# PLAN TÉCNICO DE CONSTRUCCIÓN - DEV 1 (BACKEND CORE & DOMINIO)
## Metodología SDD (Specification-Driven Development) & Kanban
### Proyecto: CacaoTrace Huila / TrazaCao
- **Responsable**: Dev 1 (Tech Lead - Backend Core & Dominio Agroindustrial)
- **Rama Git**: `feature/backend-core`
- **Requisitos a Cargo**: RF01 (Recepción), RF02 (Transformación), RF04 (Alertas de Merma), RF05 (Costo Unitario), RF08 (Inventario y Concurrencia), RF12 (Balance Económico)
- **Estado Kanban**: `LISTO PARA CODIFICAR (Definition of Ready - DoR Aprobado)`

---

## 1. OBJETIVO DEL PLAN TÉCNICO
Especificar de forma exhaustiva la arquitectura interna, modelos de datos, contratos de validación, lógica matemática y suite de pruebas para el núcleo del backend, previo a la escritura de código en `src/backend/`.

---

## 2. ARQUITECTURA DE DOMINIO ONION (NÚCLEO AISLADO)

Siguiendo el **ADR-01 (Monolito Onion)**, el núcleo de cálculo agroindustrial se ubicará en `src/backend/domain/` y **no importará FastAPI, ni SQLAlchemy, ni Pydantic, ni librerías externas**. Será Python puro con `Decimal`.

```
src/backend/
├── domain/                    # << CORE DEV 1: Lógica Pura sin Frameworks
│   ├── __init__.py
│   ├── entidades.py          # Clases de datos del dominio (dataclasses puras)
│   └── calculos.py           # Funciones matemáticas deterministas con Decimal
├── models.py                  # << Modelos ORM SQLAlchemy (Tabla lotes y transformaciones)
├── schemas.py                 # << Esquemas de validación Pydantic
├── services/                  # << Casos de uso
│   ├── __init__.py
│   └── inventario.py         # << Lógica de consumo atómico e idempotencia
└── routers/                   # << Controladores FastAPI
    ├── lotes.py              # << Endpoints de recepción (RF01)
    └── transformaciones.py   # << Endpoints de transformación (RF02)
```

---

## 3. ESPECIFICACIÓN MATEMÁTICA Y BLINDAJE DE ERRORES (`domain/calculos.py`)

### 3.1 Tipo de Dato Obligatorio: `Decimal`
Para evitar errores de precisión de punto flotante de IEEE 754 (como `19.999999999999996%` en lugar de `20.00%`), todos los cálculos operarán con `from decimal import Decimal, ROUND_HALF_UP`.

### 3.2 Fórmulas Oficiales del Caso Base (`CAC001`)
El caso oficial de la guía establece:
- **Lote**: `CAC001`
- **Entrada ($E$)**: $100.00 \text{ kg}$
- **Salida Vendible ($S$)**: $80.00 \text{ kg}$
- **Costo Total Etapa**: $\$1.600.000.00 \text{ COP}$
- **Precio Venta Hipotético**: $\$25.000.00 \text{ COP/kg}$

#### 1. Cálculo de Merma y Alerta (RF04)
$$\text{Merma} (\%) = \left(\frac{E - S}{E}\right) \times 100$$
$$\text{Merma}(100, 80) = \left(\frac{100 - 80}{100}\right) \times 100 = 20.00\%$$
- **Regla de Alerta**: Se dispara **únicamente si $\text{Merma} > 15.00\%$** (estricto).
  - Como $20.00\% > 15.00\% \rightarrow \text{alerta\_merma} = \text{True}$.
  - Explicación obligatoria: `"Merma del 20.00% supera el umbral máximo tolerado del 15.00% para la etapa de transformación"`.

#### 2. Costo Unitario de Producción (RF05, RF12)
$$\text{Costo Unitario} = \frac{\text{Costo Total Etapa}}{S}$$
$$\text{Costo Unitario} = \frac{\$1.600.000}{80.00 \text{ kg}} = \$20.000.00 \text{ COP/kg}$$

