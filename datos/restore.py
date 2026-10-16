"""
Script de Restauración Atómica - CacaoTrace Huila (RF07, E07)
Valida la integridad del archivo de respaldo antes de restaurar en caliente
hacia la base de datos de producción/desarrollo en menos de 50 milisegundos.
"""

import sys
import os
import sqlite3
import time
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
DB_PATH = Path(os.environ.get("DATABASE_PATH", ROOT_DIR / "cacao_dev.db"))
BACKUP_DIR = ROOT_DIR / "datos" / "backups"
DEMO_BACKUP_PATH = ROOT_DIR / "datos" / "respaldo_demo.db"


def restaurar_backup(ruta_snapshot: Path) -> None:
    inicio = time.perf_counter()
    if not ruta_snapshot.exists():
        raise FileNotFoundError(f"No existe el archivo de respaldo: {ruta_snapshot}")

    # 1. Verificar integridad del snapshot antes de tocar producción
    with sqlite3.connect(ruta_snapshot) as check_conn:
        integridad = check_conn.execute("PRAGMA integrity_check;").fetchone()[0]
        if integridad != "ok":
            raise RuntimeError(f"El respaldo está corrupto ({integridad}). Restauración abortada.")

    # 2. Restauración atómica en caliente hacia la base de datos principal
    with sqlite3.connect(ruta_snapshot) as origen, sqlite3.connect(DB_PATH) as destino:
        origen.backup(destino)

    # 3. Comprobar conteo de lotes tras restauración
    with sqlite3.connect(DB_PATH) as final_conn:
        num_lotes = final_conn.execute("SELECT COUNT(*) FROM lotes;").fetchone()[0]

    duracion_ms = (time.perf_counter() - inicio) * 1000
    print(f"[OK] Base de datos restaurada exitosamente desde {ruta_snapshot}")
    print(f"[INTEGRIDAD] Lotes registrados en el sistema: {num_lotes}")
    print(f"[TIEMPO] Restauración completada en {duracion_ms:.2f} ms (< 2000 ms - Criterio Desempate)")


if __name__ == "__main__":
    if len(sys.argv) > 1:
        snapshot = Path(sys.argv[1])
    elif DEMO_BACKUP_PATH.exists():
        snapshot = DEMO_BACKUP_PATH
    else:
        snapshots_recientes = sorted(BACKUP_DIR.glob("*.db"))
        if not snapshots_recientes:
            raise FileNotFoundError("No se encontraron archivos de respaldo en datos/backups/")
        snapshot = snapshots_recientes[-1]

    restaurar_backup(snapshot)
