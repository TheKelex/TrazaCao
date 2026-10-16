# ==============================================================================
# Dockerfile Multi-Stage de Producción - TrazaCao Huila (CacaoTrace)
# II Hackathon de Programación DEVURITY - Universidad Surcolombiana
# Despliegue en la Nube (Render / Railway / Docker Compose)
# ==============================================================================

# ------------------------------------------------------------------------------
# Etapa 1: Compilación del Frontend (React 19 + Vite + Tailwind CSS)
# ------------------------------------------------------------------------------
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

# Copiar manifiestos de paquetes y resolver dependencias
COPY src/frontend/package*.json ./
RUN npm ci --prefer-offline || npm install

# Copiar código fuente del frontend y compilar bundle de producción
COPY src/frontend/ ./
RUN npm run build

# ------------------------------------------------------------------------------
# Etapa 2: Entorno Python FastAPI Monolítico de Alto Rendimiento
# ------------------------------------------------------------------------------
FROM python:3.11-slim
WORKDIR /app

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8000 \
    DATABASE_PATH=/app/cacao_dev.db \
    PYTHONPATH=/app/src/backend:/app

# Utilidades mínimas del sistema
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    sqlite3 \
    && rm -rf /var/lib/apt/lists/*

# Instalar dependencias de Python
COPY requirements.txt ./
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copiar código de backend, landing page institucional y datos de inicialización
COPY src/backend/ ./src/backend/
COPY ["landing page/", "./landing page/"]
COPY datos/ ./datos/

# Copiar el frontend SPA compilado desde la Etapa 1
COPY --from=frontend-builder /app/frontend/dist ./src/frontend/dist

# Inicializar base de datos SQLite con los datos canónicos (CAC001, CAC002, CAC003)
RUN python src/backend/seed.py

# Exponer puerto predeterminado
EXPOSE 8000

# Inicio de FastAPI con Uvicorn (enlaza dinámicamente al $PORT asignado por Render)
CMD ["sh", "-c", "uvicorn src.backend.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
