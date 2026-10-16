# ESPECIFICACIÓN DE CONTRATOS DE API (CONTRATOS_API.md)
## Filosofía SDD: Especificación Previa a la Implementación
### Proyecto: CacaoTrace Huila / TrazaCao

Todos los endpoints deben construirse en estricta conformidad con esta especificación de contratos JSON, códigos de estado HTTP y políticas de autorización.

---

## 1. ENDPOINTS DE OPERADOR (RECEPCIÓN Y TRANSFORMACIÓN)

### 1.1 Registrar Recepción de Lote (RF01, RF08)
- **Método**: `POST`
- **Ruta**: `/api/lotes`
- **Rol Requerido**: `OPERADOR` o `ADMINISTRADOR`
- **Request Body (JSON)**:
  ```json
  {
    "id": "CAC001",
    "productor": "Productor A",
    "origen": "Rivera",
    "kg_recibidos": 100.0,
    "humedad_porcentaje": 7.5,
    "fermentacion_porcentaje": 75.0
  }
  ```
- **Validaciones Pydantic**:
  - `id`: Alfanumérico, no vacío, único.
  - `kg_recibidos`: `Decimal > 0`. (Si $\le 0 \rightarrow$ `HTTP 422 Unprocessable Entity`).
  - `origen`: Debe ser uno de `["Rivera", "Campoalegre", "Algeciras"]`.
- **Respuestas**:
  - `201 Created`: Lote creado con `kg_disponibles = kg_recibidos` y `estado = "PENDIENTE"`.
  - `409 Conflict`: Si el `id` ya existe.
  - `422 Unprocessable Entity`: Datos inválidos o faltantes.

---

### 1.2 Registrar Transformación de Lote (RF02, RF04, RF08)
- **Método**: `POST`
- **Ruta**: `/api/transformaciones`
- **Rol Requerido**: `OPERADOR` o `ADMINISTRADOR`
- **Headers Obligatorios**: `X-Idempotency-Key: <UUID>` (Evita doble consumo por reenvío).
- **Request Body (JSON)**:
  ```json
  {
    "lote_id": "CAC001",
    "etapa": "Tostión y Molienda",
    "responsable": "Operador Planta 1",
    "kg_entrada": 100.0,
    "kg_salida_vendible": 80.0,
    "incidencia_justificacion": "Tostión controlada a 120°C"
  }
  ```
- **Reglas de Negocio en Backend**:
  - Validación de stock: `kg_entrada <= lote.kg_disponibles`. Si no cumple $\rightarrow$ `HTTP 422` con mensaje: *"Existencias insuficientes. Disponible: X kg"*.
  - Validación física: `kg_salida_vendible <= kg_entrada` (a menos que exista justificación explícita de adición).
  - Cálculo automático:
    $$\text{Merma} = \frac{100 - 80}{100} \times 100 = 20.00\%$$
    $$\text{Alerta} = \text{True} \quad (\text{porque } 20.0\% > 15.0\%)$$
    $$\text{Subproducto (Cascarilla)} = 100 - 80 = 20.00 \text{ kg}$$
- **Respuestas**:
  - `201 Created`: Transformación guardada, saldo del lote actualizado atómicamente, alerta generada.
  - `422 Unprocessable Entity`: Stock insuficiente o física de masa inválida.

---

## 2. ENDPOINTS DE ADMINISTRADOR (CONTROL, COSTOS, ESTADOS Y AUDITORÍA)

### 2.1 Cambiar Estado de Calidad / Bloqueo (RF09 & Incidencia Hora 12)
- **Método**: `PATCH`
- **Ruta**: `/api/admin/lotes/{lote_id}/estado`
- **Rol Requerido**: `ADMINISTRADOR` (Estrictamente controlado por backend).
- **Request Body (JSON)**:
  ```json
  {
    "nuevo_estado": "BLOQUEADO",
    "motivo": "Reporte de comprador Hora 12: humedad fuera de rango en lote CAC001"
  }
  ```
