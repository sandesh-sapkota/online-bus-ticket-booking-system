cmd /c "cd frontend && npm run build > ..\fe-build.log 2>&1"
if (Test-Path frontend/dist/index.html) {
  Write-Output 'FRONTEND BUILD OK'
} else {
  Write-Output 'FRONTEND BUILD FAILED'
  Get-Content fe-build.log -Tail 20 -ErrorAction SilentlyContinue
}
Write-Output '----- backend still up? -----'
try {
  $r = Invoke-WebRequest -Uri 'http://localhost:3000/buses/routes' -UseBasicParsing -TimeoutSec 10
  Write-Output ('routes HTTP ' + $r.StatusCode + ' len=' + $r.Content.Length)
} catch {
  Write-Output ('ERROR: ' + $_.Exception.Message)
}
