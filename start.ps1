# Lanzador Unificado PowerShell - TrazaCao Huila
Write-Host "===============================================================================" -ForegroundColor Yellow
Write-Host "               TRAZACAO HUILA - LANZADOR UNIFICADO 100% OFFLINE" -ForegroundColor Green
Write-Host "      II Hackathon de Programacion DEVURITY - Universidad Surcolombiana" -ForegroundColor Cyan
Write-Host "===============================================================================" -ForegroundColor Yellow

Write-Host "`n[1/3] Inicializando Base de Datos y Datos Semilla Oficiales..." -ForegroundColor Yellow
python src/backend/seed.py

Write-Host "`n[2/3] Iniciando Backend FastAPI en segundo plano (http://127.0.0.1:8000)..." -ForegroundColor Yellow
Start-Process python -ArgumentList "-m", "uvicorn", "src.backend.main:app", "--host", "127.0.0.1", "--port", "8000", "--reload"

Write-Host "`n[3/3] Iniciando Frontend React + Vite (http://127.0.0.1:5173)..." -ForegroundColor Yellow
Start-Process npm -ArgumentList "run", "dev", "--prefix", "src/frontend"

Write-Host "`n===============================================================================" -ForegroundColor Green
Write-Host " SISTEMA ACTIVO:" -ForegroundColor White
Write-Host " - Frontend Web: http://127.0.0.1:5173" -ForegroundColor Cyan
Write-Host " - Backend API:  http://127.0.0.1:8000/docs" -ForegroundColor Cyan
Write-Host "===============================================================================" -ForegroundColor Green
