param(
    [switch]$Lan,
    [int]$Port = 4173
)

$ErrorActionPreference = "Stop"

$ProjectRoot = "D:\CLI\tiago\limpaai"
$AppRoot = Join-Path $ProjectRoot "validation-app"

Set-Location $AppRoot

if (-not (Test-Path -LiteralPath "node_modules" -PathType Container)) {
    npm install

    if ($LASTEXITCODE -ne 0) {
        throw "Falha ao instalar dependências."
    }
}

$Existing = Get-NetTCPConnection `
    -LocalPort $Port `
    -State Listen `
    -ErrorAction SilentlyContinue |
    Select-Object -First 1

if ($Existing) {
    Write-Host "A porta $Port já está em uso pelo processo $($Existing.OwningProcess)."
    Write-Host "Abra: http://localhost:$Port"
    exit 0
}

$env:PORT = [string]$Port

if ($Lan) {
    $env:HOST = "0.0.0.0"
}
else {
    $env:HOST = "127.0.0.1"
}

$LogRoot = Join-Path $ProjectRoot "relatorios\runtime"
New-Item -ItemType Directory -Path $LogRoot -Force | Out-Null

$Timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$StdOut = Join-Path $LogRoot "validation-app-$Timestamp.out.log"
$StdErr = Join-Path $LogRoot "validation-app-$Timestamp.err.log"

$Process = Start-Process `
    -FilePath "node" `
    -ArgumentList "server.js" `
    -WorkingDirectory $AppRoot `
    -RedirectStandardOutput $StdOut `
    -RedirectStandardError $StdErr `
    -PassThru `
    -WindowStyle Hidden

$Healthy = $false

for ($Attempt = 1; $Attempt -le 30; $Attempt++) {
    Start-Sleep -Milliseconds 300

    try {
        $Health = Invoke-RestMethod `
            -Uri "http://localhost:$Port/api/health" `
            -Method Get `
            -TimeoutSec 2

        if ($Health.ok -eq $true) {
            $Healthy = $true
            break
        }
    }
    catch {
    }
}

if (-not $Healthy) {
    if (-not $Process.HasExited) {
        Stop-Process -Id $Process.Id -Force
    }

    throw "Aplicação não respondeu. Consulte $StdErr"
}

$PidFile = Join-Path $AppRoot ".validation-app.pid"
Set-Content -LiteralPath $PidFile -Value $Process.Id -Encoding ASCII

Write-Host ""
Write-Host "LimpaAí Validation App iniciada."
Write-Host "PID: $($Process.Id)"
Write-Host "Computador: http://localhost:$Port"

if ($Lan) {
    $IPv4 = Get-NetIPAddress `
        -AddressFamily IPv4 `
        -ErrorAction SilentlyContinue |
        Where-Object {
            $_.IPAddress -notlike "127.*" -and
            $_.PrefixOrigin -ne "WellKnown"
        } |
        Select-Object -ExpandProperty IPAddress -Unique

    foreach ($Address in $IPv4) {
        Write-Host "Rede local: http://${Address}:$Port"
    }

    Write-Host ""
    Write-Host "Use acesso em rede apenas em Wi-Fi confiável."
}

Write-Host "Saída: $StdOut"
Write-Host "Erros: $StdErr"
