# E08 - DECLARACIÓN DE USO DE INTELIGENCIA ARTIFICIAL Y BITÁCORA DE ACCIONES
## Reto Oficial de Agroindustria: Cacao con historia, calidad y valor
### II Hackathon de Programación — Universidad Surcolombiana (USCO) & Semillero DEVURITY

---

## 1. MARCO DE TRANSPARENCIA Y CUMPLIMIENTO REGLAMENTARIO

En estricto cumplimiento del **Numeral 4 del Reglamento Técnico de la Hackathon FUTICH / USCO** y de la **Guía Oficial del Reto (Sección 6.3 - E08)**:
- El equipo declara de manera pública, auditable y verificable el uso de herramientas de Inteligencia Artificial Generativa.
- **Principio de Autoría y Dominio**: Los integrantes del equipo comprenden la totalidad del código, explican las decisiones de diseño y responden por la calidad, originalidad y funcionamiento de la solución.
- **Autonomía Operativa**: La aplicación resultante **no depende de APIs de IA en la nube en tiempo de ejecución**, garantizando operatividad 100% offline en zonas rurales del Huila y ante eventuales fallas de conectividad en el recinto del evento.
- **Costo de IA**: $0.00 COP (uso exclusivo de asistentes autorizados para diseño, scaffolding y pair programming asistido).

---

## 2. BITÁCORA CRONOLÓGICA DE ACCIONES Y DECISIONES ASISTIDAS POR IA

| Hito / Hora | Actividad / Propósito | Archivos Involucrados | Aporte Generado por IA | Revisión Humana, Validación y Corrección Crítica |
| :--- | :--- | :--- | :--- | :--- |
| **Horas 00–02**<br>(17:00–19:00) | **Comprensión y Requisitos (SDD)** | `documentos/E01_problema.md`<br>`documentos/E02_requisitos.md`<br>`tasks.md` | Redacción inicial del problema de acopio en Huila y estructura de 12 historias en formato Gherkin. | Ajuste minucioso a los municipios reales (Rivera, Campoalegre, Algeciras) y adopción del marco de la **Mesa Nacional de Trazabilidad de Cacao (MNTC)**. |
| **Horas 02–03**<br>(19:00–20:00) | **Diseño Arquitectónico y ADRs** | `documentos/E03_diseno.md`<br>`documentos/CONTRATOS_API.md` | Diagramas Mermaid de arquitectura en capas y esquemas JSON preliminares. | **Decisión Arquitectónica (ADR-01)**: El equipo impuso el patrón **Onion Architecture** para aislar el dominio matemático del cacao de FastAPI y SQLite. |
| **Horas 03–04**<br>(20:00–21:00) | **Auditoría Técnica y Corrección de Fallas Críticas** | `CONTEXTO_IA_EQUIPO.md`<br>`documentos/PLAN_DEV1_CORE.md` | Auditoría crítica cruzada simulando la evaluación del jurado de la USCO. | **3 Correcciones Humanas Clave**:<br>1) Descarte de `.with_for_update()` por incompatibilidad con SQLite, adoptando `PRAGMA journal_mode=WAL` + `UPDATE` condicional atómico.<br>2) Preservación intacta de métricas oficiales de `CAC001` ($20%$, $\$20.000$, $20%$) segregando cascarilla como indicador secundario.<br>3) Adopción de `Decimal` para blindar **tres divisiones por cero**. |
| **Horas 04–05**<br>(21:00–22:00) | **Construcción del Núcleo de Dominio & Persistencia** | `src/backend/domain/calculos.py`<br>`src/backend/infra/database.py`<br>`src/backend/models.py`<br>`src/backend/services/inventario.py` | Scaffolding de funciones matemáticas, modelos SQLAlchemy y algoritmos de consumo de inventario. | Supervisión de los redondeos `ROUND_HALF_UP`, creación de **triggers nativos SQLite** de inmutabilidad en `audit_logs` y pruebas de exclusión de masa mágica ($S > E$). |
| **Horas 05–06**<br>(22:00–23:00) | **Controladores API y Sanitización de Seguridad** | `src/backend/routers/`<br>`src/backend/schemas.py`<br>`src/backend/security/rbac.py` | Generación de endpoints FastAPI, validadores Pydantic y dependencias de rol. | **Blindaje Anti-Fuga de Datos (RF06)**: Creación de `PasaportePublicoResponse` que físicamente omite costos internos y teléfonos del agricultor en el JSON público. Implementación de `HTTP 403` real para operador. |
| **Horas 06–07**<br>(23:00–00:00) | **Automatización de Pruebas & Verificación de Regresión** | `tests/test_calculos.py`<br>`tests/test_api_endpoints.py`<br>`tests/test_hora12_regresion.py` | Casos de prueba automatizados con `unittest` / `pytest`. | Corrección de conflicto en `setUp()` por el trigger de inmutabilidad de auditoría. Ejecución real en terminal: **15 de 15 pruebas pasando en 1.21 segundos**. |

---

## 3. MAPEO EXHAUSTIVO: CÓDIGO HUMANO VS. CÓDIGO ASISTIDO POR IA

