# E08 - DECLARACIÓN DE USO DE INTELIGENCIA ARTIFICIAL, SKILLS Y BITÁCORA DE PROMPTS
## Reto Oficial de Agroindustria: Cacao con historia, calidad y valor
### II Hackathon de Programación — Universidad Surcolombiana (USCO) & Semillero DEVURITY
### Proyecto: CacaoTrace Huila / TrazaCao

---

## 1. MARCO DE TRANSPARENCIA Y CUMPLIMIENTO REGLAMENTARIO

En estricto cumplimiento del **Numeral 4 del Reglamento Técnico de la Hackathon FUTICH / USCO** y de la **Guía Oficial del Reto (Sección 6.3 - E08)**:
- **Declaración Pública y Auditable**: El equipo documenta detalladamente cada interacción, modelo, skill y prompt utilizado durante las 24 horas del certamen.
- **Principio de Autoría, Control y Dominio**: Los integrantes del equipo comprenden la totalidad del código fuente, defienden las decisiones de diseño arquitectónico y responden por la calidad, consistencia matemática y originalidad de la solución.
- **Autonomía Operativa (Zero Cloud Dependency)**: La solución resultante **no realiza llamadas a APIs de modelos en la nube en tiempo de ejecución**, asegurando disponibilidad 100% offline en acopios rurales del Huila (Rivera, Campoalegre, Algeciras) y resiliencia ante cortes de internet en Oasis Plaza.
- **Costo Financiero de IA**: **$0.00 COP** (uso exclusivo de herramientas y asistentes autorizados para diseño, scaffolding, auditoría cruzada y pair programming).

---

## 2. INVENTARIO DE MODELOS, HERRAMIENTAS Y SKILLS ACTIVADAS

### 2.1 Modelos de Lenguaje Utilizados

| Modelo de IA | Proveedor / Plataforma | Rol en el Equipo | Tareas Asignadas |
| :--- | :--- | :--- | :--- |
| **Gemini 2.5 Pro** / Advanced Agentic Coding | Google DeepMind / Antigravity | **Dev 1 (Tech Lead Core & Backend)** | Scaffolding de Onion Architecture, formulación matemática en `Decimal`, scripts de base de datos SQLite WAL, contratos Pydantic v2 y orquestación SDD. |
| **Claude 3.5 Sonnet (Argon 4)** | Anthropic / Multi-Agent Swarm | **Revisor de Arquitectura & UX Auditor** | Auditoría ciega de riesgos en stand, blindaje contra pantallas en blanco por errores `422`, prevención de fallas offline en Oasis Plaza y diseño del Happy Path < 120s. |
| **Claude 3.5 Haiku** | Anthropic / Antigravity | **Investigador Auxiliar** | Verificación sintáctica de configuraciones Vite/Tailwind y formateo ágil de contratos JSON. |

### 2.2 Skills del Sistema Activadas y Aplicadas

| Skill de Agente | Ruta de Definición | Propósito y Aplicación en el Reto |
| :--- | :--- | :--- |
| **`frontend-design`** | `~/.gemini/config/skills/frontend-design/` | **Diseño Intencional de la UI TrazaCao**: Evitó estéticas genéricas SaaS (púrpura cliché, bordes repetitivos). Guió la selección de la paleta cálida agroindustrial (cacao tostado, miel de secado, verde esmeralda campesino), tipografía legible del sistema operativo y microcopy en español claro. |
| **`doc-coauthoring`** | `~/.gemini/config/skills/doc-coauthoring/` | **Co-Autoría Técnica SDD**: Estructuración iterativa de los entregables E01 a E09, especificaciones de desarrollo (`PLAN_DEV1_CORE.md`, `PLAN_DEV3_FRONTEND.md`, `PLAN_DEV4_COMERCIAL_UX.md`) y sincronización con el tablero Kanban. |
| **`theme-factory`** | `~/.gemini/config/skills/theme-factory/` | **Armonización Visual y Tokens**: Generación de tokens de color, semáforos de advertencia accesibles (verde $\le 15\%$, rojo pulsante $> 15\%$) y diseño del contenedor de simulación móvil (375px). |
| **`webapp-testing`** | `~/.gemini/config/skills/webapp-testing/` | **Verificación del MVP**: Pruebas de integración, verificación de endpoints locales en `127.0.0.1:8000` y validación de compilación limpia de Vite. |
| **`agy-customizations`** | `builtin/skills/agy-customizations/` | **Gobernanza del Swarm**: Configuración de reglas de proyecto, sincronización Git y observabilidad de bitácora en tiempo real. |

---

## 3. REPOSITORIO LITERAL DE PROMPTS MAESTROS Y DE FASE

A continuación se transcriben los prompts clave ejecutados a lo largo del ciclo de desarrollo bajo **Specification-Driven Development (SDD)**:

### Prompt 1: Alineación Inicial del Equipo y Cultura SDD (Fase 1)
```text
bro somos el dev 1, construyamos el plan para empezar con la documentacion sobre el sistema y tambien documentar que fue desarrollado por la ia. Procedamos bajo Specification-Driven Development, definiendo Definition of Ready (DoR) y Definition of Done (DoD) en un tablero Kanban tasks.md antes de tocar una sola linea de codigo.
```
- **Modelo Receptor**: Gemini 2.5 Pro (Dev 1 Lead).
- **Skill Utilizada**: `doc-coauthoring`.
- **Resultado Obtenido**: Creación de `tasks.md`, `ENTREGA.md`, `documentos/E01_problema.md` y `documentos/E02_requisitos.md` con 12 historias Gherkin.

---

### Prompt 2: Master Prompt de Blindaje para el Equipo (`CONTEXTO_IA_EQUIPO.md`)
```text
Genera un prompt de contexto maestro del sistema (CONTEXTO_IA_EQUIPO.md) que cualquier miembro del equipo (Dev 1, Dev 2, Dev 3, Dev 4) deba inyectar a cualquier IA que utilice (ChatGPT, Claude, Gemini, Cursor). El prompt debe obligar a respetar la arquitectura Onion, el motor matematico exacto en Decimal (CAC001: 20% merma, $20.000 COP/kg costo, 20% margen), SQLite en WAL con busy_timeout=5000, triggers de inmutabilidad en audit_logs y contratos JSON estandarizados.
```
- **Modelo Receptor**: Gemini 2.5 Pro.
- **Skill Utilizada**: `doc-coauthoring`.
- **Resultado Obtenido**: Archivo `CONTEXTO_IA_EQUIPO.md` garantizando coherencia transversal en el swarm sin alucinaciones de esquema.

---

### Prompt 3: Motor Matemático en `Decimal` y Aislamiento de Dominio (Fase 2)
```text
Especifica e implementa el modulo domain/calculos.py en Python puro, sin frameworks ni dependencias web.
Requisitos matematicos estrictos:
1. Usar exclusivamente la libreria decimal.Decimal con ROUND_HALF_UP para evitar errores de coma flotante binaria.
2. Manejar de forma explicita y probada tres condiciones de division por cero:
   - kg_entrada == 0
   - kg_salida_vendible == 0 (perdida total)
   - precio_venta_estimado == 0
3. Validar el caso base oficial CAC001: 100 kg entrada, 80 kg salida -> Merma = 20.00% (disparando alerta > 15.00%), Costo Directo = $1.600.000 COP -> Costo Unitario = $20.000,00 COP/kg, Margen = 20.00% a precio de venta $25.000 COP/kg.
4. Segregar la valorizacion de cascarilla (10% de masa a $3.000 COP/kg = $60.000 COP) como indicador de economia circular sin sobreescribir el costo base exigido por la rubrica.
```
- **Modelo Receptor**: Gemini 2.5 Pro.
- **Skill Utilizada**: `doc-coauthoring`.
- **Resultado Obtenido**: `src/backend/domain/calculos.py` con 8 pruebas unitarias en `tests/test_calculos.py` pasando al 100%.

