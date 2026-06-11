if (Test-Path server.pid) {
  $oldPid = Get-Content server.pid
  Stop-Process -Id $oldPid -Force -ErrorAction SilentlyContinue
}
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

Remove-Item server.log -ErrorAction SilentlyContinue
$proc = Start-Process -PassThru -WindowStyle Hidden -FilePath 'cmd' -ArgumentList '/c','npm run start:dev > server.log 2>&1'
$proc.Id | Out-File -FilePath server.pid -Encoding ascii
Write-Output ("Restarted PID " + $proc.Id)
Start-Sleep -Seconds 35

Write-Output '----- server.log (tail) -----'
Get-Content server.log -Tail 25 -ErrorAction SilentlyContinue
Write-Output '----- GET /buses/buses -----'
try {
  $resp = Invoke-WebRequest -Uri 'http://localhost:3000/buses/buses' -UseBasicParsing -TimeoutSec 15
  Write-Output $resp.Content
} catch {
  Write-Output ('REQUEST ERROR: ' + $_.Exception.Message)
}
