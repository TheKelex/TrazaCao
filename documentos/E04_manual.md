# E04: MANUAL DE USUARIO Y GUÍA DE DEMOSTRACIÓN DEL MVP (25 PTS)
## Proyecto: CacaoTrace Huila / TrazaCao
### Sistema de Trazabilidad Agroindustrial, Gestión de Mermas y Pasaporte Digital

---

## 1. INTRODUCCIÓN Y ARQUITECTURA GENERAL
**TrazaCao Huila** es una plataforma de trazabilidad agroindustrial construida bajo **Onion Architecture** y diseñada específicamente para operar con integridad **100% offline** en acopios rurales del Huila (Rivera, Campoalegre, Algeciras) y centros de evaluación como Oasis Plaza.

### Componentes del Sistema:
- **Backend Core**: FastAPI (Python 3.13) con motor aritmético puro en `Decimal` (`calculos.py`), SQLite en modo `WAL` (`PRAGMA busy_timeout=5000`) y triggers nativos de inmutabilidad en `audit_logs`.
- **Frontend SPA**: React 19 + Vite + Tailwind CSS con renderizado SVG nativo de códigos QR (`qrcode.react`), normalizador de errores contra pantallas en blanco (`parseApiError`), y previsualizador de interfaz móvil integrada (375px).

---

## 2. GUÍA DE INSTALACIÓN Y ARRANQUE RÁPIDO

### Requisitos Previos:
- Python 3.10 o superior (con `pip`).
- Node.js v18 o superior (con `npm`).
- Sistema Operativo: Windows, Linux o macOS.

### Arranque con un solo comando (Windows):
En la raíz del proyecto, ejecuta el archivo batch oficial:
```cmd
start.bat
```
O desde PowerShell:
```powershell
.\start.ps1
```

### Arranque Manual por Terminales:

#### Terminal 1 - Backend FastAPI:
```powershell
# 1. Sembrar base de datos con lotes canónicos
python src/backend/seed.py

# 2. Iniciar servidor local
python -m uvicorn src.backend.main:app --host 127.0.0.1 --port 8000 --reload
```
- API Docs interactiva: `http://127.0.0.1:8000/docs`

#### Terminal 2 - Frontend Web:
```powershell
npm install --prefix src/frontend
npm run dev --prefix src/frontend
```
- Aplicación Web: `http://127.0.0.1:5173`

---

## 3. GUÍA DE DEMOSTRACIÓN VERTICAL "HAPPY PATH" (< 120 SEGUNDOS)
Diseñada para que el jurado evaluador o un usuario externo verifique la totalidad de los requerimientos funcionales en menos de 2 minutos sin asistencia técnica:

```
+--------------------------------------------------------------------------------------------------+
| 0:00 - 0:25  | PASO 1: Recepción de Grano en Rivera (RF01, RF08)                                 |
| 0:25 - 0:55  | PASO 2: Transformación, Semáforo de Merma (20%) y Cascarilla Circular (RF02, RF04)|
| 0:55 - 1:15  | PASO 3: Gestión de Calidad, Bloqueo Hora 12 y Prueba RBAC 403 (RF09)             |
| 1:15 - 1:35  | PASO 4: Auditoría Inmutable (RF10) y Exportación CSV Sanitizado (RF11)            |
| 1:35 - 1:55  | PASO 5: Pasaporte Digital QR Sanitizado y Lead Comercial B2B (RF06)              |
| 1:55 - 2:05  | PASO 6: Respaldo Atómico en Caliente en 15 ms (RF07)                              |
+--------------------------------------------------------------------------------------------------+
```

### Paso a Paso Detallado:

### PASO 1: Recepción y Acopio de Lote (RF01)
1. En la barra superior, confirma que el rol activo es **Operador**.
2. Haz clic en la pestaña **"1. Recepción & Acopio"**.
3. Diligencia los campos:
   - **Lote**: `CAC004`
   - **Municipio**: `Rivera`
   - **Productor**: `Finca El Diamante`
   - **Kilos Recibidos**: `120.00`
   - **Humedad**: `7.00%` (el sistema valida en verde: *Cumple NTC 1252 ≤ 7.5%*)
   - **Fermentación**: `82.00%` (valida en verde: *Excelente Sabor ≥ 75%*)
   - **Precio Compra**: `$ 15.000` COP/kg (muestra etiqueta formateada `$ 15.000 COP`).
4. Presiona **"Registrar Recepción de Lote (RF01)"**.
5. **Resultado Visible**: El lote aparece de inmediato en la tabla lateral derecha con 120.00 kg disponibles en bodega.

---

### PASO 2: Transformación, Alerta de Merma > 15% y Economía Circular (RF02, RF04, RF08)
1. Pasa a la pestaña **"2. Transformación & Merma"** (o presiona el botón rápido *"Autocompletar Lote Demo"* en la barra superior).
2. Selecciona el lote `CAC001` (Rivera, 100 kg disponibles).
3. Ingresa:
   - **Entrada**: `100.00` kg
   - **Salida Vendible**: `80.00` kg
   - **Costo Total Etapa**: `$ 1.600.000,00` COP
   - **Precio Venta Estimado**: `$ 25.000,00` COP/kg