#### 3. Margen sobre Venta (RF05, RF12)
$$\text{Margen sobre Venta} (\%) = \left(\frac{\text{Precio Venta} - \text{Costo Unitario}}{\text{Precio Venta}}\right) \times 100$$
$$\text{Margen sobre Venta} = \left(\frac{25.000 - 20.000}{25.000}\right) \times 100 = 20.00\%$$

#### 4. Indicador Secundario de Economía Circular (Diferenciador Cascarilla)
Para **no alterar las variables primarias oficiales** evaluadas por el jurado:
- $\text{Cascarilla Recuperada} = E - S = 100 - 80 = 20.00 \text{ kg}$.
- $\text{Valor Mercado Cascarilla} = \$3.000 \text{ COP/kg}$.
- $\text{Ingreso Adicional Estimado} = 20 \times 3.000 = \$60.000 \text{ COP}$.
- $\text{Costo Neto Circular} = \$1.600.000 - \$60.000 = \$1.540.000 \text{ COP}$.

---

### 3.3 Blindaje de las Tres Divisiones por Cero y Casos Borde
El motor matemático en `domain/calculos.py` responderá con los siguientes comportamientos ante casos límite:

| Caso Borde | Condición Matemática | Respuesta del Sistema | Justificación Técnica |
| :--- | :--- | :--- | :--- |
| **Entrada Cero** | $E \le 0$ | Lanza `ValueError("La cantidad de entrada debe ser estrictamente mayor a 0 kg")`. En API: `HTTP 422`. | Previene división por cero en cálculo de merma; físicamente no se puede transformar aire. |
| **Masa Mágica** | $S > E$ (sin insumos justificados) | Lanza `ValueError("La salida vendible no puede superar la entrada en grano seco")`. En API: `HTTP 422`. | Previene mermas negativas coherentes con las leyes de conservación de masa. |
| **Pérdida Total (Salida Cero)** | $S = 0$ (Lote quemado en tostión) | $\text{Merma} = 100.00\%$, $\text{Alerta} = \text{True}$, $\text{Costo Unitario} = \text{None}$ (muestra `"N/A - Pérdida Total"` en UI), $\text{Margen} = -100.00\%$. | Previene `ZeroDivisionError` en costo unitario sin romper la transacción. |
| **Precio de Venta Cero** | $\text{Precio} = 0$ | $\text{Margen} = 0.00\%$ y campo de advertencia. | Previene `ZeroDivisionError` en cálculo de margen. |

---

## 4. ESPECIFICACIÓN DEL CONSUMO ATÓMICO DE INVENTARIO (RF08)

### 4.1 Problema Identificado en Auditoría
SQLite **no soporta bloqueo a nivel de fila (`SELECT ... FOR UPDATE`)**. Si dos peticiones leen simultáneamente un saldo de $100 \text{ kg}$ y cada una descuenta $60 \text{ kg}$, el saldo quedaría en $40 \text{ kg}$ o provocaría un bloqueo de base de datos (`database is locked`).

### 4.2 Solución Diseñada (Transacción Atómica Condicional)
En `src/backend/services/inventario.py`, el consumo se realizará en un único paso atómico a nivel de SQL:

```python
# Algoritmo de consumo atómico diseñado por Dev 1
def descontar_inventario_atomico(db: Session, lote_id: str, kg_consumo: Decimal) -> None:
    # Ejecuta el UPDATE con validación de saldo en la misma sentencia
    stmt = text("""
        UPDATE lotes 
        SET kg_disponibles = kg_disponibles - :consumo 
        WHERE id = :id AND kg_disponibles >= :consumo
    """)
    result = db.execute(stmt, {"consumo": float(kg_consumo), "id": lote_id})
    
    if result.rowcount == 0:
        # Si rowcount es 0, o el lote no existe o el saldo disponible es menor al solicitado
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Operación rechazada: existencias insuficientes en el lote {lote_id} para consumir {kg_consumo} kg."
        )
```

