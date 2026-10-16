# TABLERO KANBAN & SEGUIMIENTO SDD (tasks.md)
## Metodología: Kanban + Specification-Driven Development (SDD)
### Proyecto: CacaoTrace Huila / TrazaCao
### Repositorio Oficial: `https://github.com/TheKelex/TrazaCao.git` | Rama de Integración: `develop`

---

## 1. POLÍTICAS DEL FLUJO KANBAN (WIP LIMITS & GOBERNANZA)

```
+--------------------+----------------------+--------------------+--------------------+--------------------+
| 1. BACKLOG         | 2. ESPECIFICACIÓN    | 3. LISTO PARA      | 4. EN CONSTRUCCIÓN | 5. TERMINADO (DoD) |
| (Por Iniciar)      | SDD (WIP: 2)         | INTEGRAR / QA      | / AUDITORÍA        | (Merge & Tag)      |
+--------------------+----------------------+--------------------+--------------------+--------------------+
```

### Reglas de Oro de nuestro Kanban:
1. **Definition of Ready (DoR)**: Ninguna tarea pasa a construcción sin su **Plan Técnico / Especificación SDD** redactado, commiteado y validado en `documentos/`.
2. **WIP Limit (Work In Progress)**: Máximo **1 tarea en construcción activa** por desarrollador para garantizar foco y evitar cuellos de botella.
3. **Definition of Done (DoD)**: Una tarea está terminada únicamente cuando tiene:
   - Código en su rama de feature con merge aprobado a `develop`.
   - Pruebas automatizadas (`pytest`) y verificación en consola sin errores (cero advertencias críticas).
   - Documentación sincronizada en el entregable oficial correspondiente (`documentos/`) y registrada en `ENTREGA.md`.

---

## 2. ESTADO VISUAL ACTUAL DEL FLUJO (SNAPSHOT DE AVANCE)

```
+--------------------------------------------------------------------------------------------------+
| RESUMEN DE PROGRESO DEL PROYECTO (FASE FINAL DE CONSOLIDACIÓN Y ENTREGA OFICIAL)                 |
| Total Tareas Rastreadas: 28 | Terminadas (DoD): 28 (100.0%) | En Integración: 0 | Backlog: 0     |
+--------------------------------------------------------------------------------------------------+
```

```
+-----------------------+-----------------------+-----------------------+--------------------------+
| 1. BACKLOG (Pendiente)| 2. EN INTEGRACIÓN     | 3. PRUEBAS & QA       | 4. TERMINADO (DoD Hecho) |
+-----------------------+-----------------------+-----------------------+--------------------------+
| (Ninguna pendiente)   | (Ninguna en curso)    | • 42/42 Tests PASSED  | • DOC-E01 (Problema PDF) |
|                       |                       |   Verificados en 6.3s | • DOC-E02 (13 Gherkins)  |
|                       |                       |   (0 fallas, 100% OK) | • DOC-E03 (Onion + ADRs) |
|                       |                       |    5173 / :8000)      | • DOC-API (Contratos)    |
|                       |                       |                       | • PLN-D1 a PLN-D4 (DoR)  |
|                       |                       |                       | • COD-B01 (SQLite WAL)   |
|                       |                       |                       | • COD-B02 (Motor Decimal)|
|                       |                       |                       | • COD-OPS (Backup/Restore)|
|                       |                       |                       | • COD-U01 (Frontend SPA) |
|                       |                       |                       | • COD-U02 (Ficha QR SVG) |
|                       |                       |                       | • DOC-E04 (Manual MVP)   |
|                       |                       |                       | • DOC-E05 (Pruebas PDF)  |
|                       |                       |                       | • DOC-E06 (Usabilidad)   |
|                       |                       |                       | • DOC-E07 (Operación PDF)|
|                       |                       |                       | • DOC-E08 (Bitácora IA)  |
|                       |                       |                       | • DOC-E09 (Pitch y Prop) |
|                       |                       |                       | • DOC-E10 (Matriz E10)   |
|                       |                       |                       | • FIX-404 / FIX-SCHEMA   |
|                       |                       |                       | • COD-RF12 (Balance Eco) |
|                       |                       |                       | • FEAT-CAT-B2B (Catálogo)|
|                       |                       |                       | • INT-DEV2 (Seguridad QA)|
|                       |                       |                       | • SEED-EXP-B2B (Seed B2B)|
|                       |                       |                       | • FEAT-MERMA-KG (Cascar.)|
+-----------------------+-----------------------+-----------------------+--------------------------+
```

