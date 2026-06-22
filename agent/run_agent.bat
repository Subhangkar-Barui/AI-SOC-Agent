@echo off
title SOC Network Monitoring Agent
echo ============================================
echo   SOC Windows Network Monitoring Agent
echo ============================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not in PATH.
    echo.
    echo Please install Python 3.11+ from https://www.python.org/downloads/
    echo Make sure to check "Add Python to PATH" during installation.
    echo.
    pause
    exit /b 1
)

echo [OK] Python found.
echo.

REM Install dependencies
echo Installing required packages...
python -m pip install --quiet scapy psutil requests
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install dependencies.
    echo Try running this as Administrator.
    echo.
    pause
    exit /b 1
)

echo [OK] Dependencies installed.
echo.

REM Check if all agent files exist in the same folder
if not exist "%~dp0traffic_agent.py" (
    echo [ERROR] traffic_agent.py not found in the same folder as this script.
    echo.
    echo Make sure all agent files are in the same folder:
    echo   - run_agent.bat (this file)
    echo   - traffic_agent.py
    echo   - api_client.py
    echo   - config.py
    echo   - detection_local.py
    echo   - discovery.py
    echo.
    pause
    exit /b 1
)

echo Starting the agent...
echo (Close this window or press Ctrl+C to stop)
echo.

REM Run the agent from its own directory
cd /d "%~dp0"
python traffic_agent.py

echo.
echo Agent has stopped.
pause
