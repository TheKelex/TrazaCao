# E08 - DECLARACIÓN DE USO DE INTELIGENCIA ARTIFICIAL Y COMPONENTES EXTERNOS
## Reto: Cacao con historia, calidad y valor — Huila

En estricto cumplimiento del numeral 4 del Reglamento Técnico de la Hackathon FUTICH / Universidad Surcolombiana y de la guía oficial del reto, el equipo declara de manera transparente y verificable las herramientas de IA generativa y los componentes de software externos utilizados durante el desarrollo de la solución.

---

### 1. Declaración de Uso de Inteligencia Artificial

| Herramienta | Propósito / Actividad | Componente o Módulo Afectado | Aporte Relevante Generado | Revisión Humana y Correcciones Realizadas |
| :--- | :--- | :--- | :--- | :--- |
| **Antigravity (Google DeepMind)** | Análisis de requisitos y estructuración del ciclo de vida | `documentos/` (E01, E02, E03, E10) | Generación inicial de plantillas de historias de usuario en formato Gherkin y diagramas Mermaid. | Ajuste minucioso de los datos específicos del Huila (Rivera, Campoalegre, Algeciras) y de las reglas numéricas del caso CAC001 (merma 20%, costo \$20.000). |
| **Antigravity (Google DeepMind)** | Aceleración de código base (Scaffolding) | `src/backend/` | Estructura de modelos SQLAlchemy y validadores Pydantic para prevención de cantidades negativas y división por cero. | Verificación manual de la lógica de negocio, pruebas de concurrencia y ajuste estricto de las restricciones de inventario disponible (RF08). |
| **Antigravity (Google DeepMind)** | Diseño de casos de prueba y scripts de benchmark | `tests/` | Esqueleto de pruebas automatizadas con `pytest` y generador sintético de 100 registros. | Ejecución manual de las pruebas en terminal, corrección de aserciones y medición real del tiempo de respuesta en milisegundos. |

#### Casos Reales de Detección de Error / Incertidumbre y Corrección Humana (Dev 1 & Dev 2):
1. **Error en Concurrencia de Base de Datos**: La IA sugirió inicialmente utilizar el método `.with_for_update()` de SQLAlchemy para el bloqueo de inventario en el consumo de lotes (RF08).
   - *Corrección Humana*: El equipo auditó el comportamiento y verificó que el motor SQLite no soporta bloqueo por fila a nivel de dialecto. Se descartó la sugerencia de la IA y se diseñó una solución en SQL nativo: activación de `PRAGMA journal_mode=WAL;` y una sentencia `UPDATE` atómica condicional (`WHERE kg_disponibles >= :consumo`) verificando que `rowcount == 1`.
2. **Conflicto entre Diferenciador y Fórmulas Normativas**: La IA propuso deducir el ingreso por venta de cascarilla directamente del costo de la etapa en la fórmula oficial de RF05.
   - *Corrección Humana*: El equipo detectó que esto alteraría los valores canónicos esperados por el jurado evaluador para el lote `CAC001` (Costo = $20.000/kg y Margen = 20.0%). Se segregó el cálculo: las variables primarias oficiales permanecen 100% fieles a la guía, y el impacto de la cascarilla se expone como un indicador secundario de Economía Circular.
3. **Manejo de la Precisión Decimal y Divisiones por Cero**: La IA utilizó inicialmente tipos `float` estándar.
   - *Corrección Humana*: Se reemplazaron por `Decimal` con redondeo `ROUND_HALF_UP` y se blindaron de forma explícita las tres divisiones por cero potenciales (`kg_entrada == 0`, `kg_salida_vendible == 0` y `precio_venta == 0`).

---

### 2. Declaración de Componentes, Bibliotecas y Frameworks Externos

Todos los componentes utilizados son de código abierto, con licencias permisivas declaradas:

| Componente / Librería | Versión | Licencia | Propósito en el Proyecto |
| :--- | :--- | :--- | :--- |
| **Python** | 3.11+ | PSF License | Lenguaje principal del backend |
| **FastAPI** | >= 0.100.0 | MIT License | Framework backend para APIs REST y documentación Swagger |
| **Uvicorn** | >= 0.23.0 | BSD-3-Clause | Servidor ASGI para FastAPI |
| **SQLAlchemy** | >= 2.0.0 | MIT License | ORM para abstracción de datos en base de datos local |
| **SQLite 3** | Nativo Python | Public Domain | Motor de base de datos embebido y autónomo |
| **Pydantic** | >= 2.0.0 | MIT License | Validación rigurosa de esquemas y tipos de datos |
| **Pytest** | >= 7.4.0 | MIT License | Framework de pruebas automatizadas de software |
| **React** | 18+ | MIT License | Biblioteca de interfaz de usuario |
| **Vite** | 5+ | MIT License | Empaquetador y servidor de desarrollo frontend |
| **Tailwind CSS** | 3+ | MIT License | Framework de diseño visual responsive |
| **Lucide React** | Última estable | ISC License | Iconografía accesible |
| **qrcode.react** | Última estable | ISC License | Generador de códigos QR para la Ficha Comercial Pública |

*Nota: No se utilizaron plantillas preconstruidas de productos preexistentes ni código propietario anterior al evento.*