---

## 3. SEGUIMIENTO DE REQUISITOS POR DESARROLLADOR

### DEV 1: Tech Lead & Dominio Agroindustrial
- **Rama Asignada**: `feature/backend-core` $\rightarrow$ Merged to `develop`
- **Documentos Entregados**: `documentos/PLAN_DEV1_CORE.md`, `documentos/E04_manual.pdf`, `ENTREGA.md`
- **Avance de Tareas**:
  - [x] **KB-D1-01**: Fórmulas matemáticas oficiales de `CAC001` (100 kg entrada, 80 kg salida, merma 20.0%, costo $20.000/kg, margen 20.0%).
  - [x] **KB-D1-02**: Motor de cálculo puro con `Decimal` y tratamiento de las **tres divisiones por cero**.
  - [x] **KB-D1-03**: Aislamiento arquitectural bajo **Onion Architecture** (dominio sin dependencias de frameworks).
  - [x] **KB-D1-04**: Consumo atómico condicional de existencias (`UPDATE ... WHERE kg_disponibles >= consumo`) para eliminar condiciones de carrera sin usar `.with_for_update()`.
  - [x] **KB-D1-05**: Contratos Pydantic v2 para lotes y transformaciones con tolerancia a alias y cabecera `X-Idempotency-Key`.
  - [x] **KB-D1-06**: Subsanación de desalineaciones del MVP preliminar (rutas `/api/pasaporte` y `/lotes-csv` en HTTP 200 OK, validación de responsable y balance RF12).

---

### DEV 2: Seguridad, Infraestructura de Datos & QA
- **Rama Asignada**: `feature/security-qa` $\rightarrow$ Merged to `develop`
- **Documentos Entregados**: `documentos/PLAN_DEV2_INFRA_QA.md`, `documentos/E05_pruebas.pdf`, `documentos/E07_operacion.pdf`
- **Avance de Tareas**:
  - [x] **KB-D2-01**: Configuración SQLite WAL (`busy_timeout=5000`, `foreign_keys=ON`) para alta concurrencia local.
  - [x] **KB-D2-02**: Triggers nativos DDL de **Inmutabilidad** en `audit_logs` (`RAISE(ABORT)` ante `UPDATE` y `DELETE`).
  - [x] **KB-D2-03**: Matriz de autorización RBAC (`security/rbac.py`): emisión de `HTTP 403 Forbidden` a operadores que intentan alterar estados.
  - [x] **KB-D2-04**: Suite automatizada de pruebas en `pytest` (38/38 pruebas de integración, estrés y regresión pasando en 1.73s).
  - [x] **KB-D2-05**: Scripts de respaldo atómico (`backup.py` en 15.68 ms) y restauración íntegra (`restore.py` en 18.19 ms).

---

### DEV 3: Frontend Interno (Operador Móvil & Dashboard Administrador)
- **Rama Asignada**: `feature/frontend-ui` $\rightarrow$ Merged to `develop`
- **Documento Entregado**: `documentos/PLAN_DEV3_FRONTEND.md`
- **Avance de Tareas**:
  - [x] **KB-D3-01**: Wireframe y flujo de pantalla unificada (Command Workspace) para el Operador.
  - [x] **KB-D3-02**: Prevención de doble clic (`isSubmitting`) y cabecera `X-Idempotency-Key` en UUIDv4.
  - [x] **KB-D3-03**: Semáforo dinámico de merma con bloqueo de guardado si merma $> 15\%$ hasta ingresar justificación ($\ge 10$ caracteres).
  - [x] **KB-D3-04**: Dashboard de Administrador con filtros por municipio, exportación CSV con BOM `utf-8-sig` y bitácora de auditoría en hora local de Colombia (`America/Bogota` COT).
  - [x] **KB-D3-05**: Modal de cuarentena para la **Incidencia de la Hora 12** con motivo obligatorio.
  - [x] **KB-D3-06**: Incorporación de campos de vereda/ubicación del cultivo y selector multi-unidad en la recepción (RF01).

