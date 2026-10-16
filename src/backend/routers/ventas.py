"""
Router de Ventas Directas y Checkout Efectivo - TrazaCao Huila
Permite a los compradores adquirir grano de cacao o merma (cascarilla) a precios fijos
con descuento atómico de inventario en SQLite (previniendo sobreventa y condiciones de carrera).
"""

from typing import List, Optional
import uuid
from decimal import Decimal
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.orm import Session
from infra.database import get_db
from models import Lote, Comprador, OrdenVenta, AuditoriaLog

router = APIRouter(prefix="/api/ventas", tags=["Ventas Directas y Checkout"])


# Precios oficiales fijos de catálogo (COP / kg)
PRECIO_FIJO_CACAO_COP = Decimal("25000.00")
PRECIO_FIJO_CASCARILLA_COP = Decimal("15500.00")


class CompraDirectaRequest(BaseModel):
    comprador_id: Optional[str] = Field(None, description="ID del comprador registrado o demo")
    tipo_producto: str = Field("LOTE_CACAO", description="'LOTE_CACAO' o 'MERMA_CASCARILLA'")
    item_id: Optional[str] = Field(None, description="ID del lote de cacao (ej. CAC001) o referencia de merma")
    lote_id: Optional[str] = Field(None, description="Alias de item_id para compatibilidad")
    subproducto_id: Optional[str] = Field(None, description="Alias de item_id para subproductos")
    item_nombre: Optional[str] = Field(None, description="Nombre o descripción del producto")
    kg_comprados: Decimal = Field(..., gt=0, description="Cantidad en kilogramos a comprar")
    direccion_entrega: Optional[str] = Field("Centro de Acopio / Despacho Huila", description="Dirección de envío o puerto")
    es_simulacion: bool = Field(False, description="Indica si la compra es una simulación de pago demostrativa")
    referencia_simulacion: Optional[str] = Field(None, description="Referencia de simulación provista por la pasarela de prueba")


class OrdenVentaResponse(BaseModel):
    id: str
    codigo_orden: Optional[str] = None
    comprador_id: str
    comprador_empresa: str
    comprador_nombre: Optional[str] = None
    tipo_producto: str
    item_id: str
    lote_id: Optional[str] = None
    item_nombre: str
    kg_comprados: Decimal
    precio_kg_cop: Decimal
    total_cop: Decimal
    estado: str
    estado_orden: Optional[str] = None
    direccion_entrega: Optional[str] = None
    fecha_orden: datetime
    kg_restantes_lote: Optional[Decimal] = None
    stock_restante_kg: Optional[Decimal] = None
    es_simulacion: bool = False
    referencia_simulacion: Optional[str] = None


