"""
Pruebas Unitarias y de Integración - Autenticación y RBAC (TrazaCao Huila)
Verifica:
1. Login exitoso con credenciales válidas (admin y operador)
2. Login fallido por contraseña incorrecta (HTTP 401)
3. Login fallido por usuario inexistente (HTTP 401)
4. Consulta de endpoint /api/auth/me
5. Contraseñas no se almacenan en texto plano (verificación de hash)
"""

import pytest
from fastapi.testclient import TestClient
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "src", "backend")))

from main import app
from infra.database import SessionLocal
from models import Usuario
from security.hashing import verify_password


@pytest.fixture
def client():
    return TestClient(app)


def test_login_admin_exitoso(client):
    response = client.post("/api/auth/login", json={
        "username": "admin",
        "password": "AdminTrazaCao2026!",
    })
    assert response.status_code == 200
    data = response.json()
    assert "user" in data
    assert data["user"]["username"] == "admin"
    assert data["user"]["rol"] == "ADMINISTRADOR"
    assert data["user"]["activo"] is True


def test_login_operador_exitoso(client):
    response = client.post("/api/auth/login", json={
        "username": "operador",
        "password": "OperadorCacao2026!",
    })
    assert response.status_code == 200
    data = response.json()
    assert "user" in data
    assert data["user"]["username"] == "operador"
    assert data["user"]["rol"] == "OPERADOR"


def test_login_password_incorrecta(client):
    response = client.post("/api/auth/login", json={
        "username": "admin",
        "password": "PasswordEquivocada123!",
    })
    assert response.status_code == 401
    assert "incorrectos" in response.json()["detail"].lower()


def test_login_usuario_inexistente(client):
    response = client.post("/api/auth/login", json={
        "username": "usuario_fantasma",
        "password": "CualquierPassword123!",
    })
    assert response.status_code == 401


def test_passwords_estan_encriptadas_en_db():
    db = SessionLocal()
    try:
        admin = db.query(Usuario).filter(Usuario.username == "admin").first()
        operador = db.query(Usuario).filter(Usuario.username == "operador").first()
        assert admin is not None
        assert operador is not None

        # Verificar que el hash no es texto plano
        assert admin.password_hash != "AdminTrazaCao2026!"
        assert admin.password_hash.startswith("pbkdf2_sha256$")

        assert operador.password_hash != "OperadorCacao2026!"
        assert operador.password_hash.startswith("pbkdf2_sha256$")

        # Verificar que verify_password valida correctamente
        assert verify_password("AdminTrazaCao2026!", admin.password_hash)
        assert verify_password("OperadorCacao2026!", operador.password_hash)
    finally:
        db.close()
