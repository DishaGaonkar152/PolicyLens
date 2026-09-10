@echo off
echo === DocuAI RAG Assistant ===
echo.

REM Check for GROQ_API_KEY in backend/.env
findstr /C:"your_groq_api_key_here" backend\.env >nul 2>&1
if not errorlevel 1 (
    echo WARNING: GROQ_API_KEY not set in backend\.env
    echo Please edit backend\.env and replace 'your_groq_api_key_here' with your actual key.
    echo Get a free key at: https://console.groq.com
    echo.
    pause
)

echo Starting DocuAI server...
echo Open your browser at: http://localhost:8000
echo Press Ctrl+C to stop.
echo.

cd backend
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
