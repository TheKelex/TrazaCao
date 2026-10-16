# E03 - DISEÑO DEL PRODUCTO Y DE LA SOLUCIÓN
## Reto: Cacao con historia, calidad y valor — Huila

---

## 1. Flujo Integral de Usuario (Happy Path del Jurado)

```mermaid
sequenceDiagram
    autonumber
    actor OP as Operador (Planta)
    actor ADM as Administrador
    actor COMP as Comprador (Público)
    participant BE as Backend FastAPI
    participant DB as SQLite DB

    Note over OP,BE: 1. Recepción (RF01, RF08)
    OP->>BE: POST /api/lotes (CAC001, Productor A, Rivera, 100 kg)
    BE->>DB: INSERT INTO Lote (disp=100kg, estado='PENDIENTE')
    BE-->>OP: 201 Created (Lote registrado)

    Note over OP,BE: 2. Transformación & Merma (RF02, RF04)
    OP->>BE: POST /api/transformaciones (CAC001, entrada=100kg, salida=80kg)
    BE->>BE: Validar stock (disp >= 100) & Calcular merma: (100-80)/100 = 20%
    BE->>BE: Disparar alerta (merma 20% > 15%)
    BE->>DB: Descontar stock (disp=0kg), guardar transformación y registrar alerta
    BE-->>OP: 200 OK (Alerta generada y vinculada)

    Note over ADM,BE: 3. Análisis Económico & Liberación (RF05, RF09, RF12)
    ADM->>BE: GET /api/lotes/CAC001/costos
    BE-->>ADM: Costo unitario ($20.000/kg) y Margen venta (20%)
    ADM->>BE: PATCH /api/lotes/CAC001/estado (estado='LIBERADO', motivo='Lote conforme')
    BE->>DB: UPDATE estado='LIBERADO' & INSERT INTO Auditoria
    BE-->>ADM: 200 OK (Lote liberado y auditado)

    Note over COMP,BE: 4. Ficha Comercial QR & CRM Referidos (RF06)
    COMP->>BE: GET /api/public/lotes/CAC001 (Vía Escaneo QR)
    BE-->>COMP: 200 OK (Origen, historia, estado LIBERADO. Costos internos OCULTOS)
    COMP->>BE: POST /api/public/leads (Interés de compra, ref='COMPRADOR_01')
    BE-->>COMP: 201 Created (Muestra solicitada con código de descuento)
```

---

## 2. Diagrama de Arquitectura de Componentes

```mermaid
flowchart TB
    subgraph UI["Capa de Presentación (Frontend Responsive Vite + React)"]
        V_OP["Vista Operador\n(Mobile-First: Recepción y Transformación)"]
        V_ADM["Dashboard Administrador\n(Inventario, Alertas, Costos, Auditoría, CSV)"]
        V_PUB["Ficha Comercial Pública\n(Pasaporte Digital QR + Referidos B2B)"]
    end

    subgraph API["Capa de Servicios y Control de Acceso (Backend FastAPI)"]
        GUARD["Middleware RBAC / Auth Guard\n(Valida rol Operador vs Admin)"]
        R_LOTES["Router Lotes & Stock (RF01, RF08)"]
        R_TRANS["Router Transformación & Mermas (RF02, RF04)"]
        R_FINAN["Servicio Económico & Márgenes (RF05, RF12)"]
        R_AUDIT["Servicio Auditoría Inmutable (RF10)"]
        R_PUB["Router Consulta Pública Sanitizada (RF06)"]
        R_EXP["Router Exportación CSV (RF11)"]
    end

    subgraph DATA["Capa de Persistencia y Recuperación (Local SQLite)"]
        DB_ENGINE[("Motor SQLite 3 (proud_cacao.db)")]
        BACKUP_TOOL["Script backup.py / restore.py"]
    end

    UI --> GUARD
    GUARD --> R_LOTES
    GUARD --> R_TRANS
    GUARD --> R_FINAN
    GUARD --> R_AUDIT
    V_PUB --> R_PUB
    GUARD --> R_EXP

    R_LOTES --> DB_ENGINE
    R_TRANS --> DB_ENGINE
    R_FINAN --> DB_ENGINE
    R_AUDIT --> DB_ENGINE
    R_PUB --> DB_ENGINE
    R_EXP --> DB_ENGINE
    DB_ENGINE <--> BACKUP_TOOL
```

