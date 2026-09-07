@echo off
set "PATH=C:\Program Files\nodejs;%PATH%"
if not exist "C:\Program Files\nodejs\npm.cmd" (
  echo Node.js was not found at C:\Program Files\nodejs
  exit /b 1
)
cd /d "%~dp0"
"C:\Program Files\nodejs\npm.cmd" run dev %*
