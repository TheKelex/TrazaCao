"""
Configuración del Motor de Base de Datos - CacaoTrace Huila (ADR-02)
Configura SQLite con modo WAL, control de timeout por concurrencia y triggers de auditoría inmutable.
"""

import os
from sqlalchemy import create_engine, event, text
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.engine import Engine

# Ruta por defecto de la base de datos local
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
DB_PATH = os.environ.get("DATABASE_PATH", os.path.join(BASE_DIR, "cacao_dev.db"))
SQLALCHEMY_DATABASE_URL = f"sqlite:///{DB_PATH}"

# Motor SQLite con timeout ampliado para peticiones concurrentes
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False, "timeout": 20},
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


# ==============================================================================
# PRAGMAS OBLIGATORIOS DE SQLITE (CONCURRENCIA & ROBUSTEZ - AUDITORÍA)
# ==============================================================================
@event.listens_for(Engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    """
    Activa PRAGMAS de conexión rápida para SQLite:
    - busy_timeout=5000: Espera hasta 5 segundos si otra transacción está escribiendo.
    - foreign_keys=ON: Garantiza integridad referencial estricta.
    """
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA busy_timeout=5000")
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


def aplicar_triggers_auditoria():
    """
    Crea los triggers nativos de SQLite para blindar la inmutabilidad de la auditoría (RF10).
    Cualquier intento de UPDATE o DELETE sobre audit_logs es abortado a nivel de motor.
    """
    with engine.connect() as conn:
        conn.execute(text("PRAGMA journal_mode=WAL"))
        conn.execute(text("""
            CREATE TRIGGER IF NOT EXISTS abort_audit_update
            BEFORE UPDATE ON audit_logs
            BEGIN
                SELECT RAISE(ABORT, 'RF10: Los registros de auditoria son estrictamente inmutables');
            END;
        """))
        conn.execute(text("""
            CREATE TRIGGER IF NOT EXISTS abort_audit_delete
            BEFORE DELETE ON audit_logs
            BEGIN
                SELECT RAISE(ABORT, 'RF10: Prohibido eliminar registros historicos de auditoria');
            END;
        """))
        conn.commit()


def init_db():
    """Inicializa las tablas y aplica los triggers de inmutabilidad."""
    from models import Base
    Base.metadata.create_all(bind=engine)
    aplicar_triggers_auditoria()


def get_db():
    """Generador de sesiones de base de datos para dependencias de FastAPI."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