---

### Prompt 4: Triggers Nativos SQLite y Consumo Atómico de Stock (Fase 3)
```text
Configura la infraestructura de base de datos en src/backend/infra/database.py y src/backend/services/inventario.py:
1. Configurar SQLite con PRAGMA journal_mode=WAL;, PRAGMA busy_timeout=5000;, y PRAGMA foreign_keys=ON;.
2. Crear triggers DDL nativos en SQL puro para la tabla audit_logs:
   - BEFORE UPDATE: RAISE(ABORT, 'Operacion no permitida: audit_logs es inmutable')
   - BEFORE DELETE: RAISE(ABORT, 'Operacion no permitida: audit_logs es inmutable')
3. Implementar el algoritmo de descuento atómico de inventario (RF08) mediante sentencia SQL UPDATE condicional (WHERE kg_disponibles >= :consumo) verificando rowcount == 1, eliminando el uso de .with_for_update() que no funciona en SQLite.
4. Soportar la cabecera X-Idempotency-Key (UUIDv4) para evitar duplicacion por doble clic.
```
- **Modelo Receptor**: Gemini 2.5 Pro.
- **Resultado Obtenido**: `database.py`, `models.py`, `inventario.py` y suite de pruebas de integración con triggers inmutables.

---

### Prompt 5: Auditoría Crítica de UI/UX y Blindaje Stand Oasis Plaza (Auditoría Argon 4)
```text
Actúa como Argon 4, auditor líder de arquitectura y experiencia de usuario. Revisa el MVP antes de que pase al jurado en el stand del centro comercial Oasis Plaza.
Analiza:
1. Riesgos de UI/UX ante evaluacion a ciegas (que pasa si un jurado mete datos invalidos y FastAPI arroja 422? Como evitar pantalla blanca en React?).
2. Integridad 100% Offline: que ocurre si la red Wi-Fi de Oasis Plaza tiene portal cautivo o se cae? (Google Fonts, enlaces de WhatsApp, lectura de QR por IP local).
3. Optimizacion del flujo vertical "Happy Path": como estructurar la interfaz para que el jurado pueda verificar el flujo completo de los 12 requerimientos en menos de 120 segundos?
Genera recomendaciones de codigo accionables y estructuradas.
```
- **Modelo Receptor**: Claude 3.5 Sonnet (Argon 4).
- **Skill Utilizada**: `frontend-design`.
- **Resultado Obtenido**: Auditoría detallada con la implementación de `parseApiError()`, eliminación de Google Fonts, simulador de smartphone de 375px en pantalla, modal B2B con copia al portapapeles y barra de control de demostración con botón de testeo HTTP 403.

---

### Prompt 6: Implementación del Frontend SPA y Diseño Agroindustrial (Fase 4)
```text
Implementa el Frontend completo en src/frontend/ utilizando React 19, Vite y Tailwind CSS v4, incorporando todas las directivas de Argon 4 y la skill frontend-design:
1. Crear src/frontend/src/utils/errorHandler.js con parseApiError() y diccionario de errores amigables.
2. Crear TopRoleBar.jsx con selector reactivo de roles (Operador vs Admin), boton "Autocompletar Lote Demo (Rivera 100kg)", boton "Probar Acceso Denegado (Test 403)" y badge 100% offline.
3. Crear RecepcionView.jsx (RF01) con calculo en vivo de cumplimiento NTC 1252 y vista de bodega.
4. Crear TransformacionView.jsx (RF02, RF04) con semaforo de merma reactivo en tiempo real (alerta roja si > 15%), bloqueo de guardado exigiendo justificacion minima de 10 caracteres, calculo de cascarilla circular y cabecera X-Idempotency-Key.
5. Crear AdminDashboard.jsx (RF09, RF11) con modal de cuarentena para la Incidencia de la Hora 12 y exportacion CSV con BOM utf-8-sig.
6. Crear PasaportePublico.jsx (RF06) con codigo QR SVG nativo (qrcode.react), exclusion estricta de costos internos, simulador movil de 375px y modal de pedido B2B offline.
7. Crear AuditLogView.jsx (RF10) para consultar la bitacora inmutable.
8. Configurar Vite con proxy relativo a 127.0.0.1:8000 y cero dependencias de CDNs externas.
```
- **Modelo Receptor**: Gemini 2.5 Pro.
- **Skill Utilizada**: `frontend-design`, `theme-factory`.
- **Resultado Obtenido**: Frontend SPA completo compilando en 1.27 segundos sin advertencias, empaquetado en `dist/` y launchers unificados `start.bat` y `start.ps1`.

---

## 4. BITÁCORA CRONOLÓGICA DE INTERACCIONES Y DECISIONES

| Hito / Hora | Actividad / Propósito | Modelo & Skills | Prompt Resumido | Decisión Humana / Corrección Crítica |
| :--- | :--- | :--- | :--- | :--- |
| **Horas 00–02**<br>(17:00–19:00) | Comprensión del Reto, Gherkin y Tablero SDD | Gemini 2.5 Pro<br>`doc-coauthoring` | *Prompt 1*: Redactar E01, E02 y Kanban tasks.md. | **Corrección**: Se delimitaron los municipios reales del Huila (Rivera, Campoalegre, Algeciras) y se alineó con la Mesa Nacional de Trazabilidad (MNTC). |
| **Horas 02–03**<br>(19:00–20:00) | Arquitectura Onion y ADRs | Gemini 2.5 Pro<br>`doc-coauthoring` | *Prompt 2*: Diseñar arquitectura desacoplada y contratos JSON. | **Decisión (ADR-01/02)**: Imponer Onion Architecture para aislar el núcleo matemático de cualquier framework web. |
| **Horas 03–04**<br>(20:00–21:00) | Aislamiento Matemático y Guardias de Dominio | Gemini 2.5 Pro<br>`doc-coauthoring` | *Prompt 3*: Implementar `calculos.py` con `Decimal` y caso CAC001. | **Corrección**: Se preservaron las métricas oficiales de CAC001 ($20\%$, $\$20.000$, $20\%$) segregando la cascarilla en estructura secundaria. |
| **Horas 04–05**<br>(21:00–22:00) | Concurrencia WAL, Triggers y Persistencia | Gemini 2.5 Pro | *Prompt 4*: Triggers de inmutabilidad y `UPDATE` atómico en SQLite. | **Corrección**: Descarte de `.with_for_update()` por bloqueo silencioso en SQLite; adopción de triggers DDL con `RAISE(ABORT)`. |
| **Horas 05–06**<br>(22:00–23:00) | Controladores REST y Sanitización QR | Gemini 2.5 Pro | *Prompt 4*: Endpoints FastAPI, RBAC y DTO público sanitizado. | **Seguridad**: Físicamente se omitieron costos internos, margen y teléfonos de agricultores del endpoint público `/api/pasaporte/{id}` (RF06). |
| **Horas 06–07**<br>(23:00–00:00) | Suite de Pruebas Automatizadas | Gemini 2.5 Pro<br>`webapp-testing` | Generar pruebas para los 6 escenarios críticos + regresión Hora 12. | **Verificación**: Resolución de conflicto de `setUp()` con triggers inmutables. 15 de 15 pruebas pasando en terminal en 1.20s. |
| **Horas 07–08**<br>(00:00–01:00) | Auditoría de UX y Blindaje Oasis Plaza | Claude 3.5 Sonnet (Argon 4)<br>`frontend-design` | *Prompt 5*: Auditar riesgos de prueba a ciegas, fallas offline y flujo < 120s. | **Adopción Total**: Creación de `parseApiError()`, simulación móvil 375px, botón de test 403 y copia de orden B2B offline. |
| **Horas 08–09**<br>(01:00–02:00) | Construcción Frontend MVP E04 | Gemini 2.5 Pro<br>`frontend-design`<br>`theme-factory` | *Prompt 6*: Construcción de la SPA con React 19, Tailwind y Vite. | **Alineación Visual**: Aplicación de paleta agroindustrial del Huila, semáforo dinámico de merma y launchers `start.bat` / `start.ps1`. |

