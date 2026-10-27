@echo off
title Cyber Risk Platform - Frontend UI
echo ===================================================
echo Starting AI Cyber Risk Platform - Frontend UI
echo ===================================================
cd frontend
if not exist node_modules (
    echo Installing node dependencies...
    call npm install
)
echo Starting Vite Dev Server on http://localhost:3000
call npm run dev
pause
