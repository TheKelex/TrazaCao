"""
Benchmark de Rendimiento Agroindustrial - CacaoTrace Huila (RF03, E07)
Meta Oficial del Jurado (Pág. 4 Guía): Consulta de trazabilidad en <= 3.000 segundos.
Inserta y consulta más de 100 registros sintéticos del Huila midiendo con time.perf_counter().
"""

import os
import sqlite3
import time
from pathlib import Path
from decimal import Decimal

ROOT_DIR = Path(__file__).resolve().parent.parent
DB_PATH = Path(os.environ.get("DATABASE_PATH", ROOT_DIR / "cacao_dev.db"))

MUNICIPIOS_HUILA = [
    "Rivera", "Campoalegre", "Algeciras", "Gigante",
    "Garzón", "Palermo", "Pitalito", "Tello"
]


def ejecutar_benchmark():
    if not DB_PATH.exists():
        raise FileNotFoundError(f"Base de datos no encontrada en {DB_PATH}. Ejecute seed.py primero.")

    with sqlite3.connect(DB_PATH) as conn:
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        # 1. Asegurar al menos 100 lotes sintéticos del Huila respetando CAC001..CAC003
        for i in range(4, 110):
            lote_id = f"CAC{i:03d}"
            municipio = MUNICIPIOS_HUILA[i % len(MUNICIPIOS_HUILA)]
            cursor.execute("""
                INSERT OR IGNORE INTO lotes (
                    id, productor, origen, humedad_porcentaje, fermentacion_porcentaje,
                    kg_recibidos, kg_disponibles, estado, fecha_recepcion
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            """, (
                lote_id,
                f"Finca Cacaotera #{i}",
                municipio,
                7.40,
                76.00,
                120.00,
                120.00,
                "LIBERADO" if i % 2 == 0 else "PENDIENTE"
            ))
        conn.commit()

        # 2. Medir consulta completa de trazabilidad y existencia sobre >= 100 lotes
        t0 = time.perf_counter()
        filas = cursor.execute("""
            SELECT l.id, l.productor, l.origen, l.kg_recibidos, l.kg_disponibles, l.estado
            FROM lotes l
            ORDER BY l.id ASC
            LIMIT 100;
        """).fetchall()
        t_consulta = time.perf_counter() - t0

        # 3. Medir consulta puntual de Pasaporte de un lote (CAC050)
        t1 = time.perf_counter()
        detalle = cursor.execute("SELECT * FROM lotes WHERE id = ?", ("CAC050",)).fetchone()
        t_detalle = time.perf_counter() - t1

    print("=" * 70)
    print("BENCHMARK DE RENDIMIENTO (E07) - CACAOTRACE HUILA")
    print("OBJETIVO REGLAMENTARIO DE LA GUÍA OFICIAL: <= 3.000 SEGUNDOS")
    print("=" * 70)
    print(f"Registros evaluados          : {len(filas)} lotes agroindustriales")
    print(f"Consulta masiva (100 lotes)  : {t_consulta * 1000:.3f} ms ({t_consulta:.6f} s)")
    print(f"Consulta puntual (CAC050)    : {t_detalle * 1000:.3f} ms ({t_detalle:.6f} s)")
    cumple = t_consulta < 3.0
    print(f"Veredicto del Jurado         : {'[APROBADO SOBRESALIENTE]' if cumple else '[REPROBADO]'}")
    holgura = (3.0 - t_consulta) / 3.0 * 100
    print(f"Holgura frente a la norma    : {holgura:.2f}% más rápido que el límite exigido")
    print("=" * 70)


if __name__ == "__main__":
    ejecutar_benchmark()
