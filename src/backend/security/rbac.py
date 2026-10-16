"""
Control de Acceso Basado en Roles (RBAC) - CacaoTrace Huila (RF09)
Garantiza que la restricción de privilegios opere en la capa de datos/backend.
Ocultar botones en frontend es insuficiente; aquí se emite HTTP 403 real.
"""

from typing import Optional
from fastapi import Header, HTTPException, status, Depends
from sqlalchemy.orm import Session
from infra.database import get_db
from models import AuditoriaLog


def get_current_user_and_role(
    x_user_name: Optional[str] = Header(default="operador_planta"),
    x_user_role: Optional[str] = Header(default="OPERADOR"),
) -> dict:
    """Extrae el usuario y rol de las cabeceras de la petición."""
    rol_normalizado = (x_user_role or "OPERADOR").strip().upper()
    usuario_normalizado = (x_user_name or "operador_planta").strip()
    return {"usuario": usuario_normalizado, "rol": rol_normalizado}


def require_role(roles_permitidos: list):
    """Fábrica de dependencias que exige uno de los roles permitidos."""
    def dependency(
        auth: dict = Depends(get_current_user_and_role),
        db: Session = Depends(get_db),
    ):
        if auth["rol"] not in roles_permitidos:
            # Registrar intento no autorizado en auditoría (RF10)
            log_intento = AuditoriaLog(
                usuario=auth["usuario"],
                accion="INTENTO_NO_AUTORIZADO",
                lote_id="SISTEMA",
                valor_anterior=auth["rol"],
                valor_nuevo=None,
                motivo=f"Intento denegado: se requería rol en {roles_permitidos}",
            )
            db.add(log_intento)
            db.commit()

            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Acceso denegado: su rol '{auth['rol']}' no tiene permisos para esta acción",
            )
        return auth
    return dependency


# Dependencias listas para inyectar en routers
require_operador_or_admin = require_role(["OPERADOR", "ADMINISTRADOR", "ADMIN"])
require_admin = require_role(["ADMINISTRADOR", "ADMIN"])
