@echo off
echo === DocuAI - Development Mode (Hot Reload) ===
echo.
echo This starts:
echo   - Backend:  http://localhost:8000  (FastAPI with auto-reload)
echo   - Frontend: http://localhost:5173  (Vite dev server with HMR)
echo.
echo Press Ctrl+C in each window to stop.
echo.

start "DocuAI Backend" cmd /k "cd /d "%~dp0backend" && uvicorn main:app --host 0.0.0.0 --port 8000 --reload"
timeout /t 3 >nul
start "DocuAI Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo Both servers are starting. Open http://localhost:5173 in your browser.
pause
