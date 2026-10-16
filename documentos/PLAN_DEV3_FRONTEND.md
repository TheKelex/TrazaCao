# PLAN TÉCNICO Y ESPECIFICACIÓN FRONTEND MVP (E04)
## Módulo: UI/UX Operador, Dashboard Administrador y Ficha QR
### Proyecto: CacaoTrace Huila / TrazaCao
### Autor: Dev 3 (Frontend & UX Lead) | Auditado por: Argon 4 (Tech Lead Reviewer)

---

## 1. OBJETIVO Y ARQUITECTURA DE VISTA
Construir una interfaz web responsiva, 100% autónoma y offline para la evaluación del reto de Agroindustria de la Hackathon DEVURITY (USCO).
El sistema resuelve los requerimientos funcionales **RF01 a RF12**, brindando:
1. **Flujo de Operador**: Recepción rápida y registro de transformaciones agroindustriales con semáforo de merma en tiempo real.
2. **Dashboard de Administrador**: Monitoreo de stock, cambio de estado preventivo con motivo obligatorio (Incidencia Hora 12) y exportación de CSV sanitizado con BOM `utf-8-sig`.
3. **Ficha Comercial QR (Pasaporte Digital)**: Consulta pública sanitizada (sin fuga de costos internos) con vista móvil simulada para prueba offline.
4. **Auditoría Inmutable**: Visualizador transparente de trazabilidad de cambios.
5. **Demo Control Bar (Barra de Control de Evaluación)**: Barra superior persistente para cambiar de rol (`OPERADOR` vs `ADMINISTRADOR`), autocompletar lote demo (`CAC001`) y probar acceso denegado (`HTTP 403`) en vivo ante el jurado.

---

## 2. BLINDAJE OFFLINE PARA EL RECINTO (OASIS PLAZA)
Con base en la auditoría de riesgos de Argon 4 para mitigar fallas en redes públicas con portales cautivos o cortes de conexión:
1. **Cero Dependencias Externas (CDN / Fuentes Web)**:
   - Eliminados enlaces externos a Google Fonts.
   - Pila tipográfica del sistema: `fontFamily: { sans: ['system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'sans-serif'] }`.
2. **Iconografía e Ilustración Nativa**:
   - Iconos SVG limpios y empaquetados mediante `lucide-react`.
   - Favicon local SVG de fruto de cacao.
3. **Generación QR Local**:
   - Renderizado vectorial SVG con `qrcode.react` en el cliente.
   - Botón **"Simular Escaneo Móvil"** que abre un contenedor responsivo (`max-w-[375px]`) simulando un smartphone, eliminando la necesidad de que el jurado conecte su teléfono a una IP local sujeta a *AP Isolation*.
4. **Lead Comercial B2B Resiliente**:
   - En lugar de forzar redirección a `wa.me` (que arroja `ERR_INTERNET_DISCONNECTED` sin internet), se abre un modal con el mensaje comercial formateado y botón **"Copiar Orden de Compra al Portapapeles"**.

---

## 3. MANEJO DE ERRORES CENTRALIZADO (`errorHandler.js`)
Para evitar pantallas en blanco causadas por errores de validación de FastAPI/Pydantic (`HTTP 422` con array de objetos) o excepciones de base de datos:
- Función `parseApiError(errorResponse, status)`:
  - Normaliza arrays de Pydantic a: `"Valor inválido en '{campo}': verifica que sea un número positivo y no esté vacío."`
  - Mapea códigos de dominio conocidos (`Stock insuficiente`, `X-Idempotency-Key`, `División por cero`, `kg_salida mayor a kg_entrada`).
  - Traduce `403 Forbidden` a: `"Acceso denegado (Rol insuficiente): Solo el Administrador puede ejecutar esta acción."`

---

## 4. WIREFRAME Y WORKSPACE UNIFICADO

```
+----------------------------------------------------------------------------------------------------+
| [TrazaCao Huila]  Lote Demo (Rivera 100kg) | Rol: [ OPERADOR / ADMIN ] | Test 403 | Reset Demo Seed  |
+----------------------------------------------------------------------------------------------------+
| Pestañas: [ 1. Recepción & Bodega ] [ 2. Transformación ] [ 3. Admin & Lotes ] [ 4. Pasaporte QR ] |
+----------------------------------------------------------------------------------------------------+
|                                                                                                    |
| CONTENIDO SEGÚN PESTAÑA:                                                                           |
|                                                                                                    |
| Pestaña 1: Formulario Recepción RF01 + Tabla de Stock en Bodega                                    |
| Pestaña 2: Calculadora en vivo RF02/RF04 (Semáforo Merma, Cascarilla Circular, Justificación)      |
| Pestaña 3: KPIs + Tabla Filtrable + Modal Bloqueo Hora 12 + Botón Exportar CSV RF11                |
| Pestaña 4: Pasaporte Digital RF06 + QR SVG + Simulador Celular 375px + Lead B2B                    |
| Pestaña 5: Tabla de Auditoría Inmutable RF10 (Quién, Cuándo, Qué, Motivo)                          |
+----------------------------------------------------------------------------------------------------+
```

---

## 5. REGLAS DE INTERACCIÓN Y VALIDACIÓN EN TIEMPO REAL
1. **Semáforo de Merma (RF04)**:
   $$\text{Merma \%} = \frac{\text{Entrada} - \text{Salida}}{\text{Entrada}} \times 100$$
   - Si $\text{Merma} \le 15.00\%$: Badge Verde "Merma Normal dentro de tolerancia agroindustrial".
   - Si $\text{Merma} > 15.00\%$: Badge Rojo intermitente "Alerta de Merma Crítica (> 15%)".
   - El botón "Guardar Transformación" permanece bloqueado si la merma supera el 15% hasta que el operador ingrese al menos 10 caracteres en la justificación de incidencia.
2. **Economía Circular (RF04)**:
   - Se calculan automáticamente los kilos de cascarilla residual ($10\%$ del peso procesado) y su valorización comercial a $\$3.000\text{ COP/kg}$, mostrando el Costo Neto de Etapa.
3. **Formateo Monetario en Vivo**:
   - Cada campo de dinero muestra una etiqueta de confirmación visual formateada con `Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' })`.
4. **Idempotencia (RF08)**:
   - Cada envío genera un `X-Idempotency-Key` único (UUIDv4) y deshabilita el botón con indicador `isSubmitting`.
5. **Sincronización de Stock Reactiva**:
   - Tras cada recepción o transformación exitosa, se refresca inmediatamente el catálogo de lotes para evitar desfases de saldos en la UI.
