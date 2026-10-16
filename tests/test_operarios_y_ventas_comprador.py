"""
Pruebas Automatizadas de CRUD de Operarios, Autenticación de Compradores y Ventas Directas
Verifica:
1. CRUD Administrativo de Operarios (crear, editar, vetar/activar y prohibición de eliminación física).
2. Autenticación y Registro de Compradores (portal de clientes B2B).
3. Compra Directa Inmediata con descuento atómico de inventario en lote y merma.
4. Rechazo de compra directa ante lotes bloqueados por calidad (Hora 12) o sobreconsumo.
"""

import pytest
from decimal import Decimal
from fastapi.testclient import TestClient
from src.backend.main import app
from src.backend.infra.database import get_db, SessionLocal
from src.backend.models import Lote, Usuario, Comprador, OrdenVenta

client = TestClient(app)


def test_crud_operarios_flujo_completo():
    """Verifica creación, edición, veto y bloqueo de eliminación de operarios."""
    import uuid
    uid = uuid.uuid4().hex[:6]
    username_test = f"op_qa_{uid}"
    # 1. Crear nuevo operario
    payload_nuevo = {
        "username": username_test,
        "nombre_completo": "Pedro Picapiedra (Test QA)",
        "password": "PasswordTest123!",
        "email": f"pedro_{uid}@trazacao.com",
        "telefono": "+57 300 111 2233",
        "cedula": "1098765432",
    }
    res_crear = client.post("/api/admin/operarios", json=payload_nuevo, headers={"X-User-Role": "ADMINISTRADOR"})
    assert res_crear.status_code == 201, res_crear.text
    data_op = res_crear.json()
    assert data_op["username"] == username_test
    assert data_op["activo"] is True
    op_id = data_op["id"]

    # 2. Listar operarios y encontrarlo
    res_lista = client.get("/api/admin/operarios", headers={"X-User-Role": "ADMINISTRADOR"})
    assert res_lista.status_code == 200
    ops = res_lista.json()
    assert any(o["id"] == op_id for o in ops)

    # 3. Editar datos del operario
    payload_edit = {
        "nombre_completo": "Pedro Picapiedra Editado",
        "telefono": "+57 300 999 8877",
    }
    res_edit = client.put(f"/api/admin/operarios/{op_id}", json=payload_edit, headers={"X-User-Role": "ADMINISTRADOR"})
    assert res_edit.status_code == 200
    assert res_edit.json()["nombre_completo"] == "Pedro Picapiedra Editado"
    assert res_edit.json()["telefono"] == "+57 300 999 8877"

    # 4. Vetar acceso al operario
    payload_veto = {
        "activo": False,
        "motivo": "Incumplimiento de norma de trazabilidad en báscula de acopio",
    }
    res_veto = client.patch(f"/api/admin/operarios/{op_id}/estado", json=payload_veto, headers={"X-User-Role": "ADMINISTRADOR"})
    assert res_veto.status_code == 200
    assert res_veto.json()["activo"] is False
    assert res_veto.json()["motivo_inactivacion"] == payload_veto["motivo"]

    # 4.1 Verificar que el operario vetado no puede iniciar sesión
    res_login_vetado = client.post("/api/auth/login", json={"username": username_test, "password": "PasswordTest123!"})
    assert res_login_vetado.status_code == 403
    assert "inactiva" in res_login_vetado.json()["detail"].lower()

    # 5. Reactivar operario
    payload_reactivar = {
        "activo": True,
        "motivo": "Capacitación completada satisfactoriamente",
    }
    res_reactivar = client.patch(f"/api/admin/operarios/{op_id}/estado", json=payload_reactivar, headers={"X-User-Role": "ADMINISTRADOR"})
    assert res_reactivar.status_code == 200
    assert res_reactivar.json()["activo"] is True

    # 6. Intentar ELIMINAR al operario -> DEBE SER RECHAZADO (HTTP 400)
    res_del = client.delete(f"/api/admin/operarios/{op_id}")
    assert res_del.status_code == 400
    assert "trazabilidad inmutable" in res_del.json()["detail"].lower()


def test_registro_y_login_comprador():
    """Verifica el flujo de registro y login de compradores B2B con tabla propia."""
    import uuid
    uid = uuid.uuid4().hex[:6]
    email_test = f"comprador_{uid}@chocolatiers.fr"
    payload_reg = {
        "email": email_test,
        "password": "PasswordComprador2026!",
        "nombre_contacto": "Jean-Luc Picard",
        "empresa_o_razon_social": "Chocolaterie de Paris SAS",
        "telefono": "+33 1 40 50 60 70",
        "pais_ciudad": "Francia, París",
    }

    # 1. Registro
    res_reg = client.post("/api/compradores/registro", json=payload_reg)
    assert res_reg.status_code == 201
    data = res_reg.json()
    assert data["comprador"]["email"] == email_test
    assert data["comprador"]["empresa_o_razon_social"] == "Chocolaterie de Paris SAS"
    comprador_id = data["comprador"]["id"]

    # 2. Rechazo de correo duplicado
    res_dup = client.post("/api/compradores/registro", json=payload_reg)
    assert res_dup.status_code == 400

    # 3. Login exitoso
    res_login = client.post(
        "/api/compradores/login",
        json={"email": email_test, "password": "PasswordComprador2026!"},
    )
    assert res_login.status_code == 200
    assert res_login.json()["comprador"]["id"] == comprador_id

    # 4. Login fallido por contraseña errónea
    res_fail = client.post(
        "/api/compradores/login",
        json={"email": email_test, "password": "PasswordErronea!"},
    )
    assert res_fail.status_code == 401


