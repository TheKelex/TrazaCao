# E02 - ESPECIFICACIÓN DE REQUISITOS Y GESTIÓN DEL CAMBIO
## Reto: Cacao con historia, calidad y valor — Huila

### 1. Historias de Usuario (RF01 - RF12)

#### HU-01: Recepción de Lotes de Cacao (RF01)
- **Rol**: Operador
- **Necesidad**: Registrar el ingreso de un lote de cacao seco entregado por un productor.
- **Beneficio**: Formalizar la entrada de materia prima con identificador único y origen claro.
- **Prioridad**: Alta (Crítica)
- **Criterio de Aceptación (Gherkin)**:
  - *Dado* que el operador ingresa un ID único (ej. `CAC001`), productor ("Productor A"), origen ("Rivera"), fecha y cantidad mayor a 0 kg,
  - *Cuando* confirma el registro,
  - *Entonces* el sistema almacena el lote con saldo disponible igual a la cantidad recibida y estado inicial `PENDIENTE`.
  - *Pero si* ingresa una cantidad $\le 0$ o campos vacíos, el sistema rechaza la operación con un mensaje explicativo y no crea registros parciales.

#### HU-02: Transformación y Vinculación de Lote (RF02)
- **Rol**: Operador
- **Necesidad**: Registrar una etapa de transformación sobre un lote existente.
- **Beneficio**: Medir la producción obtenida y mantener la trazabilidad del lote origen.
- **Prioridad**: Alta (Crítica)
- **Criterio de Aceptación (Gherkin)**:
  - *Dado* un lote con existencia disponible,
  - *Cuando* el operador registra la etapa (ej. "Tostión y Molienda"), responsable, fecha, cantidad de entrada y cantidad de salida vendible,
  - *Entonces* el sistema descuenta la entrada del saldo disponible del lote original, calcula la merma y genera el registro de salida vinculado.

#### HU-03: Consulta de Trazabilidad Integral (RF03)
- **Rol**: Administrador / Comprador
- **Necesidad**: Consultar la línea de vida completa de un producto.
- **Beneficio**: Demostrar el origen auténtico y las etapas superadas desde la finca hasta el empaque.
- **Prioridad**: Alta
- **Criterio de Aceptación (Gherkin)**:
  - *Dado* el identificador de un lote o producto terminado,
  - *Cuando* el usuario consulta la trazabilidad,
  - *Entonces* el sistema muestra la secuencia cronológica: productor, municipio de origen, fecha de acopio, etapas de transformación, mermas y estado actual en menos de 3 segundos.

#### HU-04: Detección y Alerta de Mermas Excesivas (RF04)
- **Rol**: Administrador
- **Necesidad**: Recibir una alerta automática si la merma de una etapa supera el límite tolerado.
- **Beneficio**: Tomar decisiones operativas inmediatas para corregir fallas en tostión o descarte.
- **Prioridad**: Alta
- **Criterio de Aceptación (Gherkin)**:
  - *Dado* una transformación con entrada de 100 kg y salida de 80 kg ($\text{Merma} = 20\%$),
  - *Cuando* se guarda la operación,
  - *Entonces* como $20\% > 15\%$, el sistema genera una alerta visible explicando: "Merma del 20.0% supera el umbral máximo tolerado del 15.0%".

#### HU-05: Cálculo de Indicadores Económicos (RF05)
- **Rol**: Administrador
- **Necesidad**: Conocer el costo unitario de producción y el margen estimado sobre la venta.
- **Beneficio**: Fijar precios rentables y evaluar la sostenibilidad de cada lote.
- **Prioridad**: Media-Alta
- **Criterio de Aceptación (Gherkin)**:
  - *Dado* un costo de etapa de \$1.600.000 COP y salida de 80 kg, con precio de venta de \$25.000 COP/kg,
  - *Cuando* el administrador consulta los costos del lote,
  - *Entonces* el sistema calcula y muestra: Costo Unitario = \$20.000 COP/kg y Margen sobre Venta = 20.0%, haciendo visibles las fórmulas y supuestos.

#### HU-06: Consulta de Ficha Comercial Pública (RF06)
- **Rol**: Comprador
- **Necesidad**: Escanear un código QR o abrir un enlace del producto para conocer su procedencia y atributos.
- **Beneficio**: Garantizar autenticidad del cacao fino de aroma sin revelar información confidencial.
- **Prioridad**: Alta
- **Criterio de Aceptación (Gherkin)**:
  - *Dado* un enlace o QR de un producto liberado,
  - *Cuando* el comprador accede a la vista pública,
  - *Entonces* observa origen (municipio, finca/productor), perfil y estado, pero la vista oculta estrictamente costos internos, márgenes y datos sensibles.

