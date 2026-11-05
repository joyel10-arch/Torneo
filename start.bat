@echo off
echo Starting Torneo Backend...
set PYTHONPATH=D:\Torneo\backend\pkgs
set PYTHONUTF8=1
start "Torneo Backend" cmd /k "cd /d D:\Torneo\backend && set PYTHONPATH=D:\Torneo\backend\pkgs && set PYTHONUTF8=1 && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"
echo Waiting for backend to start...
timeout /t 4 /nobreak >nul
echo Starting Torneo Frontend...
start "Torneo Frontend" cmd /k "cd /d D:\Torneo\frontend && npm run dev"
echo.
echo ====================================
echo  TORNEO is starting up!
echo ====================================
echo  Frontend: http://localhost:5173
echo  Backend:  http://localhost:8000
echo  API Docs: http://localhost:8000/api/docs
echo.
echo  Demo Accounts:
echo    Admin:     admin@torneo.app     / Admin@123
echo    Organizer: organizer@torneo.app / Org@123
echo    Viewer:    viewer@torneo.app    / View@123
echo ====================================
pause
