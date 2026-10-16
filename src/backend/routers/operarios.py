"""
Router de Gestión de Operarios (CRUD Administrativo) - TrazaCao Huila
Permite al Administrador registrar nuevos operarios, editar sus datos y vetar/activar su acceso.
IMPORTANTE: Prohíbe explícitamente el borrado físico (DELETE) para preservar la trazabilidad
inmutable de los registros históricos de acopio y transformación en los que hayan intervenido.
"""

from typing import List, Optional
import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Header
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from infra.database import get_db
from models import Usuario, AuditoriaLog
from security.hashing import hash_password

router = APIRouter(prefix="/api/admin/operarios", tags=["Gestión de Operarios (Admin)"])


# Esquemas Pydantic
class OperarioCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50, description="Nombre de usuario único para inicio de sesión")
    nombre_completo: str = Field(..., min_length=3, max_length=150, description="Nombre y apellido del operario")
    password: str = Field(..., min_length=4, description="Contraseña de acceso inicial")
    email: Optional[str] = Field(None, description="Correo electrónico institucional o de contacto")
    telefono: Optional[str] = Field(None, description="Número de teléfono móvil")
    cedula: Optional[str] = Field(None, description="Documento de identidad nacional")


class OperarioUpdate(BaseModel):
    nombre_completo: Optional[str] = Field(None, min_length=3, max_length=150)
    email: Optional[str] = None
    telefono: Optional[str] = None
    cedula: Optional[str] = None
    password: Optional[str] = Field(None, min_length=4, description="Nueva contraseña (opcional)")


class OperarioEstadoUpdate(BaseModel):
    activo: bool = Field(..., description="True para activo, False para vetar/suspender")
    motivo: str = Field(..., min_length=5, description="Motivo obligatorio del cambio de estado o veto")


class OperarioResponse(BaseModel):
    id: str
    username: str
    nombre_completo: str
    rol: str
    email: Optional[str] = None
    telefono: Optional[str] = None
    cedula: Optional[str] = None
    motivo_inactivacion: Optional[str] = None
    activo: bool
    fecha_creacion: datetime

    model_config = {"from_attributes": True}


def verificar_admin(x_user_role: Optional[str] = Header(None, alias="X-User-Role")):
    """Verifica que quien ejecuta la acción sea Administrador."""
    if x_user_role and x_user_role.upper() != "ADMINISTRADOR":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso denegado: Solo el Administrador puede gestionar el personal operativo.",
        )


@router.get("", response_model=List[OperarioResponse])
def listar_operarios(
    db: Session = Depends(get_db),
    _: None = Depends(verificar_admin),
):
    """Retorna la lista completa de operarios registrados con su estado (activos y vetados)."""
    return db.query(Usuario).filter(Usuario.rol == "OPERADOR").order_by(Usuario.fecha_creacion.desc()).all()


@router.post("", response_model=OperarioResponse, status_code=status.HTTP_201_CREATED)
def registrar_operario(
    payload: OperarioCreate,
    db: Session = Depends(get_db),
    x_user_name: Optional[str] = Header("Administrador", alias="X-User-Name"),
    _: None = Depends(verificar_admin),
):
    """
    Registra un nuevo operario con contraseña encriptada (PBKDF2-HMAC-SHA256).
    Asienta el evento en la bitácora inmutable de auditoría.
    """
    clean_username = payload.username.strip().lower()
    existente = db.query(Usuario).filter(Usuario.username == clean_username).first()
    if existente:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"El nombre de usuario '{clean_username}' ya se encuentra registrado.",
        )

    nuevo_id = f"usr-op-{uuid.uuid4().hex[:8]}"
    nuevo_op = Usuario(
        id=nuevo_id,
        username=clean_username,
        nombre_completo=payload.nombre_completo.strip(),
        password_hash=hash_password(payload.password),
        rol="OPERADOR",
        email=payload.email.strip() if payload.email else None,
        telefono=payload.telefono.strip() if payload.telefono else None,
        cedula=payload.cedula.strip() if payload.cedula else None,
        activo=True,
        fecha_creacion=datetime.utcnow(),
    )
    db.add(nuevo_op)

    # Registro de auditoría inmutable
    db.add(
        AuditoriaLog(
            usuario=x_user_name or "Administrador",
            accion="CREACION_OPERARIO",
            lote_id="PERSONAL",
            valor_anterior=None,
            valor_nuevo=f"Username: {clean_username}, Nombre: {nuevo_op.nombre_completo}",
            motivo="Alta formal de nuevo operario de planta",
        )
    )
    db.commit()
    db.refresh(nuevo_op)
    return nuevo_op


