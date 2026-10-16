# ENTREGA.md — ÍNDICE DE ENTREGA Y MATRIZ DE TRAZABILIDAD (E10)
## Reto: Cacao con Historia, Calidad y Valor (Huila)
### II Hackathon de Programación DEVURITY — Universidad Surcolombiana (USCO)

---

## 1. Identificación del Equipo y Proyecto
- **Nombre del Equipo**: TrazaCao Huila (Equipo 1)
- **Institución**: Universidad Surcolombiana (USCO) — Semillero DEVURITY
- **Repositorio Oficial**: `https://github.com/TheKelex/TrazaCao.git`
- **Rama Principal de Integración**: `develop`
- **Estado de Pruebas Automatizadas**: **38/38 Tests PASSED (100% de éxito en 1.73s)**
- **Fecha y Edición**: Octubre 2026

---

## 2. Índice Oficial de Entregables (E01 a E10)

| Código | Entregable Oficial | Formato | Ubicación Oficial en el Repositorio | Descripción Breve y Alcance Técnico |
| :--- | :--- | :--- | :--- | :--- |
| **E01** | Comprensión del Problema y Propuesta de Valor | **PDF** | `documentos/E01_problema.pdf` | Diagnóstico de asociaciones del Huila (Rivera, Campoalegre, Algeciras), propuesta de valor offline, alcance del MVP, exclusiones e indicadores. |
| **E02** | Requisitos y Organización del Equipo | **PDF** | `documentos/E02_requisitos.pdf` | 13 Historias de Usuario con especificación formal Gherkin (RF01–RF13) y tarjetas de gestión del cambio (CR Hora 12 y CR Modelo B2B). |
| **E03** | Diseño del Producto y Solución | **PDF** | `documentos/E03_diseño.pdf` | Arquitectura Onion (Clean Lite), modelo entidad-relación, diagramas de secuencia, contratos de API JSON y registros de decisiones arquitectónicas (ADRs). |
| **E04** | Producto Mínimo Viable (Código y Manual) | **PDF** | `documentos/E04_manual.pdf`<br>*(Código: `src/`)* | Software funcional 100% offline, frontend React 19, backend FastAPI, motor Decimal, guía vertical de demostración "< 120 segundos", roles y troubleshooting. |
| **E05** | Informe y Archivos de Pruebas | **PDF** | `documentos/E05_pruebas.pdf`<br>*(Tests: `tests/`)* | Auditoría de doble vía: testeo cruzado en interfaz web, suite de 38 pruebas `pytest`, 4 pruebas de estrés/seguridad, latencias (<3 ms) y gobernanza de IA. |
| **E06** | Verificación de Experiencia de Usuario (UX) | **PDF** | `documentos/E06_usabilidad.pdf` | Evaluación heurística y prueba formal con usuario externo en Oasis Plaza: registro de lote, trazabilidad, pasaporte QR y plan de simplificación visual. |
| **E07** | Instalación, Respaldo y Mantenimiento | **PDF** | `documentos/E07_operacion.pdf` | Procedimiento de despliegue reproducible en 1 clic, backup atómico en caliente en 15.68 ms, restauración en 18.19 ms y plan de mantenimiento a 30 días. |
| **E08** | Declaración de IA y Fuentes Externas | **PDF** | `documentos/E08_IA_y_fuentes.pdf` | Bitácora exhaustiva en cumplimiento del Numeral 4 del Reglamento: prompts literales, modelos (Gemini/Claude), supervisión humana y licenciamiento MIT/Apache 2.0. |
| **E09** | Propuesta Comercial y Pitch | **PDF** | `documentos/E09_presentacion.pdf` | Identificación de cliente/pagador, oferta del piloto comercial a 30 días, estructura de precios ($180.000 COP/mes), cronograma e indicadores de validación. |
| **E10** | Índice de Entrega y Matriz de Trazabilidad | **Markdown** | `ENTREGA.md`<br>`documentos/E10_entrega.md` | Matriz de trazabilidad integral requisito a componente, pruebas y verificación técnica para el jurado calificador. |

---

## 3. Matriz de Trazabilidad Integral (Requisito $\rightarrow$ Componente $\rightarrow$ Prueba $\rightarrow$ Evidencia)

