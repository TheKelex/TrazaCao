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

#### Ejemplo de Manejo de Incertidumbre / Error en IA:
- **Caso**: En una propuesta inicial generada por IA, se sugería integrar una API en la nube para análisis predictivo de precios de cacao.
- **Detección y Corrección Humana**: El equipo descartó inmediatamente dicha sugerencia porque violaba la restricción de autonomía offline en caso de falla de conectividad en el evento y añadía costos recurrentes no justificados. Se sustituyó por lógica matemática determinista local en FastAPI.

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