- **Reglas de Seguridad y Auditoría**:
  - Si el usuario logueado tiene rol `OPERADOR` $\rightarrow$ `HTTP 403 Forbidden` y se inserta un registro en `audit_logs` con acción `"INTENTO_NO_AUTORIZADO"`.
  - Si `nuevo_estado` es `"BLOQUEADO"`, el campo `motivo` es OBLIGATORIO (mínimo 10 caracteres no vacíos).
  - Se genera un registro inmutable en `audit_logs` con `valor_anterior`, `valor_nuevo`, `usuario`, `timestamp` y `motivo`.
- **Respuestas**:
  - `200 OK`: Estado actualizado e insertado en auditoría.
  - `403 Forbidden`: Acción denegada por permisos.
  - `422 Unprocessable Entity`: Motivo ausente o estado inválido.

---

### 2.2 Consultar Resumen Financiero y Balance de Lote (RF05, RF12)
- **Método**: `GET`
- **Ruta**: `/api/admin/lotes/{lote_id}/balance`
- **Rol Requerido**: `ADMINISTRADOR`
- **Response (JSON)**:
  ```json
  {
    "lote_id": "CAC001",
    "costo_etapa_cop": 1600000.0,
    "kg_salida_vendible": 80.0,
    "costo_unitario_cop": 20000.0,
    "precio_venta_estimado": 25000.0,
    "margen_venta_porcentaje": 20.0,
    "indicador_circular_secundario": {
      "kg_cascarilla_recuperada": 20.0,
      "valor_unitario_cascarilla_cop": 3000.0,
      "ingreso_adicional_cop": 60000.0,
      "costo_neto_ajustado_cop": 1540000.0
    },
    "supuestos_visibles": "Incluye mano de obra directa de tostión, energía, acopio y depreciación. Salida vendible base de cálculo."
  }
  ```

---

### 2.3 Exportar Resumen en CSV (RF11)
- **Método**: `GET`
- **Ruta**: `/api/admin/export/csv`
- **Parámetros Query**: `?origen=Rivera&estado=LIBERADO` (Opcionales para filtrado).
- **Respuesta**: Archivo con header `Content-Type: text/csv; charset=utf-8` y BOM `utf-8-sig` para compatibilidad con Excel.

---

## 3. ENDPOINT PÚBLICO (COMPRADOR / ESCANEO QR)

### 3.1 Consultar Pasaporte Digital del Cacao (RF06 - Ficha Pública Sanitizada)
- **Método**: `GET`
- **Ruta**: `/api/public/pasaporte/{lote_id}`
- **Autenticación**: Ninguna (Acceso público).
- **Response DTO (`PasaportePublicoResponse`)**:
  ```json
  {
    "lote_id": "CAC001",
    "origen_municipio": "Rivera, Huila",
    "productor": "Productor A",
    "variedad": "Cacao Fino de Aroma (Criollo / Trinitario)",
    "fecha_cosecha": "2026-10-15",
    "etapas_superadas": [
      {
        "etapa": "Recepción en Centro de Acopio",
        "fecha": "2026-10-15",
        "conformidad": "Aprobada (Humedad 7.5%, Fermentación 75%)"
      },
      {
        "etapa": "Tostión y Molienda",
        "fecha": "2026-10-15",
        "conformidad": "Procesado"
      }
    ],
    "estado": "LIBERADO",
    "es_comercializable": true,
    "sello_eudr": "Compatible Cero Deforestación (Huila Sostenible)",
    "contacto_comercial_wa": "https://wa.me/573000000000?text=Hola,%20solicito%20muestra%20del%20lote%20CAC001"
  }
  ```
> **REGLA ESTRICTA DE SANITIZACIÓN**:  
> Este DTO **NO contiene** los campos `costo_etapa_cop`, `costo_unitario_cop`, `margen_venta_porcentaje`, ni teléfonos personales del agricultor.
