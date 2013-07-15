@ECHO OFF

Echo Venus Start Ok...

node "%~dp0\bootstrap.js" 1>%~dp0\log\system.log 2>&1

pause