#### HU-07: Persistencia y Recuperación de Datos (RF07)
- **Rol**: Administrador / Sistema
- **Necesidad**: Garantizar que los registros se mantengan intactos tras apagar o reiniciar la aplicación.
- **Beneficio**: Continuidad de negocio y confiabilidad de los datos.
- **Prioridad**: Crítica
- **Criterio de Aceptación (Gherkin)**:
  - *Dado* un conjunto de lotes y transformaciones registrados,
  - *Cuando* el servidor se detiene y reinicia,
  - *Entonces* todos los registros se cargan con integridad exacta sin pérdidas ni duplicaciones.

#### HU-08: Control de Existencias y Prevención de Doble Consumo (RF08)
- **Rol**: Operador / Administrador
- **Necesidad**: Impedir consumos que excedan el inventario disponible y rechazar reenvíos duplicados.
- **Beneficio**: Evitar descuadres de inventario físico y transacciones inconsistentes.
- **Prioridad**: Crítica
- **Criterio de Aceptación (Gherkin)**:
  - *Dado* un lote con 100 kg disponibles,
  - *Cuando* un usuario solicita transformar 120 kg,
  - *Entonces* el sistema rechaza la operación, mantiene los 100 kg intactos y retorna error de saldo insuficiente.
  - *Además*, ante un reenvío duplicado accidental de la misma petición, el sistema aplica control de idempotencia para no duplicar el descuento.

#### HU-09: Gestión de Estados y Control de Liberación (RF09)
- **Rol**: Administrador
- **Necesidad**: Liberar o bloquear lotes con justificación obligatoria.
- **Beneficio**: Control de calidad estricto antes de ofrecer el cacao a clientes.
- **Prioridad**: Alta
- **Criterio de Aceptación (Gherkin)**:
  - *Dado* un lote en estado `PENDIENTE`,
  - *Cuando* el administrador lo cambia a `LIBERADO` o `BLOQUEADO` e ingresa un motivo,
  - *Entonces* el sistema actualiza el estado. Si un operador intenta cambiar el estado, el sistema deniega el acceso con error 403 Forbidden.

#### HU-10: Registro de Auditoría Mínima Inmutable (RF10)
- **Rol**: Administrador
- **Necesidad**: Consultar la bitácora de quién, cuándo y qué se modificó en el sistema.
- **Beneficio**: Transparencia y cumplimiento normativo.
- **Prioridad**: Media-Alta
- **Criterio de Aceptación (Gherkin)**:
  - *Dado* cualquier cambio en cantidades, transformación o estado de lote,
  - *Cuando* se realiza la acción,
  - *Entonces* el sistema inserta un registro inmutable con usuario, timestamp, acción, valor anterior y valor nuevo, sin permitir edición ni borrado de auditoría.

#### HU-11: Consulta y Exportación en Formato CSV (RF11)
- **Rol**: Administrador
- **Necesidad**: Filtrar lotes por origen o estado y descargar un archivo CSV.
- **Beneficio**: Facilitar la conciliación contable y reportes a la junta directiva.
- **Prioridad**: Media
- **Criterio de Aceptación (Gherkin)**:
  - *Dado* el listado de lotes en el panel de administración,
  - *Cuando* se aplica un filtro y se presiona "Exportar CSV",
  - *Entonces* se genera un archivo descargable con columnas: Identificador, Origen, Recibido, Disponible, Estado y Costo.

#### HU-12: Balance Económico Completo y Protección Matemática (RF12)
- **Rol**: Administrador
- **Necesidad**: Asegurar que las divisiones por cero en cálculos de costos y márgenes sean neutralizadas.
- **Beneficio**: Robustez del sistema ante datos extremos o lotes con salida nula.
- **Prioridad**: Alta
- **Criterio de Aceptación (Gherkin)**:
  - *Dado* un lote con salida vendible = 0 kg o precio estimado = 0,
  - *Cuando* se calculan los costos,
  - *Entonces* el sistema maneja la excepción devolviendo valores controlados (0 o no aplicable) con explicación visible de los rubros incluidos.