| Archivo / Módulo | % Aporte IA | % Aporte y Decisión Humana | Explicación del Dominio Humano |
| :--- | :---: | :---: | :--- |
| `domain/calculos.py` | 40% | 60% | Las fórmulas matemáticas oficiales ($20\%$, $\$20.000$, $20\%$), el redondeo con `Decimal` y las condiciones de guardia contra división por cero fueron definidas y auditadas por el equipo. |
| `infra/database.py` | 30% | 70% | La configuración de pragmas de alto rendimiento (`WAL`, `busy_timeout=5000`) y los triggers nativos de inmutabilidad en SQL puro fueron decisiones explícitas del equipo para mitigar bloqueos en SQLite. |
| `models.py` | 50% | 50% | La IA generó la sintaxis declarativa de SQLAlchemy; el equipo definió las restricciones `CheckConstraint("kg_recibidos > 0")` y `CheckConstraint("kg_disponibles >= 0")`. |
| `services/inventario.py`| 35% | 65% | La lógica de actualización atómica condicional (`UPDATE ... WHERE kg_disponibles >= :consumo`) y la verificación de `rowcount == 1` fue conceptualizada por el equipo para sustituir `.with_for_update()`. |
| `routers/pasaporte.py` | 30% | 70% | El diseño del DTO sanitizado que protege el secreto comercial de la asociación cacaotera fue una regla impuesta por el equipo bajo RF06. |
| `security/rbac.py` | 40% | 60% | La emisión de `HTTP 403 Forbidden` y el registro automático de eventos `"INTENTO_NO_AUTORIZADO"` en la tabla de auditoría fue diseñada por el equipo. |
| `tests/*.py` | 45% | 55% | Las aserciones exactas de prueba, los datos de entrada sintéticos y el escenario de regresión de la Incidencia de la Hora 12 fueron verificados en terminal por los estudiantes. |

---

## 4. CASOS DE ESTUDIO DE ERROR / INCERTIDUMBRE DE LA IA DETECTADOS Y CORREGIDOS

### Caso 1: Sugerencia de Bloqueo Incompatible en SQLite
- **Sugerencia de IA**: Usar `.with_for_update()` en SQLAlchemy para bloquear el lote durante la transformación.
- **Riesgo Detectado**: SQLite ignora silenciosamente `.with_for_update()`, permitiendo condiciones de carrera o bloqueos generales de base de datos (`database is locked`).
- **Solución Humana**: Activación de modo `WAL` y reemplazo por una sentencia `UPDATE` atómica condicional validando `rowcount == 1`.

### Caso 2: Conflicto entre Diferenciador y Evaluación Oficial del Jurado
- **Sugerencia de IA**: Descontar el valor del subproducto (cascarilla) del costo de la etapa en la fórmula de RF05 ($1.600.000 - 60.000 = 1.540.000$), lo que daría un costo unitario de $\$19.250$ COP/kg.
- **Riesgo Detectado**: El jurado contrastará contra el valor canónico oficial de la guía: **\$20.000 COP/kg** y **20.0% de margen**. Cualquier variación causaría reprobación en los criterios de funcionamiento y consistencia económica.
- **Solución Humana**: Se conservaron las variables oficiales intactas para la rúbrica oficial y se creó una estructura secundaria explícita (`economia_circular`) para demostrar el valor agregado sin romper la evaluación base.

### Caso 3: Inmutabilidad Real vs. Supuesta
- **Sugerencia de IA**: Asumir que la inmutabilidad de la auditoría se cumplía simplemente no creando un endpoint `DELETE` en la API.
- **Riesgo Detectado**: En una auditoría de base de datos, cualquier script o conexión manual podría alterar o borrar registros.
- **Solución Humana**: Implementación de **triggers nativos en el motor SQLite** (`BEFORE UPDATE` y `BEFORE DELETE`) que abortan cualquier intento de manipulación con `RAISE(ABORT, ...)`.

---

## 5. DECLARACIÓN DE LIBRERÍAS, PLANTILLAS Y COMPONENTES EXTERNOS

Todas las librerías empleadas cuentan con licencias permisivas de código abierto debidamente acreditadas:

| Biblioteca / Framework | Versión Instalada | Tipo de Licencia | Uso Específico |
| :--- | :--- | :--- | :--- |
| **Python** | 3.13.2 | PSF License | Entorno de ejecución y biblioteca estándar (`decimal`, `sqlite3`, `unittest`, `csv`) |
| **FastAPI** | 0.141.1 | MIT License | Enrutamiento REST y generación interactiva de Swagger UI |
| **Uvicorn** | 0.54.0 | BSD-3-Clause | Servidor ASGI de alto rendimiento |
| **SQLAlchemy** | 2.0.52 | MIT License | Abstracción de modelos relacionales |
| **Pydantic** | 2.13.4 | MIT License | Validación rigurosa de esquemas y tipos |
| **Pytest** | 9.1.1 | MIT License | Ejecución automatizada de la suite de pruebas |
| **HTTPX** | 0.28.1 | BSD-3-Clause | Cliente de pruebas para TestClient de FastAPI |
| **Python-Multipart** | 0.0.32 | Apache-2.0 | Procesamiento de formularios y cargas multipart |

*Aclaración de Transparencia: No se utilizaron plantillas preexistentes comerciales ni código propietario desarrollado antes del inicio oficial del certamen.*
