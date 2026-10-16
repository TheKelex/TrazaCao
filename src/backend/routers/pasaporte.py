"""
Router Público - Pasaporte Digital del Cacao (RF06)
Endpoint público accesible mediante código o código QR.
REGLA ESTRICTA DE SEGURIDAD:
Oculta costos internos, márgenes económicos y datos privados del agricultor.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from infra.database import get_db
from models import Lote, Transformacion
from schemas import PasaportePublicoResponse, EtapaTrazabilidadPublica

router = APIRouter(tags=["Público / Pasaporte QR"])


@router.get("/api/pasaporte/{lote_id}", response_model=PasaportePublicoResponse)
@router.get("/api/public/pasaporte/{lote_id}", response_model=PasaportePublicoResponse)
def consultar_pasaporte_publico(lote_id: str, db: Session = Depends(get_db)):
    """
    RF06: Ficha Comercial Pública consultable por QR o enlace directo.
    - Demuestra origen auténtico (Rivera, Campoalegre o Algeciras).
    - Refleja estado en tiempo real (si está BLOQUEADO, es_comercializable es False).
    - Cero fuga de costos internos o teléfonos privados en el JSON (auditoría aprobada).
    """
    lote = db.query(Lote).filter(Lote.id == lote_id).first()
    if not lote:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"El pasaporte del lote '{lote_id}' no fue encontrado o no existe",
        )

    # Reconstruir las etapas superadas
    transformaciones = (
        db.query(Transformacion)
        .filter(Transformacion.lote_id == lote_id)
        .order_by(Transformacion.fecha_transformacion.asc())
        .all()
    )

    etapas_publicas = [
        EtapaTrazabilidadPublica(
            etapa="Recepción en Centro de Acopio",
            fecha=lote.fecha_recepcion,
            responsable="Asociación Cacaotera del Huila",
            conformidad=f"Grano verificado (Humedad {lote.humedad_porcentaje}%, Fermentación {lote.fermentacion_porcentaje}%)",
        )
    ]

    for t in transformaciones:
        etapas_publicas.append(
            EtapaTrazabilidadPublica(
                etapa=t.etapa,
                fecha=t.fecha_transformacion,
                responsable=t.responsable,
                conformidad="Procesado bajo estándares de calidad",
            )
        )

    es_apto_para_venta = lote.estado == "LIBERADO"

    return PasaportePublicoResponse(
        lote_id=lote.id,
        productor=lote.productor,
        origen_municipio=f"{lote.origen}, Huila",
        departamento="Huila, Colombia",
        variedad="Cacao Fino de Aroma (Criollo / Trinitario)",
        humedad_porcentaje=lote.humedad_porcentaje,
        fermentacion_porcentaje=lote.fermentacion_porcentaje,
        estado=lote.estado,
        es_comercializable=es_apto_para_venta,
        fecha_acopio=lote.fecha_recepcion,
        etapas=etapas_publicas,
        sello_calidad="Norma Técnica NTC 1252 / Cero Deforestación",
        contacto_asociacion_wa=f"https://wa.me/573000000000?text=Hola,%20me%20interesa%20el%20lote%20{lote.id}",
    )
