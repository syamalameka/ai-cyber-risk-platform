@echo off
title AI Cyber Risk & Threat Intelligence Platform Launcher
echo ======================================================================
echo Launching AI Cyber Risk & Threat Intelligence Platform
echo ======================================================================
echo.
echo [1/2] Launching Backend REST API on http://127.0.0.1:8000 ...
start "CyberRisk-Backend" cmd /k "run_backend.bat"
timeout /t 3 /nobreak > nul

echo [2/2] Launching Frontend Dashboard on http://localhost:3000 ...
start "CyberRisk-Frontend" cmd /k "run_frontend.bat"

echo.
echo ======================================================================
echo Both services launched! 
echo Frontend: http://localhost:3000
echo Backend Swagger API Docs: http://127.0.0.1:8000/docs
echo ======================================================================
pause
