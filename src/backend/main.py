"""
Punto de Entrada Principal - CacaoTrace Huila (FastAPI Monolito Modular)
Expone la documentación interactiva OpenAPI en /docs y orquesta los routers del sistema.
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from infra.database import init_db
from routers.lotes import router as lotes_router
from routers.transformaciones import router as trans_router
from routers.pasaporte import router as pasaporte_router
from routers.auditoria import router as auditoria_router
from routers.export import router as export_router
from routers.auth import router as auth_router

# Inicialización de la aplicación FastAPI
app = FastAPI(
    title="CacaoTrace Huila API - Trazabilidad Agroindustrial",
    description=(
        "Sistema de trazabilidad, control de existencias, cálculo de mermas, "
        "balance económico y pasaporte digital para la asociación cacaotera del Huila.\n\n"
        "**Reto Oficial de Agroindustria - USCO DEVURITY 2026**"
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configuración de CORS para permitir frontend React en desarrollo y local
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup_event():
    """Inicializa la base de datos SQLite y activa triggers de auditoría inmutable."""
    init_db()


# Manejo global de excepciones para convertir ValueErrors de dominio en HTTP 422
@app.exception_handler(ValueError)
async def value_error_handler(request: Request, exc: ValueError):
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": str(exc)},
    )


# Inclusión de routers modulares
app.include_router(lotes_router)
app.include_router(trans_router)
app.include_router(pasaporte_router)
app.include_router(auditoria_router)
app.include_router(export_router)
app.include_router(auth_router)

# Servir directamente la carpeta 'landing page' original sin duplicar archivos
from fastapi.staticfiles import StaticFiles
landing_page_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "landing page"))
if os.path.isdir(landing_page_dir):
    app.mount("/landing", StaticFiles(directory=landing_page_dir, html=True), name="landing")


@app.get("/", tags=["Health Check"])
@app.get("/api", tags=["Health Check"])
@app.get("/api/", tags=["Health Check"])
def health_check():
    """Endpoint de salud del backend."""
    return {
        "status": "online",
        "sistema": "CacaoTrace Huila",
        "version": "1.0.0",
        "modo": "Offline-First Local SQLite",
        "documentacion": "/docs",
    }
