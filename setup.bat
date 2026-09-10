@echo off
echo === DocuAI RAG Assistant - Setup ===
echo.

echo [1/3] Installing Python backend dependencies...
cd backend
pip install -r requirements.txt
if errorlevel 1 (
    echo ERROR: Failed to install Python packages.
    pause
    exit /b 1
)

echo.
echo [2/3] Installing Node.js frontend dependencies...
cd ..\frontend
npm install
if errorlevel 1 (
    echo ERROR: Failed to install npm packages.
    pause
    exit /b 1
)

echo.
echo [3/3] Building frontend for production...
npm run build
if errorlevel 1 (
    echo ERROR: Failed to build frontend.
    pause
    exit /b 1
)

echo.
echo =======================================
echo  Setup complete!
echo  Run: start.bat to launch the app.
echo =======================================
pause