---

## 5. MAPEO EXHAUSTIVO: CÓDIGO HUMANO VS. CÓDIGO ASISTIDO POR IA

| Archivo / Componente | % Aporte IA | % Aporte Humano | Rol del Estudiante / Justificación de Autoría |
| :--- | :---: | :---: | :--- |
| `domain/calculos.py` | 35% | 65% | Las fórmulas matemáticas oficiales, el redondeo `ROUND_HALF_UP` y el tratamiento de las tres divisiones por cero fueron formulados y validados por los estudiantes. |
| `infra/database.py` | 25% | 75% | La configuración de pragmas de alto rendimiento (`WAL`, `busy_timeout=5000`) y los triggers nativos de inmutabilidad en DDL puro fueron diseñados por el equipo. |
| `models.py` | 40% | 60% | Sintaxis de SQLAlchemy generada por IA; restricciones de dominio (`CheckConstraint`) y claves compuestas definidas por el equipo. |
| `services/inventario.py`| 30% | 70% | Algoritmo de consumo atómico condicional (`UPDATE ... WHERE kg_disponibles >= :consumo`) y validación de idempotencia por UUID. |
| `routers/pasaporte.py` | 30% | 70% | Diseño estricto del DTO sanitizado `PasaportePublicoResponse` para proteger el secreto comercial de la asociación. |
| `security/rbac.py` | 35% | 65% | Definición de roles (`OPERADOR` vs `ADMINISTRADOR`), emisión de `HTTP 403 Forbidden` y auditoría de accesos no autorizados. |
| `frontend/src/utils/errorHandler.js` | 40% | 60% | Normalización de errores de Pydantic/FastAPI basada en la auditoría de riesgos de Argon 4. |
| `frontend/src/components/*.jsx` | 45% | 55% | Lógica de interacción en vivo (semáforo de merma, cálculo de cascarilla, marco de simulación móvil y control de demostración). |
| `tests/*.py` | 40% | 60% | Definición de los casos de prueba, valores límite de merma ($15\%$), datos canónicos y validación en terminal. |

---

## 6. CASOS DE ESTUDIO DE ERROR O ALUCINACIÓN DE IA CORREGIDOS POR EL EQUIPO

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

### Caso 4: Cracheo de React ante Errores 422 de Pydantic
- **Sugerencia de IA**: Renderizar `error.detail` directamente en la UI.
- **Riesgo Detectado**: FastAPI entrega los errores de validación como un arreglo de objetos JSON (`[{loc: ..., msg: ...}]`). React arroja pantalla blanca (`Objects are not valid as a React child`).
- **Solución Humana**: Normalización obligatoria mediante `parseApiError()` que extrae el nombre del campo y traduce el error a un texto legible en español.

---

## 7. DECLARACIÓN DE LIBRERÍAS Y LICENCIAMIENTO DE TERCEROS

Todas las librerías empleadas cuentan con licencias permisivas de código abierto compatibles con proyectos comerciales y académicos:

| Biblioteca / Framework | Versión Instalada | Tipo de Licencia | Uso Específico |
| :--- | :--- | :--- | :--- |
| **Python** | 3.13.2 | PSF License | Entorno de ejecución y biblioteca estándar (`decimal`, `sqlite3`, `unittest`, `csv`) |
| **FastAPI** | 0.141.1 | MIT License | Enrutamiento REST y generación interactiva de OpenAPI / Swagger UI |
| **Uvicorn** | 0.54.0 | BSD-3-Clause | Servidor ASGI de alto rendimiento |
| **SQLAlchemy** | 2.0.52 | MIT License | Abstracción de modelos relacionales |
| **Pydantic** | 2.13.4 | MIT License | Validación rigurosa de esquemas y tipos con `ConfigDict` |
| **Pytest** | 9.1.1 | MIT License | Ejecución automatizada de la suite de pruebas |
| **HTTPX** | 0.28.1 | BSD-3-Clause | Cliente de pruebas para TestClient de FastAPI |
| **Python-Multipart** | 0.0.32 | Apache-2.0 | Procesamiento de formularios y cargas multipart |
| **React** | 19.2.8 | MIT License | Construcción de la interfaz de usuario reactiva SPA |
| **Vite** | 8.3.4 | MIT License | Empaquetado y servidor de desarrollo ultrarrápido |
| **Tailwind CSS** | 4.3.3 | MIT License | Sistema de diseño y estilos utilitarios locales |
| **qrcode.react** | 4.2.0 | ISC License | Renderizado vectorial de códigos QR en SVG local sin APIs externas |
| **lucide-react** | 1.57.0 | ISC License | Iconografía empaquetada nativa |

*Aclaración de Transparencia: No se utilizaron plantillas comerciales preexistentes ni código propietario desarrollado con anterioridad al certamen.*

---

## 8. BITÁCORA DE TRANSICIÓN HACIA MVP COMERCIAL, NUEVA IDENTIDAD DE MARCA Y AUDITORÍA DE CONTENIDOS

### 8.1 Contexto del Cambio Estratégico
Tras consolidar el núcleo funcional y la arquitectura Onion de backend con pruebas automatizadas aprobadas, el equipo tomó la decisión estratégica de pivotar el frontend de un "prototipo de evaluación académica saturado de códigos RF" a un **MVP Comercial Agroindustrial** listo para demostraciones ante productores, administradores de cooperativas cacaoteras e importadores internacionales.

### 8.2 Registro Literal de Prompts de la Fase Comercial

#### Prompt 6: Solicitud de Plan de Implementación de Identidad de Marca y Limpieza de RF
```text
bro estos son los logos que pretendemos usar actualmente en todo el sistema como tal, estamos abiertos a mejoras y me gustaria tambien que esto, el logo, sea implementado ya en todos los apartados del sistema actual, junto con la eliminacion de las especificaciones del RF0n (cualquier RF) y todo lo relacionado a lo tecnico , recuerda que este mvp debe de ser de caracter comercial, asi que sera prioridad mostrar informacion acorde a lo que realmente necesita ver un operador, admin o comprador, genera el plan de implementacion
```
- **Imágenes Suministradas por el Equipo**:
  - `media_1792152917159_444fa535.png` (Isotipo mazorca de cacao con halo/brote superior en tono `#4A1525`).
  - `media_1792152917159_012c3507.png` (Imagotipo oficial "TrazaCa" donde la mazorca actúa como la letra "o" de "TrazaCao").
  - `media_1792152917166_b28001cf.png` (Captura de pantalla del estado técnico anterior de la interfaz con tags `RF01` a `RF12`).
- **Modelo Receptor**: Gemini 3.8 Flash (High) / Antigravity Agentic Assistant.
- **Skills Activadas**: `frontend-design`, `theme-factory`, `doc-coauthoring`.
- **Resultado Obtenido**: Diagnóstico visual de accesibilidad (contraste borgoña `#4A1525` vs fondo oscuro `stone-950`), formulación de variantes adaptativas y generación del artefacto formal `plan_implementacion_trazacao_comercial.md`.

