"""
Pruebas de la Pasarela de Pago Simulada para TrazaCao Huila.
Verifica:
1. Flujo completo de compra simulada con tarjeta de prueba y descuento atómico de stock.
2. Generación de identificador ficticio 'SIM-PAGO-xxxx' y estado 'PAGO_SIMULADO'.
3. Rechazo estricto ante lotes en cuarentena (BLOQUEADO) o sobrestock.
4. Garantía de privacidad: Cero almacenamiento o persistencia de datos bancarios confidenciales.
"""

from decimal import Decimal
import uuid
import pytest
from fastapi.testclient import TestClient

from src.backend.main import app
from src.backend.infra.database import SessionLocal
from src.backend.models import Lote, Comprador, OrdenVenta, AuditoriaLog

client = TestClient(app)


def test_simulacion_compra_exitosa_lote_cacao():
    """Verifica una compra simulada exitosa con código SIM-PAGO y descuento atómico."""
    lote_id = f"SIM_LOT_{uuid.uuid4().hex[:6]}"
    
    db = SessionLocal()
    # Crear lote liberado para la simulación
    lote = Lote(
        id=lote_id,
        productor="Productor Huila Demo",
        origen="Rivera",
        humedad_porcentaje=Decimal("6.80"),
        fermentacion_porcentaje=Decimal("82.00"),
        kg_recibidos=Decimal("80.00"),
        kg_disponibles=Decimal("80.00"),
        estado="LIBERADO",
    )
    db.add(lote)
    db.commit()
    db.close()

    kg_compra = Decimal("12.50")
    payload_simulacion = {
        "tipo_producto": "LOTE_CACAO",
        "item_id": lote_id,
        "item_nombre": f"Cacao Fino de Aroma - Lote {lote_id}",
        "kg_comprados": float(kg_compra),
        "direccion_entrega": "Parque Industrial Huila, Bodega 4",
        "es_simulacion": True,
        "referencia_simulacion": f"SIM-PAGO-{uuid.uuid4().hex[:8].upper()}",
    }

    res = client.post("/api/ventas/comprar", json=payload_simulacion)
    assert res.status_code == 201, res.text
    data = res.json()

    # Validar formato y estado de simulación
    assert data["id"].startswith("SIM-PAGO-")
    assert data["estado"] == "PAGO_SIMULADO"
    assert data["es_simulacion"] is True
    assert Decimal(str(data["kg_comprados"])) == kg_compra
    assert Decimal(str(data["total_cop"])) == kg_compra * Decimal("25000.00")

    # Validar descuento atómico en base de datos
    db = SessionLocal()
    lote_db = db.query(Lote).filter(Lote.id == lote_id).first()
    assert lote_db.kg_disponibles == Decimal("80.00") - kg_compra

    # Validar bitácora de auditoría inmutable
    log = db.query(AuditoriaLog).filter(AuditoriaLog.lote_id == lote_id).order_by(AuditoriaLog.timestamp.desc()).first()
    assert log is not None
    assert log.accion == "VENTA_SIMULADA"
    assert "PAGO_SIMULADO" in log.valor_nuevo
    db.close()


def test_simulacion_compra_rechazo_lote_bloqueado():
    """Verifica que ningún comprador pueda simular ni completar compras de lotes retenidos por calidad."""
    lote_id = f"SIM_BLOQ_{uuid.uuid4().hex[:6]}"
    
    db = SessionLocal()
    lote = Lote(
        id=lote_id,
        productor="Productor Cuarentena",
        origen="Campoalegre",
        humedad_porcentaje=Decimal("8.50"),
        fermentacion_porcentaje=Decimal("60.00"),
        kg_recibidos=Decimal("50.00"),
        kg_disponibles=Decimal("50.00"),
        estado="BLOQUEADO",
    )
    db.add(lote)
    db.commit()
    db.close()

    payload_simulacion = {
        "tipo_producto": "LOTE_CACAO",
        "item_id": lote_id,
        "kg_comprados": 5.0,
        "es_simulacion": True,
    }

    res = client.post("/api/ventas/comprar", json=payload_simulacion)
    assert res.status_code == 422
    assert "RETENCIÓN PREVENTIVA DE CALIDAD" in res.json()["detail"]


def test_simulacion_compra_rechazo_sobrestock():
    """Verifica que la simulación no permita comprar más kilogramos de los que hay disponibles."""
    lote_id = f"SIM_STOCK_{uuid.uuid4().hex[:6]}"
    
    db = SessionLocal()
    lote = Lote(
        id=lote_id,
        productor="Productor Escaso",
        origen="Algeciras",
        humedad_porcentaje=Decimal("6.90"),
        fermentacion_porcentaje=Decimal("80.00"),
        kg_recibidos=Decimal("10.00"),
        kg_disponibles=Decimal("10.00"),
        estado="LIBERADO",
    )
    db.add(lote)
    db.commit()
    db.close()

    payload_simulacion = {
        "tipo_producto": "LOTE_CACAO",
        "item_id": lote_id,
        "kg_comprados": 50.0,  # Excede los 10 kg
        "es_simulacion": True,
    }

    res = client.post("/api/ventas/comprar", json=payload_simulacion)
    assert res.status_code == 422
    assert "Existencias insuficientes" in res.json()["detail"]


def test_privacidad_cero_almacenamiento_datos_tarjeta():
    """Garantiza que la base de datos no tenga columnas ni tablas para almacenar información de tarjetas."""
    db = SessionLocal()
    from sqlalchemy import inspect
    inspector = inspect(db.bind)
    columnas_orden = [col["name"] for col in inspector.get_columns("ordenes_venta")]
    
    # Asegurar que campos sensibles NUNCA existan en el modelo ni en BD
    campos_prohibidos = ["tarjeta", "numero_tarjeta", "cvv", "vencimiento", "card_number", "exp_date"]
    for campo in campos_prohibidos:
        assert campo not in columnas_orden, f"Vulnerabilidad de seguridad: '{campo}' encontrado en BD"
    db.close()
