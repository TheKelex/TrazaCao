"""
Router de Subproductos y Catálogo Industrial/Botánico B2B - CacaoTrace Huila
Ofrece la merma del proceso agroindustrial de cacao (cascarilla, biomasa vegetal)
como materia prima estandarizada y trazable para grandes empresas e industrias:
- Cosmética & Dermocosmética (mascarillas, exfoliantes botánicos, mantecas).
- Agroquímica Orgánica (biofertilizantes ricos en potasio, compostaje, biochar).
- Extractos Botánicos & Nutracéutica (polifenoles, teobromina, infusiones).

FRONTERA OPERATIVA Y DE NEGOCIO:
TrazaCao se enfoca exclusivamente en el beneficio, tratamiento y transformación del cacao.
NO manufactura ni comercializa productos finales (mascarillas comerciales, fertilizantes envasados).
Abastece como proveedor B2B de materias primas secundarias certificadas a gran escala.
"""

import uuid
from decimal import Decimal
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from infra.database import get_db
from models import Transformacion, Lote, AuditoriaLog
from schemas import (
    CatalogoSubproductosResponse,
    SubproductoBotanicoItem,
    SolicitudCotizacionB2BCreate,
    SolicitudCotizacionB2BResponse,
)
from domain.calculos import clasificar_merma_destinos_industriales

router = APIRouter(prefix="/api/subproductos", tags=["Subproductos / Catálogo Industrial & Botánico B2B"])


@router.get("/catalogo-industrial", response_model=CatalogoSubproductosResponse)
def consultar_catalogo_industrial_botanico(db: Session = Depends(get_db)):
    """
    Retorna el Catálogo Industrial y Botánico B2B de subproductos y mermas valorizadas.
    Permite a grandes empresas de cosmética, fertilizantes y nutracéutica adquirir
    materia prima vegetal pura con trazabilidad de origen en el Huila.
    """
    # 1. Sumar la merma total real acumulada en transformaciones
    transformaciones = db.query(Transformacion).all()
    merma_total_acumulada = sum(
        (t.kg_cascarilla for t in transformaciones),
        Decimal("0.00")
    )

    # Si la base de datos está recién inicializada o sin transformaciones, respaldar con el canon CAC001 (20 kg)
    if merma_total_acumulada <= Decimal("0.00"):
        merma_total_acumulada = Decimal("20.00")

    # 2. Desglose botánico e industrial mediante el dominio Onion
    desglose = clasificar_merma_destinos_industriales(merma_total_acumulada)
    fracciones = desglose["fracciones_b2b"]

    # Identificar lotes de origen activos
    primer_lote = db.query(Lote).filter(Lote.id == "CAC001").first()
    lote_id = primer_lote.id if primer_lote else "CAC001"
    muni_origen = f"{primer_lote.origen}, Huila" if primer_lote else "Rivera, Huila"

    items: List[SubproductoBotanicoItem] = [
        SubproductoBotanicoItem(
            id="SUB-COSM-01",
            nombre=fracciones["cosmetico_mascarillas"]["nombre"],
            sector_industrial="Industria Cosmética y Dermocosmética",
            lote_origen_id=lote_id,
            municipio_origen=muni_origen,
            kg_disponibles=fracciones["cosmetico_mascarillas"]["kg_disponibles"],
            precio_b2b_kg_cop=fracciones["cosmetico_mascarillas"]["precio_sugerido_b2b_kg_cop"],
            pureza_botanica=fracciones["cosmetico_mascarillas"]["pureza_botanica"],
            humedad_porcentaje=Decimal("5.80"),
            aplicaciones_industriales=fracciones["cosmetico_mascarillas"]["aplicaciones_industriales"],
        ),
        SubproductoBotanicoItem(
            id="SUB-AGRO-01",
            nombre=fracciones["biofertilizantes_enmiendas"]["nombre"],
            sector_industrial="Agroquímica Orgánica y Biofertilizantes",
            lote_origen_id=lote_id,
            municipio_origen=muni_origen,
            kg_disponibles=fracciones["biofertilizantes_enmiendas"]["kg_disponibles"],
            precio_b2b_kg_cop=fracciones["biofertilizantes_enmiendas"]["precio_sugerido_b2b_kg_cop"],
            pureza_botanica=fracciones["biofertilizantes_enmiendas"]["pureza_botanica"],
            humedad_porcentaje=Decimal("6.50"),
            aplicaciones_industriales=fracciones["biofertilizantes_enmiendas"]["aplicaciones_industriales"],
        ),
        SubproductoBotanicoItem(
            id="SUB-BOTA-01",
            nombre=fracciones["botanico_extractos"]["nombre"],
            sector_industrial="Extractos Botánicos, Fitofármacos y Nutracéutica",
            lote_origen_id=lote_id,
            municipio_origen=muni_origen,
            kg_disponibles=fracciones["botanico_extractos"]["kg_disponibles"],
            precio_b2b_kg_cop=fracciones["botanico_extractos"]["precio_sugerido_b2b_kg_cop"],
            pureza_botanica=fracciones["botanico_extractos"]["pureza_botanica"],
            humedad_porcentaje=Decimal("5.20"),
            aplicaciones_industriales=fracciones["botanico_extractos"]["aplicaciones_industriales"],
        ),
    ]

    return CatalogoSubproductosResponse(
        principio_negocio=desglose["principio_negocio_b2b"],
        total_merma_recuperada_kg=merma_total_acumulada,
        subproductos=items,
    )


@router.post("/solicitar-cotizacion-b2b", response_model=SolicitudCotizacionB2BResponse, status_code=status.HTTP_201_CREATED)
def solicitar_cotizacion_materia_prima_b2b(
    solicitud: SolicitudCotizacionB2BCreate,
    db: Session = Depends(get_db)
):
    """
    Canal de enlace comercial B2B para que laboratorios cosméticos o fabricantes
    de fertilizantes soliciten suministro a gran escala o fichas técnicas oficiales.
    """
    folio = f"COT-B2B-{uuid.uuid4().hex[:8].upper()}"

    # Registrar en auditoría la intención de compra B2B
    audit = AuditoriaLog(
        usuario="portal_b2b_comprador",
        accion="SOLICITUD_COTIZACION_MERMA",
        lote_id=solicitud.lote_origen_id,
        valor_anterior=None,
        valor_nuevo=f"Empresa: {solicitud.empresa_solicitante}, Subproducto: {solicitud.subproducto_id}, Cantidad: {solicitud.volumen_requerido_kg} kg",
        motivo=f"Sector: {solicitud.sector_industrial}. Aplicación: {solicitud.aplicacion_prevista}. Contacto: {solicitud.correo_corporativo}",
    )
    db.add(audit)
    db.commit()

    return SolicitudCotizacionB2BResponse(
        id=str(uuid.uuid4()),
        mensaje="Solicitud de cotización de materia prima botánica radicada con éxito.",
        folio_solicitud=folio,
        subproducto_solicitado=solicitud.subproducto_id,
        volumen_solicitado_kg=solicitud.volumen_requerido_kg,
        empresa=solicitud.empresa_solicitante,
        estado="RECIBIDA_ANALISIS_TECNICO",
        contacto_comercial_b2b="comercial-b2b@trazacao-huila.org / Mesa de Enlace Agroindustrial",
    )
