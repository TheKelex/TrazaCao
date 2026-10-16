@echo off
echo ===============================================================================
echo                TRAZACAO HUILA - LANZADOR UNIFICADO 100%% OFFLINE
echo       II Hackathon de Programacion DEVURITY - Universidad Surcolombiana
echo ===============================================================================

setlocal
where py >nul 2>nul
if %ERRORLEVEL% equ 0 (
    set PY_CMD=py
) else (
    set PY_CMD=python
)

echo [1/3] Inicializando Base de Datos y Datos Semilla Oficiales...
%PY_CMD% src\backend\seed.py

echo [2/3] Iniciando Servidor Backend FastAPI (127.0.0.1:8000)...
start "TrazaCao Backend (FastAPI)" cmd /k "%PY_CMD% -m uvicorn src.backend.main:app --host 0.0.0.0 --port 8000 --reload"

echo [3/3] Iniciando Servidor Frontend Vite + React (127.0.0.1:5173)...
start "TrazaCao Frontend (Vite)" cmd /k "npm run dev --prefix src/frontend"

echo.
echo ===============================================================================
echo  SISTEMA ACTIVO:
echo  - Frontend Web (UI Operador / Admin / QR): http://127.0.0.1:5173
echo  - Backend API Docs (OpenAPI / Swagger):     http://127.0.0.1:8000/docs
echo ===============================================================================
