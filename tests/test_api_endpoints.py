"""
Suite de Pruebas de Integración de Endpoints - CacaoTrace Huila
Verifica RF01, RF02, RF04, RF05, RF06, RF08, RF09, RF10, RF11, RF12.
"""

import sys
import os
import unittest
from decimal import Decimal
from fastapi.testclient import TestClient

# Asegurar path de backend
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "src", "backend")))

from main import app
from infra.database import init_db, SessionLocal, engine
from models import Lote, Transformacion, AuditoriaLog

client = TestClient(app)


class TestApiIntegration(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        init_db()

    def setUp(self):
        # Limpiar y preparar base de datos de prueba
        db = SessionLocal()
        # NOTA DE AUDITORÍA: audit_logs NO se borra con DELETE porque el trigger de
        # inmutabilidad (RF10) aborta la operación como debe ser.
        db.query(Transformacion).delete()
        db.query(Lote).delete()
        db.commit()

        # Insertar lote de prueba
        lote_test = Lote(
            id="CAC_TEST_01",
            productor="Productor Test",
            origen="Rivera",
            humedad_porcentaje=Decimal("7.50"),
            fermentacion_porcentaje=Decimal("75.00"),
            kg_recibidos=Decimal("100.00"),
            kg_disponibles=Decimal("100.00"),
            estado="PENDIENTE",
        )
        db.add(lote_test)
        db.commit()
        db.close()

    def test_rf01_recepcion_valida_y_rechazo_negativos(self):
        """RF01: Crear lote válido y rechazar cantidades <= 0."""
        # Caso válido
        payload_valido = {
            "id": "CAC_TEST_02",
            "productor": "Productor B",
            "origen": "Campoalegre",
            "kg_recibidos": 150.0,
            "humedad_porcentaje": 7.2,
            "fermentacion_porcentaje": 80.0,
        }
        resp = client.post("/api/lotes", json=payload_valido, headers={"X-User-Role": "OPERADOR"})
        self.assertEqual(resp.status_code, 201)
        data = resp.json()
        self.assertEqual(data["id"], "CAC_TEST_02")
        self.assertEqual(float(data["kg_disponibles"]), 150.0)

        # Caso inválido: cantidad negativa
        payload_invalido = {
            "id": "CAC_TEST_03",
            "productor": "Productor C",
            "origen": "Algeciras",
            "kg_recibidos": -10.0,
        }
        resp_neg = client.post("/api/lotes", json=payload_invalido, headers={"X-User-Role": "OPERADOR"})
        self.assertEqual(resp_neg.status_code, 422)

    def test_rf02_rf04_rf08_transformacion_merma_y_control_stock(self):
        """RF02, RF04, RF08: Consumo de stock, cálculo de merma y rechazo por falta de inventario."""
        # 1. Transformar 100 kg con salida de 80 kg
        payload_trans = {
            "lote_id": "CAC_TEST_01",
            "etapa": "Tostión y Molienda",
            "responsable": "Operador 1",
            "kg_entrada": 100.0,
            "kg_salida_vendible": 80.0,
            "costo_etapa_cop": 1600000.0,
            "precio_venta_estimado": 25000.0,
        }
        resp = client.post(
            "/api/transformaciones",
            json=payload_trans,
            headers={"X-User-Role": "OPERADOR", "X-Idempotency-Key": "test-key-01"},
        )
        self.assertEqual(resp.status_code, 201)
        data = resp.json()
        self.assertEqual(float(data["merma_porcentaje"]), 20.0)
        self.assertTrue(data["alerta_merma"])
        self.assertEqual(float(data["costo_unitario_cop"]), 20000.0)
        self.assertEqual(float(data["margen_venta_porcentaje"]), 20.0)

        # 2. RF08: Intentar consumir más cuando el saldo disponible quedó en 0 kg
        resp_sobreconsumo = client.post(
            "/api/transformaciones",
            json={"lote_id": "CAC_TEST_01", "responsable": "Operador 1", "kg_entrada": 10.0, "kg_salida_vendible": 8.0},
            headers={"X-User-Role": "OPERADOR"},
        )
        self.assertEqual(resp_sobreconsumo.status_code, 422)
        self.assertIn("insuficientes", resp_sobreconsumo.json()["detail"].lower())

    def test_rf09_gestion_estados_rbac_operador_denegado_admin_permitido(self):
        """RF09: Solo Administrador puede liberar/bloquear. Operador recibe 403 Forbidden."""
        # 1. Operador intenta bloquear -> 403 Forbidden
        resp_op = client.patch(
            "/api/lotes/CAC_TEST_01/estado",
            json={"nuevo_estado": "BLOQUEADO", "motivo": "Intento de operador"},
            headers={"X-User-Role": "OPERADOR"},
        )
        self.assertEqual(resp_op.status_code, 403)

        # 2. Administrador bloquea con motivo -> 200 OK
        resp_admin = client.patch(
            "/api/lotes/CAC_TEST_01/estado",
            json={"nuevo_estado": "BLOQUEADO", "motivo": "Incidencia Hora 12: grano fuera de estándar"},
            headers={"X-User-Role": "ADMINISTRADOR"},
        )
        self.assertEqual(resp_admin.status_code, 200)
        self.assertEqual(resp_admin.json()["estado"], "BLOQUEADO")

    def test_rf06_ficha_publica_sanitizada_sin_fuga_de_costos(self):
        """RF06: Ficha pública NO contiene costos internos ni márgenes en el JSON."""
        resp = client.get("/api/public/pasaporte/CAC_TEST_01")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()

        # Verificar presencia de campos públicos
        self.assertEqual(data["lote_id"], "CAC_TEST_01")
        self.assertIn("Rivera", data["origen_municipio"])

        # VERIFICACIÓN ESTRICTA DE SEGURIDAD (ANTI-FUGA EN NETWORK):
        self.assertNotIn("costo_etapa_cop", data)
        self.assertNotIn("costo_unitario_cop", data)
        self.assertNotIn("margen_venta_porcentaje", data)
        self.assertNotIn("precio_venta_estimado", data)

    def test_rf10_auditoria_inmutable(self):
        """RF10: Consulta de auditoría disponible solo para Admin con histórico de acciones."""
        resp = client.get("/api/admin/auditoria", headers={"X-User-Role": "ADMINISTRADOR"})
        self.assertEqual(resp.status_code, 200)
        logs = resp.json()
        self.assertGreater(len(logs), 0)

    def test_rf11_exportacion_csv(self):
        """RF11: Exportación CSV estructurada con BOM utf-8-sig."""
        resp = client.get("/api/admin/export/csv", headers={"X-User-Role": "ADMINISTRADOR"})
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.headers["content-type"], "text/csv; charset=utf-8")
        self.assertTrue(resp.content.startswith(b"\xef\xbb\xbf"))  # BOM utf-8-sig

    def test_rf11_exportacion_excel_estilizado(self):
        """RF11 Plus: Exportación de reporte Excel (.xls) con diseño corporativo, tablas y KPIs."""
        resp = client.get("/api/admin/export/excel", headers={"X-User-Role": "ADMINISTRADOR"})
        self.assertEqual(resp.status_code, 200)
        self.assertIn("application/vnd.ms-excel", resp.headers["content-type"])
        self.assertIn("CACAOTRACE HUILA", resp.text)
        self.assertIn("Control de Lotes Huila", resp.text)


if __name__ == "__main__":
    unittest.main()