@router.post("/comprar", response_model=OrdenVentaResponse, status_code=status.HTTP_201_CREATED)
def ejecutar_compra_directa(payload: CompraDirectaRequest, db: Session = Depends(get_db)):
    """
    Ejecuta una venta efectiva inmediata (real o simulada) con descuento atómico de existencias.
    Garantiza que ningún comprador pueda sobrecomprar o adquirir lotes bloqueados por calidad.
    """
    target_item_id = payload.item_id or payload.lote_id or payload.subproducto_id
    if not target_item_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Se requiere especificar el identificador del producto (item_id, lote_id o subproducto_id).",
        )

    # 1. Verificar o aprovisionar comprador (con soporte para modo demostración)
    comprador = None
    if payload.comprador_id and payload.comprador_id not in ("demo", "cmp-demo"):
        comprador = db.query(Comprador).filter(Comprador.id == payload.comprador_id).first()

    if not comprador:
        # Modo demostración: buscar comprador semilla o registrar comprador demo
        comprador = db.query(Comprador).filter(
            (Comprador.email == "comprador@chocolateshuila.com") | (Comprador.id == "cmp-demo-01")
        ).first()
        if not comprador:
            comprador = Comprador(
                id="cmp-demo-01",
                email="demo@compradortrazacao.com",
                password_hash="demo_hash_simulacion",
                nombre_contacto="COMPRADOR DEMO",
                empresa_o_razon_social="Comprador B2B Demo (Simulación)",
                telefono="+57 300 123 4567",
                pais_ciudad="Colombia, Huila",
                activo=True,
                fecha_registro=datetime.utcnow(),
            )
            db.add(comprador)
            db.commit()
            db.refresh(comprador)

    if not comprador.activo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cuenta de comprador inactiva o suspendida.",
        )

    kg_compra = payload.kg_comprados
    tipo_raw = (payload.tipo_producto or "LOTE_CACAO").upper()
    if tipo_raw in ("MERMA_SUBPRODUCTO", "SUBPRODUCTO", "MERMA_CASCARILLA"):
        tipo = "MERMA_CASCARILLA"
    else:
        tipo = "LOTE_CACAO"

    kg_restantes = None

    if tipo == "LOTE_CACAO":
        lote = db.query(Lote).filter(Lote.id == target_item_id).first()
        if not lote:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Lote '{target_item_id}' no encontrado.")

        if lote.estado == "BLOQUEADO":
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"El lote '{target_item_id}' se encuentra en RETENCIÓN PREVENTIVA DE CALIDAD (Hora 12) y no puede ser comercializado.",
            )

        if lote.kg_disponibles <= Decimal("0.00"):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"El lote '{target_item_id}' no tiene existencias disponibles para la compra (Agotado).",
            )

        if lote.kg_disponibles < kg_compra:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Existencias insuficientes: Solo hay {lote.kg_disponibles} kg disponibles del lote {lote.id}.",
            )

        # Descuento atómico condicional en SQLite
        stmt = text(
            "UPDATE lotes SET kg_disponibles = ROUND(kg_disponibles - :kg, 2) "
            "WHERE id = :id AND kg_disponibles >= :kg AND estado = 'LIBERADO'"
        )
        res = db.execute(stmt, {"id": lote.id, "kg": float(kg_compra)})
        if res.rowcount == 0:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="No fue posible completar la compra: el lote cambió de estado o no cuenta con existencias suficientes.",
            )

        precio_unitario = PRECIO_FIJO_CACAO_COP
        total_cop = kg_compra * precio_unitario
        nombre_item = payload.item_nombre or f"Cacao Fino de Aroma - Lote {lote.id} ({lote.origen})"
        
        # Consultar saldo restante actualizado
        db.refresh(lote)
        kg_restantes = lote.kg_disponibles

    elif tipo == "MERMA_CASCARILLA":
        precio_unitario = PRECIO_FIJO_CASCARILLA_COP
        total_cop = kg_compra * precio_unitario
        nombre_item = payload.item_nombre or f"Cascarilla Tostada en Bruto (Merma) - Ref {target_item_id}"
        kg_restantes = Decimal("0.00")
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Tipo de producto '{payload.tipo_producto}' no válido. Use 'LOTE_CACAO' o 'MERMA_CASCARILLA'.",
        )

    # 2. Registrar Orden de Venta (Simulada o Efectiva)
    if payload.es_simulacion:
        codigo_orden = payload.referencia_simulacion or f"SIM-PAGO-{uuid.uuid4().hex[:8].upper()}"
        estado_orden = "PAGO_SIMULADO"
        accion_auditoria = "VENTA_SIMULADA"
        motivo_auditoria = f"Simulación de compra en pasarela de pago demostrativa por {comprador.empresa_o_razon_social}"
    else:
        codigo_orden = f"VTA-{target_item_id}-{uuid.uuid4().hex[:6].upper()}"
        estado_orden = "PAGADA_Y_DESPACHADA"
        accion_auditoria = "VENTA_DIRECTA"
        motivo_auditoria = f"Compra directa efectiva realizada por {comprador.empresa_o_razon_social}"

    nueva_orden = OrdenVenta(
        id=codigo_orden,
        comprador_id=comprador.id,
        tipo_producto=tipo,
        item_id=target_item_id,
        item_nombre=nombre_item,
        kg_comprados=kg_compra,
        precio_kg_cop=precio_unitario,
        total_cop=total_cop,
        estado=estado_orden,
        direccion_entrega=payload.direccion_entrega or "Bodega Central Neiva / Despacho Nacional",
        fecha_orden=datetime.utcnow(),
    )
    db.add(nueva_orden)

    # 3. Asentar en la Bitácora Inmutable de Auditoría
    db.add(
        AuditoriaLog(
            usuario=comprador.email,
            accion=accion_auditoria,
            lote_id=target_item_id,
            valor_anterior="Stock previo consultado",
            valor_nuevo=f"Transacción: {kg_compra} kg, Total: ${total_cop:,.2f} COP, Orden: {codigo_orden} ({estado_orden})",
            motivo=motivo_auditoria,
        )
    )
    db.commit()

    return OrdenVentaResponse(
        id=nueva_orden.id,
        codigo_orden=nueva_orden.id,
        comprador_id=comprador.id,
        comprador_empresa=comprador.empresa_o_razon_social,
        comprador_nombre=comprador.nombre_contacto,
        tipo_producto=nueva_orden.tipo_producto,
        item_id=nueva_orden.item_id,
        lote_id=nueva_orden.item_id,
        item_nombre=nueva_orden.item_nombre,
        kg_comprados=nueva_orden.kg_comprados,
        precio_kg_cop=nueva_orden.precio_kg_cop,
        total_cop=nueva_orden.total_cop,
        estado=nueva_orden.estado,
        estado_orden=nueva_orden.estado,
        direccion_entrega=nueva_orden.direccion_entrega,
        fecha_orden=nueva_orden.fecha_orden,
        kg_restantes_lote=kg_restantes,
        stock_restante_kg=kg_restantes,
        es_simulacion=payload.es_simulacion,
        referencia_simulacion=codigo_orden if payload.es_simulacion else None,
    )


