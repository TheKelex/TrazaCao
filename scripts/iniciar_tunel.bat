@echo off
title TrazaCao Huila - Tunel Publico Seguro
echo ===============================================================================
echo                TRAZACAO HUILA - LANZADOR DE TUNEL PUBLICO
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

%PY_CMD% scripts\iniciar_tunel.py
pause