| Requisito | Descripción | Componente / Pantalla UI | Controlador Backend | Archivo de Prueba | Resultado Obtenido | Estado |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **RF01** | Recepción de lotes con validación de calidad NTC 1252 y selector multi-unidad (kg, lb, @, qq, sacos, cargas). | `src/frontend/src/components/RecepcionView.jsx` | `src/backend/routers/lotes.py` | `tests/test_api_endpoints.py`<br>`tests/test_auditoria_4_pruebas.py` | Lote registrado con ID único; conversión exacta a kilos netos; rechazo ante $\le 0$ kg o campos vacíos. | **Cumplido** |
| **RF02** | Transformación agroindustrial y vinculación genealógica al lote de origen. | `src/frontend/src/components/TransformacionView.jsx` | `src/backend/routers/transformaciones.py` | `tests/test_api_endpoints.py`<br>`tests/test_auditoria_4_pruebas.py` | Salida vinculada canónicamente (`SAL-CAC001-01`); consumo atómico de inventario en base de datos. | **Cumplido** |
| **RF03** | Trazabilidad integral punta a punta (origen, transformación, salida). | `src/frontend/src/components/TrazabilidadView.jsx`<br>`src/frontend/src/components/PasaportePublico.jsx` | `src/backend/routers/lotes.py`<br>`src/backend/routers/pasaporte.py` | `tests/test_auditoria_4_pruebas.py`<br>`datos/benchmark_100_registros.py` | Reconstrucción genealógica en **1.8 ms** (ampliamente inferior a la meta de 3.0 s) con visualización de árbol. | **Cumplido** |
| **RF04** | Detección automática y alerta de merma $> 15.0\%$ con justificación obligatoria. | `src/frontend/src/components/TransformacionView.jsx` | `src/backend/domain/calculos.py` | `tests/test_calculos.py`<br>`tests/test_api_endpoints.py` | Merma del 20.0% calculada en CAC001; semáforo rojo en vivo; bloqueo de guardado sin justificación ($\ge 10$ caracteres). | **Cumplido** |
| **RF05** | Indicadores económicos: costo unitario (\$20.000 COP/kg) y margen (20.0%). | `src/frontend/src/components/TransformacionView.jsx` | `src/backend/domain/calculos.py` | `tests/test_calculos.py` | Fórmulas exactas en `Decimal`; desglose transparente en UI con supuestos agroindustriales oficiales. | **Cumplido** |
| **RF06** | Ficha Comercial Pública (Pasaporte Digital) consultable por QR vectorial SVG offline. | `src/frontend/src/components/PasaportePublico.jsx` | `src/backend/routers/pasaporte.py` | `tests/test_api_endpoints.py`<br>`tests/test_seguridad_calidad.py` | QR generado 100% offline; costos internos y teléfonos estrictamente eliminados del DTO de respuesta. | **Cumplido** |
| **RF07** | Persistencia y recuperación tras reinicio mediante SQLite WAL y snapshot atómico. | SQLite 3 Embebido (`cacao_dev.db`) | `src/backend/infra/database.py` | `datos/backup.py`<br>`datos/restore.py`<br>`tests/test_auditoria_4_pruebas.py` | Respaldo atómico en caliente en **15.68 ms** y restauración íntegra en **18.19 ms** sin pérdida de transacciones. | **Cumplido** |
| **RF08** | Control de existencias, rechazo de sobreconsumo e idempotencia de peticiones. | `src/frontend/src/components/TransformacionView.jsx` | `src/backend/services/inventario.py` | `tests/test_api_endpoints.py`<br>`tests/test_seguridad_calidad.py` | `UPDATE ... WHERE kg_disponibles >= consumo` atómico rechaza sobreconsumo; cabecera `X-Idempotency-Key` evita duplicados. | **Cumplido** |
| **RF09** | Gestión de estados de calidad (Aprobación / Bloqueo Hora 12) y control RBAC real. | `src/frontend/src/components/AdminDashboard.jsx`<br>`src/frontend/src/components/TopRoleBar.jsx` | `src/backend/routers/lotes.py`<br>`src/backend/security/rbac.py` | `tests/test_hora12_regresion.py`<br>`tests/test_seguridad_calidad.py` | Operador recibe `HTTP 403 Forbidden` al intentar alterar estados; Administrador bloquea CAC001 con motivo obligatorio. | **Cumplido** |
| **RF10** | Bitácora de auditoría inmutable protegida por triggers DDL de base de datos. | `src/frontend/src/components/AuditLogView.jsx` | `src/backend/routers/auditoria.py`<br>`src/backend/infra/database.py` | `tests/test_api_endpoints.py`<br>`tests/test_seguridad_calidad.py` | Triggers nativos `BEFORE UPDATE` y `BEFORE DELETE` abortan modificaciones maliciosas; timestamp local en hora legal COT (UTC-5). | **Cumplido** |
| **RF11** | Consulta filtrada y exportación en CSV con BOM `utf-8-sig` y sanitización CWE-1236. | `src/frontend/src/components/AdminDashboard.jsx` | `src/backend/routers/export.py` | `tests/test_api_endpoints.py`<br>`tests/test_seguridad_calidad.py` | Descarga de CSV compatible con Excel sin alterar tildes; neutralización anti-inyección anteponiendo comilla simple (`'`). | **Cumplido** |
| **RF12** | Balance económico robusto, neutralización de 3 divisiones por cero y economía circular. | `src/frontend/src/components/AdminDashboard.jsx` | `src/backend/domain/calculos.py` | `tests/test_calculos.py`<br>`tests/test_seguridad_calidad.py` | Blindaje ante salida=0 o precio=0; valorización secundaria de cascarilla residual (10% a \$3.000 COP/kg = \$60.000 COP). | **Cumplido** |
| **RF13** | Catálogo Industrial & Botánico B2B de Mermas (Venta de Cascarilla por Kilo y Cotización Offline). | `src/frontend/src/components/landing/CatalogoLotesPublico.jsx` | `src/backend/routers/subproductos.py` | `tests/test_subproductos_catalogo.py` | Monetización de mermas (\$14.500–\$16.500/kg) para fertilizantes/cosmética; radicación offline con folio único inmutable. | **Cumplido** |

