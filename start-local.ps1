# Sets JAVA_HOME/PATH for this Windows machine, then starts the backend.
# Frontend (another terminal): cd frontend; npm run dev
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$jdk = "C:\Program Files\Microsoft\jdk-21.0.12.101-hotspot"
$env:JAVA_HOME = $jdk
$env:Path = "$jdk\bin;C:\Program Files\nodejs;C:\Program Files\PostgreSQL\17\bin;" + $env:Path

$busy = Get-NetTCPConnection -LocalPort 8080 -State Listen -ErrorAction SilentlyContinue
if ($busy) {
  Write-Host "Backend already running at http://localhost:8080"
  exit 0
}

Set-Location "$root\backend"
& .\mvnw.cmd spring-boot:run
