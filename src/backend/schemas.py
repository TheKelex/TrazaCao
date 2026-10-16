"""
Esquemas Pydantic - CacaoTrace Huila (FastAPI Validation)
Validación estricta de tipos, campos obligatorios, prevención de números negativos
y segregación rigurosa de DTOs (público vs administrativo).
"""

from datetime import datetime
from decimal import Decimal
from typing import Optional, List, Literal
from pydantic import BaseModel, Field, field_validator, model_validator, ConfigDict


# Municipios Oficiales del Reto Agroindustrial en el Huila
MUNICIPIOS_HUILA = ("Rivera", "Campoalegre", "Algeciras")


# ==============================================================================
# ESQUEMAS DE LOTE (RECEPCIÓN Y GESTIÓN)
# ==============================================================================

class LoteBase(BaseModel):
    productor: str = Field(..., min_length=2, max_length=150, description="Nombre del productor")
    origen: Literal["Rivera", "Campoalegre", "Algeciras"] = Field(
        ..., description="Municipio de origen en el Huila"
    )
    humedad_porcentaje: Decimal = Field(
        default=Decimal("7.50"), ge=0, le=25, description="Porcentaje de humedad del grano (NTC 1252)"
    )
    fermentacion_porcentaje: Decimal = Field(
        default=Decimal("75.00"), ge=0, le=100, description="Porcentaje de fermentación"
    )
    kg_recibidos: Decimal = Field(
        ..., gt=0, description="Cantidad recibida en kilogramos (estrictamente > 0)"
    )


class LoteCreate(LoteBase):
    id: str = Field(
        ..., min_length=3, max_length=50, pattern=r"^[A-Za-z0-9\-_]+$", description="Identificador único (ej. CAC001)"
    )


class LoteResponse(LoteBase):
    id: str
    kg_disponibles: Decimal
    estado: Literal["PENDIENTE", "LIBERADO", "BLOQUEADO"]
    motivo_bloqueo: Optional[str] = None
    fecha_recepcion: datetime

    model_config = ConfigDict(from_attributes=True)


class LoteEstadoUpdate(BaseModel):
    nuevo_estado: Literal["LIBERADO", "BLOQUEADO"]
    motivo: str = Field(..., min_length=5, description="Motivo obligatorio del cambio de estado")

    @field_validator("motivo")
    @classmethod
    def validar_motivo_no_vacio(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("El motivo del cambio de estado no puede estar vacío")
        return v.strip()


# ==============================================================================
# ESQUEMAS DE TRANSFORMACIÓN
# ==============================================================================

class TransformacionCreate(BaseModel):
    lote_id: str = Field(..., description="ID del lote de origen")
    etapa: str = Field(default="Tostión y Molienda", min_length=3, max_length=100)
    responsable: str = Field(default="Operador de Planta Rivera", min_length=2, max_length=150)
    kg_entrada: Decimal = Field(..., gt=0, description="Kilogramos a consumir del lote origen")
    kg_salida_vendible: Decimal = Field(..., ge=0, description="Kilogramos vendibles obtenidos")
    costo_etapa_cop: Decimal = Field(default=Decimal("1600000.00"), ge=0, description="Costo total de la etapa")
    precio_venta_estimado: Decimal = Field(default=Decimal("25000.00"), ge=0, description="Precio de venta estimado/kg")
    incidencia_justificacion: Optional[str] = None

    @model_validator(mode="before")
    @classmethod
    def normalizar_campos_alias(cls, data):
        if isinstance(data, dict):
            if "kg_salida_vendible" not in data and "kg_salida" in data:
                data["kg_salida_vendible"] = data["kg_salida"]
            if not data.get("responsable"):
                data["responsable"] = "Operador de Planta Rivera"
        return data

    @model_validator(mode="after")
    def validar_masa_fisica(self) -> "TransformacionCreate":
        if self.kg_salida_vendible > self.kg_entrada and not self.incidencia_justificacion:
            raise ValueError(
                "La salida vendible no puede superar la entrada sin registrar una justificación explícita de adición de insumos"
            )
        return self


class EconomiaCircularDTO(BaseModel):
    kg_cascarilla_recuperada: Decimal
    valor_kg_cascarilla_cop: Decimal
    ingreso_adicional_cop: Decimal
    costo_neto_circular_cop: Decimal


class TransformacionResponse(BaseModel):
    id: str
    lote_id: str
    etapa: str
    responsable: str
    kg_entrada: Decimal
    kg_salida_vendible: Decimal
    kg_cascarilla: Decimal
    merma_porcentaje: Decimal
    alerta_merma: bool
    alerta_explicacion: Optional[str] = None
    costo_etapa_cop: Decimal
    costo_unitario_cop: Optional[Decimal] = None
    precio_venta_estimado: Decimal
    margen_venta_porcentaje: Optional[Decimal] = None
    ingreso_cascarilla_cop: Decimal
    costo_neto_circular_cop: Decimal
    incidencia_justificacion: Optional[str] = None
    fecha_transformacion: datetime

    model_config = ConfigDict(from_attributes=True)


# ==============================================================================
# ESQUEMA PÚBLICO SANITIZADO (PASAPORTE DIGITAL QR - RF06)
# ==============================================================================

class EtapaTrazabilidadPublica(BaseModel):
    etapa: str
    fecha: datetime
    responsable: str
    conformidad: str


class PasaportePublicoResponse(BaseModel):
    """
    DTO ESTRICTAMENTE SANITIZADO PARA EL COMPRADOR / QR (RF06).
    NO CONTIENE: costo_etapa_cop, costo_unitario_cop, margen_venta_porcentaje,
    ni datos privados del agricultor.
    """
    lote_id: str
    productor: str
    origen_municipio: str
    departamento: str = "Huila, Colombia"
    variedad: str = "Cacao Fino de Aroma (Criollo / Trinitario)"
    humedad_porcentaje: Decimal
    fermentacion_porcentaje: Decimal
    estado: Literal["PENDIENTE", "LIBERADO", "BLOQUEADO"]
    es_comercializable: bool
    fecha_acopio: datetime
    etapas: List[EtapaTrazabilidadPublica] = []
    sello_calidad: str = "Norma Técnica NTC 1252 / Compatible EUDR"
    contacto_asociacion_wa: str = "https://wa.me/573000000000"