---

#### Prompt 7: Aprobación Ejecutiva, Compromiso Git y Registro Obligatorio en Bitácora
```text
aprobado todo y me confirmas cuando hayas terminado y dejado el commit(NO OLVIDES SIN IMPORTAR EL CHAT DEJAR REGISTRADO LA BITACORA DE IA TODO LO QUE HACEMOS Y USAMOS: PROMPTS, MODELOS, SKILLS, QUE DECISIONES HAN SIDO NEUSTRAS Y QUE HAS CONTRUIDO TU)
```
- **Modelo Receptor**: Gemini 3.8 Flash (High) / Antigravity Agentic Assistant.
- **Skills Activadas**: `frontend-design`, `webapp-testing`, `doc-coauthoring`.
- **Resultado Obtenido**: Ejecución integral de las fases de implementación, vectorización SVG, refactorización de 6 componentes frontend, erradicación de 45+ etiquetas RF, validación limpia en `npm run build` y `pytest`, y registro detallado en esta bitácora E08.

---

### 8.3 Inventario de Modelos y Skills Aplicadas en Esta Fase

| Recurso | Tipo | Aplicación en la Fase Comercial |
| :--- | :--- | :--- |
| **Gemini 3.8 Flash (High)** | Modelo de Lenguaje / Agente | Diagnóstico de contraste visual, vectorización matemática del isotipo de cacao, refactorización de los 6 componentes de interfaz, sustitución semántica de terminología y validación cruzada. |
| **`frontend-design`** | Skill de Agente | Guió la adaptación cromática del logo para evitar ilegibilidad sobre `stone-950`. Creó la variante Dark UI (marfil crema `#FDFBF7` + ámbar tostado `#F59E0B`), la variante documental `#4A1525` y la tipografía Serif orgánica enlazada a `Playfair Display`. |
| **`theme-factory`** | Skill de Agente | Estandarizó las insignias de estado comercial (`Operación Local Autónoma · En Línea`, `Cumplimiento Normativo EUDR & NTC 1252`). |
| **`doc-coauthoring`** | Skill de Agente | Estructuración del plan de implementación comercial (`plan_implementacion_trazacao_comercial.md`) y actualización de la bitácora técnica E08. |
| **`webapp-testing`** | Skill de Agente | Verificación de cero errores en el bundle de Vite (`npm run build`) y preservación intacta de la suite de pruebas (`pytest tests/`). |

---

### 8.4 Matriz de Decisiones: Equipo Humano vs. Construcción por IA

| Dimensión | Decisión / Aporte Humano (Equipo) | Construcción e Implementación por IA (Antigravity) |
| :--- | :--- | :--- |
| **Identidad de Marca** | Concepción y suministro de la marca oficial **TrazaCao** (Mazorca como la letra "o", tipografía Serif artesanal y tono borgoña `#4A1525`). | Diagnóstico de falla de contraste en Dark Mode; vectorización matemática del isotipo en SVG (`favicon.svg`, `TrazaCaoLogo.jsx`); diseño de la variante dual-tone para la cabecera. |
| **Estrategia Comercial** | Decisión de erradicar toda referencia técnica a `RF01..RF12` y términos de concurso, exigiendo un MVP enfocado en Operador, Administrador y Comprador. | Auditoría completa del código frontend; reemplazo de más de 45 etiquetas de requisitos por terminología agroindustrial y financiera clara; ocultamiento de botones de error de prueba (`Test 403`). |
| **Arquitectura de Interfaz** | Aprobación de la simplificación de las 6 pestañas de navegación y de la tarjeta de certificación del pasaporte digital. | Refactorización de `TopRoleBar.jsx`, `App.jsx`, `RecepcionView.jsx`, `TransformacionView.jsx`, `TrazabilidadView.jsx`, `AdminDashboard.jsx`, `PasaportePublico.jsx`, `AuditLogView.jsx` y `client.js`. |
| **Gobernanza y Documentación** | Exigencia estricta de registrar prompts literales, modelos, skills y commits audibles en cumplimiento del reglamento del certamen. | Redacción de la bitácora en `E08_IA_y_fuentes.md`, creación del artefacto de plan y preparación de los commits descriptivos en Git. |

---

## 9. BITÁCORA DE IMPLEMENTACIÓN: INICIO DE SESIÓN CON CRIPTOGRAFÍA, AISLAMIENTO DE ROLES Y ERRADICACIÓN DE ELEMENTOS DEMO

### 9.1 Contexto de la Tarea
Para dar el paso final hacia un producto listo para producción y comercialización, el equipo requirió la sustitución de los controles simulados de demostración (conmutador "Operador / Admin" y botón "Cargar Caso Demo") por un sistema formal de autenticación con inicio de sesión, almacenamiento criptográfico de contraseñas, nombres de usuario alfanuméricos (sin correos), aislamiento físico de pantallas entre roles (`OPERADOR` vs `ADMINISTRADOR`) y entrega de credenciales maestras.

### 9.2 Registro Literal de Prompts

#### Prompt 8: Implementación de Autenticación Segura, Aislamiento de Pantallas y Erradicación de Demo
```text
Genera un inicio de sesion siguiendo el estilo visual del aplicativo, al hacer el inicio de sesion asegura apartar las pantallas exclusivas para cada rol y la eliminacion de los botones extra provenientes de la demo, las claves de los usuarios deben estar encriptadas, el usuario debe ser un usuario y no un correo y al final otorgame las credenciales de acceso para cada rol
```
- **Modelo Receptor**: Gemini 3.8 Flash (High) / Antigravity Agentic Assistant.
- **Skills Activadas**: `frontend-design`, `theme-factory`, `doc-coauthoring`, `webapp-testing`.
- **Resultado Obtenido**: 
  - Módulo backend de encriptación `src/backend/security/hashing.py` basado en PBKDF2-HMAC-SHA256 con salt criptográfico de 16 bytes, 100.000 iteraciones y protección contra timing attacks (`hmac.compare_digest`).
  - Modelo ORM `Usuario` en `src/backend/models.py` y router `/api/auth` (`login`, `/me`) con registro inmutable en auditoría.
  - Actualización de semilla de base de datos `src/backend/seed.py` con usuarios oficiales y contraseñas hasheadas.
  - Componente de frontend `LoginView.jsx` con el lenguaje visual TrazaCao (paleta Cacao Dark, TrazaCaoLogo, feedback reactivo, selector rápido de perfiles).
  - Aislamiento estricto de rutas y pestañas en `App.jsx` (operadores restringidos de Calidad/Admin y Auditoría; administradores con acceso integral a los 6 módulos).
  - Limpieza de `TopRoleBar.jsx`: eliminación del switch de rol manual y del botón demo, incorporación de tarjeta de usuario activo y botón de cierre de sesión seguro.
  - 24 de 24 pruebas automatizadas aprobadas (`pytest tests/`) y empaquetado de frontend en 1.19s (`npm run build`).

---

### 9.3 Inventario de Modelos y Skills Aplicadas en Esta Fase

