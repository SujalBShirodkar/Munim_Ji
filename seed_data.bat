@echo off
echo Seeding MongoDB with Sharma Store demo data (yesterday = exactly 8,400)...
if exist "venv\Scripts\activate.bat" call venv\Scripts\activate.bat
python scripts/seed.py
pause

