@echo off
echo ========================================================
echo Starting NoteVault (Backend: 8080 ^| Frontend: 5173)
echo ========================================================

echo Starting Python FastAPI Backend on http://localhost:8080 ...
start "NoteVault Backend" cmd /k "cd /d %~dp0backend && python main.py"

echo Starting Vite React Frontend on http://localhost:5173 ...
start "NoteVault Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo Both services have been launched in separate terminal windows!
echo Visit: http://localhost:5173
echo ========================================================
pause