---

### DEV 4: Ficha Comercial Pública, Usabilidad & Propuesta de Negocio
- **Rama Asignada**: `feature/passport-docs` $\rightarrow$ Merged to `develop`
- **Documentos Entregados**: `documentos/PLAN_DEV4_COMERCIAL_UX.md`, `documentos/E06_usabilidad.pdf`, `documentos/E09_presentacion.pdf`
- **Avance de Tareas**:
  - [x] **KB-D4-01**: DTO sanitizado `PasaportePublicoResponse` con exclusión estricta de costos y teléfonos personales.
  - [x] **KB-D4-02**: Renderizado vectorial de código QR en SVG nativo (`qrcode.react`) y contenedor simulador de smartphone (375px) para demostración offline.
  - [x] **KB-D4-03**: Modal de pedido comercial B2B con botón de copia al portapapeles (resiliente sin internet).
  - [x] **KB-D4-04**: Informe formal de la **Prueba de Usabilidad Externa (E06)** consolidado en `documentos/E06_usabilidad.pdf`.
  - [x] **KB-D4-05**: Consolidación final de la **Propuesta Comercial y Pitch (E09)** en `documentos/E09_presentacion.pdf`.

---

## 4. MATRIZ DE ESTADO VIVO DE TAREAS (SEGUIMIENTO DETALLADO)

