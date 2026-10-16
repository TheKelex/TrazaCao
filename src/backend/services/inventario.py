"""
Servicio de Inventario y Control de Existencias - CacaoTrace Huila (RF08)
Implementa consumo atómico en SQLite y prevención de doble consumo (idempotencia).
"""

from decimal import Decimal
from typing import Optional, Dict
from sqlalchemy.orm import Session
from sqlalchemy import text
from fastapi import HTTPException, status
from models import Lote


# Registro en memoria de idempotencia para solicitudes en ventana de tiempo
# Mapea idempotency_key -> resultado de la operación
_CACHE_IDEMPOTENCIA: Dict[str, dict] = {}


def verificar_idempotencia(idempotency_key: Optional[str]) -> Optional[dict]:
    """
    Verifica si una operación ya fue ejecutada previamente con la misma clave.
    Retorna la respuesta almacenada si existe, evitando doble descuento de inventario.
    """
    if idempotency_key and idempotency_key in _CACHE_IDEMPOTENCIA:
        return _CACHE_IDEMPOTENCIA[idempotency_key]
    return None


def registrar_idempotencia(idempotency_key: Optional[str], resultado: dict) -> None:
    """Registra la clave de idempotencia con su resultado procesado exitosamente."""
    if idempotency_key:
        _CACHE_IDEMPOTENCIA[idempotency_key] = resultado


def descontar_inventario_atomico(db: Session, lote_id: str, kg_consumo: Decimal) -> Decimal:
    """
    Ejecuta el descuento de inventario de forma ATÓMICA en SQLite (RF08).
    
    Técnica Anti-Concurrencia:
    En lugar de SELECT ... FOR UPDATE (incompatible con SQLite), ejecuta un UPDATE
    con condición WHERE kg_disponibles >= :consumo en la misma sentencia atómica.
    
    Returns:
        nuevo_saldo_disponible (Decimal)
    """
    # 1. Verificar existencia y estado del lote
    lote = db.query(Lote).filter(Lote.id == lote_id).first()
    if not lote:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Lote con identificador '{lote_id}' no encontrado en el sistema"
        )

    if lote.estado == "BLOQUEADO":
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Operación denegada: el lote '{lote_id}' se encuentra BLOQUEADO por calidad"
        )

    # 2. Ejecutar UPDATE atómico condicional
    stmt = text("""
        UPDATE lotes
        SET kg_disponibles = ROUND(kg_disponibles - :consumo, 2)
        WHERE id = :id AND kg_disponibles >= :consumo
    """)
    result = db.execute(stmt, {"consumo": float(kg_consumo), "id": lote_id})

    # Si rowcount es 0, no cumplió la condición de saldo suficiente
    if result.rowcount == 0:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                f"Existencias insuficientes en lote '{lote_id}'. "
                f"Saldo disponible: {lote.kg_disponibles} kg, Consumo solicitado: {kg_consumo} kg"
            )
        )

    # Refrescar y obtener el nuevo saldo
    db.expire(lote)
    lote_actualizado = db.query(Lote).filter(Lote.id == lote_id).first()
    return Decimal(str(lote_actualizado.kg_disponibles))
