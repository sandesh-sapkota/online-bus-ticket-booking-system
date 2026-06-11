# Stop any stray node processes from previous dev runs, then run a stable prod build.
# NOTE: this also stops the Vite frontend if it is running; just re-run `npm run dev`.
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

Write-Output '----- building backend -----'
cmd /c "npm run build > build.log 2>&1"
if (Test-Path dist/main.js) {
  Write-Output 'build OK: dist/main.js exists'
} else {
  Write-Output 'BUILD FAILED — tail of build.log:'
  Get-Content build.log -Tail 20 -ErrorAction SilentlyContinue
  exit 1
}

Write-Output '----- starting prod server (node dist/main) -----'
Remove-Item server.log -ErrorAction SilentlyContinue
$proc = Start-Process -PassThru -WindowStyle Hidden -FilePath 'cmd' -ArgumentList '/c','node dist/main > server.log 2>&1'
$proc.Id | Out-File -FilePath server.pid -Encoding ascii
Write-Output ("Started PID " + $proc.Id)
Start-Sleep -Seconds 8

Write-Output '----- port 3000 listening? -----'
Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue | Select-Object LocalPort, OwningProcess | Format-Table -AutoSize
Write-Output '----- GET /buses/buses -----'
try {
  $r = Invoke-WebRequest -Uri 'http://localhost:3000/buses/buses' -UseBasicParsing -TimeoutSec 10
  Write-Output ('HTTP ' + $r.StatusCode + ' len=' + $r.Content.Length)
} catch {
  Write-Output ('ERROR: ' + $_.Exception.Message)
  Get-Content server.log -Tail 20 -ErrorAction SilentlyContinue
}
