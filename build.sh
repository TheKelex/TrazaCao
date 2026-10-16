#!/usr/bin/env bash
# ==============================================================================
# Script de Compilación para Render (Servicio Web Nativo Python)
# TrazaCao Huila - II Hackathon DEVURITY
# ==============================================================================
set -o errexit

echo "======================================================================"
echo "==> [1/3] Instalando dependencias de Python..."
echo "======================================================================"
pip install --upgrade pip
pip install -r requirements.txt

echo "======================================================================"
echo "==> [2/3] Compilando Frontend React 19 (Vite + Tailwind CSS)..."
echo "======================================================================"
cd src/frontend
npm ci --prefer-offline || npm install
npm run build
cd ../..

echo "======================================================================"
echo "==> [3/3] Inicializando Base de Datos SQLite y Datos Semilla..."
echo "======================================================================"
python src/backend/seed.py

echo "======================================================================"
echo "==> [LISTO] Entorno preparado con éxito para iniciar Uvicorn en Render."
echo "======================================================================"
