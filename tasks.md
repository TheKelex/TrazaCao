# TABLERO KANBAN & SEGUIMIENTO SDD (tasks.md)
## Metodología: Kanban + Specification-Driven Development (SDD)
### Proyecto: CacaoTrace Huila / TrazaCao
### Repositorios:
- **Upstream (Organización)**: `git@github.com:TheKelex/CacaoSoft.git`
- **Origin (Fork / Tenedor)**: `git@github.com:Tomasberserk/TrazaCao.git`

---

## 1. POLÍTICAS DEL FLUJO KANBAN (WIP LIMITS & GOBERNANZA)

```
+-------------------+--------------------+----------------------+--------------------+--------------------+
| 1. POR ESPECIFICAR| 2. ESPECIFICACIÓN  | 3. LISTO PARA        | 4. EN CONSTRUCCIÓN | 5. PRUEBAS & QA    | 6. TERMINADO (DoD) |
| (Backlog)         | SDD (WIP: 4)       | CODIFICAR (DoR)      | (WIP: 4)           | (WIP: 4)           | (Commit & Tag)     |
+-------------------+--------------------+----------------------+--------------------+--------------------+
```

### Reglas de Oro de nuestro Kanban:
1. **Definition of Ready (DoR)**: Ninguna tarea puede pasar a *En Construcción* si su **Plan Técnico / Especificación SDD** no está redactado, commiteado y validado con el equipo.
2. **WIP Limit (Work In Progress)**: Máximo **1 tarea en construcción activa** por desarrollador a la vez. No se abren nuevas tareas sin cerrar o transferir la anterior.
3. **Definition of Done (DoD)**: Una tarea está terminada únicamente cuando tiene:
   - Código en su rama de feature con merge aprobado a `develop`.
   - Pruebas automatizadas o manuales verificadas con evidencia.
   - Documentación sincronizada en el Markdown correspondiente.

---

## 2. FASE ACTUAL: APERTURA E IDEACIÓN DE PLANES POR DESARROLLADOR (SDD PRIMERO)

Antes de escribir código en `src/`, cada desarrollador debe abrir su rama y documentar su plan técnico de ideación:

---

### DEV 1: Tech Lead & Dominio Agroindustrial
- **Rama Asignada**: `feature/backend-core`
- **Documento Obligatorio a Entregar**: `documentos/PLAN_DEV1_CORE.md`
- **Requisitos de la Fase de Ideación / Tareas Kanban**:
  - [x] **KB-D1-01**: Analizar las fórmulas matemáticas oficiales del caso `CAC001` (100 kg entrada, 80 kg salida, merma 20.0%, costo $20.000/kg, margen 20.0%).
  - [x] **KB-D1-02**: Diseñar la especificación del motor de cálculo en `domain/calculos.py` con `Decimal` de Python, documentando el manejo explícito de las **tres divisiones por cero** (`entrada == 0`, `salida_vendible == 0`, `precio_venta == 0`).
  - [x] **KB-D1-03**: Especificar el aislamiento del dominio (Onion Architecture): cómo las entidades puras no tendrán dependencias de FastAPI ni de SQLAlchemy.
  - [x] **KB-D1-04**: Diseñar el algoritmo de **consumo atómico de inventario** para RF08 mediante consulta SQL `UPDATE` condicional (`kg_disponibles >= consumo`) para eliminar condiciones de carrera sin usar `.with_for_update()`.
  - [x] **KB-D1-05**: Redactar los contratos Pydantic para `POST /api/lotes` y `POST /api/transformaciones` con validaciones de campos no negativos.

---

### DEV 2: Seguridad, Infraestructura de Datos & QA
- **Rama Asignada**: `feature/security-qa`
- **Documento Obligatorio a Entregar**: `documentos/PLAN_DEV2_INFRA_QA.md`
- **Requisitos de la Fase de Ideación / Tareas Kanban**:
  - [x] **KB-D2-01**: Documentar la configuración de SQLite en modo `WAL` (`journal_mode=WAL`, `busy_timeout=5000`, `foreign_keys=ON`) para alta concurrencia local.
  - [ ] **KB-D2-02**: Diseñar los scripts DDL en SQL nativo para los **Triggers de Inmutabilidad** de `audit_logs` (`BEFORE UPDATE` y `BEFORE DELETE` con `RAISE(ABORT, ...)` para RF10).
  - [ ] **KB-D2-03**: Especificar la matriz de autorización RBAC (`security/rbac.py`): definir el comportamiento de la dependencia FastAPI que rechazará al Operador con `HTTP 403 Forbidden` al intentar alterar estados.
  - [ ] **KB-D2-04**: Redactar la matriz de los **6 casos de prueba automatizados obligatorios** en `pytest` (caso feliz CAC001, cantidades negativas, sobreconsumo de stock, división por cero, permisos denegados y regresión Hora 12).
  - [ ] **KB-D2-05**: Especificar el protocolo de prueba y scripts de `backup.py` y `restore.py`, definiendo cómo se validará la integridad de registros tras la restauración.

---

