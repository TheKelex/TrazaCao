"""
Router de Auditoría Inmutable - CacaoTrace Huila (RF10)
Consulta la bitácora inmutable de quién, cuándo y qué cambió en el sistema.
Exclusivo para el rol ADMINISTRADOR.
"""

from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from infra.database import get_db
from models import AuditoriaLog
from security.rbac import require_admin

router = APIRouter(prefix="/api/admin/auditoria", tags=["Auditoría (Admin)"])


from pydantic import BaseModel, ConfigDict


class AuditoriaLogResponse(BaseModel):
    id: int
    timestamp: datetime
    usuario: str
    accion: str
    lote_id: str
    valor_anterior: Optional[str] = None
    valor_nuevo: Optional[str] = None
    motivo: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


@router.get("", response_model=List[AuditoriaLogResponse])
def listar_auditoria(
    lote_id: Optional[str] = Query(None, description="Filtrar por lote afectado"),
    accion: Optional[str] = Query(None, description="Filtrar por tipo de acción"),
    db: Session = Depends(get_db),
    auth: dict = Depends(require_admin),  # Solo Administrador
):
    """
    RF10: Consulta la bitácora histórica de auditoría.
    Muestra quién, cuándo y qué cambió (valor anterior vs nuevo).
    """
    query = db.query(AuditoriaLog)
    if lote_id:
        query = query.filter(AuditoriaLog.lote_id == lote_id)
    if accion:
        query = query.filter(AuditoriaLog.accion == accion)
    return query.order_by(AuditoriaLog.timestamp.desc()).all()
