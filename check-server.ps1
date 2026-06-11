Start-Sleep -Seconds 5
Write-Output '----- server.log -----'
Get-Content server.log -ErrorAction SilentlyContinue
Write-Output '----- GET /buses/buses -----'
try {
  $resp = Invoke-WebRequest -Uri 'http://localhost:3000/buses/buses' -UseBasicParsing -TimeoutSec 15
  Write-Output $resp.Content
} catch {
  Write-Output ('REQUEST ERROR: ' + $_.Exception.Message)
}
