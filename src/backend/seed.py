"""
Script de Inicialización y Semilla de Datos - CacaoTrace Huila
Carga los datos base sintéticos del reto (CAC001, CAC002, CAC003)
y ejecuta la transformación oficial del caso de estudio CAC001.
"""

import sys
import os

# Asegurar path correcto
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from infra.database import init_db, SessionLocal
from models import Lote, Transformacion, AuditoriaLog
from domain.calculos import balance_agroindustrial_completo
from decimal import Decimal


def seed():
    print("Iniciando carga de datos sintéticos oficiales...")
    init_db()
    db = SessionLocal()

    try:
        # 1. Limpiar datos previos si existen
        db.query(Transformacion).delete()
        db.query(Lote).delete()
        db.query(AuditoriaLog).delete()
        db.commit()

        # 2. Lotes Oficiales de la Guía DEVURITY / USCO
        lotes_base = [
            Lote(
                id="CAC001",
                productor="Productor A",
                origen="Rivera",
                humedad_porcentaje=Decimal("7.50"),
                fermentacion_porcentaje=Decimal("78.00"),
                kg_recibidos=Decimal("100.00"),
                kg_disponibles=Decimal("100.00"),
                estado="LIBERADO",
            ),
            Lote(
                id="CAC002",
                productor="Productor B",
                origen="Campoalegre",
                humedad_porcentaje=Decimal("7.20"),
                fermentacion_porcentaje=Decimal("80.00"),
                kg_recibidos=Decimal("150.00"),
                kg_disponibles=Decimal("150.00"),
                estado="LIBERADO",
            ),
            Lote(
                id="CAC003",
                productor="Productor C",
                origen="Algeciras",
                humedad_porcentaje=Decimal("7.40"),
                fermentacion_porcentaje=Decimal("76.00"),
                kg_recibidos=Decimal("80.00"),
                kg_disponibles=Decimal("80.00"),
                estado="PENDIENTE",
            ),
        ]

        for l in lotes_base:
            db.add(l)
            db.add(
                AuditoriaLog(
                    usuario="sistema_seed",
                    accion="CREACION",
                    lote_id=l.id,
                    valor_anterior=None,
                    valor_nuevo=f"Recibidos: {l.kg_recibidos} kg, Productor: {l.productor}, Origen: {l.origen}",
                    motivo="Carga inicial de datos sintéticos del caso de estudio",
                )
            )
        db.commit()
        print("[OK] Lotes CAC001 (Rivera), CAC002 (Campoalegre) y CAC003 (Algeciras) creados exitosamente.")

        # 3. Registrar Transformación Oficial de CAC001 (100 kg -> 80 kg)
        # Descontar saldo de CAC001
        lote_cac001 = db.query(Lote).filter(Lote.id == "CAC001").first()
        lote_cac001.kg_disponibles = Decimal("0.00")  # Se consumieron los 100 kg

        balance = balance_agroindustrial_completo(
            kg_entrada=Decimal("100.00"),
            kg_salida_vendible=Decimal("80.00"),
            costo_total_etapa_cop=Decimal("1600000.00"),
            precio_venta_cop=Decimal("25000.00"),
        )
        circular = balance["economia_circular"]

        trans_cac001 = Transformacion(
            id="trans-cac001-oficial",
            lote_id="CAC001",
            etapa="Tostión y Molienda",
            responsable="Operador Planta 1",
            kg_entrada=Decimal("100.00"),
            kg_salida_vendible=Decimal("80.00"),
            kg_cascarilla=circular["kg_cascarilla_recuperada"],
            merma_porcentaje=balance["merma_porcentaje"],
            alerta_merma=balance["alerta_merma"],
            alerta_explicacion=balance["alerta_explicacion"],
            costo_etapa_cop=Decimal("1600000.00"),
            costo_unitario_cop=balance["costo_unitario_cop"],
            precio_venta_estimado=Decimal("25000.00"),
            margen_venta_porcentaje=balance["margen_venta_porcentaje"],
            ingreso_cascarilla_cop=circular["ingreso_adicional_cop"],
            costo_neto_circular_cop=circular["costo_neto_circular_cop"],
            incidencia_justificacion="Etapa de tostión y molienda oficial del reto.",
        )
        db.add(trans_cac001)

        db.add(
            AuditoriaLog(
                usuario="sistema_seed",
                accion="TRANSFORMACION",
                lote_id="CAC001",
                valor_anterior="Consumo: 100.00 kg",
                valor_nuevo=f"Salida: 80.00 kg, Merma: {balance['merma_porcentaje']}%",
                motivo="Ejecución de transformación canónica del reto USCO",
            )
        )
        db.commit()

        print("\n--- RESUMEN CANÓNICO DEL CASO BASE CAC001 ---")
        print(f"Lote Origen: CAC001 (Rivera, Huila)")
        print(f"Entrada: 100.00 kg -> Salida Vendible: 80.00 kg")
        print(f"Merma Calculada: {balance['merma_porcentaje']}% -> Alerta: {balance['alerta_merma']}")
        print(f"Costo Unitario Oficial: ${balance['costo_unitario_cop']:,.2f} COP/kg")
        print(f"Margen sobre Venta: {balance['margen_venta_porcentaje']}%")
        print(f"Subproducto (Cascarilla 20 kg): ${circular['ingreso_adicional_cop']:,.2f} COP recuperados")
        print(f"Costo Neto Circular: ${circular['costo_neto_circular_cop']:,.2f} COP")
        print("--------------------------------------------\n")
        print("[EXITO] Base de datos lista para demostración ante el jurado.")

    except Exception as e:
        db.rollback()
        print(f"[ERROR] Falló la inicialización: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
