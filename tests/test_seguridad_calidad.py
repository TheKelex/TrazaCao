"""
Suite de Pruebas de Seguridad, Infraestructura y QA - TrazaCao (DEV 2)
Cubre de forma exhaustiva los 6 casos de prueba obligatorios de la gobernanza Kanban
y los requerimientos RF08, RF09, RF10, RF11, RF12 más el diferenciador de Economía Circular.
"""

import os
import sys
from decimal import Decimal
import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient
from sqlalchemy import text

# Asegurar path de backend
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "src", "backend")))

from main import app
from models import Lote, Transformacion, AuditoriaLog
from domain.calculos import (
    calcular_merma_y_alerta,
    calcular_costo_unitario,
    calcular_margen_venta,
    calcular_indicadores_cascarilla,
    balance_agroindustrial_completo,
)
from services.inventario import descontar_inventario_atomico
from security.rbac import require_admin, require_operador_or_admin


# ==============================================================================
# LOS 6 CASOS DE PRUEBA UNITARIOS EXIGIDOS PARA DEV 2 (PLAN Y GOBERNANZA)
# ==============================================================================

def test_caso_feliz_cac001():
    """
    CASO 1 - CASO FELIZ OFICIAL CAC001 (RF01, RF02, RF04, RF05, RF12):
    - Entrada: 100 kg, Salida: 80 kg sin ingredientes añadidos.
    - Merma: (100 - 80) / 100 * 100 = 20.00%.
    - Alerta de merma: Activa (True) porque 20.00% > 15.00%.
    - Costo total etapa: $1.600.000 COP -> Costo unitario = $20.000.00 COP/kg.
    - Precio de venta hipotético: $25.000 COP/kg -> Margen sobre venta = 20.00%.
    """
    entrada = Decimal("100.00")
    salida = Decimal("80.00")
    costo_etapa = Decimal("1600000.00")
    precio_venta = Decimal("25000.00")

    # 1. Cálculo de merma y alerta
    merma, alerta, explicacion = calcular_merma_y_alerta(entrada, salida)
    assert merma == Decimal("20.00")
    assert alerta is True
    assert "supera el umbral" in explicacion

    # 2. Cálculo de costo unitario
    costo_u = calcular_costo_unitario(costo_etapa, salida)
    assert costo_u == Decimal("20000.00")

    # 3. Margen sobre venta
    margen = calcular_margen_venta(precio_venta, costo_u)
    assert margen == Decimal("20.00")


def test_merma_negativa_o_invalida():
    """
    CASO 2 - VALIDACIÓN DE CANTIDADES Y BALANCE DE MASAS (RF01, RF02):
    - Salida mayor a la entrada sin justificación física es rechazada.
    - Salida o entrada negativa arroja error de dominio controlado.
    """
    entrada = Decimal("100.00")
    salida_mayor = Decimal("120.00")

    # Intento de salida > entrada
    with pytest.raises(ValueError) as exc_info:
        calcular_merma_y_alerta(entrada, salida_mayor)
    assert "no puede superar la entrada" in str(exc_info.value)

    # Cantidad negativa
    with pytest.raises(ValueError) as exc_neg:
        calcular_merma_y_alerta(entrada, Decimal("-10.00"))
    assert "no puede ser negativa" in str(exc_neg.value)


def test_stock_insuficiente_rf08(db_test):
    """
    CASO 3 - CONTROL DE EXISTENCIAS ATÓMICO (RF08):
    - Dado un lote CAC001 con 100 kg disponibles.
    - Se solicita consumir 120 kg.
    - Esperado: Operación rechazada con HTTP 422, saldo se conserva íntegro en 100 kg.
    - Consumo posterior válido de 40 kg descuenta a exactamente 60 kg.
    """
    lote = Lote(
        id="CAC001",
        productor="Productor Huilense",
        origen="Rivera",
        kg_recibidos=Decimal("100.00"),
        kg_disponibles=Decimal("100.00"),
        estado="PENDIENTE",
    )
    db_test.add(lote)
    db_test.commit()

    # 1. Intento de sobreconsumo (120 kg > 100 kg)
    with pytest.raises(HTTPException) as exc_err:
        descontar_inventario_atomico(db_test, "CAC001", Decimal("120.00"))
    assert exc_err.value.status_code == 422
    assert "insuficientes" in exc_err.value.detail.lower()

    # Verificar que el saldo no cambió
    db_test.refresh(lote)
    assert lote.kg_disponibles == Decimal("100.00")

    # 2. Consumo legítimo de 40 kg
    nuevo_saldo = descontar_inventario_atomico(db_test, "CAC001", Decimal("40.00"))
    assert nuevo_saldo == Decimal("60.00")

    db_test.refresh(lote)
    assert lote.kg_disponibles == Decimal("60.00")


