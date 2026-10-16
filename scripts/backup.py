#!/usr/bin/env python3
"""
Script de Respaldo Atómico de Alto Rendimiento - TrazaCao
Utiliza la API oficial sqlite3.Connection.backup para realizar una copia consistente
y segura en caliente, generando además un checksum SHA-256.
"""
import sqlite3
import hashlib
import time
from datetime import datetime
from pathlib import Path

import os

BASE_DIR = Path(__file__).resolve().parent.parent
DATOS_DIR = BASE_DIR / "datos"
RESPALDOS_DIR = DATOS_DIR / "respaldos"

# Detección inteligente de la base de datos (compatible con DEV 1 cacao_dev.db y DEV 2 cacao.db)
ENV_DB = os.environ.get("DATABASE_PATH")
if ENV_DB and Path(ENV_DB).exists():
    DB_ORIGEN = Path(ENV_DB)
elif (BASE_DIR / "cacao_dev.db").exists():
    DB_ORIGEN = BASE_DIR / "cacao_dev.db"
elif (DATOS_DIR / "cacao.db").exists():
    DB_ORIGEN = DATOS_DIR / "cacao.db"
else:
    DB_ORIGEN = DATOS_DIR / "cacao.db"

def realizar_respaldo():
    start_time = time.perf_counter()
    RESPALDOS_DIR.mkdir(parents=True, exist_ok=True)

    if not DB_ORIGEN.exists():
        print(f"[ERROR] No se encontro la base de datos origen en: {DB_ORIGEN}")
        return False

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_file = RESPALDOS_DIR / f"cacao_backup_{timestamp}.db"
    latest_file = DATOS_DIR / "cacao_backup_latest.db"

    # Conexión origen y destino
    src_conn = sqlite3.connect(str(DB_ORIGEN))
    dst_conn = sqlite3.connect(str(backup_file))

    try:
        # Copia atómica de páginas SQLite en memoria/disco
        with dst_conn:
            src_conn.backup(dst_conn, pages=-1)
    finally:
        dst_conn.close()
        src_conn.close()

    # Copiar también como backup_latest para restauraciones directas
    import shutil
    shutil.copy2(backup_file, latest_file)

    # Calcular hash SHA-256
    sha256_hash = hashlib.sha256()
    with open(backup_file, "rb") as f:
        for byte_block in iter(lambda: f.read(4096), b""):
            sha256_hash.update(byte_block)
    checksum = sha256_hash.hexdigest()

    checksum_file = backup_file.with_suffix(".sha256")
    checksum_file.write_text(checksum, encoding="utf-8")

    elapsed_ms = (time.perf_counter() - start_time) * 1000

    print("=" * 60)
    print(" [RESPALDO EXITOSO - TRAZACAO]")
    print(f" Destino: {backup_file.name}")
    print(f" Copia más reciente: {latest_file.name}")
    print(f" Checksum SHA-256: {checksum[:16]}...")
    print(f" Tiempo de respaldo: {elapsed_ms:.2f} ms")
    print("=" * 60)
    return True

if __name__ == "__main__":
    realizar_respaldo()
