"""
Prueba de Regresión Automatizada - Incidencia de la Hora 12
Reto USCO DEVURITY: Cacao con historia, calidad y valor
Escenario: Comprador reporta problema en CAC001 -> Admin bloquea el lote -> 
Comprobación de que la ficha pública se actualiza, nuevas transformaciones se rechazan,
el historial de auditoría se preserva y el resto del sistema sigue operando normalmente.
"""

import sys
import os
import unittest
from decimal import Decimal
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "src", "backend")))

from main import app
from infra.database import init_db, SessionLocal
from models import Lote, Transformacion

client = TestClient(app)


class TestIncidenciaHora12(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        init_db()

    def setUp(self):
        db = SessionLocal()
        db.query(Transformacion).delete()
        db.query(Lote).delete()

        # Preparar lote CAC001 inicialmente LIBERADO
        cac001 = Lote(
            id="CAC001",
            productor="Productor A",
            origen="Rivera",
            humedad_porcentaje=Decimal("7.50"),
            fermentacion_porcentaje=Decimal("78.00"),
            kg_recibidos=Decimal("100.00"),
            kg_disponibles=Decimal("100.00"),
            estado="LIBERADO",
        )
        # Preparar lote CAC002 para verificar que no hay regresión colateral
        cac002 = Lote(
            id="CAC002",
            productor="Productor B",
            origen="Campoalegre",
            humedad_porcentaje=Decimal("7.20"),
            fermentacion_porcentaje=Decimal("80.00"),
            kg_recibidos=Decimal("150.00"),
            kg_disponibles=Decimal("150.00"),
            estado="LIBERADO",
        )
        db.add_all([cac001, cac002])
        db.commit()
        db.close()

    def test_protocolo_completo_incidencia_hora_12(self):
        # 1. Comprador consulta inicialmente CAC001: está liberado y comercializable
        resp_ini = client.get("/api/public/pasaporte/CAC001")
        self.assertEqual(resp_ini.status_code, 200)
        self.assertEqual(resp_ini.json()["estado"], "LIBERADO")
        self.assertTrue(resp_ini.json()["es_comercializable"])

        # 2. Operador intenta bloquear CAC001: el backend lo rechaza con 403 Forbidden
        resp_op = client.patch(
            "/api/lotes/CAC001/estado",
            json={"nuevo_estado": "BLOQUEADO", "motivo": "Reporte de comprador no conforme"},
            headers={"X-User-Role": "OPERADOR"},
        )
        self.assertEqual(resp_op.status_code, 403)

        # 3. Administrador bloquea el lote CAC001 con motivo obligatorio
        motivo_hora_12 = "Incidencia Hora 12: Comprador reporta olor anómalo y humedad no conforme en CAC001"
        resp_block = client.patch(
            "/api/lotes/CAC001/estado",
            json={"nuevo_estado": "BLOQUEADO", "motivo": motivo_hora_12},
            headers={"X-User-Role": "ADMINISTRADOR"},
        )
        self.assertEqual(resp_block.status_code, 200)
        self.assertEqual(resp_block.json()["estado"], "BLOQUEADO")
        self.assertEqual(resp_block.json()["motivo_bloqueo"], motivo_hora_12)

        # 4. Ficha Comercial Pública (QR) se actualiza de inmediato
        resp_pub = client.get("/api/public/pasaporte/CAC001")
        self.assertEqual(resp_pub.status_code, 200)
        self.assertEqual(resp_pub.json()["estado"], "BLOQUEADO")
        self.assertFalse(resp_pub.json()["es_comercializable"])

        # 5. Intentar transformar el lote bloqueado CAC001: debe ser rechazado
        resp_trans = client.post(
            "/api/transformaciones",
            json={
                "lote_id": "CAC001",
                "etapa": "Molienda",
                "responsable": "Operador 1",
                "kg_entrada": 50.0,
                "kg_salida_vendible": 40.0,
            },
            headers={"X-User-Role": "OPERADOR"},
        )
        self.assertEqual(resp_trans.status_code, 422)
        self.assertIn("bloqueado", resp_trans.json()["detail"].lower())

        # 6. Historial de Auditoría preserva el evento completo sin borrado
        resp_audit = client.get(
            "/api/admin/auditoria?lote_id=CAC001",
            headers={"X-User-Role": "ADMINISTRADOR"},
        )
        self.assertEqual(resp_audit.status_code, 200)
        logs = resp_audit.json()
        bloqueo_logs = [l for l in logs if l["accion"] == "BLOQUEO"]
        self.assertGreaterEqual(len(bloqueo_logs), 1)
        self.assertEqual(bloqueo_logs[0]["valor_anterior"], "LIBERADO")
        self.assertEqual(bloqueo_logs[0]["valor_nuevo"], "BLOQUEADO")
        self.assertEqual(bloqueo_logs[0]["motivo"], motivo_hora_12)

        # 7. Regresión Positiva: CAC002 continúa operando y comercializable
        resp_cac002 = client.get("/api/public/pasaporte/CAC002")
        self.assertEqual(resp_cac002.status_code, 200)
        self.assertEqual(resp_cac002.json()["estado"], "LIBERADO")
        self.assertTrue(resp_cac002.json()["es_comercializable"])


if __name__ == "__main__":
    unittest.main()
