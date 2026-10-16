"""
Router de Transformaciones - CacaoTrace Huila (RF02, RF04, RF05, RF08, RF12)
Ejecuta la transformación agroindustrial, cálculo de mermas, balance económico y auditoría.
"""

import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from infra.database import get_db
from models import Transformacion, AuditoriaLog
from schemas import TransformacionCreate, TransformacionResponse
from security.rbac import require_operador_or_admin
from domain.calculos import balance_agroindustrial_completo
from services.inventario import (
    descontar_inventario_atomico,
    verificar_idempotencia,
    registrar_idempotencia,
)

router = APIRouter(prefix="/api/transformaciones", tags=["Transformaciones"])


@router.post("", response_model=TransformacionResponse, status_code=status.HTTP_201_CREATED)
def crear_transformacion(
    trans_in: TransformacionCreate,
    x_idempotency_key: Optional[str] = Header(None, description="Clave única para evitar doble envío"),
    db: Session = Depends(get_db),
    auth: dict = Depends(require_operador_or_admin),
):
    """
    RF02, RF04, RF08: Registrar etapa de transformación.
    - Valida que la entrada no exceda el inventario disponible (RF08).
    - Ejecuta descuento atómico en SQLite.
    - Calcula merma del 20% y activa alerta si supera el 15%.
    - Calcula costo unitario oficial ($20.000 COP) y margen (20.00%).
    - Protege contra doble clic mediante X-Idempotency-Key.
    """
    # 1. Control de Idempotencia (RF08)
    previo = verificar_idempotencia(x_idempotency_key)
    if previo:
        return previo

    # 2. Descuento atómico de existencias (RF08)
    descontar_inventario_atomico(db, trans_in.lote_id, trans_in.kg_entrada)

    # 3. Cálculo de métricas agroindustriales (Domain Onion)
    try:
        balance = balance_agroindustrial_completo(
            kg_entrada=trans_in.kg_entrada,
            kg_salida_vendible=trans_in.kg_salida_vendible,
            costo_total_etapa_cop=trans_in.costo_etapa_cop,
            precio_venta_cop=trans_in.precio_venta_estimado,
        )
    except ValueError as err:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Error en validación física/matemática: {err}"
        )

    # 4. Crear registro de transformación
    from datetime import datetime
    trans_id = str(uuid.uuid4())
    circular = balance["economia_circular"]

    nueva_trans = Transformacion(
        id=trans_id,
        lote_id=trans_in.lote_id,
        etapa=trans_in.etapa,
        responsable=trans_in.responsable,
        kg_entrada=trans_in.kg_entrada,
        kg_salida_vendible=trans_in.kg_salida_vendible,
        kg_cascarilla=circular["kg_cascarilla_recuperada"],
        merma_porcentaje=balance["merma_porcentaje"],
        alerta_merma=balance["alerta_merma"],
        alerta_explicacion=balance["alerta_explicacion"],
        costo_etapa_cop=trans_in.costo_etapa_cop,
        costo_unitario_cop=balance["costo_unitario_cop"],
        precio_venta_estimado=trans_in.precio_venta_estimado,
        margen_venta_porcentaje=balance["margen_venta_porcentaje"],
        ingreso_cascarilla_cop=circular["ingreso_adicional_cop"],
        costo_neto_circular_cop=circular["costo_neto_circular_cop"],
        incidencia_justificacion=trans_in.incidencia_justificacion,
        fecha_transformacion=trans_in.fecha_transformacion or datetime.utcnow(),
    )
    db.add(nueva_trans)

    # 5. Auditoría inmutable (RF10)
    audit = AuditoriaLog(
        usuario=auth["usuario"],
        accion="TRANSFORMACION",
        lote_id=trans_in.lote_id,
        valor_anterior=f"Consumo: {trans_in.kg_entrada} kg",
        valor_nuevo=f"Salida: {trans_in.kg_salida_vendible} kg, Merma: {balance['merma_porcentaje']}%",
        motivo=trans_in.incidencia_justificacion or f"Transformación en etapa {trans_in.etapa}",
    )
    db.add(audit)
    db.commit()
    db.refresh(nueva_trans)

    # 6. Registrar respuesta en caché de idempotencia
    resp_dict = TransformacionResponse.model_validate(nueva_trans)
    registrar_idempotencia(x_idempotency_key, resp_dict)

    return nueva_trans


@router.get("", response_model=List[TransformacionResponse])
def listar_todas_transformaciones(
    db: Session = Depends(get_db),
    auth: dict = Depends(require_operador_or_admin),
):
    """Consulta todas las transformaciones registradas en el sistema (trazabilidad de salidas)."""
    return db.query(Transformacion).order_by(Transformacion.fecha_transformacion.desc()).all()


@router.get("/lote/{lote_id}", response_model=List[TransformacionResponse])
def listar_transformaciones_lote(
    lote_id: str,
    db: Session = Depends(get_db),
    auth: dict = Depends(require_operador_or_admin),
):
    """Consulta todas las transformaciones ejecutadas sobre un lote."""
    return db.query(Transformacion).filter(Transformacion.lote_id == lote_id).order_by(Transformacion.fecha_transformacion.desc()).all()
