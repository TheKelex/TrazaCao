@echo off
title TrazaCao Huila - Modo Hibrido (Local + Tunel Online)
echo ===============================================================================
echo        TRAZACAO HUILA - MODO HIBRIDO (LOCAL OFFLINE-FIRST + TUNEL ONLINE)
echo       II Hackathon de Programacion DEVURITY - Universidad Surcolombiana
echo ===============================================================================
echo.

setlocal
where py >nul 2>nul
if %ERRORLEVEL% equ 0 (
    set PY_CMD=py
) else (
    set PY_CMD=python
)

echo [1/3] Inicializando Base de Datos y Datos Semilla Oficiales...
%PY_CMD% src\backend\seed.py

echo [2/3] Iniciando Servidor Frontend Vite + React (Local 127.0.0.1:5173)...
start "TrazaCao Frontend (Vite)" cmd /k "npm run dev --prefix src/frontend"

echo [3/3] Iniciando Backend FastAPI y Tunel Publico Ngrok...
%PY_CMD% scripts\iniciar_tunel.py

pause
