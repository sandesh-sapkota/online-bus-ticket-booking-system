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

Write-Output '----- TS errors (if any) -----'
Select-String -Path server.log -Pattern 'error TS' -ErrorAction SilentlyContinue | Select-Object -First 8
Write-Output '----- Khalti routes mapped -----'
Select-String -Path server.log -Pattern 'khalti' -ErrorAction SilentlyContinue
Write-Output '----- startup line -----'
Select-String -Path server.log -Pattern 'successfully started|Server started' -ErrorAction SilentlyContinue
