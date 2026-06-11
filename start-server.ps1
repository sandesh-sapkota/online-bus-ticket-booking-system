$ErrorActionPreference = 'Stop'
$proc = Start-Process -PassThru -WindowStyle Hidden -FilePath 'cmd' -ArgumentList '/c','npm run start:dev > server.log 2>&1'
$proc.Id | Out-File -FilePath 'server.pid' -Encoding ascii
Write-Output ("Started PID " + $proc.Id)