4. **Verificación en Vivo del Semáforo**:
   - El semáforo cambia instantáneamente a **ROJO (20.00% > 15.00%)**.
   - El botón de guardado se **deshabilita** y aparece un recuadro rojo pulsante: *"Justificación de Incidencia (Obligatorio por merma > 15%)"*.
5. Escribe en la justificación:
   `"Exceso de lluvias en Rivera prolongó el secado técnico."`
6. Observa la tarjeta de **Economía Circular**:
   - Cascarilla recuperada (10%): `10.00 kg`.
   - Ingreso adicional ($3.000 COP/kg): `$ 30.000,00 COP`.
   - Costo neto recalculado: `$ 1.570.000,00 COP`.
7. Presiona **"Guardar Transformación y Descontar Stock"**.
8. **Resultado Visible**: Se genera la cabecera `X-Idempotency-Key`, el stock en bodega de CAC001 baja atómicamente a `0.00 kg`, y se muestra confirmación de costos sin recargar la pantalla.

---

### PASO 3: Control de Calidad, Bloqueo Preventivo Hora 12 y Prueba RBAC 403 (RF09)
1. **Demostración de Rechazo RBAC (Prueba a Ciegas del Jurado)**:
   - Con el rol **Operador** activo, haz clic en el botón superior **"Probar Acceso Denegado (Test 403)"**.
   - Se abre un modal limpio informando: *"HTTP 403 Forbidden - Acceso denegado (Rol insuficiente): Solo el Administrador puede ejecutar esta acción"*.
   - Esto demuestra que la seguridad está aplicada en el backend y no solo en la interfaz.
2. **Cambio de Rol y Gestión de Calidad**:
   - En la barra superior, cambia al rol **Admin**.
   - Accede a la pestaña **"3. Admin & Control Calidad"**.
   - En la fila del lote `CAC001`, presiona el botón **"Bloquear"**.
   - Se despliega el modal de la **Incidencia Hora 12**:
     - Motivo: `"Retención preventiva por sospecha de lote no conforme"`.
     - Presiona **"Confirmar BLOQUEADO"**.
3. **Resultado Visible**: El lote pasa al estado `BLOQUEADO`, el KPI de cuarentena se incrementa a 1 y queda registrado en la bitácora de auditoría.

---

### PASO 4: Auditoría Inmutable (RF10) y Exportación CSV (RF11)
1. Ve a la pestaña **"5. Auditoría Inmutable"**.
2. Observa la fila generada automáticamente con la acción `BLOQUEO_LOTE`, el usuario `Dirección Técnica (Asociación Huila)`, el lote `CAC001`, y los valores previo y nuevo.
3. Regresa a la pestaña **"3. Admin & Control Calidad"** y presiona **"Exportar CSV (BOM utf-8-sig)"**.
4. Se descarga el archivo `CacaoTrace_Huila_Lotes_YYYY-MM-DD.csv`. Al abrirlo en Excel:
   - Los caracteres con tildes y eñes se muestran legibles gracias al BOM UTF-8.
   - Los números usan comas decimales colombianas (ej. `100,00`).
   - Las celdas están sanitizadas contra inyección de fórmulas (`'`, `@`, `=`, `+`, `-`).

---

### PASO 5: Pasaporte Digital de Cacao QR y Lead B2B (RF06)
1. Dirígete a la pestaña **"4. Pasaporte Digital QR"**.
2. Selecciona el lote `CAC001`.
3. Observa que aparece el banner de retención: *"LOTE EN RETENCIÓN PREVENTIVA DE CALIDAD (NO APTO PARA EXPORTACIÓN)"*.
4. Selecciona el lote `CAC002` o `CAC003` (Liberados).
5. Observa el código QR vectorial en SVG (`qrcode.react`), el sello de calidad NTC 1252 / Compatible EUDR, y la segregación estricta de información: **no existe ningún campo de costo ni margen**.
6. Presiona el botón **"Simular Escaneo QR (Móvil)"**:
   - La pantalla se encuadra en un marco de smartphone (375px), demostrando cómo un comprador en Europa ve el producto desde su celular sin depender de la red Wi-Fi de Oasis Plaza.
7. Presiona **"Solicitar Muestra o Cotización B2B"** y luego **"Copiar Orden (Modo Offline)"**:
   - Se copia el mensaje institucional formateado al portapapeles sin intentar abrir URLs caídas si la laptop está desconectada de internet.

---

### PASO 6: Demostración de Respaldo y Restauración en Caliente (RF07)
Abre una terminal y ejecuta:
```powershell
python datos/backup.py
```
- **Evidencia**: Respaldo completado e integridad verificada en **15.68 ms** (muy inferior al límite de 2000 ms).
```powershell
python datos/restore.py
```
- **Evidencia**: Restauración y verificación de integridad en **18.19 ms**.
