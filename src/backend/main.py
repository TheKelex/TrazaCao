"""
Punto de Entrada Principal - CacaoTrace Huila (FastAPI Monolito Modular)
Expone la documentación interactiva OpenAPI en /docs y orquesta los routers del sistema.
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI, Request, status, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from sqlalchemy import text
from sqlalchemy.orm import Session
from infra.database import init_db, get_db
from routers.lotes import router as lotes_router
from routers.transformaciones import router as trans_router
from routers.pasaporte import router as pasaporte_router
from routers.auditoria import router as auditoria_router
from routers.export import router as export_router
from routers.auth import router as auth_router
from routers.subproductos import router as subproductos_router
from routers.operarios import router as operarios_router
from routers.compradores import router as compradores_router
from routers.ventas import router as ventas_router

# Inicialización de la aplicación FastAPI
app = FastAPI(
    title="TrazaCao Huila API - Trazabilidad Agroindustrial",
    description=(
        "Sistema de trazabilidad, control de existencias, cálculo de mermas, "
        "balance económico, pasaporte digital y catálogo industrial/botánico de biomasa para la asociación cacaotera del Huila."
    ),
    version="1.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configuración de CORS para permitir frontend React en desarrollo, Vercel y Render
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_origin_regex=r"https://.*\.vercel\.app|https://.*\.onrender\.com|http://localhost:.*|http://127\.0\.0\.1:.*",
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
app.include_router(subproductos_router)
app.include_router(operarios_router)
app.include_router(compradores_router)
app.include_router(ventas_router)

# Servir directamente la carpeta 'landing page' original sin duplicar archivos
from fastapi.staticfiles import StaticFiles
landing_page_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "landing page"))
if os.path.isdir(landing_page_dir):
    app.mount("/landing", StaticFiles(directory=landing_page_dir, html=True), name="landing")

# Servir el Frontend SPA compilado (React + Vite)
frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))
dist_assets = os.path.join(frontend_dist, "assets")
dist_images = os.path.join(frontend_dist, "images")

if os.path.isdir(dist_assets):
    app.mount("/assets", StaticFiles(directory=dist_assets), name="dist_assets")
if os.path.isdir(dist_images):
    app.mount("/images", StaticFiles(directory=dist_images), name="dist_images")


@app.get("/ficha", response_class=FileResponse, tags=["Público / Pasaporte QR"])
@app.get("/pasaporte-web", response_class=FileResponse, tags=["Público / Pasaporte QR"])
def ver_ficha():
    """Sirve la Ficha Comercial y Experiencia Visual de Origen."""
    index_landing = os.path.join(landing_page_dir, "index.html")
    if os.path.exists(index_landing):
        return FileResponse(index_landing, media_type="text/html")
    dist_index = os.path.join(frontend_dist, "index.html")
    return FileResponse(dist_index, media_type="text/html")


@app.get("/pasaporte/{lote_id}", response_class=FileResponse, tags=["Público / Pasaporte QR"])
def ver_pasaporte_directo(lote_id: str):
    """
    Sirve la interfaz web del Pasaporte Comercial directamente al escanear el QR físico.
    Permite a compradores internacionales ver la ficha del lote en el navegador móvil.
    """
    dist_index = os.path.join(frontend_dist, "index.html")
    if os.path.exists(dist_index):
        return FileResponse(dist_index, media_type="text/html")
    index_landing = os.path.join(landing_page_dir, "index.html")
    if os.path.exists(index_landing):
        return FileResponse(index_landing, media_type="text/html")
    return JSONResponse(
        status_code=404,
        content={"detail": f"Pasaporte para lote '{lote_id}' no disponible en este momento."},
    )


@app.get("/favicon.svg", include_in_schema=False)
def favicon():
    fav = os.path.join(frontend_dist, "favicon.svg")
    if os.path.exists(fav):
        return FileResponse(fav)
    return JSONResponse(status_code=404, content={"detail": "Not found"})


@app.get("/trazacao-logo.png", include_in_schema=False)
def trazacao_logo():
    lg = os.path.join(frontend_dist, "trazacao-logo.png")
    if os.path.exists(lg):
        return FileResponse(lg)
    return JSONResponse(status_code=404, content={"detail": "Not found"})


@app.get("/trazacao-isotype.png", include_in_schema=False)
def trazacao_isotype():
    iso = os.path.join(frontend_dist, "trazacao-isotype.png")
    if os.path.exists(iso):
        return FileResponse(iso)
    return JSONResponse(status_code=404, content={"detail": "Not found"})


@app.get("/", tags=["UI / Frontend"])
@app.get("/gestion", tags=["UI / Frontend"])
@app.get("/catalogo", tags=["UI / Frontend"])
def root_spa(request: Request):
    """Sirve la aplicación SPA interactiva de TrazaCao (React + Vite)."""
    dist_index = os.path.join(frontend_dist, "index.html")
    if os.path.exists(dist_index):
        return FileResponse(dist_index, media_type="text/html")
    index_landing = os.path.join(landing_page_dir, "index.html")
    if os.path.exists(index_landing):
        return FileResponse(index_landing, media_type="text/html")
    return {
        "status": "online",
        "sistema": "TrazaCao Huila",
        "version": "1.1.0",
        "modo": "Offline-First Local SQLite",
        "documentacion": "/docs",
        "landing": "/landing",
        "ficha_publica": "/ficha",
    }


@app.get("/health", tags=["Health Check"])
@app.get("/api", tags=["Health Check"])
@app.get("/api/", tags=["Health Check"])
@app.get("/api/health", tags=["Health Check"])
def health_check(db: Session = Depends(get_db)):
    """
    Endpoint de Salud y Liveness Probe para Render Cloud.
    Valida activamente la conectividad y respuesta del motor de base de datos SQLite WAL.
    """
    db_status = "connected"
    try:
        db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"

    return {
        "status": "online" if db_status == "connected" else "degraded",
        "database": db_status,
        "sistema": "TrazaCao Huila",
        "version": "1.1.0",
        "modo": "Producción Cloud / SQLite WAL",
        "documentacion": "/docs",
        "landing": "/landing",
        "ficha_publica": "/ficha",
    }

