param(
    [switch]$ExportCsv
)

$ErrorActionPreference = "Stop"

$ProjectRoot = "D:\CLI\tiago\limpaai"
$AppRoot = Join-Path $ProjectRoot "validation-app"
$DataRoot = Join-Path $AppRoot "data"
$BackupRoot = Join-Path $ProjectRoot "backups\validation-data"
$Timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$Destination = Join-Path $BackupRoot $Timestamp

New-Item -ItemType Directory -Path $Destination -Force | Out-Null

$Files = @(
    "clients.json",
    "professionals.json"
)

foreach ($FileName in $Files) {
    $Source = Join-Path $DataRoot $FileName

    if (Test-Path -LiteralPath $Source -PathType Leaf) {
        Copy-Item `
            -LiteralPath $Source `
            -Destination (Join-Path $Destination $FileName) `
            -Force
    }
    else {
        Set-Content `
            -LiteralPath (Join-Path $Destination $FileName) `
            -Value "[]" `
            -Encoding UTF8
    }
}

$Manifest = [ordered]@{
    created_at = (Get-Date).ToString("o")
    source = $DataRoot
    destination = $Destination
    files = $Files
}

$Manifest |
    ConvertTo-Json -Depth 5 |
    Set-Content `
        -LiteralPath (Join-Path $Destination "manifest.json") `
        -Encoding UTF8

if ($ExportCsv) {
    $Health = $null

    try {
        $Health = Invoke-RestMethod `
            -Uri "http://localhost:4173/api/health" `
            -TimeoutSec 2
    }
    catch {
    }

    if ($Health.ok -eq $true) {
        Invoke-WebRequest `
            -Uri "http://localhost:4173/api/export/clients.csv" `
            -OutFile (Join-Path $Destination "clients.csv") `
            -UseBasicParsing

        Invoke-WebRequest `
            -Uri "http://localhost:4173/api/export/professionals.csv" `
            -OutFile (Join-Path $Destination "professionals.csv") `
            -UseBasicParsing
    }
    else {
        Write-Warning "Aplicação não está ativa; CSV não foi exportado."
    }
}

Write-Host "Backup criado em:"
Write-Host $Destination
