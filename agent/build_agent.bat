@echo off
title SOC Agent - Build EXE
echo ============================================
echo   Building SOC Windows Agent EXE
echo ============================================
echo.

python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not in PATH.
    echo Please install Python 3.11+ from https://www.python.org/downloads/
    pause
    exit /b 1
)

echo Installing dependencies...
python -m pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install dependencies.
    pause
    exit /b 1
)

echo Building standalone EXE...
pyinstaller --onefile --name SOC-Windows-Agent traffic_agent.py
if %errorlevel% neq 0 (
    echo [ERROR] Build failed.
    pause
    exit /b 1
)

echo.
echo [OK] Build complete! EXE is at: dist\SOC-Windows-Agent.exe
pause
