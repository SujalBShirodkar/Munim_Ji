@echo off
echo Starting Munim Ji Frontend on http://localhost:3000...
set PATH=%CD%\.tools\node-v20.18.0-win-x64;%PATH%
cd frontend
call npm start
pause

