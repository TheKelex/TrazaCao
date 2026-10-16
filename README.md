# TrazaCao (CacaoTrace Huila) — Trazabilidad Agroindustrial con Historia y Valor
### II Hackathon de Programación — Universidad Surcolombiana (USCO) & Semillero DEVURITY

*TrazaCao* (CacaoTrace Huila) es una solución tecnológica construida para asociaciones cacaoteras del departamento del Huila (Rivera, Campoalegre, Algeciras). Permite conectar de extremo a extremo la recepción de grano seco, el control estricto de existencias, la detección temprana de mermas anómalas en transformación, el cálculo de costos y la generación de un **Pasaporte Digital de Cacao** consultable vía código QR por compradores especializados.

---

## 1. Requisitos del Entorno
- **Python**: Versión 3.10 o superior.
- **Node.js**: Versión 18 o superior con `npm`.
- **Navegador Web**: Cualquier navegador moderno (Chrome, Firefox, Edge) en PC o móvil.
- **Sin dependencias externas complejas**: No requiere Docker, ni PostgreSQL instalado previamente, ni conexión obligatoria a Internet (arquitectura 100% resiliente y offline).

---

## 2. Instalación Limpia y Puesta en Marcha

### Opción Rápida en Windows (Script de un solo clic)
```powershell
.\start.bat
```

### Opción Manual Paso a Paso

#### A. Backend (FastAPI + SQLite)
```bash
# 1. Navegar al backend
cd src/backend

# 2. Crear y activar entorno virtual (opcional pero recomendado)
python -m venv venv
# En Windows:
.\venv\Scripts\activate
# En Linux/Mac:
source venv/bin/activate

# 3. Instalar dependencias
pip install -r requirements.txt

# 4. Inicializar base de datos con datos de demostración
python seed.py

# 5. Iniciar servidor backend
uvicorn main:app --reload --port 8000
```
El backend estará disponible en `http://localhost:8000` con documentación interactiva en `http://localhost:8000/docs`.

#### B. Frontend (React + Vite + Tailwind)
```bash
# En una nueva terminal:
cd src/frontend

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```
La aplicación web estará disponible en `http://localhost:5173`.

---

## 3. Usuarios y Credenciales de Demostración (Sin Secretos)

| Rol | Usuario de Prueba | Rol y Permisos | Propósito de Demostración |
| :--- | :--- | :--- | :--- |
| **Operador** | `operador_planta` | Registrar lotes, registrar transformaciones, registrar incidencias. | Formularios rápidos optimizados para celular/tableta en punto de acopio. |
| **Administrador** | `admin_asociacion` | Consultar inventario, autorizar liberación/bloqueo con motivo, ver auditoría inmutable, exportar CSV. | Control total de calidad, costos y supervisión. |
| **Comprador** | *Acceso público sin login* | Escaneo de QR o consulta de enlace público de producto. | Ver origen, variedad y estado sin revelar costos internos ni teléfonos privados. |

---

## 4. Ejecución de la Suite de Pruebas

Para verificar la integridad de las reglas de negocio (merma 20%, alerta > 15%, prevención de consumo excesivo, permisos RBAC):

```bash
# Ejecutar todas las pruebas automatizadas
pytest tests/ -v
```

### Medición de Rendimiento (Benchmark de 100 Registros)
```bash
# Ejecutar prueba de consulta de trazabilidad sobre 100 registros sintéticos
python tests/benchmark_100_registros.py
```
*Tiempo objetivo del reto*: < 3.00 segundos.  
*Tiempo obtenido en SQLite local*: **< 0.05 segundos (50 ms)**.

---

## 5. Procedimiento de Respaldo y Restauración de Datos

### Generar Respaldo
```bash
python src/backend/backup.py
# Genera una copia fechada e íntegra en datos/respaldo_YYYYMMDD_HHMMSS.db
```

### Restaurar Respaldo
```bash
python src/backend/restore.py datos/respaldo_demo.db
# Restaura el estado de la base de datos y valida cantidades de lote inmediatamente
```

---

## 6. Estructura de Entregables de la Hackathon

- **`ENTREGA.md`**: Matriz de trazabilidad integral E10 de RF01 a RF12 y lista de verificación.
- **`documentos/`**: Documentación técnica y metodológica completa (E01 a E09).
- **`pitch/`**: Presentación comercial de 5 diapositivas para el jurado.
- **`tests/`**: Suite de pruebas unitarias y de integración ejecutables.

---

## 7. Declaración de Transparencia e Inteligencia Artificial (Numeral 4 del Reglamento)

En cumplimiento del reglamento técnico del certamen, se declara que el proyecto utilizó asistencia de **Inteligencia Artificial Generativa (Antigravity / Google DeepMind y ChatGPT / OpenAI)** para tareas de diseño arquitectónico, estructuración de historias de usuario (Gherkin), aceleración de scaffolding de código base y esqueleto de pruebas automatizadas.

- **Autoría y Control Humano**: Todo el código y diseño fue rigurosamente auditado, corregido y validado por los integrantes del equipo. Las decisiones críticas de ingeniería (como el descarte de `.with_for_update()` por incompatibilidad con SQLite, la implementación de triggers nativos de inmutabilidad en SQL y el blindaje con `Decimal` para evitar divisiones por cero) fueron tomadas por el equipo.
- **Autonomía Operativa**: La aplicación no depende de APIs de IA en la nube en tiempo de ejecución (opera 100% offline).
- **Bitácora Detallada**: Consulte el informe completo, matriz de aportes por archivo y casos de corrección en [`documentos/E08_IA_y_fuentes.md`](documentos/E08_IA_y_fuentes.md).
