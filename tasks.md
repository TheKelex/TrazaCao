# TABLERO DE TAREAS Y SEGUIMIENTO SDD (tasks.md)
## Metodología: Specification-Driven Development (SDD) & Micro-Scrum 24H
### Proyecto: CacaoTrace Huila / TrazaCao
### Repositorios:
- **Upstream (Organización)**: `git@github.com:TheKelex/CacaoSoft.git`
- **Origin (Fork / Tenedor)**: `git@github.com:Tomasberserk/TrazaCao.git`

---

## 1. PRINCIPIO FUNDAMENTAL SDD (Specification-Driven Development)
> **"La documentación y el contrato son la verdad única del sistema. NINGUNA línea de código se escribe sin que su especificación, criterios de aceptación (Gherkin), contrato de datos y caso de prueba estén previamente redactados y aprobados."**

---

## 2. ESTADO GENERAL DE SPRINTS (24 HORAS)

```
[██████████░░░░░░░░░░] 35% Completado (Fase de Especificación y Diseño Concluida)
```

| Sprint | Horas | Enfoque Principal | Estado |
| :--- | :--- | :--- | :--- |
| **Sprint 1** | 00:00 - 04:00 | **Especificación (SDD)**: Problema, 12 Historias Gherkin, Modelo de Datos, ADRs, Contratos API, Contexto IA. | **COMPLETADO (100%)** |
| **Sprint 2** | 04:00 - 10:00 | **Construcción Core & QA**: Persistencia SQLite WAL, Triggers, Motor Matemático Decimal, Pytest, Consumo Atómico. | **EN CURSO** |
| **Sprint 3** | 10:00 - 16:00 | **Integración UI & Incidencia Hora 12**: Vistas Operador/Admin, Bloqueo de CAC001, Ficha QR sin fuga de datos. | PENDIENTE |
| **Sprint 4** | 16:00 - 21:00 | **Pruebas de Estrés & Usabilidad**: 15 casos manuales, Benchmark 100 registros (<3s), Usabilidad externa (E06). | PENDIENTE |
| **Sprint 5** | 21:00 - 24:00 | **Cierre & Pitch**: Backup/Restore verificado, Consolidación PDFs E01-E10, Diapositivas pitch 5 min, Tag final. | PENDIENTE |

---

## 3. ASIGNACIÓN DE TAREAS POR DESARROLLADOR

### Dev 1 (Tech Lead - Backend Core & Dominio)
- [x] **SDD-01**: Especificar modelo ER y reglas matemáticas de `CAC001` (Merma 20%, Costo $20k, Margen 20%).
- [ ] **DEV1-01**: Implementar `src/backend/domain/calculos.py` con `Decimal` y protección de las 3 divisiones por cero.
- [ ] **DEV1-02**: Implementar modelos SQLAlchemy en `src/backend/models.py` (`Lote`, `Transformacion`, `AuditoriaLog`).
- [ ] **DEV1-03**: Implementar esquemas Pydantic (`schemas.py`) con validación de entradas no negativas.
- [ ] **DEV1-04**: Implementar endpoint `POST /api/lotes` (RF01) y `POST /api/transformaciones` (RF02).
- [ ] **DEV1-05**: Implementar consumo atómico con `UPDATE` condicional e idempotencia (RF08).

### Dev 2 (Seguridad, Calidad & Base de Datos)
- [x] **SDD-02**: Redactar ADR-01 (Monolito Onion), ADR-02 (SQLite WAL) y ADR-03 (FastAPI Pydantic).
- [ ] **DEV2-01**: Configurar `src/backend/infra/database.py` con modo `WAL`, `foreign_keys=ON` y `busy_timeout=5000`.
- [ ] **DEV2-02**: Crear triggers SQLite nativos para inmutabilidad de `audit_logs` (RF10).
- [ ] **DEV2-03**: Implementar dependencia de seguridad RBAC (`security/rbac.py`) con `HTTP 403 Forbidden` (RF09).
- [ ] **DEV2-04**: Diseñar y ejecutar suite de 5+ pruebas automáticas en `tests/` (`pytest`).
- [ ] **DEV2-05**: Implementar endpoint de exportación CSV (`routers/export.py`) con codificación `utf-8-sig` (RF11).
- [ ] **DEV2-06**: Crear scripts de `backup.py` y `restore.py` probados contra corrupción o pérdida.

