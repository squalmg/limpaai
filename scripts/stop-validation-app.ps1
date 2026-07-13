param(
    [int]$Port = 4173
)

$ErrorActionPreference = "Stop"

$ProjectRoot = "D:\CLI\tiago\limpaai"
$AppRoot = Join-Path $ProjectRoot "validation-app"
$PidFile = Join-Path $AppRoot ".validation-app.pid"

$Stopped = $false

if (Test-Path -LiteralPath $PidFile -PathType Leaf) {
    $ProcessId = [int](Get-Content -LiteralPath $PidFile -Raw)

    $Process = Get-Process -Id $ProcessId -ErrorAction SilentlyContinue

    if ($Process) {
        Stop-Process -Id $ProcessId -Force
        $Stopped = $true
    }

    Remove-Item -LiteralPath $PidFile -Force
}

$Listener = Get-NetTCPConnection `
    -LocalPort $Port `
    -State Listen `
    -ErrorAction SilentlyContinue |
    Select-Object -First 1

if ($Listener) {
    Stop-Process -Id $Listener.OwningProcess -Force
    $Stopped = $true
}

if ($Stopped) {
    Write-Host "Aplicação de validação encerrada."
}
else {
    Write-Host "Nenhuma aplicação ativa foi encontrada na porta $Port."
}
