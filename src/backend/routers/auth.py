"""
Router de Autenticación y Control de Sesiones - TrazaCao Huila
Gestiona el inicio de sesión, verificación criptográfica de contraseñas y consulta de perfil.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from infra.database import get_db
from models import Usuario, AuditoriaLog
from security.hashing import verify_password
from security.rbac import get_current_user_and_role

router = APIRouter(prefix="/api/auth", tags=["Autenticación"])


class LoginRequest(BaseModel):
    username: str = Field(..., min_length=2, max_length=50, description="Nombre de usuario del sistema (no correo)")
    password: str = Field(..., min_length=4, description="Contraseña en texto plano a verificar")


class UserResponse(BaseModel):
    id: str
    username: str
    nombre_completo: str
    rol: str
    activo: bool
    model_config = {"from_attributes": True}


class LoginResponse(BaseModel):
    user: UserResponse
    mensaje: str = "Inicio de sesión exitoso"


@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    """
    Autentica un usuario contra la base de datos comparando el hash criptográfico PBKDF2.
    Registra el acceso en la bitácora de auditoría inmutable.
    """
    username_clean = payload.username.strip().lower()
    user = db.query(Usuario).filter(Usuario.username == username_clean).first()

    if not user:
        # Registrar intento fallido por usuario inexistente
        db.add(
            AuditoriaLog(
                usuario=payload.username,
                accion="INTENTO_NO_AUTORIZADO",
                lote_id="AUTENTICACION",
                valor_anterior=None,
                valor_nuevo=None,
                motivo=f"Intento de inicio de sesión con usuario inexistente: '{payload.username}'",
            )
        )
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario o contraseña incorrectos",
        )

    if not user.activo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="La cuenta de usuario se encuentra inactiva",
        )

    if not verify_password(payload.password, user.password_hash):
        # Registrar intento fallido por contraseña errónea
        db.add(
            AuditoriaLog(
                usuario=user.username,
                accion="INTENTO_NO_AUTORIZADO",
                lote_id="AUTENTICACION",
                valor_anterior=None,
                valor_nuevo=None,
                motivo="Contraseña incorrecta ingresada",
            )
        )
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario o contraseña incorrectos",
        )

    # Registrar inicio de sesión exitoso
    db.add(
        AuditoriaLog(
            usuario=user.username,
            accion="LOGIN_EXITOSO",
            lote_id="AUTENTICACION",
            valor_anterior=None,
            valor_nuevo=f"Rol: {user.rol}, Nombre: {user.nombre_completo}",
            motivo="Inicio de sesión autenticado correctamente",
        )
    )
    db.commit()

    return LoginResponse(
        user=UserResponse(
            id=user.id,
            username=user.username,
            nombre_completo=user.nombre_completo,
            rol=user.rol,
            activo=user.activo,
        ),
        mensaje=f"Bienvenido {user.nombre_completo} ({user.rol})"
    )


@router.get("/me", response_model=dict)
def get_current_user_profile(
    auth: dict = Depends(get_current_user_and_role),
    db: Session = Depends(get_db)
):
    """Retorna el usuario actual autenticado según las credenciales del request."""
    user = db.query(Usuario).filter(Usuario.username == auth["usuario"].lower()).first()
    if user:
        return {
            "id": user.id,
            "username": user.username,
            "nombre_completo": user.nombre_completo,
            "rol": user.rol,
            "activo": user.activo,
        }
    return {
        "id": "anonimo",
        "username": auth["usuario"],
        "nombre_completo": auth["usuario"],
        "rol": auth["rol"],
        "activo": True,
    }
