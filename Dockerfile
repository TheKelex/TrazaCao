# ==============================================================================
# Dockerfile Multi-Stage de Producción - TrazaCao Huila (CacaoTrace)
# II Hackathon de Programación DEVURITY - Universidad Surcolombiana
# ==============================================================================

# ------------------------------------------------------------------------------
# Etapa 1: Compilación del Frontend (React 19 + Vite + Tailwind CSS)
# ------------------------------------------------------------------------------
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY src/frontend/package*.json ./
RUN npm install

COPY src/frontend/ ./
RUN npm run build

# ------------------------------------------------------------------------------
# Etapa 2: Entorno Python FastAPI Monolítico de Alto Rendimiento
# ------------------------------------------------------------------------------
FROM python:3.11-slim
WORKDIR /app

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8000

# Utilidades mínimas del sistema
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    sqlite3 \
    && rm -rf /var/lib/apt/lists/*

# Instalar dependencias Python
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código backend, landing page y datos de inicialización
COPY src/backend/ ./src/backend/
COPY "landing page/" "./landing page/"
COPY datos/ ./datos/

# Copiar el frontend compilado desde la Etapa 1
COPY --from=frontend-builder /app/frontend/dist ./src/frontend/dist

# Inicializar base de datos con los datos semilla canónicos (CAC001, CAC002, CAC003)
RUN python src/backend/seed.py

# Exponer puerto predeterminado
EXPOSE 8000

# Inicio de FastAPI con Uvicorn (soporta variable $PORT dinámica de Render y Railway)
CMD ["sh", "-c", "uvicorn src.backend.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