@router.put("/{operario_id}", response_model=OperarioResponse)
def actualizar_operario(
    operario_id: str,
    payload: OperarioUpdate,
    db: Session = Depends(get_db),
    x_user_name: Optional[str] = Header("Administrador", alias="X-User-Name"),
    _: None = Depends(verificar_admin),
):
    """
    Actualiza la información de contacto o credenciales de un operario existente.
    """
    op = db.query(Usuario).filter(Usuario.id == operario_id, Usuario.rol == "OPERADOR").first()
    if not op:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Operario no encontrado")

    valor_anterior = f"Nombre: {op.nombre_completo}, Email: {op.email}, Tel: {op.telefono}"

    if payload.nombre_completo:
        op.nombre_completo = payload.nombre_completo.strip()
    if payload.email is not None:
        op.email = payload.email.strip() if payload.email else None
    if payload.telefono is not None:
        op.telefono = payload.telefono.strip() if payload.telefono else None
    if payload.cedula is not None:
        op.cedula = payload.cedula.strip() if payload.cedula else None
    if payload.password:
        op.password_hash = hash_password(payload.password)

    db.add(
        AuditoriaLog(
            usuario=x_user_name or "Administrador",
            accion="ACTUALIZACION_OPERARIO",
            lote_id="PERSONAL",
            valor_anterior=valor_anterior,
            valor_nuevo=f"Nombre: {op.nombre_completo}, Email: {op.email}, Tel: {op.telefono}",
            motivo="Actualización administrativa de datos del operario",
        )
    )
    db.commit()
    db.refresh(op)
    return op


@router.patch("/{operario_id}/estado", response_model=OperarioResponse)
def cambiar_estado_operario(
    operario_id: str,
    payload: OperarioEstadoUpdate,
    db: Session = Depends(get_db),
    x_user_name: Optional[str] = Header("Administrador", alias="X-User-Name"),
    _: None = Depends(verificar_admin),
):
    """
    Veta o reactiva a un operario en el sistema.
    Al estar vetado (activo=False), el login le rechazará el acceso con HTTP 403 Forbidden.
    """
    op = db.query(Usuario).filter(Usuario.id == operario_id, Usuario.rol == "OPERADOR").first()
    if not op:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Operario no encontrado")

    estado_previo = "ACTIVO" if op.activo else "VETADO"
    nuevo_estado = "ACTIVO" if payload.activo else "VETADO"

    op.activo = payload.activo
    op.motivo_inactivacion = payload.motivo if not payload.activo else None

    db.add(
        AuditoriaLog(
            usuario=x_user_name or "Administrador",
            accion="VETO_OPERARIO" if not payload.activo else "REACTIVACION_OPERARIO",
            lote_id="PERSONAL",
            valor_anterior=f"Operario: {op.username} ({estado_previo})",
            valor_nuevo=f"Operario: {op.username} ({nuevo_estado})",
            motivo=payload.motivo,
        )
    )
    db.commit()
    db.refresh(op)
    return op


@router.delete("/{operario_id}")
def intentar_eliminar_operario(operario_id: str):
    """
    Regla de Trazabilidad Estricta: Prohíbe explícitamente el borrado físico de operarios.
    """
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail=(
            "Acción no permitida: Por integridad y trazabilidad inmutable de la cadena de custodia, "
            "los operarios no pueden ser eliminados físicamente del sistema. Si desea suspender su acceso, "
            "utilice la función de VETAR/SUSPENDER operario."
        ),
    )