def test_compra_directa_lote_cacao_con_descuento_atomico():
    """Verifica que una compra directa descuente atómicamente el stock del lote."""
    import uuid
    lote_id = f"LOTE_TEST_{uuid.uuid4().hex[:6]}"
    
    db = SessionLocal()
    # Asegurar lote de prueba liberado
    lote = Lote(
        id=lote_id,
        productor="Productor Venta Test",
        origen="Rivera",
        humedad_porcentaje=Decimal("7.20"),
        fermentacion_porcentaje=Decimal("80.00"),
        kg_recibidos=Decimal("100.00"),
        kg_disponibles=Decimal("100.00"),
        estado="LIBERADO",
    )
    db.add(lote)

    # Asegurar comprador
    comprador = db.query(Comprador).first()
    if not comprador:
        comprador = Comprador(
            id=f"cmp-test-{uuid.uuid4().hex[:6]}",
            email=f"test_buyer_{uuid.uuid4().hex[:4]}@cacao.com",
            password_hash="fakehash",
            nombre_contacto="Comprador Test",
            empresa_o_razon_social="Chocolates Test",
            activo=True,
        )
        db.add(comprador)
    db.commit()
    db.refresh(comprador)
    db.refresh(lote)
    comprador_id = comprador.id
    stock_inicial = Decimal(str(lote.kg_disponibles))
    db.close()

    kg_a_comprar = Decimal("15.00")
    payload_compra = {
        "comprador_id": comprador_id,
        "tipo_producto": "LOTE_CACAO",
        "item_id": lote_id,
        "item_nombre": f"Cacao Fino de Aroma - Lote {lote_id} (Rivera)",
        "kg_comprados": float(kg_a_comprar),
        "direccion_entrega": "Calle 100 # 15-20, Bogotá DC",
    }

    res_compra = client.post("/api/ventas/comprar", json=payload_compra)
    assert res_compra.status_code == 201, res_compra.text
    orden = res_compra.json()
    assert orden["id"].startswith(f"VTA-{lote_id}-")
    assert orden["kg_comprados"] == "15.00"
    assert Decimal(orden["total_cop"]) == Decimal("15.00") * Decimal("25000.00")

    # Verificar descuento atómico en base de datos
    db = SessionLocal()
    lote_post = db.query(Lote).filter(Lote.id == lote_id).first()
    stock_final = Decimal(str(lote_post.kg_disponibles))
    assert stock_final == stock_inicial - kg_a_comprar
    db.close()


def test_rechazo_compra_lote_bloqueado_y_sobrestock():
    """Verifica que no se pueda comprar lotes bloqueados ni exceder el stock disponible."""
    import uuid
    lote_id = f"LOTE_BLOQ_{uuid.uuid4().hex[:6]}"
    
    db = SessionLocal()
    lote = Lote(
        id=lote_id,
        productor="Productor Bloqueado Test",
        origen="Algeciras",
        humedad_porcentaje=Decimal("7.40"),
        fermentacion_porcentaje=Decimal("76.00"),
        kg_recibidos=Decimal("50.00"),
        kg_disponibles=Decimal("50.00"),
        estado="LIBERADO",
    )
    db.add(lote)
    comprador = db.query(Comprador).first()
    db.commit()
    db.refresh(comprador)
    comprador_id = comprador.id
    db.close()

    # 1. Intentar comprar sobrestock (ej. 99999 kg)
    payload_sobrestock = {
        "comprador_id": comprador_id,
        "tipo_producto": "LOTE_CACAO",
        "item_id": lote_id,
        "kg_comprados": 99999.0,
    }
    res_sobre = client.post("/api/ventas/comprar", json=payload_sobrestock)
    assert res_sobre.status_code == 422
    assert "insuficientes" in res_sobre.json()["detail"].lower()

    # 2. Bloquear lote para simular cuarentena
    client.patch(
        f"/api/lotes/{lote_id}/estado",
        json={"nuevo_estado": "BLOQUEADO", "motivo": "Cuarentena por olor extraño"},
        headers={"X-User-Role": "ADMINISTRADOR"},
    )

    payload_bloqueado = {
        "comprador_id": comprador_id,
        "tipo_producto": "LOTE_CACAO",
        "item_id": lote_id,
        "kg_comprados": 5.0,
    }
    res_bloq = client.post("/api/ventas/comprar", json=payload_bloqueado)
    assert res_bloq.status_code == 422
    assert "retención preventiva" in res_bloq.json()["detail"].lower()