### 4.3 Control de Idempotencia contra Doble Envío
Para solicitudes `POST /api/transformaciones`:
- El cliente frontend envía una cabecera `X-Idempotency-Key` (UUIDv4 generado por el cliente al montar el formulario).
- El backend almacena las claves procesadas en memoria/tabla temporal de transacciones en la ventana de 5 minutos. Si se recibe la misma clave, responde con el resultado previo sin re-ejecutar el descuento de inventario.

---

## 5. ESPECIFICACIÓN DE MODELOS ORM (`models.py`)

```python
# Diseño preliminar de modelos SQLAlchemy 2.0
class Lote(Base):
    __tablename__ = "lotes"
    
    id = Column(String(50), primary_key=True)  # ej. CAC001
    productor = Column(String(150), nullable=False)
    origen = Column(String(100), nullable=False)  # Rivera, Campoalegre, Algeciras
    humedad_porcentaje = Column(Numeric(5, 2), default=7.50, nullable=False)
    fermentacion_porcentaje = Column(Numeric(5, 2), default=75.00, nullable=False)
    kg_recibidos = Column(Numeric(10, 2), nullable=False)
    kg_disponibles = Column(Numeric(10, 2), nullable=False)
    estado = Column(String(20), default="PENDIENTE", nullable=False)  # PENDIENTE, LIBERADO, BLOQUEADO
    motivo_bloqueo = Column(Text, nullable=True)
    fecha_recepcion = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    __table_args__ = (
        CheckConstraint("kg_recibidos > 0", name="chk_lote_recibidos_positivo"),
        CheckConstraint("kg_disponibles >= 0", name="chk_lote_disponibles_no_negativo"),
    )

class Transformacion(Base):
    __tablename__ = "transformaciones"
    
    id = Column(String(36), primary_key=True)  # UUID4
    lote_id = Column(String(50), ForeignKey("lotes.id"), nullable=False)
    etapa = Column(String(100), nullable=False)
    responsable = Column(String(150), nullable=False)
    kg_entrada = Column(Numeric(10, 2), nullable=False)
    kg_salida_vendible = Column(Numeric(10, 2), nullable=False)
    kg_cascarilla = Column(Numeric(10, 2), nullable=False)
    merma_porcentaje = Column(Numeric(5, 2), nullable=False)
    alerta_merma = Column(Boolean, default=False, nullable=False)
    alerta_explicacion = Column(Text, nullable=True)
    costo_etapa_cop = Column(Numeric(12, 2), default=1600000.00, nullable=False)
    costo_unitario_cop = Column(Numeric(12, 2), nullable=True)
    precio_venta_estimado = Column(Numeric(12, 2), default=25000.00, nullable=False)
    margen_venta_porcentaje = Column(Numeric(5, 2), nullable=True)
    ingreso_cascarilla_cop = Column(Numeric(12, 2), default=0.00, nullable=False)
    costo_neto_circular_cop = Column(Numeric(12, 2), default=1600000.00, nullable=False)
    incidencia_justificacion = Column(Text, nullable=True)
    fecha_transformacion = Column(DateTime, default=datetime.utcnow, nullable=False)
```

---

## 6. ESPECIFICACIÓN DE ENDPOINTS DE DEV 1

### 6.1 `POST /api/lotes` (RF01 - Recepción de Lotes)
- **Roles autorizados**: `OPERADOR`, `ADMINISTRADOR`.
- **Precondiciones**: `id` alfanumérico no existente, `kg_recibidos > 0`, `origen` en lista autorizada (`Rivera`, `Campoalegre`, `Algeciras`).
- **Postcondiciones**: Registro en tabla `lotes` con `kg_disponibles = kg_recibidos` y `estado = "PENDIENTE"`.
- **Registro de Auditoría**: Genera evento `"CREACION"` en `audit_logs`.

