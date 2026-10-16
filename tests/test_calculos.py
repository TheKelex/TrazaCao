"""
Suite de Pruebas Unitarias - Motor de Cálculos Agroindustriales (Dev 1)
Reto USCO DEVURITY: Cacao con historia, calidad y valor
Cumple con la prueba oficial del jurado para el lote CAC001 y blindajes de error.
Compatible tanto con 'pytest' como con 'python -m unittest'.
"""

import sys
import os
import unittest
from decimal import Decimal

# Asegurar que el directorio src/backend esté en el PYTHONPATH
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "src", "backend")))

from domain.calculos import (
    calcular_merma_y_alerta,
    calcular_costo_unitario,
    calcular_margen_venta,
    calcular_indicadores_cascarilla,
    balance_agroindustrial_completo,
)


class TestCalculosAgroindustriales(unittest.TestCase):
    """Pruebas rigurosas de la lógica matemática del cacao en el Huila."""

    def test_01_caso_oficial_base_cac001(self):
        """
        RF04, RF05, RF12: Caso oficial obligatorio de la guía:
        - Entrada = 100 kg, Salida = 80 kg
        - Merma = (100 - 80) / 100 * 100 = 20.00%
        - Alerta = True (20.00% > 15.00%)
        - Costo Etapa = $1.600.000 COP -> Costo Unitario = $20.000.00 COP/kg
        - Precio Venta = $25.000 COP -> Margen sobre Venta = 20.00%
        """
        # 1. Merma y Alerta
        merma, alerta, explicacion = calcular_merma_y_alerta(100, 80)
        self.assertEqual(merma, Decimal("20.00"))
        self.assertTrue(alerta)
        self.assertIn("supera el umbral máximo tolerado del 15.00%", explicacion)

        # 2. Costo Unitario
        costo_unitario = calcular_costo_unitario(1600000, 80)
        self.assertEqual(costo_unitario, Decimal("20000.00"))

        # 3. Margen sobre Venta
        margen = calcular_margen_venta(25000, costo_unitario)
        self.assertEqual(margen, Decimal("20.00"))

        # 4. Indicador Secundario de Cascarilla (Economía Circular)
        circular = calcular_indicadores_cascarilla(100, 80, 1600000)
        self.assertEqual(circular["kg_cascarilla_recuperada"], Decimal("20.00"))
        self.assertEqual(circular["ingreso_adicional_cop"], Decimal("60000.00"))
        self.assertEqual(circular["costo_neto_circular_cop"], Decimal("1540000.00"))

    def test_02_limite_exacto_umbral_15_porciento(self):
        """
        RF04: Si la merma es exactamente 15.00%, NO se debe disparar alerta
        (la regla es estrictamente 'mayor a 15%').
        """
        merma, alerta, explicacion = calcular_merma_y_alerta(100, 85)
        self.assertEqual(merma, Decimal("15.00"))
        self.assertFalse(alerta)
        self.assertIsNone(explicacion)

    def test_03_disparo_inmediato_al_superar_15_porciento(self):
        """
        RF04: Con 84.99 kg de salida, merma es 15.01% -> Alerta se dispara inmediatamente.
        """
        merma, alerta, explicacion = calcular_merma_y_alerta(100, "84.99")
        self.assertEqual(merma, Decimal("15.01"))
        self.assertTrue(alerta)
        self.assertIsNotNone(explicacion)

    def test_04_blindaje_division_por_cero_1_entrada_cero_o_negativa(self):
        """
        Blindaje División por Cero 1: Entrada <= 0 debe ser rechazada con ValueError.
        """
        with self.assertRaises(ValueError):
            calcular_merma_y_alerta(0, 50)

        with self.assertRaises(ValueError):
            calcular_merma_y_alerta(-10, 50)

    def test_05_blindaje_masa_magica_salida_mayor_entrada(self):
        """
        Rechazar salida vendible mayor a la entrada (física de conservación de masa).
        """
        with self.assertRaises(ValueError):
            calcular_merma_y_alerta(100, 120)

    def test_06_blindaje_division_por_cero_2_perdida_total_salida_cero(self):
        """
        Blindaje División por Cero 2: Si el lote se quema en tostión (salida = 0 kg):
        - Merma = 100.00% y Alerta = True
        - Costo unitario debe retornar None ('N/A') sin lanzar ZeroDivisionError
        - Margen de venta debe ser -100.00%
        """
        merma, alerta, explicacion = calcular_merma_y_alerta(100, 0)
        self.assertEqual(merma, Decimal("100.00"))
        self.assertTrue(alerta)

        costo_unitario = calcular_costo_unitario(1600000, 0)
        self.assertIsNone(costo_unitario)

        margen = calcular_margen_venta(25000, costo_unitario)
        self.assertEqual(margen, Decimal("-100.00"))

    def test_07_blindaje_division_por_cero_3_precio_venta_cero(self):
        """
        Blindaje División por Cero 3: Si precio_venta == 0, no lanzar ZeroDivisionError.
        """
        margen = calcular_margen_venta(0, Decimal("20000.00"))
        self.assertEqual(margen, Decimal("0.00"))

    def test_08_balance_agroindustrial_completo_estructura(self):
        """
        RF12: Verificar que el balance completo exponga supuestos visibles
        y datos estructurados.
        """
        balance = balance_agroindustrial_completo(100, 80, 1600000, 25000)
        self.assertEqual(balance["merma_porcentaje"], Decimal("20.00"))
        self.assertEqual(balance["costo_unitario_cop"], Decimal("20000.00"))
        self.assertEqual(balance["margen_venta_porcentaje"], Decimal("20.00"))
        self.assertIn("supuestos_visibles", balance)
        self.assertIn("mano de obra directa", balance["supuestos_visibles"])


if __name__ == "__main__":
    unittest.main()