#### HU-13: Catálogo Industrial y Botánico B2B de Mermas y Biomasa (RF13)
- **Rol**: Comprador Corporativo B2B (Laboratorios Cosméticos / Agroquímica / Nutracéutica) / Administrador Comercial
- **Necesidad**: Consultar fichas técnicas botánicas y cotizar volúmenes de merma agroindustrial estandarizada (cascarilla micronizada, biomasa rica en potasio y extractos) provenientes de la transformación del cacao.
- **Beneficio**: Monetización del 100% de la biomasa residual sin dispersión operativa. TrazaCao se mantiene enfocado exclusivamente en el tratamiento del cacao y no compite con sus clientes fabricando productos finales (no comercializamos mascarillas terminadas ni fertilizantes embotellados).
- **Prioridad**: Alta (Diferenciador Estratégico)
- **Criterio de Aceptación (Gherkin)**:
  - *Dado* que se registran transformaciones en centros de beneficio que generan merma (ej. 20 kg en CAC001),
  - *Cuando* un comprador corporativo o directivo consulta el endpoint `GET /api/subproductos/catalogo-industrial` o la pestaña pública del catálogo,
  - *Entonces* el sistema presenta las líneas de materias primas categorizadas (Cosmética, Biofertilizantes, Botánica) con sus especificaciones de pureza vegetal, humedad, aplicaciones sugeridas y precio base B2B.
  - *Y además* el sistema expone explícitamente el deslinde de responsabilidad: *"TrazaCao se enfoca exclusivamente en el tratamiento y transformación del cacao; suministramos la materia prima vegetal certificada y no elaboramos bienes de consumo masivo terminados"*.
  - *Cuando* el comprador radica una solicitud de cotización vía `POST /api/subproductos/solicitar-cotizacion-b2b`, el sistema genera un folio inmutable de seguimiento y registra el evento en auditoría.

---

### 2. Tarjetas de Gestión de Cambio (Change Requests)

#### CR-H12-BLOQUEO-CAC001: Incidencia de Calidad y Bloqueo Preventivo
| Campo | Detalle de la Incidencia |
| :--- | :--- |
| **ID de Cambio** | `CR-H12-BLOQUEO-CAC001` |
| **Origen del Incidente** | Reporte de comprador externo sobre defecto de calidad en lote `CAC001` (humedad y olor no conforme). |
| **Impacto Operativo** | Riesgo de comercialización de producto no conforme. Se requiere congelamiento preventivo inmediato. |
| **Acción Realizada** | 1. Administrador invoca `POST /api/lotes/CAC001/estado` con estado `BLOQUEADO` y motivo `"Reporte de humedad no conforme por comprador"`.<br>2. Verificación de que la Ficha Pública cambie a estado NO DISPONIBLE.<br>3. Auditoría conserva el historial completo sin borrar registros previos. |
| **Criterio de Regresión** | Ejecución de prueba automatizada `test_bloqueo_cac001_y_ficha_publica()` garantizando que la ficha comercial no ofrezca el producto y que los lotes `CAC002` y `CAC003` sigan operando normalmente. |

#### CR-H14-VALORIZACION-MERMA-CATALOGO-BOTANICO-B2B: Modelo de Venta Industrial de Residuos
| Campo | Detalle de la Incidencia |
| :--- | :--- |
| **ID de Cambio** | `CR-H14-VALORIZACION-MERMA-CATALOGO-BOTANICO-B2B` |
| **Origen del Requerimiento** | Clarificación estratégica del modelo de negocio: el aprovechamiento de la merma no es contable ni de consumo masivo, sino una oferta comercial B2B para industrias de cosméticos y fertilizantes. |
| **Impacto Operativo** | Creación del Catálogo Industrial & Botánico B2B. Deslinde estricto de la frontera del negocio: TrazaCao solo procesa cacao y vende materia prima a gran escala, sin elaborar productos de consumo final (ni mascarillas ni fertilizantes terminados). |
| **Acción Realizada** | 1. Extensión del dominio Onion (`clasificar_merma_destinos_industriales`).<br>2. Creación del router `/api/subproductos` con endpoints de catálogo y radicación de cotizaciones B2B.<br>3. Adaptación visual en el frontend con selector de pestañas (Granos vs Catálogo Botánico B2B) y modal de cotización.<br>4. Incorporación del deslinde operativo explícito en UI y DTOs. |
| **Criterio de Regresión** | Ejecución de la suite `tests/test_subproductos_catalogo.py` asegurando 100% de pase en endpoints B2B, integridad del inventario de biomasa y confirmación del principio de no manufactura de bienes finales. |

