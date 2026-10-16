"""
Router de Exportación CSV - CacaoTrace Huila (RF11)
Exporta resumen estructurado de lotes para el Administrador con codificación utf-8-sig.
Incluye sanitización para prevenir inyección de fórmulas en hojas de cálculo.
"""

import io
import csv
from typing import Optional
from fastapi import APIRouter, Depends, Response, Query
from sqlalchemy.orm import Session
from infra.database import get_db
from models import Lote, Transformacion
from security.rbac import require_admin

router = APIRouter(prefix="/api/admin/export", tags=["Exportación CSV (Admin)"])


def sanitizar_celda_csv(valor) -> str:
    """Previene inyección de fórmulas CSV (ej. =CMD o + o - o @) ante caracteres maliciosos."""
    if valor is None:
        return ""
    txt = str(valor).strip()
    if txt and txt[0] in ("=", "+", "-", "@"):
        return "'" + txt
    return txt


@router.get("/csv")
@router.get("/lotes-csv")
def exportar_resumen_csv(
    origen: Optional[str] = Query(None, description="Filtrar por municipio"),
    estado: Optional[str] = Query(None, description="Filtrar por estado"),
    db: Session = Depends(get_db),
    auth: dict = Depends(require_admin),  # Solo Administrador
):
    """
    RF11: Exportar resumen de lotes en CSV para el Administrador.
    Columnas: Identificador, Productor, Origen, Recibido (kg), Disponible (kg), Estado, Costo Etapa, Costo Unitario, Margen.
    """
    query = db.query(Lote)
    if origen:
        query = query.filter(Lote.origen == origen)
    if estado:
        query = query.filter(Lote.estado == estado)
    lotes = query.order_by(Lote.id.asc()).all()

    output = io.StringIO()
    writer = csv.writer(output, delimiter=",", quoting=csv.QUOTE_MINIMAL)

    # Cabeceras requeridas por RF11
    writer.writerow([
        "Identificador",
        "Productor",
        "Origen (Huila)",
        "Humedad (%)",
        "Fermentación (%)",
        "Kg Recibidos",
        "Kg Disponibles",
        "Estado",
        "Costo Total Etapa (COP)",
        "Costo Unitario (COP/kg)",
        "Margen sobre Venta (%)",
    ])

    for lote in lotes:
        # Obtener última transformación para costos
        ultima_trans = (
            db.query(Transformacion)
            .filter(Transformacion.lote_id == lote.id)
            .order_by(Transformacion.fecha_transformacion.desc())
            .first()
        )

        costo_etapa = ultima_trans.costo_etapa_cop if ultima_trans else "N/A"
        costo_unitario = ultima_trans.costo_unitario_cop if ultima_trans else "N/A"
        margen = ultima_trans.margen_venta_porcentaje if ultima_trans else "N/A"

        writer.writerow([
            sanitizar_celda_csv(lote.id),
            sanitizar_celda_csv(lote.productor),
            sanitizar_celda_csv(lote.origen),
            sanitizar_celda_csv(lote.humedad_porcentaje),
            sanitizar_celda_csv(lote.fermentacion_porcentaje),
            sanitizar_celda_csv(lote.kg_recibidos),
            sanitizar_celda_csv(lote.kg_disponibles),
            sanitizar_celda_csv(lote.estado),
            sanitizar_celda_csv(costo_etapa),
            sanitizar_celda_csv(costo_unitario),
            sanitizar_celda_csv(margen),
        ])

    csv_data = output.getvalue()
    # Agregar BOM utf-8-sig para que Excel en Windows lo abra con acentos y tildes perfectas
    bom_csv = "\ufeff" + csv_data

    return Response(
        content=bom_csv.encode("utf-8-sig"),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": "attachment; filename=resumen_lotes_cacao_huila.csv"},
    )
