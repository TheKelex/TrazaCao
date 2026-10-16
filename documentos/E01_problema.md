# E01 - COMPRENSIÓN DEL PROBLEMA Y PROPUESTA DE VALOR
## Reto: Cacao con historia, calidad y valor — Huila
### Marco Normativo: Mesa Nacional de Trazabilidad de Cacao en Colombia (MNTC)

---

### 1. Contexto de la Organización y Situación Actual
La asociación de productores cacaoteros del Huila agrupa a familias campesinas de municipios de alta vocación cacaotera (Rivera, Campoalegre y Algeciras). Actualmente, la recepción de cacao en grano seco, las etapas de transformación y la comercialización se gestionan mediante cuadernos físicos de campo, hojas de cálculo desarticuladas y mensajes de chat.

Esta dispersión impide cumplir con los lineamientos técnicos de la **Mesa Nacional de Trazabilidad de Cacao (MNTC)**:
1. **Trazabilidad hacia atrás**: Desconexión entre el lote recibido y la ficha técnica del productor y su registro de cosecha.
2. **Trazabilidad de proceso**: Falta de control formal en el centro de acopio y monitoreo ciego de las etapas de transformación (tostión, descascarillado, molienda).
3. **Trazabilidad hacia adelante**: Inexistencia de un historial de despacho confiable y verificable para el comprador final.

---

### 2. Dificultad Prioritaria y Consecuencias
- **Dificultad Prioritaria**: Pérdida de la identidad del origen del cacao y opacidad en las pérdidas por mermas agroindustriales.
- **Consecuencias**:
  1. Cacao fino de aroma del Huila se comercializa como cacao estándar, perdiendo primas de calidad de hasta un 30% a 50% en mercados especializados.
  2. Mermas no detectadas en tostión y descascarillado generan fugas financieras silenciosas para la asociación.
  3. Desconocimiento del costo unitario real y del margen de ganancia por lote.
  4. Pérdida del 100% de la merma (cascarilla), desechada como residuo en lugar de valorizarse como subproducto.

---

### 3. Objetivo del MVP y Propuesta de Valor
Desarrollar **CacaoTrace Huila**, un sistema de software ligero, resiliente y de fácil adopción que centralice los tres ejes de la MNTC:
- **Hacia atrás**: Registro auditable de lotes por productor y municipio del Huila (Rivera, Campoalegre, Algeciras).
- **En proceso**: Control de inventario en centro de acopio, cálculo automático de mermas con alertas (>15%), valorización de la cascarilla como subproducto y balance de costos/márgenes.
- **Hacia adelante**: Emisión del **Pasaporte Digital del Cacao** (Ficha Comercial Pública accesible por QR) con captación de compradores y referidos B2B, protegiendo estrictamente costos internos.

---

### 4. Alcance y Exclusiones
- **Alcance**:
  - Trazabilidad integral de tres lotes base (`CAC001`, `CAC002`, `CAC003`).
  - Transformación unitaria por lote con control estricto de existencias (recibido, consumido, disponible).
  - Cálculo de merma del 20% en CAC001 y activación de alerta automática por superar el 15%.
  - Recuperación de subproducto (cascarilla de cacao) para economía circular.
  - Generación de Ficha Comercial con QR y canal de referidos/solicitud de muestras B2B.
  - Auditoría inmutable de cambios (quién, cuándo, valor previo y nuevo).
  - Gestión de estados (Pendiente, Liberado, Bloqueado) y respuesta inmediata a la incidencia de la hora 12.
  - Exportación de resumen de lotes en formato CSV.
- **Exclusiones**:
  - Pasarelas de pago electrónico con dinero real o facturación DIAN (fuera de las 24h del reto).
  - Dispositivos de hardware o sensores IoT en fincas.
  - Modelos pesados de IA en la nube que vulneren la autonomía offline.

---

### 5. Restricciones Técnicas y Operativas
1. **Autonomía y Resiliencia Offline**: El software debe ser completamente funcional en local sin depender de internet, protegiendo la operación ante caídas de conectividad en zonas rurales del Huila o en el centro de eventos.
2. **Seguridad y Control de Acceso en Datos**: La separación entre el rol de Operador y Administrador debe validarse en la capa del backend/control de datos; ocultar elementos visuales en el cliente no es suficiente.

---

### 6. Indicadores de Beneficio del MVP
1. **Completitud de Trazabilidad MNTC**:
   - *Fórmula*: $(\text{Lotes con trazabilidad punta a punta consultable} / \text{Total lotes recibidos}) \times 100$.
   - *Meta en Piloto*: 100% de los lotes procesados cuentan con su historia reconstruible en menos de 3 segundos.
2. **Tasa de Recuperación y Alerta de Mermas**:
   - *Fórmula*: $(\text{Alertas de merma > 15\% notificadas en tiempo real} / \text{Total transformaciones con merma crítica}) \times 100$.
   - *Meta en Piloto*: 100% de detecciones instantáneas y registro de la cascarilla como subproducto comercializable.