---

## 3. Modelo de Datos y Esquema Relacional

```mermaid
erDiagram
    LOTE {
        string id PK "ej. CAC001"
        string productor "Productor A"
        string origen "Rivera, Huila"
        date fecha_recepcion
        float cantidad_recibida "100.0 kg (> 0)"
        float cantidad_disponible "Saldo restante (>= 0)"
        string estado "PENDIENTE | LIBERADO | BLOQUEADO"
        string motivo_bloqueo
        datetime created_at
    }

    TRANSFORMACION {
        string id PK "UUID"
        string lote_id FK
        string etapa "Tostión y Molienda"
        string responsable
        date fecha
        float cantidad_entrada "kg consumidos"
        float cantidad_salida "kg vendibles"
        float cantidad_subproducto "kg cascarilla recuperada"
        float merma_porcentaje
        boolean alerta_merma "True si > 15%"
        string incidencia_justificacion
        float costo_etapa_cop
        float costo_unitario_cop
        float precio_venta_estimado
        float margen_venta_porcentaje
        datetime created_at
    }

    AUDITORIA {
        int id PK
        string usuario
        string entidad_afectada
        string id_entidad
        string accion "CREAR | TRANSFORMAR | BLOQUEAR | LIBERAR"
        string valor_anterior
        string valor_nuevo
        string motivo
        datetime timestamp
    }

    LEAD_COMERCIAL {
        int id PK
        string lote_id FK
        string nombre_comprador
        string contacto
        string codigo_referido
        datetime created_at
    }

    LOTE ||--o{ TRANSFORMACION : "origina"
    LOTE ||--o{ AUDITORIA : "registra cambios"
    LOTE ||--o{ LEAD_COMERCIAL : "recibe interés"
```

---

## 4. Control de Acceso, Reglas de Negocio y Seguridad
- **Aplicación estricta en Backend**: El backend intercepta todas las peticiones a través de dependencias de seguridad FastAPI (`get_current_role`).
- **Separación de Privilegios**:
  - `OPERADOR`: Autorizado para `POST /api/lotes` y `POST /api/transformaciones`. Si intenta ejecutar `PATCH /api/lotes/{id}/estado`, el backend retorna un código HTTP `403 Forbidden` inmediato.
  - `ADMINISTRADOR`: Autorizado para liberar/bloquear lotes, consultar auditoría, costos internos y exportar CSV.
  - `COMPRADOR (Público)`: El endpoint `/api/public/lotes/{id}` utiliza un esquema Pydantic sanitizado (`LotePublicoSchema`) que **omite deliberadamente** los campos `costo_etapa_cop`, `costo_unitario_cop`, `precio_venta_estimado`, `margen_venta_porcentaje` y datos de contacto privado del productor.
- **Regla de Existencias Atómica (RF08)**: 
  Toda transformación se ejecuta bajo transacción de base de datos (`BEGIN IMMEDIATE`). Si `cantidad_disponible < cantidad_entrada`, la transacción se aborta con HTTP `422 Unprocessable Entity` y el saldo permanece inalterado.

---

## 5. Decisiones Técnicas de Arquitectura (ADR - Architecture Decision Records)

### ADR-01: Monolito Modular con Patrón Onion Architecture para Aislamiento del Dominio
- **Contexto**: El reto exige resolver un flujo vertical integrado en 24 horas, garantizando que las reglas de negocio (cálculo de merma del 20%, costo unitario de $20.000 COP/kg, alertas > 15% y control de existencias) se apliquen estrictamente en el backend y no en la interfaz, además de someterse a pruebas automatizadas independientes.
- **Decisión**: Implementar un **Monolito Modular** a nivel de empaquetado y despliegue, estructurando internamente el código bajo el patrón concéntrico **Onion Architecture**. El núcleo de dominio (`domain/`) contiene las entidades puras y las reglas matemáticas del cacao sin ninguna dependencia de frameworks web (FastAPI) ni de persistencia (SQLAlchemy/SQLite). Los servicios de aplicación (`services/`) orquestan los casos de uso, y la infraestructura (`routers/`, `infra/`) se mantiene en la capa exterior.
- **Alternativas Descartadas**:
  1. *Microservicios*: Descartado por complejidad operativa, latencia de red innecesaria y alto riesgo de fallo por conectividad o puertos en el evento de 24 horas.
  2. *Monolito Tradicional Acoplado (Active Record / MVC monolítico)*: Descartado porque mezcla la lógica de cálculo con las llamadas a la base de datos, dificultando pruebas unitarias limpias y aumentando el riesgo de efectos secundarios ante cambios.