def test_resiliencia_division_cero_rf12():
    """
    CASO 4 - RESILIENCIA ANTE DIVISIÓN POR CERO (RF12):
    - Entrada = 0 kg: cálculo de merma rechaza con ValueError controlado (no ZeroDivisionError).
    - Salida vendible = 0 kg: costo unitario retorna None seguro sin ZeroDivisionError.
    - Precio de venta = 0 COP: margen retorna Decimal('0.00') sin ZeroDivisionError.
    """
    # 1. Entrada = 0
    with pytest.raises(ValueError) as exc:
        calcular_merma_y_alerta(Decimal("0.0"), Decimal("0.0"))
    assert "mayor a 0 kg" in str(exc.value)

    # 2. Salida = 0 (pérdida total)
    costo_u = calcular_costo_unitario(Decimal("1600000.0"), Decimal("0.0"))
    assert costo_u is None  # Retorna seguro para renderizar 'N/A'

    # 3. Precio = 0
    margen = calcular_margen_venta(Decimal("0.0"), Decimal("20000.0"))
    assert margen == Decimal("0.00")


def test_permisos_403_operador_cambio_estado(db_test):
    """
    CASO 5 - RBAC REAL EN CAPA DE DATOS (RF09, RF10):
    - Operador intenta invocar acción administrativa.
    - Esperado: HTTP 403 Forbidden.
    - Intento registrado en audit_logs de forma inmutable.
    """
    dep_admin = require_admin

    with pytest.raises(HTTPException) as exc_info:
        dep_admin(auth={"usuario": "operador_acopio", "rol": "OPERADOR"}, db=db_test)

    assert exc_info.value.status_code == 403
    assert "no tiene permisos" in exc_info.value.detail

    # Verificar que el intento no autorizado quedó auditado en la tabla inmutable
    log = db_test.query(AuditoriaLog).filter(AuditoriaLog.accion == "INTENTO_NO_AUTORIZADO").first()
    assert log is not None
    assert log.usuario == "operador_acopio"
    assert "OPERADOR" in log.valor_anterior


def test_regresion_incidencia_hora_12(db_test):
    """
    CASO 6 - REGRESIÓN DE LA INCIDENCIA TÉCNICA OFICIAL (HORA 12):
    - Escenario: Bloqueo de CAC001 con motivo obligatorio.
    - Verificaciones:
      1. El lote pasa a estado BLOQUEADO.
      2. El motivo queda asentado en la base de datos.
      3. El consumo de inventario de un lote bloqueado es denegado atómicamente.
    """
    lote = Lote(
        id="CAC001",
        productor="Productor Huilense",
        origen="Rivera",
        kg_recibidos=Decimal("100.00"),
        kg_disponibles=Decimal("100.00"),
        estado="PENDIENTE",
    )
    db_test.add(lote)
    db_test.commit()

    # Bloqueo con motivo
    motivo_oficial = "Incidencia Hora 12: Detección de humedad fuera de estándar NTC 1252"
    lote.estado = "BLOQUEADO"
    lote.motivo_bloqueo = motivo_oficial

    log = AuditoriaLog(
        usuario="admin_calidad",
        accion="BLOQUEO",
        lote_id="CAC001",
        valor_anterior="PENDIENTE",
        valor_nuevo="BLOQUEADO",
        motivo=motivo_oficial,
    )
    db_test.add(log)
    db_test.commit()

    # Verificar que el consumo atómico rechaza el lote bloqueado
    with pytest.raises(HTTPException) as exc:
        descontar_inventario_atomico(db_test, "CAC001", Decimal("10.00"))
    assert exc.value.status_code == 422
    assert "BLOQUEADO" in exc.value.detail


