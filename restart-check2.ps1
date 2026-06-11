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

Write-Output '----- compile status (errors if any) -----'
Select-String -Path server.log -Pattern 'error TS' -ErrorAction SilentlyContinue | Select-Object -First 5
Write-Output '----- GET /buses/routes -----'
try {
  $r = Invoke-WebRequest -Uri 'http://localhost:3000/buses/routes' -UseBasicParsing -TimeoutSec 15
  Write-Output $r.Content
} catch {
  Write-Output ('ROUTES ERROR: ' + $_.Exception.Message)
}
Write-Output '----- GET /buses/buses?origin=kathmandu&destination=pokhara (case-insensitive test) -----'
try {
  $b = Invoke-WebRequest -Uri 'http://localhost:3000/buses/buses?origin=kathmandu&destination=pokhara' -UseBasicParsing -TimeoutSec 15
  Write-Output $b.Content
} catch {
  Write-Output ('BUSES ERROR: ' + $_.Exception.Message)
}