- **Limitaciones y Trade-offs Asumidos**: Requiere disciplina de importación en Python (el dominio nunca debe importar módulos de FastAPI o SQLAlchemy). A cambio, permite ejecutar pruebas unitarias del dominio en microsegundos sin necesidad de levantar bases de datos ni servidores.

### ADR-02: SQLite Embebido vs. Servidor PostgreSQL Autónomo
- **Contexto**: El sistema debe ejecutarse de forma limpia y reproducible en local, resistir caídas de conexión a internet del recinto ferial y superar la prueba oficial de respaldo/restauración (criterio de desempate en la evaluación).
- **Decisión**: Utilizar el motor **SQLite 3 nativo** mediante transacciones atómicas (`BEGIN IMMEDIATE` y restricción `CHECK(cantidad_disponible >= 0)`).
- **Alternativas Descartadas**: PostgreSQL o MySQL en contenedores Docker. Introducían sobrecarga de memoria, riesgo de puertos bloqueados en máquinas ajenas y complejidad de scripting para la restauración en vivo.
- **Limitaciones y Trade-offs Asumidos**: Concurrencia de escritura limitada. Para la escala del caso (3 lotes, 2 operadores y consultas de compradores concurrentes en modo lectura), SQLite soporta más de 1.000 lecturas/segundo y tiempos de consulta < 25 ms, cumpliendo con creces la meta de < 3 segundos del reto.

### ADR-03: FastAPI con Validación Pydantic vs. Frameworks Dinámicos
- **Contexto**: La especificación del reto prohíbe guardar datos inválidos (cantidades negativas, campos obligatorios vacíos o división por cero) y exige respuestas de error comprensibles.
- **Decisión**: Emplear **FastAPI con esquemas Pydantic**, garantizando validación estricta de tipos en tiempo de compilación/ejecución y generando documentación OpenAPI interactiva en `/docs` para la inspección directa del jurado.
- **Alternativas Descartadas**: Express.js o Flask sin tipado fuerte, donde la validación manual de cada campo aumenta la probabilidad de omitir casos borde en 24 horas.
- **Limitaciones y Trade-offs Asumidos**: Requiere entorno Python 3.10+, el cual está estandarizado en la documentación de instalación limpia.

---

## 6. Esquema Breve de Pantallas (UI Layouts)

1. **Pantalla Operador (Móvil)**:
   - Encabezado: "CacaoTrace Huila - Registro Operativo".
   - Botón 1: "Recepción de Grano" (Campos: ID Lote, Productor, Municipio, Kg).
   - Botón 2: "Transformación" (Selector de Lote, Kg Entrada, Kg Salida, Subproducto Cascarilla). Al ingresar valores, previsualiza la merma en tiempo real.
2. **Dashboard Administrador (Desktop)**:
   - Tarjetas KPI: Lotes Activos, Kg Disponibles en Bodega, Alertas Activas (Semáforo rojo).
   - Tabla de Lotes con Badge de Estado (`PENDIENTE`, `LIBERADO`, `BLOQUEADO`).
   - Botón "Exportar Resumen CSV" y Botón "Historial de Auditoría".
3. **Ficha Pública Comprador (Mobile-First / QR)**:
   - Imagen de Cacao Fino del Huila, Origen verificado (Rivera), Municipio, Notas sensoriales.
   - Estado: "Certificado y Liberado" (o alerta en rojo si está Bloqueado).
   - Botón "Solicitar Muestra / Código Referido B2B".