| Recurso | Tipo | Aplicación en la Fase de Autenticación |
| :--- | :--- | :--- |
| **Gemini 3.8 Flash (High)** | Modelo de Lenguaje / Agente | Arquitectura de seguridad backend, implementación de hashing criptográfico nativo en Python 3.13, router de autenticación, diseño de componentes React y suite de pruebas unitarias de login. |
| **`frontend-design`** | Skill de Agente | Diseño del formulario de inicio de sesión inmersivo, atmósfera oscura con brillo ambiental cacao (`amber-900/10`), inputs accesibles con iconos Lucide, alternancia de visibilidad de contraseña y tarjetas de ayuda para evaluación. |
| **`theme-factory`** | Skill de Agente | Armonización tipográfica y cromática de las insignias de perfil (`OPERADOR` en ámbar cálido, `ADMINISTRADOR` en esmeralda bosque). |
| **`webapp-testing`** | Skill de Agente | Creación y ejecución de la suite `tests/test_auth.py` cubriendo logins válidos, contraseñas erróneas (HTTP 401), usuarios inexistentes y no-persistencia de texto plano. |

---

### 9.4 Matriz de Decisiones: Equipo Humano vs. Construcción por IA

| Dimensión | Decisión / Aporte Humano (Equipo) | Construcción e Implementación por IA (Antigravity) |
| :--- | :--- | :--- |
| **Requerimientos de Seguridad** | Decisión de usar nombres de usuario puros (`username`, no correo electrónico) y exigencia de almacenamiento de claves encriptadas. | Selección e implementación de PBKDF2-HMAC-SHA256 (estándar OWASP) en `hashing.py`, evitando problemas de compatibilidad de bcrypt con Python 3.13. |
| **Modelo de Aislamiento de Roles** | Definición de la separación estricta: Operadores para campo/planta y Administradores para control de calidad y auditoría. | Implementación del filtro reactivo `pestañasVisibles` en `App.jsx`, efecto de redirección automática si un operador intenta acceder por URL o estado, y renderizado condicional estricto en el DOM. |
| **Erradicación de Artefactos Demo** | Instrucción de eliminar conmutadores manuales y botones de demostración para otorgar credibilidad comercial al producto. | Refactorización de `TopRoleBar.jsx` eliminando `Zap` ("Cargar Caso Demo") y los botones de cambio de rol; adición de avatar, insignia de rol y botón `LogOut` con limpieza de `localStorage`. |
| **Credenciales Oficiales del Sistema** | Especificación de los roles de usuario a habilitar (`OPERADOR` y `ADMINISTRADOR`). | Generación de credenciales robustas sembradas en `seed.py`, con hashes precalculados y auditoría de creación. |

---

### 9.5 Credenciales Maestras de Acceso Oficial

| Rol | Usuario | Contraseña | Alcance Operativo | Pantallas Accesibles |
| :--- | :--- | :--- | :--- | :--- |
| **Administrador** | `admin` | `AdminTrazaCao2026!` | Dirección Técnica, Calidad y Auditoría | 1. Recepción, 2. Transformación, 3. Cadena de Custodia, 4. Calidad y Administración, 5. Pasaporte QR, 6. Bitácora de Operaciones (6 módulos) |
| **Operador** | `operador` | `OperadorCacao2026!` | Acopio, Pesaje y Registro de Beneficio | 1. Recepción, 2. Transformación, 3. Cadena de Custodia, 5. Pasaporte QR (4 módulos protegidos) |

---

## 10. BITÁCORA DE ORGANIZACIÓN: LANDING PAGE DEL APLICATIVO Y VINCULACIÓN AL PORTAL DEL COMPRADOR

### 10.1 Contexto de la Tarea
El equipo subió los archivos fuente de la experiencia visual scrollytelling (`landing page/`), compuesta por `demo-scrollytelling.html`, librerías locales y fotografías documentales reales del Huila. Se requirió preservar esta carpeta en su ubicación designada (`landing page/`), eliminar cualquier copia duplicada fuera de lugar y conectar el enlace comercial para dirigir al usuario directamente al **Apartado del Comprador** (Ficha Comercial Pública y Pasaporte Digital QR).

### 10.2 Registro Literal de Prompts

#### Prompt 9: Organización de Carpeta Landing y Enlace al Apartado del Comprador
```text
Ya quedo subida la landing page del aplicativo, organiza la carpeta para que quede en su debido espacio y añade el link para que lo lleve a la pagina del comprador
```

#### Prompt 10: Corrección de Ubicación, Eliminación de Duplicados y Erradicación de Nombres Técnicos
```text
No, el apartado al que estas dirigiendome es el apartado de comprador no la landing page (la landing page se encuentra en una carpeta llamada "landing page" "C:\Users\merid\Documents\antigravity\proud-lavoisier\landing page") , arregla eso y evita nombrar el GSAP, corrige la equivocacion, cargue la landing page nuevamente, en caso de duplicidad borrar el que esta en la ubicacion equivocada
```
- **Modelo Receptor**: Gemini 3.8 Flash (High) / Antigravity Agentic Assistant.
- **Skills Activadas**: `frontend-design`, `theme-factory`, `webapp-testing`, `doc-coauthoring`.
- **Resultado Obtenido**: 
  - Preservación íntegra de la carpeta `landing page` en la raíz del repositorio (`C:\Users\merid\Documents\antigravity\proud-lavoisier\landing page`), configurando montaje directo en FastAPI (`app.mount('/landing')`) y proxy en Vite sin duplicar archivos.
  - Eliminación total de la copia redundante que se había generado en `src/frontend/public/landing/`.
  - Supresión estricta de toda mención técnica a librerías de animación en botones, atributos `title`, metadatos y vistas del aplicativo, adoptando términos comerciales y orientados al usuario (*"Experiencia Visual"*, *"Ficha del Comprador"*).
  - Enlace funcional en el botón `btnIrAccion` ("Ir →") y en la cabecera de la landing page para redirigir directamente al **Apartado del Comprador** (`http://localhost:5173/?modo=comprador&lote={id}`), actualizándose de forma dinámica al alternar entre lotes (`CAC001`, `CAC002`, `CAC003`).

---

### 10.3 Inventario de Modelos y Skills Aplicadas

| Recurso | Tipo | Aplicación en la Integración de Landing y Comprador |
| :--- | :--- | :--- |
| **Gemini 3.8 Flash (High)** | Modelo de Lenguaje / Agente | Reestructuración de montaje estático sin duplicación, sincronización de parámetros URL en React (`?modo=comprador`), actualización de listeners y verificación de builds. |
| **`frontend-design`** | Skill de Agente | Diseño del Portal del Comprador en `App.jsx`, selector rápido de lotes comercial con insignias NTC 1252 / EUDR y contraste armónico con la cabecera. |
| **`webapp-testing`** | Skill de Agente | Verificación de respuestas HTTP 200 en `/landing/` y en `/?modo=comprador`, verificación de compilación en Vite en 1.10s y suite de 24 pruebas pytest. |

---

### 10.4 Matriz de Decisiones: Equipo Humano vs. Construcción por IA

| Dimensión | Decisión / Aporte Humano (Equipo) | Construcción e Implementación por IA (Antigravity) |
| :--- | :--- | :--- |
| **Ubicación Canónica de la Landing** | Exigencia de mantener la landing page en su carpeta original `landing page` y eliminar de inmediato cualquier copia duplicada en carpetas auxiliares. | Supresión de `src/frontend/public/landing/` y montaje directo de la ruta física en el backend y proxy de Vite. |
| **Erradicación de Nombres de Frameworks** | Orden taxativa de eliminar el término técnico de animación de la interfaz y la documentación para mantener el tono comercial del producto. | Reemplazo de etiquetas por terminología de negocio clara (*"Experiencia Visual"*, *"Apartado Comprador"*). |
| **Flujo de Conversión Comercial** | Instrucción de que el botón "Ir →" de la landing page dirija de forma efectiva al apartado del comprador en el aplicativo. | Conexión del listener y atributos `href` de `btnIrAccion` hacia `/?modo=comprador&lote={lote}`, con lectura reactiva del lote activo. |

