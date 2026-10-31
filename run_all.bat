@echo off
echo ===================================================
echo Starting Munim Ji Services (MongoDB, Backend, Frontend)
echo ===================================================

start "Munim Ji - MongoDB (27017)" cmd /c start_mongo.bat
timeout /t 3 /nobreak >nul

start "Munim Ji - Backend API (8000)" cmd /c start_backend.bat
timeout /t 3 /nobreak >nul

start "Munim Ji - Frontend PWA (3000)" cmd /c start_frontend.bat

echo All services launched!
echo Open http://localhost:3000 in your browser.
pause

