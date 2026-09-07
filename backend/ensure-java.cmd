@echo off
REM Make Maven work even when Cursor/PowerShell has a stale or trailing-slash JAVA_HOME.

if not defined JAVA_HOME goto :findjdk
if "%JAVA_HOME:~-1%"=="\" set "JAVA_HOME=%JAVA_HOME:~0,-1%"
if exist "%JAVA_HOME%\bin\java.exe" goto :addpath

:findjdk
for /d %%D in ("C:\Program Files\Microsoft\jdk-21*") do (
  if exist "%%~D\bin\java.exe" (
    set "JAVA_HOME=%%~D"
    goto :addpath
  )
)
for /d %%D in ("C:\Program Files\Eclipse Adoptium\jdk-21*") do (
  if exist "%%~D\bin\java.exe" (
    set "JAVA_HOME=%%~D"
    goto :addpath
  )
)
for /d %%D in ("C:\Program Files\Java\jdk-21*") do (
  if exist "%%~D\bin\java.exe" (
    set "JAVA_HOME=%%~D"
    goto :addpath
  )
)
for /d %%D in ("C:\Program Files\Microsoft\jdk*") do (
  if exist "%%~D\bin\java.exe" (
    set "JAVA_HOME=%%~D"
    goto :addpath
  )
)

echo JDK 21 was not found. Install Microsoft OpenJDK 21 and reopen the terminal. >&2
exit /b 1

:addpath
set "PATH=%JAVA_HOME%\bin;%PATH%"
exit /b 0