# ==============================================================================
# PRUEBAS DE INMUTABILIDAD EN BASE DE DATOS Y PLUS DIFERENCIADOR
# ==============================================================================

def test_inmutabilidad_audit_logs_trigger_no_update(db_test):
    """
    RF10: Valida que los triggers en SQL nativo bloqueen cualquier intento de UPDATE en audit_logs.
    """
    log = AuditoriaLog(
        usuario="operador1",
        accion="CREACION",
        lote_id="CAC001",
        valor_anterior=None,
        valor_nuevo="PENDIENTE",
        motivo="Recepción inicial",
    )
    db_test.add(log)
    db_test.commit()

    # Intento malicioso de modificar la auditoría
    with pytest.raises(Exception) as exc_info:
        db_test.execute(text("UPDATE audit_logs SET motivo = 'Alterado' WHERE id = :id"), {"id": log.id})
        db_test.commit()

    assert "RF10" in str(exc_info.value) or "inmutables" in str(exc_info.value).lower()


def test_inmutabilidad_audit_logs_trigger_no_delete(db_test):
    """
    RF10: Valida que los triggers en SQL nativo bloqueen cualquier intento de DELETE en audit_logs.
    """
    log = AuditoriaLog(
        usuario="operador1",
        accion="CREACION",
        lote_id="CAC002",
        valor_anterior=None,
        valor_nuevo="PENDIENTE",
        motivo="Recepción inicial",
    )
    db_test.add(log)
    db_test.commit()

    # Intento malicioso de borrar la auditoría
    with pytest.raises(Exception) as exc_info:
        db_test.execute(text("DELETE FROM audit_logs WHERE id = :id"), {"id": log.id})
        db_test.commit()

    assert "RF10" in str(exc_info.value) or "prohibido" in str(exc_info.value).lower() or "inmutables" in str(exc_info.value).lower()


def test_seguridad_rbac_admin_permitido(db_test):
    """
    RF09: Valida que un usuario con rol ADMINISTRADOR sea autorizado correctamente.
    """
    dep_admin = require_admin
    resultado = dep_admin(auth={"usuario": "admin_maria", "rol": "ADMINISTRADOR"}, db=db_test)

    assert resultado["usuario"] == "admin_maria"
    assert resultado["rol"] == "ADMINISTRADOR"


def test_diferenciador_economia_circular_merma():
    """
    PLUS DIFERENCIADOR: Valida la valorización de subproductos (cascarilla)
    a partir de los 20 kg de merma sin alterar el costo unitario oficial.
    """
    res = calcular_indicadores_cascarilla(
        kg_entrada=Decimal("100.00"),
        kg_salida_vendible=Decimal("80.00"),
        costo_total_etapa_cop=Decimal("1600000.00"),
        precio_kg_cascarilla_cop=Decimal("3000.00"),
    )

    assert res["kg_cascarilla_recuperada"] == Decimal("20.00")
    assert res["valor_kg_cascarilla_cop"] == Decimal("3000.00")
    assert res["ingreso_adicional_cop"] == Decimal("60000.00")
    assert res["costo_neto_circular_cop"] == Decimal("1540000.00")


def test_exportacion_csv_utf8_sig_admin():
    """
    RF11: Valida que el endpoint de exportación CSV requiera rol de Administrador
    y emita el archivo con la cabecera BOM de Excel (utf-8-sig).
    """
    client = TestClient(app)

    # 1. Operador rechazado con 403
    resp_op = client.get("/api/admin/export/csv", headers={"X-User-Role": "OPERADOR"})
    assert resp_op.status_code == 403

    # 2. Administrador permitido con 200 y BOM
    resp_admin = client.get("/api/admin/export/csv", headers={"X-User-Role": "ADMINISTRADOR"})
    assert resp_admin.status_code == 200
    assert resp_admin.headers["content-type"] == "text/csv; charset=utf-8"
    assert resp_admin.content.startswith(b"\xef\xbb\xbf")
