@echo off
echo ===================================================
echo Munim Ji -- Starting Services (MongoDB, Backend, Frontend)
echo ===================================================

:: Clean up any stale processes holding port 8000 or 3000
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000 ^| findstr LISTENING') do taskkill /f /pid %%a 2>nul
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do taskkill /f /pid %%a 2>nul

echo [1/3] Starting MongoDB...
start "Munim Ji - MongoDB (27017)" cmd /c start_mongo.bat
timeout /t 3 /nobreak >nul

echo [2/3] Starting FastAPI Backend on http://localhost:8000...
start "Munim Ji - Backend API (8000)" cmd /c start_backend.bat
timeout /t 3 /nobreak >nul

echo [3/3] Starting Next.js Frontend on http://localhost:3000...
start "Munim Ji - Frontend PWA (3000)" cmd /c start_frontend.bat
timeout /t 4 /nobreak >nul

echo.
echo ===================================================
echo [SUCCESS] All services launched!
echo - Register / Login: http://localhost:3000/login
echo - Home Dashboard:   http://localhost:3000
echo ===================================================
start http://localhost:3000/login
pause
