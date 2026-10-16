# PLAN TÉCNICO: PASAPORTE COMERCIAL DIGITAL, USABILIDAD Y PITCH (E04, E05, E06)
## Módulo: Ficha Pública QR, Blindaje Comercial, Protocolo de Usabilidad Externa y Pitch
### Proyecto: CacaoTrace Huila / TrazaCao
### Autor: Dev 4 (Comercial, Public UX & Pitch Lead) | Revisado por: Argon 4

---

## 1. PASAPORTE DIGITAL DE CACAO (FICHA QR - RF06)

### 1.1 Segregación Rigurosa de Información (Público vs Interno)
Para proteger los márgenes comerciales de la asociación y la privacidad de las familias cacaocultoras del Huila, el endpoint público `/api/pasaporte/{lote_id}` entrega exclusivamente el DTO sanitizado `PasaportePublicoResponse`:

| Campo Público Permitido | Justificación Comercial | Campo Prohibido (Excluido Físicamente) | Razón de Exclusión |
| :--- | :--- | :--- | :--- |
| `lote_id` | Identificador de trazabilidad del saco | `costo_etapa_cop` | Costos internos confidenciales |
| `productor` | Nombre del agricultor (ej. Finca La Esperanza) | `costo_unitario_cop` | Información sensible de margen |
| `origen_municipio` | Denominación de origen (Rivera, Campoalegre, Algeciras) | `precio_venta_estimado` | Negociación libre con cliente B2B |
| `departamento` | "Huila, Colombia" | `telefono_productor` | Protección de datos personales (Habeas Data) |
| `variedad` | "Cacao Fino de Aroma (Criollo / Trinitario)" | `margen_venta_porcentaje` | Margen de la asociación |
| `humedad_porcentaje` | Cumplimiento NTC 1252 ($\le 7.5\%$) | `auditoria_interna` | Registros internos del sistema |
| `fermentacion_porcentaje` | Calidad de sabor ($\ge 75\%$) | | |
| `estado` / `es_comercializable` | Garantía de no cuarentena | | |
| `sello_calidad` | Certificación NTC 1252 / Cero Deforestación | | |
| `contacto_asociacion_wa` | Canal comercial institucional oficial | | |

### 1.2 Tratamiento de Lotes en Cuarentena (Incidencia Hora 12)
Si un lote se encuentra en estado `BLOQUEADO`:
- `es_comercializable`: `false`.
- Banner rojo superior en el pasaporte: *"Lote en Retención Preventiva de Calidad - No Apto para Despacho Comercial"*.
- El botón de contacto comercial queda deshabilitado con mensaje explícito.

---

## 2. COMPONENTE OFFLINE DE CÓDIGO QR Y SIMULADOR MÓVIL
- Renderizado de QR 100% vectorial en el navegador con `qrcode.react` (`<QRCodeSVG value={url} size={180} />`).
- Botón interactivo **"Simular Escaneo en Smartphone"** que renderiza el pasaporte público en un marco CSS simulando pantalla de teléfono móvil (`375px x 667px`), permitiendo al jurado comprobar la experiencia móvil sin necesidad de encender la cámara ni depender de la red Wi-Fi de Oasis Plaza.

---

## 3. PROTOCOLO DE PRUEBA DE USABILIDAD EXTERNA (E06)
Diseñado para que una persona ajena al equipo de desarrollo (jurado evaluador o invitado externo) complete las dos tareas centrales sin entrenamiento previo:

### Tarea 1: Registro de un nuevo lote de cacao (RF01)
- **Instrucción dada al evaluador**: *"Eres un acopiador en Rivera. Ingresa un lote de 100 kg de cacao recibido de Pedro Nel con 7% de humedad y 80% de fermentación."*
- **Criterio de éxito**: Completar el formulario en menos de 45 segundos sin errores no asistidos.

### Tarea 2: Consulta del Pasaporte de Trazabilidad QR (RF06)
- **Instrucción dada al evaluador**: *"Eres un comprador de chocolate en Suiza. Verifica si el lote CAC001 cumple la norma de humedad y genera una orden de muestra."*
- **Criterio de éxito**: Localizar el lote, abrir el pasaporte y visualizar el sello NTC 1252 en menos de 20 segundos.

---

## 4. GUION CRONOMETRADO DEL PITCH DE 5 MINUTOS (E05)

| Minuto | Momento del Pitch | Mensaje Clave & Acción en Pantalla |
| :--- | :--- | :--- |
| **0:00 - 1:00** | **El Dolor del Cacao en Huila** | 3.500 familias cacaocultoras pierden hasta el 25% de su margen por mermas invisibles y falta de certificación EUDR exigida por la Unión Europea. |
| **1:00 - 2:00** | **Nuestra Solución: TrazaCao** | Monolito ágil 100% offline con Onion Architecture, precisión matemática `Decimal` y valorización circular de cascarilla ($3.000 COP/kg). |
| **2:00 - 3:30** | **Demo en Vivo (Happy Path < 90s)** | **1)** Recepción rápida en Rivera. **2)** Alerta de merma al 20% (>15%) y registro con justificación. **3)** Bloqueo preventivo de lote (Hora 12) por Administrador. **4)** Escaneo de Pasaporte Digital QR. |
| **3:30 - 4:15** | **Modelo de Negocio & Piloto** | Piloto asociativo de 30 días por **$1.200.000 COP**. Con solo detectar un 5% de merma oculta en 1 tonelada de cacao ($25M COP), el sistema se paga solo en 15 días. |
| **4:15 - 5:00** | **Cierre y Preguntas del Jurado** | Demostración de respaldo en caliente en 15 ms y exportación auditada para DIAN/INVIMA. |
