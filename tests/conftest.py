import os
import sys
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Asegurar path de src/backend en sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "src", "backend")))

from models import Base, Lote, Transformacion, AuditoriaLog


@pytest.fixture(scope="function")
def db_test():
    """
    Crea una base de datos SQLite aislada en memoria para cada prueba
    con foreign keys y triggers de inmutabilidad activos.
    """
    engine_test = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False}
    )

    with engine_test.connect() as conn:
        conn.exec_driver_sql("PRAGMA foreign_keys = ON;")

    Base.metadata.create_all(bind=engine_test)

    # Aplicar triggers nativos de inmutabilidad sobre audit_logs
    with engine_test.connect() as conn:
        conn.exec_driver_sql("""
            CREATE TRIGGER IF NOT EXISTS abort_audit_update
            BEFORE UPDATE ON audit_logs
            BEGIN
                SELECT RAISE(ABORT, 'RF10: Los registros de auditoria son estrictamente inmutables');
            END;
        """)
        conn.exec_driver_sql("""
            CREATE TRIGGER IF NOT EXISTS abort_audit_delete
            BEFORE DELETE ON audit_logs
            BEGIN
                SELECT RAISE(ABORT, 'RF10: Prohibido eliminar registros historicos de auditoria');
            END;
        """)
        conn.commit()

    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine_test)
    session = TestingSessionLocal()

    yield session

    session.close()
    Base.metadata.drop_all(bind=engine_test)
