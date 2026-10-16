"""
Router de Compradores B2B y Clientes - TrazaCao Huila
Gestiona el registro de clientes corporativos e internacionales, inicio de sesión propio
y consulta de perfil con historial de compras.
"""

from typing import List, Optional
import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session
from infra.database import get_db
from models import Comprador, AuditoriaLog
from security.hashing import hash_password, verify_password

router = APIRouter(prefix="/api/compradores", tags=["Compradores y Clientes B2B"])


class CompradorRegistroRequest(BaseModel):
    email: EmailStr = Field(..., description="Correo electrónico institucional o de la empresa")
    password: str = Field(..., min_length=4, description="Contraseña de acceso seguro")
    nombre_contacto: str = Field(..., min_length=3, max_length=150, description="Nombre de la persona de contacto")
    empresa_o_razon_social: str = Field(..., min_length=2, max_length=150, description="Razón social o nombre comercial")
    telefono: Optional[str] = Field(None, description="Teléfono móvil o WhatsApp corporativo")
    pais_ciudad: str = Field("Colombia", min_length=2, max_length=100, description="País y ciudad de origen")


class CompradorLoginRequest(BaseModel):
    email: EmailStr = Field(..., description="Correo electrónico del comprador registrado")
    password: str = Field(..., description="Contraseña")


class CompradorResponse(BaseModel):
    id: str
    email: str
    nombre_contacto: str
    empresa_o_razon_social: str
    telefono: Optional[str] = None
    pais_ciudad: str
    activo: bool
    fecha_registro: datetime

    model_config = {"from_attributes": True}


class CompradorLoginResponse(BaseModel):
    comprador: CompradorResponse
    mensaje: str = "Inicio de sesión como comprador exitoso"


@router.post("/registro", response_model=CompradorLoginResponse, status_code=status.HTTP_201_CREATED)
def registrar_comprador(payload: CompradorRegistroRequest, db: Session = Depends(get_db)):
    """
    Registra un nuevo comprador / cliente en la base de datos de TrazaCao.
    """
    clean_email = payload.email.strip().lower()
    existente = db.query(Comprador).filter(Comprador.email == clean_email).first()
    if existente:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ya existe una cuenta registrada con el correo '{clean_email}'. Por favor inicie sesión.",
        )

    nuevo_id = f"cmp-{uuid.uuid4().hex[:8]}"
    comprador = Comprador(
        id=nuevo_id,
        email=clean_email,
        password_hash=hash_password(payload.password),
        nombre_contacto=payload.nombre_contacto.strip(),
        empresa_o_razon_social=payload.empresa_o_razon_social.strip(),
        telefono=payload.telefono.strip() if payload.telefono else None,
        pais_ciudad=payload.pais_ciudad.strip(),
        activo=True,
        fecha_registro=datetime.utcnow(),
    )
    db.add(comprador)

    # Auditoría
    db.add(
        AuditoriaLog(
            usuario=clean_email,
            accion="REGISTRO_COMPRADOR",
            lote_id="CLIENTES",
            valor_anterior=None,
            valor_nuevo=f"Empresa: {comprador.empresa_o_razon_social}, Contacto: {comprador.nombre_contacto}",
            motivo="Registro de nuevo cliente en portal comercial",
        )
    )
    db.commit()
    db.refresh(comprador)

    return CompradorLoginResponse(
        comprador=CompradorResponse.model_validate(comprador),
        mensaje="Registro exitoso. ¡Bienvenido al portal comercial de TrazaCao Huila!",
    )


@router.post("/login", response_model=CompradorLoginResponse)
def login_comprador(payload: CompradorLoginRequest, db: Session = Depends(get_db)):
    """
    Autentica a un comprador registrado mediante su correo y contraseña encriptada.
    """
    clean_email = payload.email.strip().lower()
    comprador = db.query(Comprador).filter(Comprador.email == clean_email).first()

    if not comprador:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo o contraseña incorrectos.",
        )

    if not comprador.activo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="La cuenta de cliente se encuentra suspendida o inactiva.",
        )

    if not verify_password(payload.password, comprador.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo o contraseña incorrectos.",
        )

    db.add(
        AuditoriaLog(
            usuario=comprador.email,
            accion="LOGIN_COMPRADOR",
            lote_id="CLIENTES",
            valor_anterior=None,
            valor_nuevo=f"Empresa: {comprador.empresa_o_razon_social}",
            motivo="Inicio de sesión de comprador B2B",
        )
    )
    db.commit()

    return CompradorLoginResponse(
        comprador=CompradorResponse.model_validate(comprador),
        mensaje=f"Bienvenido de nuevo, {comprador.nombre_contacto} ({comprador.empresa_o_razon_social})",
    )


@router.get("/admin/listado", response_model=List[CompradorResponse])
def listar_compradores_admin(db: Session = Depends(get_db)):
    """Retorna la lista de clientes compradores registrados para el panel de administración."""
    return db.query(Comprador).order_by(Comprador.fecha_registro.desc()).all()