### 6.2 `POST /api/transformaciones` (RF02, RF04, RF08)
- **Roles autorizados**: `OPERADOR`, `ADMINISTRADOR`.
- **Precondiciones**: `lote_id` existente y en estado distinto de `BLOQUEADO`, `kg_entrada <= kg_disponibles`, `kg_salida_vendible <= kg_entrada`.
- **Postcondiciones**: 
  - Saldo de lote descontado atómicamente.
  - Merma y alerta calculadas.
  - Registro de transformación vinculado a `lote_id`.
  - Si `merma_porcentaje > 15.00`, campo `alerta_explicacion` diligenciado.
- **Registro de Auditoría**: Genera evento `"TRANSFORMACION"` en `audit_logs` con `kg_entrada` consumidos.

---

## 7. SUITE DE PRUEBAS UNITARIAS PLANIFICADAS PARA DEV 1 (`tests/test_calculos.py`)

| ID Prueba | Función Probada | Entrada | Resultado Esperado | Criterio de Verificación |
| :--- | :--- | :--- | :--- | :--- |
| **UT-D1-01** | `calcular_merma_y_alerta` | $E = 100, S = 80$ | $\text{Merma} = 20.00\%$, $\text{Alerta} = \text{True}$ | Exactitud decimal y disparo de alerta > 15%. |
| **UT-D1-02** | `calcular_merma_y_alerta` | $E = 100, S = 85$ | $\text{Merma} = 15.00\%$, $\text{Alerta} = \text{False}$ | Límite exacto: 15% exacto NO dispara alerta. |
| **UT-D1-03** | `calcular_merma_y_alerta` | $E = 100, S = 84.99$ | $\text{Merma} = 15.01\%$, $\text{Alerta} = \text{True}$ | Disparo inmediato al superar el 15.00%. |
| **UT-D1-04** | `calcular_costo_unitario` | $\text{Costo} = 1.600.000, S = 80$ | $\text{Costo Unitario} = \$20.000.00$ | Valor exacto oficial del caso base. |
| **UT-D1-05** | `calcular_margen_venta` | $\text{Precio} = 25.000, \text{Costo} = 20.000$ | $\text{Margen} = 20.00\%$ | Margen oficial del 20.00%. |
| **UT-D1-06** | `blindaje_division_por_cero` | $E = 100, S = 0$ | $\text{Merma} = 100\%$, $\text{Costo} = \text{None}$, $\text{Margen} = -100\%$ | No lanza excepción ni rompe el hilo. |
| **UT-D1-07** | `blindaje_masa_magica` | $E = 100, S = 120$ | Lanza `ValueError` | Rechazo de salida vendible mayor a entrada. |

---

## 8. DECLARACIÓN DE USO DE IA (ENTREGABLE E08) - DEV 1

En cumplimiento estricto del Numeral 4 del Reglamento Técnico y de la guía oficial:

1. **Herramienta Utilizada**: Antigravity (Google DeepMind) y ChatGPT (OpenAI) para asistencia en el diseño de arquitectura y contratos.
2. **Propósito**: Estructuración del esquema de tipos con `Decimal`, redacción de validadores Pydantic y diseño del algoritmo de consumo atómico en SQL.
3. **Aporte Generado por IA**:
   - Borrador inicial de fórmulas y esqueletos de funciones en `domain/calculos.py`.
   - Plantilla de modelos SQLAlchemy con constraints de chequeo.
4. **Revisión Humana y Correcciones Críticas (Auditoría del Equipo)**:
   - *Corrección 1*: La IA sugirió inicialmente `.with_for_update()` en SQLAlchemy. El equipo auditó y constató que SQLite no soporta bloqueo por fila, reemplazándolo por `PRAGMA journal_mode=WAL` + sentencia `UPDATE` condicional directa.
   - *Corrección 2*: La IA sugirió alterar el costo contable oficial descontando el valor de la cascarilla. El equipo corrigió la lógica para mantener las variables oficiales primarias intactas (\$20.000 COP/kg y 20% de margen) y segregar el subproducto como indicador circular secundario.
   - *Corrección 3*: Detección de los 3 casos de división por cero y sustitución de tipos `float` por `Decimal` para evitar decimales espurios.