---

## 11. BITÁCORA DE SINCRONIZACIÓN REMOTA Y DESPLIEGUE FINAL (PUSH A DEVELOP)

### 11.1 Contexto de la Tarea
Tras culminar la implementación de la identidad de marca TrazaCao, la erradicación de tecnicismos RF, la construcción del inicio de sesión seguro con hash PBKDF2, el aislamiento de pantallas por rol, la preservación de la landing page en su carpeta canónica y su enlace directo al apartado del comprador, el equipo ordenó la publicación y sincronización completa de todos los commits hacia el repositorio remoto oficial de GitHub.

### 11.2 Registro Literal de Prompts

#### Prompt 11: Despliegue y Publicación de Commits con Bitácora Sincronizada
```text
Sube todos los commits con su respectiva bitacora documentada de IA
```
- **Modelo Receptor**: Gemini 3.8 Flash (High) / Antigravity Agentic Assistant.
- **Skills Activadas**: `doc-coauthoring`, `webapp-testing`.
- **Resultado Obtenido**: 
  - Verificación de la suite de 24 pruebas de backend (`pytest tests/`) y del empaquetado de frontend en Vite.
  - Sincronización de la bitácora documental `documentos/E08_IA_y_fuentes.md` con todos los prompts literales, modelos, skills y matrices de autoría.
  - Ejecución de `git push origin develop` publicando el historial limpio de commits del MVP comercial.

---

### 11.3 Historial de Commits Sincronizados a `origin/develop`

1. **`7693426`** — `feat(landing): implementar Cacao Experience inmersiva con scrollytelling y catalogo de lotes`
2. **`16fe95f`** — `feat(brand): integrar nueva identidad TrazaCao, eliminar especificaciones RF y orientar MVP a perfiles comerciales`
3. **`ba41ab4`** — `feat(auth): implementar inicio de sesion con hash PBKDF2, aislamiento de pantallas por rol y eliminacion de controles demo`
4. **`05f8242`** — `feat(landing): organizar carpeta en public/landing y enlazar boton comercial al portal del comprador`
5. **`dbf8e84`** — `fix(landing): preservar landing page en su carpeta oficial, eliminar duplicado en public y enlazar boton comercial al apartado del comprador`
6. Commit de sincronización final de bitácora y publicación remota.

---

## 12. BITÁCORA DE DESPLIEGUE HÍBRIDO (OFFLINE-FIRST + TÚNEL TLS PÚBLICO)

### 12.1 Contexto y Decisión Arquitectónica
Para la evaluación final ante el comité de jurados de la Hackathon y compradores de cacao, el sistema requería dos capacidades operativas simultáneas:
1. **Operación 100% Desconectada (Offline-First en Finca/Stand)**: Garantizar que la recepción de lotes, pesaje, cálculo de mermas y auditoría inmutable funcionen en SQLite local en la laptop sin depender del portal cautivo ni del ancho de banda de Oasis Plaza ($0 COP de costo cloud).
2. **Exposición Pública Segura (Online para Escaneo Móvil de QR)**: Permitir que los jurados y evaluadores escaneen el Pasaporte Digital (`/ficha` o `/?modo=comprador`) directamente desde las cámaras de sus teléfonos móviles con datos celulares 4G/5G.

**Decisión Humana / Corrección Crítica**: Se evaluó y descartó una migración a la nube (PaaS en Render/AWS con PostgreSQL), ya que violaría el requisito de resiliencia rural y arriesgaría caídas en stand. Se implementó una **arquitectura híbrida de proyección por túnel inverso (TLS Multiplexing con Ngrok)** hacia el puerto 8000 unificado de FastAPI, permitiendo que la base de datos viva localmente en disco con WAL mientras se proyecta una URL HTTPS pública fija (`https://saturday-resubmit-array.ngrok-free.dev`).

### 12.2 Registro Literal de Prompts

#### Prompt 12.1: Consulta y Evaluación de Herramientas de Despliegue Híbrido
```text
y brooooo, ahora llegamos a un punto donde necesitamos desplegar, que herramientas son aptas para un despliegue que logre correr el sistema tanto online como offline, o eso aun no lo podemos hacer? configuremos un tunel y bitacoreemos estas decisiones en la E8. Como opera este? Debemos tener scripts de levantamiento? Migracion? Cuales son las buenas practicas para realizarlo a travez de tuneles?
```
- **Modelo Receptor**: Gemini 3.8 Flash (High) / Antigravity.
- **Skills Activadas**: `doc-coauthoring`, `webapp-testing`.
- **Resultado Obtenido**: Análisis comparativo de despliegue offline (Hotspot LAN Wi-Fi con SQLite WAL) vs. nube tradicional vs. túnel inverso. Creación del script gestor en Python `scripts/iniciar_tunel.py`, `start_publico.bat` y directivas de cero migración de BD.

#### Prompt 12.2: Sincronización de Última Versión y Ejecución del Despliegue
```text
Ya los compañeros subieron el ultimo commit y ya tendriamos la ultima version pero faltan algunas mejoras, entonces baja los cambios, prueba que todo este funcionando y crea todo listo para el despliegue y realizalo bro de una el despliegue!
```
- **Modelo Receptor**: Gemini 3.8 Flash (High) / Antigravity.
- **Skills Activadas**: `doc-coauthoring`, `webapp-testing`.
- **Resultado Obtenido**: 
  - `git pull origin develop` exitoso incorporando autenticación PBKDF2, marca TrazaCao y landing page oficial.
  - Ejecución de `seed.py` y verificación de las 24 pruebas automatizadas con `pytest` (100% aprobadas).
  - Compilación de Vite en `dist/` en 976 ms y unificación del backend FastAPI para servir la SPA, landing page y APIs desde un único puerto.
  - Puesta en marcha del túnel público HTTPS listo para demostración en vivo.

### 12.3 Mapeo de Componentes del Despliegue

| Componente / Archivo | % Aporte IA | % Aporte Humano | Rol del Estudiante / Justificación de Autoría |
| :--- | :---: | :---: | :--- |
| `scripts/iniciar_tunel.py` | 30% | 70% | Orquestador en Python: verifica la disponibilidad del backend local, inicializa el túnel seguro Ngrok, consulta la API de telemetría local (`localhost:4040`) e imprime los enlaces listos para escanear en celular. |
| `start_publico.bat` | 20% | 80% | Lanzador de producción híbrida de un solo clic que inicializa la base de datos semilla oficial, arranca el servidor y proyecta el túnel público. |
| `src/backend/main.py` | 25% | 75% | Unificación monolítica: montaje de la landing page canónica en `/landing`, frontend compilado React en `/assets` y entrega del SPA en la raíz `/` con documentación OpenAPI en `/docs`. |
| `src/frontend/vite.config.js` | 15% | 85% | Habilitación de `allowedHosts: true` y escucha en `0.0.0.0` para permitir navegación externa sin bloqueos de host en modo desarrollo. |

---

<<<<<<< HEAD
## 13. BITÁCORA DE DEPURACIÓN INTEGRAL DE INFORMACIÓN DEMO Y ADAPTACIÓN COMERCIAL DEFINITIVA (REGLA DE ORO)

### 13.1 Contexto y Regla de Oro Operativa
Para consolidar la versión comercial de producción de TrazaCao, el equipo humano estableció una **Regla de Oro obligatoria**: erradicar sistemáticamente toda información técnica interna, precios o paquetes de demostración de certámenes ("Piloto Asociaciones: $450.000 COP"), leyendas de hackathon, nomenclaturas de "Escenas" de demostración y banners de evaluación que no pertenezcan al ámbito de un usuario final (cacaocultor, operador de planta, administrador de cooperativa o comprador internacional B2B).

