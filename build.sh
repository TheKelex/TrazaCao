#!/usr/bin/env bash
# ==============================================================================
# Script de Compilación para Render (Servicio Web Nativo Python - Backend + DB)
# TrazaCao Huila - II Hackathon DEVURITY
# ==============================================================================
set -o errexit

echo "======================================================================"
echo "==> [1/2] Instalando dependencias de Python..."
echo "======================================================================"
pip install --upgrade pip
pip install -r requirements.txt

echo "======================================================================"
echo "==> [2/2] Inicializando Base de Datos SQLite con datos semilla..."
echo "======================================================================"
python src/backend/seed.py

echo "======================================================================"
echo "==> [LISTO] Backend FastAPI y SQLite WAL listos para iniciar en Render."
echo "======================================================================"
