"""
Router de Lotes - CacaoTrace Huila (RF01, RF08, RF09)
Endpoints para recepción, consulta interna y gestión de estado (liberar/bloquear).
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from infra.database import get_db
from models import Lote, AuditoriaLog
from schemas import LoteCreate, LoteResponse, LoteEstadoUpdate
from security.rbac import require_operador_or_admin, require_admin

router = APIRouter(prefix="/api/lotes", tags=["Lotes"])


@router.post("", response_model=LoteResponse, status_code=status.HTTP_201_CREATED)
def crear_lote(
    lote_in: LoteCreate,
    db: Session = Depends(get_db),
    auth: dict = Depends(require_operador_or_admin),
):
    """
    RF01: Registrar recepción de un lote de cacao seco.
    Rechaza cantidades negativas o iguales a cero; valida identificación única.
    """
    # Verificar unicidad del ID
    existente = db.query(Lote).filter(Lote.id == lote_in.id).first()
    if existente:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"El identificador de lote '{lote_in.id}' ya se encuentra registrado"
        )

    nuevo_lote = Lote(
        id=lote_in.id,
        productor=lote_in.productor,
        origen=lote_in.origen,
        humedad_porcentaje=lote_in.humedad_porcentaje,
        fermentacion_porcentaje=lote_in.fermentacion_porcentaje,
        kg_recibidos=lote_in.kg_recibidos,
        kg_disponibles=lote_in.kg_recibidos,  # Disponible inicial igual a recibido
        estado="PENDIENTE",
    )
    db.add(nuevo_lote)

    # Registrar en auditoría (RF10)
    audit = AuditoriaLog(
        usuario=auth["usuario"],
        accion="CREACION",
        lote_id=lote_in.id,
        valor_anterior=None,
        valor_nuevo=f"Recibidos: {lote_in.kg_recibidos} kg, Productor: {lote_in.productor}, Origen: {lote_in.origen}",
        motivo="Recepción formal en centro de acopio",
    )
    db.add(audit)
    db.commit()
    db.refresh(nuevo_lote)
    return nuevo_lote


@router.get("", response_model=List[LoteResponse])
def listar_lotes(
    origen: Optional[str] = Query(None, description="Filtrar por municipio"),
    estado: Optional[str] = Query(None, description="Filtrar por estado"),
    db: Session = Depends(get_db),
    auth: dict = Depends(require_operador_or_admin),
):
    """Consulta la lista de lotes internos con filtros opcionales."""
    query = db.query(Lote)
    if origen:
        query = query.filter(Lote.origen == origen)
    if estado:
        query = query.filter(Lote.estado == estado)
    return query.order_by(Lote.fecha_recepcion.desc()).all()


@router.get("/{lote_id}", response_model=LoteResponse)
def obtener_lote(
    lote_id: str,
    db: Session = Depends(get_db),
    auth: dict = Depends(require_operador_or_admin),
):
    """Obtiene los detalles completos de un lote."""
    lote = db.query(Lote).filter(Lote.id == lote_id).first()
    if not lote:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Lote '{lote_id}' no encontrado",
        )
    return lote


@router.patch("/{lote_id}/estado", response_model=LoteResponse)
def cambiar_estado_lote(
    lote_id: str,
    estado_in: LoteEstadoUpdate,
    db: Session = Depends(get_db),
    auth: dict = Depends(require_admin),  # RF09: Exclusivo para Administrador (403 a Operador)
):
    """
    RF09 & Incidencia Hora 12: Cambiar estado a LIBERADO o BLOQUEADO.
    Exige motivo justificado obligatorio y registra la auditoría inmutable.
    """
    lote = db.query(Lote).filter(Lote.id == lote_id).first()
    if not lote:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Lote '{lote_id}' no encontrado",
        )

    estado_anterior = lote.estado
    lote.estado = estado_in.nuevo_estado
    lote.motivo_bloqueo = estado_in.motivo if estado_in.nuevo_estado == "BLOQUEADO" else None

    # Registrar en auditoría inmutable
    audit = AuditoriaLog(
        usuario=auth["usuario"],
        accion="BLOQUEO" if estado_in.nuevo_estado == "BLOQUEADO" else "LIBERACION",
        lote_id=lote_id,
        valor_anterior=estado_anterior,
        valor_nuevo=estado_in.nuevo_estado,
        motivo=estado_in.motivo,
    )
    db.add(audit)
    db.commit()
    db.refresh(lote)
    return lote