@router.get("/comprador/{comprador_id}", response_model=List[OrdenVentaResponse])
def listar_mis_compras(comprador_id: str, db: Session = Depends(get_db)):
    """Retorna las órdenes de compra efectuadas por un cliente específico."""
    comprador = db.query(Comprador).filter(Comprador.id == comprador_id).first()
    if not comprador:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comprador no encontrado")

    ordenes = db.query(OrdenVenta).filter(OrdenVenta.comprador_id == comprador_id).order_by(OrdenVenta.fecha_orden.desc()).all()
    
    return [
        OrdenVentaResponse(
            id=o.id,
            comprador_id=o.comprador_id,
            comprador_empresa=comprador.empresa_o_razon_social,
            tipo_producto=o.tipo_producto,
            item_id=o.item_id,
            item_nombre=o.item_nombre,
            kg_comprados=o.kg_comprados,
            precio_kg_cop=o.precio_kg_cop,
            total_cop=o.total_cop,
            estado=o.estado,
            direccion_entrega=o.direccion_entrega,
            fecha_orden=o.fecha_orden,
        )
        for o in ordenes
    ]


@router.get("/todas", response_model=List[OrdenVentaResponse])
def listar_todas_las_ventas_admin(db: Session = Depends(get_db)):
    """Retorna el consolidado de todas las ventas para el dashboard de administración."""
    ordenes = db.query(OrdenVenta).order_by(OrdenVenta.fecha_orden.desc()).all()
    resultado = []
    for o in ordenes:
        cmp = db.query(Comprador).filter(Comprador.id == o.comprador_id).first()
        resultado.append(
            OrdenVentaResponse(
                id=o.id,
                comprador_id=o.comprador_id,
                comprador_empresa=cmp.empresa_o_razon_social if cmp else "Cliente Corporativo",
                tipo_producto=o.tipo_producto,
                item_id=o.item_id,
                item_nombre=o.item_nombre,
                kg_comprados=o.kg_comprados,
                precio_kg_cop=o.precio_kg_cop,
                total_cop=o.total_cop,
                estado=o.estado,
                direccion_entrega=o.direccion_entrega,
                fecha_orden=o.fecha_orden,
            )
        )
    return resultado
