"""
Módulo de Cálculos Agroindustriales - CacaoTrace Huila
Filosofía SDD / Onion Architecture:
- Python puro usando únicamente la biblioteca estándar (decimal).
- Cero dependencias de FastAPI, SQLAlchemy o frameworks web.
- Fórmulas oficiales del caso base CAC001 y blindaje contra divisiones por cero.
"""

from decimal import Decimal, ROUND_HALF_UP, InvalidOperation
from typing import Tuple, Optional, Dict, Any, Union

# Constantes del Negocio Agroindustrial del Huila
UMBRAL_ALERTA_MERMA_PORCENTAJE = Decimal("15.00")
PRECIO_BASE_CASCARILLA_COP = Decimal("3000.00")
DOS_DECIMALES = Decimal("0.01")


def to_decimal(valor: Union[Decimal, float, int, str]) -> Decimal:
    """
    Convierte de forma segura cualquier tipo numérico a Decimal.
    Evita imprecisiones de coma flotante de IEEE 754.
    """
    if isinstance(valor, Decimal):
        return valor
    try:
        # Convertir float a string primero para preservar el valor literal exacto
        return Decimal(str(valor))
    except (InvalidOperation, TypeError, ValueError) as err:
        raise ValueError(f"No se pudo convertir '{valor}' a Decimal: {err}")


def calcular_merma_y_alerta(
    kg_entrada: Union[Decimal, float, int, str],
    kg_salida_vendible: Union[Decimal, float, int, str],
) -> Tuple[Decimal, bool, Optional[str]]:
    """
    Calcula el porcentaje de merma y determina si se activa la alerta (> 15.00%).
    
    Fórmula oficial:
        Merma (%) = ((Entrada - Salida) / Entrada) * 100
        
    Reglas y Blindajes:
    - Entrada <= 0: Lanza ValueError (previene división por cero).
    - Salida < 0: Lanza ValueError (cantidades negativas rechazadas).
    - Salida > Entrada: Lanza ValueError (salida no puede superar la entrada en grano seco).
    - Salida == 0: Merma = 100.00%, Alerta = True (Pérdida total del lote).
    - Merma > 15.00%: Alerta = True con mensaje explicativo de la causa.
    
    Returns:
        Tuple[merma_porcentaje, alerta_merma, alerta_explicacion]
    """
    dec_entrada = to_decimal(kg_entrada)
    dec_salida = to_decimal(kg_salida_vendible)

    # 1. Blindaje División por Cero 1: Entrada <= 0
    if dec_entrada <= Decimal("0"):
        raise ValueError("La cantidad de entrada debe ser estrictamente mayor a 0 kg")

    # 2. Blindaje de cantidades negativas
    if dec_salida < Decimal("0"):
        raise ValueError("La cantidad de salida vendible no puede ser negativa")

    # 3. Blindaje de Masa Mágica: Salida no puede superar Entrada en grano seco
    if dec_salida > dec_entrada:
        raise ValueError(
            f"Físicamente inválido: la salida vendible ({dec_salida} kg) "
            f"no puede superar la entrada ({dec_entrada} kg) sin justificación de insumos añadidos"
        )

    # 4. Caso Borde: Pérdida total en planta (Salida == 0)
    if dec_salida == Decimal("0"):
        merma = Decimal("100.00")
        alerta = True
        explicacion = (
            "Alerta Crítica: Pérdida total del lote en etapa de transformación (merma del 100.00%)"
        )
        return merma, alerta, explicacion

    # 5. Cálculo estándar de merma
    diferencia = dec_entrada - dec_salida
    merma_bruta = (diferencia / dec_entrada) * Decimal("100")
    merma = merma_bruta.quantize(DOS_DECIMALES, rounding=ROUND_HALF_UP)

    # Regla estricta del reto: Alerta solo si Merma > 15.00%
    alerta = merma > UMBRAL_ALERTA_MERMA_PORCENTAJE
    explicacion = (
        f"Merma del {merma}% supera el umbral máximo tolerado del "
        f"{UMBRAL_ALERTA_MERMA_PORCENTAJE}% para la etapa de transformación"
        if alerta
        else None
    )

    return merma, alerta, explicacion


def calcular_costo_unitario(
    costo_total_etapa_cop: Union[Decimal, float, int, str],
    kg_salida_vendible: Union[Decimal, float, int, str],
) -> Optional[Decimal]:
    """
    Calcula el costo unitario de producción por kilogramo vendible.
    
    Fórmula oficial:
        Costo Unitario ($/kg) = Costo Total Etapa / Salida Vendible
        
    Caso oficial CAC001:
        $1.600.000 / 80 kg = $20.000.00 COP/kg
        
    Blindaje División por Cero 2:
    - Si Salida == 0 (Pérdida total), retorna None para mostrar 'N/A' en UI y no romper el backend.
    """
    dec_costo = to_decimal(costo_total_etapa_cop)
    dec_salida = to_decimal(kg_salida_vendible)

    if dec_costo < Decimal("0"):
        raise ValueError("El costo total de la etapa no puede ser negativo")

    if dec_salida < Decimal("0"):
        raise ValueError("La salida vendible no puede ser negativa")

    # Blindaje División por Cero 2: Salida == 0
    if dec_salida == Decimal("0"):
        return None

    costo_unitario = dec_costo / dec_salida
    return costo_unitario.quantize(DOS_DECIMALES, rounding=ROUND_HALF_UP)


