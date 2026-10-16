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

---

## 4. ENDPOINTS PÚBLICOS DEL CATÁLOGO INDUSTRIAL & BOTÁNICO B2B (RF13)

### 4.1 Consultar Catálogo Industrial y Botánico de Mermas
- **Método**: `GET`
- **Ruta**: `/api/subproductos/catalogo-industrial`
- **Autenticación**: Ninguna (Acceso público para compradores industriales y corporativos).
- **Descripción**: Expone el residuo agroindustrial puro de la transformación del cacao: cascarilla tostada por kilo (merma sin tratar) con trazabilidad NTC 1252 y reseñas técnicas de usos potenciales para las empresas adquirentes.
- **Response DTO (`CatalogoSubproductosResponse`)**:
  ```json
  {
    "principio_negocio": "TrazaCao procesa cacao y recolecta su merma. Vendemos exclusivamente cascarilla tostada por kilo sin tratar. No producimos mascarillas ni fertilizantes. Suministramos la cascarilla como residuo puro; las reseñas indican lo que las empresas compradoras pueden elaborar con ella.",
    "total_merma_recuperada_kg": 75.00,
    "subproductos": [
      {
        "id": "SUB-COSM-01",
        "nombre": "Cascarilla Tostada de Cacao (Merma sin tratar) - Lote CAC001",
        "sector_industrial": "Industria Cosmética y Dermocosmética",
        "lote_origen_id": "CAC001",
        "municipio_origen": "Rivera, Huila",
        "kg_disponibles": 8.00,
        "precio_b2b_kg_cop": 16000.00,
        "pureza_botanica": "100% cascarilla pura en hojuela, residuo seco de tostión sin moler ni tratar",
        "humedad_porcentaje": 5.80,
        "aplicaciones_industriales": [
          "Reseña Cosmética: Tu empresa puede micronizarla en sus instalaciones para elaborar mascarillas faciales purificantes",
          "Reseña Exfoliantes: Tu empresa puede triturarla al calibre deseado para exfoliantes corporales 100% biodegradables",
          "Reseña Jabonería: Materia prima pura para que jabonerías botánicas elaboren jabones artesanales de cacao"
        ],
        "frontera_negocio": "Suministro exclusivo de cascarilla tostada por kilo sin tratar. TrazaCao no manufactura productos cosméticos; la empresa compradora los produce."
      },
      {
        "id": "SUB-AGRO-01",
        "nombre": "Cascarilla Tostada de Cacao (Merma sin tratar) - Lote CAC001",
        "sector_industrial": "Agroquímica Orgánica y Biofertilizantes",
        "lote_origen_id": "CAC001",
        "municipio_origen": "Rivera, Huila",
        "kg_disponibles": 8.00,
        "precio_b2b_kg_cop": 14500.00,
        "pureza_botanica": "100% cascarilla pura en hojuela, residuo seco de tostión sin moler ni tratar",
        "humedad_porcentaje": 6.50,
        "aplicaciones_industriales": [
          "Reseña Biofertilizantes: Tu empresa puede fermentarla para producir biofertilizantes foliares ricos en potasio",
          "Reseña Compostaje: Tu empresa puede usarla como estructurante de biomasa para compost orgánico acelerado",
          "Reseña Enmiendas: Tu empresa puede pirólizarla para generar biochar de cacao y acondicionadores de suelo"
        ],
        "frontera_negocio": "Suministro exclusivo de cascarilla tostada por kilo sin tratar. TrazaCao no manufactura fertilizantes terminados; la empresa compradora los produce."
      },
      {
        "id": "SUB-BOTA-01",
        "nombre": "Cascarilla Tostada de Cacao (Merma sin tratar) - Lote CAC001",
        "sector_industrial": "Extractos Botánicos, Fitofármacos y Nutracéutica",
        "lote_origen_id": "CAC001",
        "municipio_origen": "Rivera, Huila",
        "kg_disponibles": 4.00,
        "precio_b2b_kg_cop": 16500.00,
        "pureza_botanica": "100% cascarilla pura en hojuela, residuo seco de tostión sin moler ni tratar",
        "humedad_porcentaje": 5.20,
        "aplicaciones_industriales": [
          "Reseña Extractos: Tu laboratorio puede realizar extracción hidroalcohólica de polifenoles y flavonoides",
          "Reseña Fitofármacos: Tu empresa biotecnológica puede aislar teobromina natural de pureza farmacéutica",
          "Reseña Bebidas: Tu empresa puede empacarla para tisanas e infusiones funcionales de cascarilla de cacao"
        ],
        "frontera_negocio": "Suministro exclusivo de cascarilla tostada por kilo sin tratar. TrazaCao no manufactura suplementos ni infusiones; la empresa compradora los produce."
      }
    ]
  }
  ```

---

### 4.2 Radicar Solicitud de Cotización de Materia Prima B2B
- **Método**: `POST`
- **Ruta**: `/api/subproductos/solicitar-cotizacion-b2b`
- **Autenticación**: Ninguna (Acceso comercial público).
- **Request Body (JSON)**:
  ```json
  {
    "subproducto_id": "SUB-COSM-01",
    "lote_origen_id": "CAC001",
    "empresa_solicitante": "BioCosmética Andina S.A.",
    "sector_industrial": "Cosmética Natural",
    "correo_corporativo": "compras@biocosmetica.com",
    "telefono_contacto": "+57 312 987 6543",
    "volumen_requerido_kg": 500.0,
    "aplicacion_prevista": "Formulación de mascarillas exfoliantes de cacao fino de aroma"
  }
  ```
- **Respuestas**:
  - `201 Created`: Solicitud radicada con folio inmutable `COT-B2B-XXXXXXXX` y guardada en auditoría.
  - `422 Unprocessable Entity`: Datos obligatorios faltantes o volumen $\le 0$.

