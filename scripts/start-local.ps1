$ErrorActionPreference = 'Stop'
$taskRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
$taskUrl = 'http://localhost:3100'
$taskRunning = $false
try {
    $taskPage = Invoke-WebRequest -Uri $taskUrl -TimeoutSec 3 -UseBasicParsing
    if ($taskPage.Content -notlike '*Samen op reis*') { throw 'Port 3100 is used by another application.' }
    $taskRunning = $true
} catch {
    if ($_.Exception.Message -like '*another application*') { throw }
}
if (-not $taskRunning) {
    New-Item -ItemType Directory -Force -Path (Join-Path $taskRoot 'data') | Out-Null
    Start-Process -FilePath (Get-Command node).Source -ArgumentList @('node_modules/next/dist/bin/next', 'dev', '--hostname', '0.0.0.0', '--port', '3100') -WorkingDirectory $taskRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $taskRoot 'data/server.log') -RedirectStandardError (Join-Path $taskRoot 'data/server-error.log') | Out-Null
    for ($taskAttempt = 0; $taskAttempt -lt 30; $taskAttempt++) {
        Start-Sleep -Seconds 1
        try { Invoke-WebRequest -Uri $taskUrl -TimeoutSec 2 -UseBasicParsing | Out-Null; $taskRunning = $true; break } catch {}
    }
}
if (-not $taskRunning) { throw 'The app could not start. Check data/server-error.log.' }
Start-Process -FilePath 'explorer.exe' -ArgumentList $taskUrl -WindowStyle Hidden
Write-Output 'Samen op reis is running at http://localhost:3100 (mobile wifi: http://192.168.2.12:3100).'