def calcular_margen_venta(
    precio_venta_cop: Union[Decimal, float, int, str],
    costo_unitario_cop: Optional[Union[Decimal, float, int, str]],
) -> Optional[Decimal]:
    """
    Calcula el margen porcentual estimado sobre el precio de venta.
    
    Fórmula oficial:
        Margen sobre Venta (%) = ((Precio Venta - Costo Unitario) / Precio Venta) * 100
        
    Caso oficial CAC001:
        Precio: $25.000, Costo: $20.000
        Margen = ((25.000 - 20.000) / 25.000) * 100 = 20.00%
        
    Blindaje División por Cero 3:
    - Si Costo Unitario es None (pérdida total), retorna Decimal('-100.00').
    - Si Precio Venta <= 0, retorna Decimal('0.00') para evitar división por cero.
    """
    if costo_unitario_cop is None:
        return Decimal("-100.00")

    dec_precio = to_decimal(precio_venta_cop)
    dec_costo = to_decimal(costo_unitario_cop)

    if dec_precio < Decimal("0"):
        raise ValueError("El precio de venta no puede ser negativo")

    # Blindaje División por Cero 3: Precio == 0
    if dec_precio == Decimal("0"):
        return Decimal("0.00")

    diferencia = dec_precio - dec_costo
    margen_bruto = (diferencia / dec_precio) * Decimal("100")
    return margen_bruto.quantize(DOS_DECIMALES, rounding=ROUND_HALF_UP)


def calcular_indicadores_cascarilla(
    kg_entrada: Union[Decimal, float, int, str],
    kg_salida_vendible: Union[Decimal, float, int, str],
    costo_total_etapa_cop: Union[Decimal, float, int, str],
    precio_kg_cascarilla_cop: Union[Decimal, float, int, str] = PRECIO_BASE_CASCARILLA_COP,
) -> Dict[str, Decimal]:
    """
    Calcula el indicador secundario de Economía Circular (Aprovechamiento de Cascarilla).
    
    IMPORTANTE:
    Este cálculo es un indicador de valor agregado secundario y NO sustituye
    ni altera el costo unitario oficial ($20.000 COP) ni el margen oficial (20.00%).
    """
    dec_entrada = to_decimal(kg_entrada)
    dec_salida = to_decimal(kg_salida_vendible)
    dec_costo_total = to_decimal(costo_total_etapa_cop)
    dec_precio_cascarilla = to_decimal(precio_kg_cascarilla_cop)

    kg_cascarilla = max(Decimal("0.00"), dec_entrada - dec_salida).quantize(DOS_DECIMALES)
    ingreso_adicional = (kg_cascarilla * dec_precio_cascarilla).quantize(
        DOS_DECIMALES, rounding=ROUND_HALF_UP
    )
    costo_neto_circular = max(Decimal("0.00"), dec_costo_total - ingreso_adicional).quantize(
        DOS_DECIMALES, rounding=ROUND_HALF_UP
    )

    return {
        "kg_cascarilla_recuperada": kg_cascarilla,
        "valor_kg_cascarilla_cop": dec_precio_cascarilla,
        "ingreso_adicional_cop": ingreso_adicional,
        "costo_neto_circular_cop": costo_neto_circular,
    }


def balance_agroindustrial_completo(
    kg_entrada: Union[Decimal, float, int, str],
    kg_salida_vendible: Union[Decimal, float, int, str],
    costo_total_etapa_cop: Union[Decimal, float, int, str] = Decimal("1600000.00"),
    precio_venta_cop: Union[Decimal, float, int, str] = Decimal("25000.00"),
) -> Dict[str, Any]:
    """
    Ejecuta el balance integral agroindustrial para una etapa de transformación.
    Reúne métricas oficiales obligatorias y métricas secundarias circulares.
    """
    merma, alerta, explicacion = calcular_merma_y_alerta(kg_entrada, kg_salida_vendible)
    costo_unitario = calcular_costo_unitario(costo_total_etapa_cop, kg_salida_vendible)
    margen_venta = calcular_margen_venta(precio_venta_cop, costo_unitario)
    circular = calcular_indicadores_cascarilla(
        kg_entrada, kg_salida_vendible, costo_total_etapa_cop
    )

    return {
        "kg_entrada": to_decimal(kg_entrada),
        "kg_salida_vendible": to_decimal(kg_salida_vendible),
        "merma_porcentaje": merma,
        "alerta_merma": alerta,
        "alerta_explicacion": explicacion,
        "costo_total_etapa_cop": to_decimal(costo_total_etapa_cop),
        "costo_unitario_cop": costo_unitario,
        "precio_venta_cop": to_decimal(precio_venta_cop),
        "margen_venta_porcentaje": margen_venta,
        "economia_circular": circular,
        "supuestos_visibles": (
            "Costo total incluye mano de obra directa de tostión, energía, acopio y depreciación. "
            "El margen sobre venta se calcula sobre el precio base de venta declarado."
        ),
    }