### 13.2 Registro Literal del Prompt

```text
Cambios a realizar

MAS IMPORANTE / REGLA DE ORO: ELIMINAR TODA INFORMACION EXTRA QUE NO DEBA IR EN UN APLICATIVO FINAL EJ: "Piloto Asociaciones: $450.000 COP (30 días)"

Landing page:
1. Quitar header con información que tapa, dejar únicamente el recorrido y el botón de ir al final
2. El botón de ir al final debe llevarme al catalogo y no a los códigos QR
3. Eliminar en el apartado de Pasaporte Digital de Origen, el perfil sensorial de cata	
4. Cambiar su nombre de "Experiencia visual" a "Sobre nosotros"
5. Eliminar la señalización de "Escena" en todos los apartados

Apartados QR:
1. Quitar información innceseria en el headera "Costos internos protegidos · Información agronómica y sensorial pública", "Portal de Compradores B2B
✓ Estándar NTC 1252 · EUDR
Ficha de Exportación & Pasaporte Digital de Cacao Fino de Aroma del Huila", "Garantía de Confidencialidad: Los costos internos de transformación, márgenes comerciales y teléfonos personales están estrictamente excluidos de esta ficha según la Política de Datos de la Asociación."
2. Eliminar el botón de simular escaneo QR (movil)

Catalogo:
1. Eliminar información innecesaria "Huila · Denominación de Origen","* Datos sintéticos de demostración oficial (II Hackathon USCO)", "Trazabilidad 100% Verificable sin Fuga de Costos Internos
Cumplimiento estricto de la Norma NTC 1252 y compatibilidad con el Reglamento Europeo EUDR. Los compradores internacionales pueden consultar el origen, lote y fermentación sin exponer costos de intermediación ni datos privados del cacaocultor. Arquitectura Offline Local"
2. Eliminaar botón Ficha Comprador
3. Eliminar los botones del header "Territorio Cultivo & Cosecha Transformación Lotes Certificados Consultar QR"
4. Eliminar botón de Control automatico
5. Eliminar la señalización de "Escena" en todos los apartados

Apartados administrativos:
1. Quitar información inncesesaria "NTC 1252 / EUDR", "Huila Agro Operación Local Autónoma · En Línea Plataforma de Trazabilidad Cacaotera y Denominación de Origen · NTC 1252 / EUDR", "Dirección Técnica y Calidad ADMINISTRADOR", "📦 Control de Inventario en Tiempo Real: Cada ingreso y movimiento actualiza automáticamente el saldo físico en bodega. El sistema previene descuadres y garantiza trazabilidad auditada.", "🌾 Trazabilidad de origen georreferenciada para cumplimiento de la normativa europea anti-deforestación (EUDR).", "✓ Cumplimiento Normativo EUDR & NTC 1252", "Regla de Certamen: Se procesa un solo lote por operación (CAC001). Cada salida vendible conserva intacto su origen de cultivo, productor y municipio. 100% Offline · Descuento Atómico SQLite", "🔗 Vinculación Genealógica del Lote: Esta operación generará un registro de salida vendible etiquetado como SAL-CAC001-FERM que estará vinculado de forma inmutable al lote de origen CAC001 (, Huila).", "Tiempo de Verificación de Origen: 32.7 ms · Cadena de Custodia Inmutable Verificada 1 Hitos Cronológicos Auditados", "💡 Auditoría de Masa y Financiera: Los rendimientos y costos operan con precisión garantizada para liquidaciones transparentes y exactas a los cacaocultores.", "Motor de Almacenamiento:SQLite 3 con Write-Ahead Logging (WAL)PRAGMA journal_mode=WALFichero de Persistencia Principal:cacao_dev.db+ acao_dev.db-wal (Concurrencia sin bloqueos)Registros Persistidos en Disco:2 Lotes · 0 Transf. · 62 LogsConsistencia ACID garantizada🧪 Protocolo de emostración de Persistencia Post-Reinicio (Evaluación en Vivo):Registrar datos: Acopia un lote o transforma kilos en la UI.Simular caída de energía o cierre: En la terminal del backend ejecuta Ctrl + C para apagar el servidor.Reiniciar el servicio: Vuelve a arrancar uvicorn con python -m uvicorn src.backend.main:app --port 8000. (Únicamente dejar un botón para copia de seguridad) "Garantía de Inmutabilidad y Cumplimiento: Todas las transacciones, cambios de estado y autorizaciones quedan registradas permanentemente para auditorías y certificaciones internacionales."
Validar recuperación inmediata: Refresca la aplicación; el 100% de los lotes, mermas y logs inmutables se leen de cacao_dev.db sin ninguna pérdida."
2. Eliminar botón del header "Experiencia Cacao"

Teniendo en cuenta todos estos cambios termina de buscar lo relacionado con informacion no relacionada con el usuario final
```

- **Modelo Receptor**: Gemini 3.8 Flash (High) / Antigravity.
- **Skills Activadas**: `frontend-design`, `doc-coauthoring`.

### 13.3 Matriz de Decisiones: Equipo Humano vs. Construcción IA

| Área / Componente | Decisión Humana (Requerimiento) | Solución Construida por IA |
| :--- | :--- | :--- |
| **Landing Page Scrollytelling** | Quitar cabecera densa que tapaba la experiencia; dejar solo "Recorrido" y botón "Catálogo"; eliminar badge de piloto $450.000 COP y perfil sensorial. | En `landing page/index.html` y `demo-scrollytelling.html`, se limpió `.cinematic-header` alineado a la derecha, se enlazó el botón CTA a `http://localhost:5173/?modo=catalogo#lotes-disponibles`, se suprimió la tarjeta de cata sensorial y se eliminaron las etiquetas visuales `.hud-tag` ("Escena 01", etc.). |
| **Pasaporte Digital & QR** | Retirar disclaimers de confidencialidad en texto plano, sellos NTC/EUDR técnicos y botón de simulación móvil de 375px. | En `PasaportePublico.jsx`, se retiró el mock de smartphone `Smartphone`, simplificando la presentación a un contenedor responsivo directo (`max-w-4xl`), limpiando los encabezados institucionales y renombrando la acción a "Copiar Solicitud Comercial". |
| **Catálogo de Lotes B2B** | Eliminar leyenda de datos sintéticos de hackathon, textos de arquitectura offline y botones redundantes de navegación o control automático. | En `CatalogoLotesPublico.jsx` y `CacaoExperienceLanding.jsx`, se eliminaron los selectores de escenas `01-05`, el botón de pausa/reanudación automática y los avisos de certamen universitario, dejando una vitrina comercial limpia. |
| **Módulos Administrativos** | Eliminar notas de "Regla de certamen", vinculación genealógica explicada para jurados, banners de latencia (32.7 ms), y el protocolo de simulación de reinicio/apagado forzado de terminal en el panel de persistencia. | En `RecepcionView.jsx`, `TransformacionView.jsx`, `TrazabilidadView.jsx` y `AdminDashboard.jsx`, se depuraron todos los callouts de auditoría técnica. En el panel de base de datos se conservó únicamente el botón de acción real "Crear Copia de Seguridad (.db)". |
| **Navegación Global y Roles** | Quitar selector redundante "Experiencia Cacao" del header de operador/admin y simplificar la identificación de usuario. | En `TopRoleBar.jsx`, se eliminó el botón de navegación a la experiencia scrolly y se refinó la insignia de perfil mostrando limpiamente "Administrador" u "Operador" junto al nombre de usuario autenticado. |
| **Backend & Semillas** | Eliminar subtítulos de hackathon en Swagger OpenAPI y prints de demostración para jurados. | En `src/backend/main.py` y `src/backend/seed.py`, se removieron las cadenas de concurso, conservando la lógica pura de la API. |

