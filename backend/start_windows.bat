@echo off
REM Windows startup script for NeuroCoach Backend
REM This script starts the backend server for network access

echo ========================================
echo NeuroCoach Backend - Windows Server
echo ========================================
echo.
echo Starting backend server...
echo Backend will be accessible at: http://0.0.0.0:8000
echo.
echo To find your IP address, run: ipconfig
echo Then connect from other devices using: ws://YOUR_IP:8000/ws
echo.
echo Make sure:
echo   1. BlueMuse is running and streaming
echo   2. Muse headset is connected via Bluetooth
echo   3. Windows Firewall allows port 8000
echo.

python main.py

pause

