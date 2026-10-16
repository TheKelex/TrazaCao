# ==============================================================================
# Dockerfile - Backend API FastAPI + Base de Datos SQLite WAL
# TrazaCao Huila - II Hackathon de Programación DEVURITY
# Despliegue en Render Cloud (Backend Exclusivo y Base de Datos Integrada)
# ==============================================================================

FROM python:3.11-slim
WORKDIR /app

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8000 \
    DATABASE_PATH=/app/cacao_dev.db \
    PYTHONPATH=/app/src/backend:/app

# Utilidades mínimas del sistema (curl para healthcheck, sqlite3 para inspección)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    sqlite3 \
    && rm -rf /var/lib/apt/lists/*

# Instalar dependencias de Python
COPY requirements.txt ./
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copiar código del backend, landing page institucional y datos de inicialización
COPY src/backend/ ./src/backend/
COPY ["landing page/", "./landing page/"]
COPY datos/ ./datos/

# Inicializar base de datos SQLite con los datos canónicos (CAC001, CAC002, CAC003, usuarios y triggers)
RUN python src/backend/seed.py

# Exponer puerto predeterminado
EXPOSE 8000

# Inicio de FastAPI con Uvicorn enlazado al puerto asignado dinámicamente por Render
CMD ["sh", "-c", "uvicorn src.backend.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