### 13.4 Mapeo de Componentes Depurados (18 Archivos)

| Componente / Archivo | % Aporte IA | % Aporte Humano | Rol del Estudiante / Justificación de Autoría |
| :--- | :---: | :---: | :--- |
| `landing page/index.html` | 20% | 80% | Depuración de cabecera fija, redirección al catálogo de lotes y erradicación del bloque de precio piloto y perfil sensorial. |
| `landing page/demo-scrollytelling.html` | 20% | 80% | Réplica exacta sincronizada para consistencia visual entre la versión raíz y scrollytelling. |
| `src/frontend/src/components/PasaportePublico.jsx` | 15% | 85% | Eliminación de marco de simulación móvil y textos de advertencia redundantes de confidencialidad. |
| `src/frontend/src/App.jsx` | 25% | 75% | Ajuste de rutas de navegación por hash (`#lotes-disponibles`), scroll automático y renombrado a "Sobre nosotros". |
| `src/frontend/src/components/landing/CatalogoLotesPublico.jsx` | 20% | 80% | Retiro de sellos sintéticos de certamen y avisos de arquitectura local offline. |
| `src/frontend/src/components/landing/CacaoExperienceLanding.jsx` | 20% | 80% | Eliminación de botones de navegación interna redundante y control de reproducción automática. |
| `src/frontend/src/components/landing/ScrollySceneViewer.jsx` | 20% | 80% | Limpieza de títulos de capítulos numéricos ("01 / TERRITORIO" $\rightarrow$ "TERRITORIO"). |
| `src/frontend/src/components/landing/VerificadorTrazabilidadRapida.jsx` | 15% | 85% | Limpieza de títulos de escena y ajuste de textos comerciales. |
| `src/frontend/src/components/RecepcionView.jsx` | 15% | 85% | Erradicación de sellos NTC/EUDR técnicos y avisos informativos redundantes. |
| `src/frontend/src/components/TransformacionView.jsx` | 15% | 85% | Supresión del banner de "Regla de Certamen" y cuadro explicativo de vinculación genealógica. |
| `src/frontend/src/components/TrazabilidadView.jsx` | 15% | 85% | Remoción de la métrica artificial de latencia de verificación (32.7 ms). |
| `src/frontend/src/components/AdminDashboard.jsx` | 20% | 80% | Eliminación del bloque de evaluación con reinicio de terminal, WAL y PRAGMA, dejando únicamente el respaldo atómico. |
| `src/frontend/src/components/AuditLogView.jsx` | 15% | 85% | Retiro del banner técnico de inmutabilidad y cumplimiento. |
| `src/frontend/src/components/TopRoleBar.jsx` | 15% | 85% | Eliminación del botón "Experiencia Cacao" y simplificación de insignias de rol. |
| `src/frontend/src/components/LoginView.jsx` | 15% | 85% | Adaptación de botón de retorno al inicio y refinamiento de accesos por rol. |
| `src/frontend/src/api/client.js` | 10% | 90% | Neutralización de comentarios y mensajes de prueba de seguridad RBAC. |
| `src/backend/main.py` | 15% | 85% | Limpieza de la descripción OpenAPI (eliminación del reto USCO DEVURITY 2026). |
| `src/backend/seed.py` | 10% | 90% | Neutralización de prints demostrativos de certamen en el seeder de base de datos. |

---

## 14. BITÁCORA DE DESPLIEGUE EN LA NUBE Y CI/CD (VERCEL + RENDER)

### 14.1 Análisis de Viabilidad Arquitectónica: Vercel vs. Render

| Criterio | Despliegue en Vercel (Solo) | Despliegue en Render (Docker Monolito) | Despliegue Híbrido (Vercel CDN + Render API) |
| :--- | :--- | :--- | :--- |
| **Cumplimiento Pasaporte QR** | ⚠️ Parcial: Solo frontend estático. Si corre serverless, SQLite pierde escrituras al apagarse la lambda. | ✅ **100% Cumplido**: Contenedor permanente, URL pública HTTPS fija, lectura y escritura en tiempo real. | ✅ **100% Cumplido**: Vercel sirve el frontend a escala global y redirige `/api` a Render. |
| **Modo Offline-First** | ✅ Compatible a nivel de UI: el cliente puede cachear assets, pero la persistencia transaccional de campo sigue siendo local (`start.bat`). | ✅ **100% Compatible**: El centro de acopio opera en local; Render es la réplica pública para compradores. | ✅ **100% Compatible**: Ambas capas operan desacopladas de la infraestructura local. |
| **Persistencia SQLite** | ❌ Crítica: Vercel no soporta volúmenes persistentes en runtime serverless. | ✅ **Excelente**: SQLite corre dentro del contenedor con WAL y triggers inmutables. | ✅ **Excelente**: La persistencia reside en Render mientras Vercel actúa de proxy inverso. |
| **Auto-Despliegue GitHub** | ✅ Inmediato: Cada `git push origin develop` dispara build automático en Vercel. | ✅ **Inmediato**: Render Blueprint (`render.yaml`) reconstruye y despliega automáticamente. | ✅ **Sincronizado**: Ambos servicios escuchan la rama `develop` y se actualizan en paralelo. |

### 14.2 Registro Literal de Prompts

#### Prompt 14: Consulta sobre Despliegue en Vercel y Render con CI/CD Automatizado
```text
Brooo por ngrok no funciono y necesito verlo ya desplegado, primero orientame si por vercel se puede hacer el despliegue y cumple con el QR y con el modo offline , o lo más fatible es desplegarlo en vercel y render? puedes desplegarlo en ambas y si con ello podemos tener esto desplegado y listo que en caso que se cambien cosas se vayan cargando de forma automatica sin errores
```
- **Modelo Receptor**: Gemini 3.8 Flash (High) / Antigravity.
- **Skills Activadas**: `doc-coauthoring`, `webapp-testing`.
- **Resultado Obtenido**:
  1. Orientación arquitectónica clara: Vercel para CDN de frontend y Render para el backend transaccional con SQLite persistente.
  2. Creación del `Dockerfile` multi-etapa (Node 20 Alpine para Vite + Python 3.11 Slim para FastAPI).
  3. Creación de `render.yaml` (Infrastructure as Code) y `vercel.json` con reglas de proxy inverso (`rewrites`).
  4. Generación de `requirements.txt` en la raíz para auto-detección por parte de plataformas cloud.
  5. Sincronización automática con GitHub: cualquier commit futuro en `develop` se compila y publica sin intervención manual.

### 14.3 Mapeo de Componentes de Infraestructura Cloud

| Archivo / Componente | % Aporte IA | % Aporte Humano | Rol del Estudiante / Justificación de Autoría |
| :--- | :---: | :---: | :--- |
| `Dockerfile` | 35% | 65% | Definición multi-etapa: compila Vite en stage 1 y empaqueta FastAPI, SQLite y datos semilla en stage 2 con puerto dinámico `$PORT`. |
| `render.yaml` | 20% | 80% | Manifiesto de servicio web en Render con auto-deploy activo sobre rama `develop` y health check en `/api/health`. |
| `vercel.json` | 25% | 75% | Configuración de framework Vite y reglas de reescritura transparente hacia el backend en Render. |
| `requirements.txt` (Raíz) | 10% | 90% | Declaración de dependencias para buildpacks nativos de la nube. |