### Dev 3 (Frontend Operador & Dashboard Administrador)
- [x] **SDD-03**: Diseñar wireframes y flujo de pantallas responsive (móvil y desktop).
- [ ] **DEV3-01**: Setup de proyecto React + Vite + Tailwind local (100% offline, sin CDN web).
- [ ] **DEV3-02**: Construir vista móvil del Operador (Recepción rápida y Transformación con prevención de doble submit).
- [ ] **DEV3-03**: Construir modal de justificación cuando la merma supere el 15.0% (RF04).
- [ ] **DEV3-04**: Construir Dashboard del Administrador con KPIs, semáforo de alertas y botón de exportar CSV.
- [ ] **DEV3-05**: Construir modal de bloqueo de lote con motivo obligatorio para la Incidencia de la Hora 12.

### Dev 4 (Frontend Público, Experiencia de Usuario & Entregables)
- [x] **SDD-04**: Redactar E01 (Problema MNTC), E02 (12 Historias Gherkin), E08 (Bitácora de IA) y ENTREGA.md (E10).
- [ ] **DEV4-01**: Construir Ficha Comercial Pública ("Pasaporte Digital") con renderizado local en SVG de `qrcode.react`.
- [ ] **DEV4-02**: Conectar botón de contacto directo B2B a WhatsApp (`wa.me/...`) con mensaje prellenado de lote.
- [ ] **DEV4-03**: Realizar prueba de usabilidad (E06) con usuario externo ajeno al equipo y registrar evidencias antes/después.
- [ ] **DEV4-04**: Generar script de estrés de 100 registros (`seed_100.py`) y registrar benchmark medido (<3s).
- [ ] **DEV4-05**: Diseñar diapositivas de Pitch de 5 minutos (`pitch/presentacion.pdf`) y propuesta comercial del piloto ($1.200.000 COP).

---

## 4. MATRIZ DE TRAZABILIDAD SDD (Requisito -> Doc -> Código -> Prueba)

| RF | Requisito | Documento Especificación | Archivo Código | Archivo de Prueba | Estado |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **RF01** | Recepción de Lotes | `documentos/E02_requisitos.md` | `routers/lotes.py` | `tests/test_rf01_recepcion.py` | Especificado |
| **RF02** | Transformación vinculada | `documentos/E02_requisitos.md` | `routers/transformaciones.py` | `tests/test_rf02_transformacion.py` | Especificado |
| **RF03** | Trazabilidad Integral | `documentos/E01_problema.md` | `routers/trazabilidad.py` | `tests/test_rf03_trazabilidad.py` | Especificado |
| **RF04** | Alerta Merma > 15% | `documentos/E02_requisitos.md` | `domain/calculos.py` | `tests/test_rf04_alertas.py` | Especificado |
| **RF05** | Indicadores Económicos | `documentos/E02_requisitos.md` | `domain/calculos.py` | `tests/test_rf05_costos.py` | Especificado |
| **RF06** | Ficha Comercial Pública | `documentos/E03_diseno.md` | `routers/pasaporte.py` | `tests/test_rf06_pasaporte.py` | Especificado |
| **RF07** | Persistencia Confiable | `documentos/E03_diseno.md` | `infra/database.py` | `tests/test_rf07_persistencia.py` | Especificado |
| **RF08** | Control de Stock & Idempotencia | `documentos/E03_diseno.md` | `services/inventario.py` | `tests/test_rf08_stock.py` | Especificado |
| **RF09** | Gestión Estados & RBAC | `documentos/E03_diseno.md` | `security/rbac.py` | `tests/test_rf09_estados.py` | Especificado |
| **RF10** | Auditoría Inmutable | `documentos/E03_diseno.md` | `infra/triggers.py` | `tests/test_rf10_auditoria.py` | Especificado |
| **RF11** | Exportación CSV | `documentos/E02_requisitos.md` | `routers/export.py` | `tests/test_rf11_export.py` | Especificado |
| **RF12** | Balance Económico Robusto | `documentos/E02_requisitos.md` | `domain/calculos.py` | `tests/test_rf12_balance.py` | Especificado |