### DEV 3: Frontend Interno (Operador Móvil & Dashboard Administrador)
- **Rama Asignada**: `feature/frontend-ui`
- **Documento Obligatorio a Entregar**: `documentos/PLAN_DEV3_FRONTEND.md`
- **Requisitos de la Fase de Ideación / Tareas Kanban**:
  - [x] **KB-D3-01**: Diseñar el wireframe y flujo de interacción de la vista móvil del Operador (Recepción y Transformación).
  - [ ] **KB-D3-02**: Especificar el mecanismo de prevención de doble submit en el formulario del operador (deshabilitar botón `isSubmitting` y generación de cabecera `X-Idempotency-Key` en UUIDv4).
  - [ ] **KB-D3-03**: Diseñar la lógica visual del **Semáforo de Alertas de Merma**: definir cómo se presentará en verde ($\le 15\%$) y rojo intermitente ($> 15\%$), obligando a ingresar el campo de incidencia antes de guardar.
  - [ ] **KB-D3-04**: Especificar el layout del Dashboard del Administrador: tarjetas de saldo de bodega, tabla filtrable por municipio (`Rivera`, `Campoalegre`, `Algeciras`), botón de descarga CSV (`utf-8-sig`) y visualizador del historial de auditoría.
  - [ ] **KB-D3-05**: Diseñar el modal de acción inmediata para la **Incidencia de la Hora 12** (bloqueo preventivo de CAC001 con motivo mínimo de 10 caracteres).

---

### DEV 4: Ficha Comercial Pública, Usabilidad & Propuesta de Negocio
- **Rama Asignada**: `feature/passport-docs`
- **Documento Obligatorio a Entregar**: `documentos/PLAN_DEV4_COMERCIAL_UX.md`
- **Requisitos de la Fase de Ideación / Tareas Kanban**:
  - [x] **KB-D4-01**: Diseñar la estructura del **Pasaporte Digital de Cacao** (Ficha Comercial QR) asegurando que el schema público (`PasaportePublicoResponse`) excluya físicamente costos y teléfonos privados.
  - [ ] **KB-D4-02**: Especificar el componente de renderizado offline del código QR utilizando `qrcode.react` en SVG nativo (sin llamadas a CDNs ni APIs web).
  - [ ] **KB-D4-03**: Diseñar el protocolo de la **Prueba de Usabilidad Externa (E06)**: redactar la guía de observación para una persona ajena al equipo que ejecutará las dos tareas obligatorias (registrar lote y consultar trazabilidad), midiendo tiempo y fricción.
  - [ ] **KB-D4-04**: Estructurar el guion cronometrado del **Pitch de 5 minutos** (Problema $\rightarrow$ Solución $\rightarrow$ Demo en vivo $\rightarrow$ Modelo financiero $\rightarrow$ Cierre) y las 5 diapositivas oficiales.
  - [ ] **KB-D4-05**: Redactar la propuesta del **Piloto Comercial de 30 días** ($1.200.000 COP) justificando cómo la detección de mermas y la valorización de cascarilla pagan la inversión en 15 días.

---

## 3. ESTADO VIVO DEL TABLERO KANBAN

| ID Tarea | Descripción Breve | Responsable | Estado Kanban | Rama Git |
| :--- | :--- | :--- | :--- | :--- |
| **DOC-E01** | Comprensión y Marco MNTC | Dev 4 | **DONE** | `master` / `develop` |
| **DOC-E02** | 12 Historias Gherkin + Hora 12 | Dev 4 | **DONE** | `master` / `develop` |
| **DOC-E03** | Arquitectura Onion y ADRs | Dev 1 & Dev 2 | **DONE** | `master` / `develop` |
| **DOC-API** | Contratos de API JSON | Dev 1 | **DONE** | `master` / `develop` |
| **DOC-CTX** | Prompt de Alineación IA | Dev 1 | **DONE** | `master` / `develop` |
| **PLN-D1** | Plan Detallado Core & Matemáticas | Dev 1 | **DONE (DoR Aprobado)** | `feature/backend-core` |
| **PLN-D2** | Plan Seguridad, Triggers & QA | Dev 2 | **EN ESPECIFICACIÓN** | `feature/security-qa` |
| **PLN-D3** | Plan Frontend Operador & Admin | Dev 3 | **EN ESPECIFICACIÓN** | `feature/frontend-ui` |
| **PLN-D4** | Plan Pasaporte QR, Usabilidad & Pitch | Dev 4 | **EN ESPECIFICACIÓN** | `feature/passport-docs` |
| **COD-B01** | Implementación SQLite WAL & Triggers | Dev 2 | **DONE (Integrado en Core)** | `feature/backend-core` |
| **COD-B02** | Motor Decimal de Cálculos y Pytest | Dev 1 | **DONE (15/15 Tests OK)** | `feature/backend-core` |
| **COD-U01** | Setup React + Vite Offline | Dev 3 | Backlog (Bloqueado por PLN-D3) | `feature/frontend-ui` |
| **COD-U02** | Ficha QR y WhatsApp Lead | Dev 4 | Backlog (Bloqueado por PLN-D4) | `feature/passport-docs` |
