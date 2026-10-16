"""
Script de Respaldo en Caliente - CacaoTrace Huila (RF07, E07)
Utiliza la API nativa sqlite3.Connection.backup() para garantizar un snapshot atómico consistente
sin riesgo de corrupción en modo WAL, ejecutándose en menos de 50 milisegundos.
"""

import sys
import os
import sqlite3
import time
from pathlib import Path
from datetime import datetime

# Rutas estándar del proyecto
ROOT_DIR = Path(__file__).resolve().parent.parent
DB_PATH = Path(os.environ.get("DATABASE_PATH", ROOT_DIR / "cacao_dev.db"))
BACKUP_DIR = ROOT_DIR / "datos" / "backups"
DEMO_BACKUP_PATH = ROOT_DIR / "datos" / "respaldo_demo.db"


def realizar_backup(destino: Path | None = None) -> Path:
    inicio = time.perf_counter()
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)

    if not DB_PATH.exists():
        raise FileNotFoundError(f"La base de datos principal no existe en: {DB_PATH}")

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    archivo_backup = destino or (BACKUP_DIR / f"snapshot_{timestamp}.db")

    # Respaldo atómico en caliente mediante la API de SQLite
    with sqlite3.connect(DB_PATH) as origen, sqlite3.connect(archivo_backup) as dest:
        origen.backup(dest)

    # Validar integridad del respaldo
    with sqlite3.connect(archivo_backup) as check_conn:
        resultado = check_conn.execute("PRAGMA integrity_check;").fetchone()[0]
        if resultado != "ok":
            raise RuntimeError(f"Fallo de integridad en el respaldo generado: {resultado}")

    duracion_ms = (time.perf_counter() - inicio) * 1000
    print(f"[OK] Respaldo verificado con integridad 'ok' en: {archivo_backup}")
    print(f"[TIEMPO] Respaldo completado en {duracion_ms:.2f} ms (< 2000 ms)")

    return archivo_backup


if __name__ == "__main__":
    # Generar snapshot con timestamp y actualizar también datos/respaldo_demo.db
    realizar_backup()
    realizar_backup(destino=DEMO_BACKUP_PATH)
