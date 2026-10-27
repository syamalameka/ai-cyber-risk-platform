@echo off
title Cyber Risk Platform - Backend API
echo ===================================================
echo Starting AI Cyber Risk Platform - Backend Service
echo ===================================================
cd backend
python -m pip install -r requirements.txt
echo Starting Uvicorn API Server on http://127.0.0.1:8000
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
pause
