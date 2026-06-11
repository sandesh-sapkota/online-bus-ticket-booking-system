Write-Output '----- node processes -----'
Get-Process node -ErrorAction SilentlyContinue | Select-Object Id, StartTime | Format-Table -AutoSize
Write-Output '----- port 3000 listening? -----'
Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue | Select-Object LocalAddress, LocalPort, OwningProcess | Format-Table -AutoSize
Write-Output '----- GET /buses/buses -----'
try {
  $r = Invoke-WebRequest -Uri 'http://localhost:3000/buses/buses' -UseBasicParsing -TimeoutSec 10
  Write-Output ('HTTP ' + $r.StatusCode + ' len=' + $r.Content.Length)
} catch {
  Write-Output ('ERROR: ' + $_.Exception.Message)
}
Write-Output '----- server.log tail -----'
Get-Content server.log -Tail 15 -ErrorAction SilentlyContinue