| ID Tarea | Descripción del Entregable / Hito | Responsable | Estado Kanban | Evidencia / Ubicación Oficial |
| :--- | :--- | :--- | :--- | :--- |
| **DOC-E01** | Comprensión del Problema y Marco MNTC | Dev 4 | **DONE (DoD)** | `documentos/E01_problema.pdf` |
| **DOC-E02** | 13 Historias de Usuario Gherkin + Hora 12 | Dev 4 | **DONE (DoD)** | `documentos/E02_requisitos.pdf` |
| **DOC-E03** | Arquitectura Onion, Diagramas ER y ADRs | Dev 1 & 2 | **DONE (DoD)** | `documentos/E03_diseño.pdf` |
| **DOC-API** | Contratos de API JSON | Dev 1 | **DONE (DoD)** | `documentos/CONTRATOS_API.md` |
| **DOC-CTX** | Prompt Maestro de Alineación IA | Dev 1 | **DONE (DoD)** | `CONTEXTO_IA_EQUIPO.md` |
| **PLN-D1** | Plan Técnico Backend Core & Dominio | Dev 1 | **DONE (DoD)** | `documentos/PLAN_DEV1_CORE.md` |
| **PLN-D2** | Plan Seguridad, Triggers & QA | Dev 2 | **DONE (DoD)** | `documentos/PLAN_DEV2_INFRA_QA.md` |
| **PLN-D3** | Plan Frontend Operador & Admin | Dev 3 | **DONE (DoD)** | `documentos/PLAN_DEV3_FRONTEND.md` |
| **PLN-D4** | Plan Ficha Comercial QR & Usabilidad | Dev 4 | **DONE (DoD)** | `documentos/PLAN_DEV4_COMERCIAL_UX.md` |
| **COD-B01** | SQLite WAL, Concurrencia y Triggers DDL | Dev 2 | **DONE (DoD)** | `src/backend/infra/database.py` |
| **COD-B02** | Motor Decimal Agroindustrial (CAC001) | Dev 1 | **DONE (DoD)** | `src/backend/domain/calculos.py` |
| **COD-OPS** | Respaldo, Restauración y Benchmark 100 | Dev 2 | **DONE (DoD)** | `datos/backup.py` / `restore.py` |
| **COD-U01** | Frontend SPA Operador & Admin | Dev 3 | **DONE (DoD)** | `src/frontend/` (Build en 2.0s) |
| **COD-U02** | Ficha QR SVG + Simulador Móvil 375px | Dev 4 | **DONE (DoD)** | `PasaportePublico.jsx` |
| **DOC-E04** | Manual de Usuario y Demo < 120s | Dev 1 / Dev 3 | **DONE (DoD)** | `documentos/E04_manual.pdf` |
| **DOC-E05** | Informe y Archivos de Pruebas | Equipo Completo | **DONE (DoD)** | `documentos/E05_pruebas.pdf` |
| **DOC-E06** | Verificación de Usabilidad (UX) | Dev 4 | **DONE (DoD)** | `documentos/E06_usabilidad.pdf` |
| **DOC-E07** | Operación, Respaldo y Mantenimiento | Dev 2 | **DONE (DoD)** | `documentos/E07_operacion.pdf` |
| **DOC-E08** | Bitácora de IA, Skills y Prompts Literales | Dev 1 | **DONE (DoD)** | `documentos/E08_IA_y_fuentes.pdf` |
| **DOC-E09** | Propuesta Comercial y Diapositivas Pitch | Dev 4 | **DONE (DoD)** | `documentos/E09_presentacion.pdf` |
| **DOC-E10** | Índice de Entrega y Matriz de Trazabilidad | Equipo Completo | **DONE (DoD)** | `ENTREGA.md` / `documentos/E10_entrega.md` |
| **FIX-API** | Corrección de rutas 404 (QR & Exportación CSV) | Dev 1 | **DONE (DoD)** | `routers/pasaporte.py` & `export.py` |
| **FIX-SCH** | Tolerancia en Transformación (Responsable y Salida) | Dev 1 | **DONE (DoD)** | `schemas.py` & `TransformacionView.jsx` |
| **FIX-UX** | Ubicación Veredal y Horario Legal Colombia (COT) | Dev 1 & Dev 3 | **DONE (DoD)** | `RecepcionView.jsx` & `AuditLogView.jsx` |
| **COD-RF12**| Panel de Balance Agroindustrial Consolidado | Dev 1 | **DONE (DoD)** | `AdminDashboard.jsx` |
| **COD-AUTH** | Inicio de Sesión Criptográfico, Aislamiento de Roles | Equipo Completo | **DONE (DoD)** | `LoginView.jsx`, `hashing.py`, `routers/auth.py` |
| **FEAT-CAT-B2B** | Catálogo Industrial y Botánico B2B de Mermas | Equipo Completo | **DONE (DoD)** | `subproductos.py`, `CatalogoLotesPublico.jsx` |
| **FEAT-MERMA-KG** | Venta Exclusiva de Cascarilla por Kilo ($14.500-$16.500) | Equipo Completo | **DONE (DoD)** | `calculos.py`, `subproductos.py` |
| **FEAT-LANDING-BRAND** | Rediseño de Identidad de Marca y Narrativa en 5 Pantallas | Equipo Completo | **DONE (DoD)** | `ScrollySceneViewer.jsx`, `CacaoExperienceLanding.jsx`, `demo-scrollytelling.html` |
| **FEAT-CRUD-OPERARIOS** | CRUD de Operarios: Crear, Editar, Vetar/Activar y Bloqueo de Eliminación (HTTP 400) | Equipo Completo | **DONE (DoD)** | `operarios.py`, `OperariosAdminView.jsx`, `AdminDashboard.jsx` |
| **FEAT-AUTH-COMPRADOR** | Autenticación y Registro de Compradores B2B (Tabla `compradores`) | Equipo Completo | **DONE (DoD)** | `models.py`, `compradores.py`, `ProductoDetalleEcommerce.jsx` |
| **FEAT-VENTA-ATOMICA** | Compra Directa Inmediata con Descuento Atómico de Stock ($25.000/kg Cacao, Merma) | Equipo Completo | **DONE (DoD)** | `ventas.py`, `ordenes_venta`, `VentasCompradoresAdminView.jsx` |
| **FEAT-ECOMMERCE-PANEL** | Panel de Producto Tipo E-commerce: Galería Multimodal, Traza de Origen y Checkout | Equipo Completo | **DONE (DoD)** | `ProductoDetalleEcommerce.jsx`, `CatalogoLotesPublico.jsx`, `App.jsx` |

---
*Fin del Tablero Kanban — TrazaCao Huila*