---

## 4. Instrucciones Rápidas de Verificación y Evaluación

### 4.1 Lanzamiento Unificado en 1 Clic (Windows)
Desde la raíz del repositorio, ejecute:
```cmd
start.bat
```
O desde PowerShell:
```powershell
.\start.ps1
```

### 4.2 Verificación de la Suite de Pruebas Automatizadas (38/38 Tests)
Para ejecutar la batería completa de pruebas unitarias, de integración, seguridad RBAC, inmutabilidad y regresión:
```powershell
python -m pytest tests/ -v
```
- **Resultado Certificado**: `38 passed in 1.73s` (100% de éxito).

### 4.3 Puntos de Acceso y URLs de Demostración Local
- **Aplicación Web Principal**: `http://localhost:5173`
- **Documentación Interactiva de APIs (Swagger)**: `http://localhost:8000/docs`
- **Sonda de Salud del Backend (Healthcheck)**: `http://localhost:8000/health`

### 4.4 Credenciales Preconfiguradas para la Demostración
- **Administrador**: Usuario `admin` | Contraseña `admin123`
- **Operador**: Usuario `operador` | Contraseña `operador123`
- **Comprador / Evaluador Externo**: Acceso directo sin autenticación a la Ficha Comercial QR y Catálogo B2B.

---

## 5. Lista de Verificación de Criterios del Jurado Calificador

- [x] **Autonomía Offline Certificada**: Cero dependencias de CDNs, APIs externas o fuentes remotas. QR generado en cliente con SVG.
- [x] **Rigor Aritmético (Decimal)**: Caso base `CAC001` reproduce exactamente: Merma = 20.00%, Costo Unitario = $20.000,00 COP/kg, Margen = 20.00%.
- [x] **Incidencia Hora 12 Resuelta**: Bloqueo preventivo de CAC001 con trazabilidad de calidad reflejada en el Pasaporte Digital.
- [x] **Seguridad de Datos y RBAC**: Denegación estricta con HTTP 403 Forbidden interceptado en el backend ante intentos de operadores.
- [x] **Inmutabilidad de Auditoría**: Triggers nativos DDL en SQLite que abortan sentencias fraudulentas de actualización o borrado.
- [x] **Privacidad en Pasaporte Comercial**: Cero exposición de costos internos, márgenes de intermediación ni teléfonos privados.
- [x] **Persistencia y Respaldo Atómico**: Snapshot en caliente verificado en 15.68 ms y restauración en 18.19 ms vía SQLite WAL.
- [x] **Innovación y Economía Circular B2B**: Catálogo de aprovechamiento de biomasa y venta de cascarilla por kilo con deslinde ético de no manufactura masiva B2C.
- [x] **Transparencia en IA (Numeral 4)**: Bitácora completa de prompts, modelos y supervisión humana documentada en `E08_IA_y_fuentes.pdf`.

---
*Fin de ENTREGA.md — TrazaCao Huila (Equipo 1)*
