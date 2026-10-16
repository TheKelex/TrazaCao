"""
Pruebas Automatizadas para el Catálogo Industrial y Botánico B2B de Mermas de Cacao.
Valida:
1. Consulta del catálogo público de subproductos botánicos e industriales.
2. Regla de frontera de negocio: venta de materia prima vegetal, no productos finales.
3. Radicación de solicitud de cotización B2B para industrias cosméticas y de fertilizantes.
"""

import sys
import os
from decimal import Decimal
import pytest
from fastapi.testclient import TestClient

# Asegurar path para imports de backend
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "src", "backend")))

from main import app
from infra.database import init_db
from seed import seed

client = TestClient(app)


@pytest.fixture(scope="module", autouse=True)
def setup_database():
    init_db()


def test_catalogo_industrial_botanico_disponible():
    """Valida la estructura y respuesta del catálogo B2B de materias primas derivadas de merma."""
    res = client.get("/api/subproductos/catalogo-industrial")
    assert res.status_code == 200, f"Error al consultar catálogo: {res.text}"
    
    data = res.json()
    assert "principio_negocio" in data
    assert "total_merma_recuperada_kg" in data
    assert Decimal(str(data["total_merma_recuperada_kg"])) >= Decimal("20.00")
    
    subproductos = data["subproductos"]
    assert len(subproductos) == 3

    sectores = [s["sector_industrial"] for s in subproductos]
    assert "Industria Cosmética y Dermocosmética" in sectores
    assert "Agroquímica Orgánica y Biofertilizantes" in sectores
    assert "Extractos Botánicos, Fitofármacos y Nutracéutica" in sectores

    for item in subproductos:
        assert item["id"].startswith("SUB-")
        assert Decimal(str(item["kg_disponibles"])) > Decimal("0")
        assert Decimal(str(item["precio_b2b_kg_cop"])) > Decimal("0")
        assert len(item["aplicaciones_industriales"]) >= 2
        # Verificar deslinde de no fabricación de cosméticos/fertilizantes terminados
        assert "no manufactura mascarillas" in item["frontera_negocio"].lower()


def test_solicitud_cotizacion_materia_prima_b2b():
    """Valida la radicación de cotización B2B por parte de una gran empresa compradora."""
    payload = {
        "subproducto_id": "SUB-COSM-01",
        "lote_origen_id": "CAC001",
        "empresa_solicitante": "BioCosmética Andina S.A.",
        "sector_industrial": "Cosmética Natural",
        "correo_corporativo": "compras@biocosmetica.com",
        "telefono_contacto": "+57 312 987 6543",
        "volumen_requerido_kg": 500.0,
        "aplicacion_prevista": "Formulación de mascarillas exfoliantes de cacao fino de aroma",
    }
    res = client.post("/api/subproductos/solicitar-cotizacion-b2b", json=payload)
    assert res.status_code == 201, f"Error al radicar solicitud: {res.text}"
    
    data = res.json()
    assert data["folio_solicitud"].startswith("COT-B2B-")
    assert data["empresa"] == "BioCosmética Andina S.A."
    assert data["subproducto_solicitado"] == "SUB-COSM-01"
    assert data["estado"] == "RECIBIDA_ANALISIS_TECNICO"
