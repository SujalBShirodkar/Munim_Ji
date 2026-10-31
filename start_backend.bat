@echo off
echo Starting Munim Ji Backend API on http://localhost:8000...
if exist "venv\Scripts\activate.bat" call venv\Scripts\activate.bat
set PYTHONPATH=backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
pause

