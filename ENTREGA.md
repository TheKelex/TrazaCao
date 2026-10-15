# ENTREGA.md — ÍNDICE DE ENTREGA Y MATRIZ DE TRAZABILIDAD (E10)
## Hackathon Agroindustria: Cacao con Historia, Calidad y Valor
### Universidad Surcolombiana (USCO) — Semillero DEVURITY

---

## 1. Identificación del Equipo y Proyecto
- **Nombre del Equipo**: [Nombre del Equipo]
- **Institución**: Universidad Surcolombiana (USCO)
- **Repositorio Público**: [URL del Repositorio de GitHub]
- **Etiqueta / Tag de Entrega**: `v1.0.0-final`
- **Hash de Commit Final**: `[HASH_COMPLETO_DEL_COMMIT]`
- **Fecha y Hora de Entrega**: [Día 2 - 14:00 COT]

---

## 2. Índice de Entregables (E01 a E09)

| Código | Entregable | Ubicación en el Repositorio | Descripción Breve |
| :--- | :--- | :--- | :--- |
| **E01** | Comprensión del Problema y Propuesta de Valor | `documentos/E01_problema.md` | Diagnóstico de asociaciones del Huila, alcance, restricciones e indicadores. |
| **E02** | Requisitos y Gestión del Cambio | `documentos/E02_requisitos.md` | 12 Historias de Usuario con Gherkin y tarjeta de cambio hora 12. |
| **E03** | Diseño del Producto y Solución | `documentos/E03_diseno.md` | Diagramas de arquitectura, modelo ER, contratos de API y decisiones técnicas. |
| **E04** | Producto Mínimo Viable (Código) | `src/backend/` y `src/frontend/` | Software funcional demostrando el flujo completo RF01–RF12. |
| **E05** | Informe y Archivos de Pruebas | `documentos/E05_pruebas.md` y `tests/` | 15 casos manuales ejecutados + 5 pruebas automatizadas `pytest`. |
| **E06** | Verificación de Usabilidad (UX) | `documentos/E06_usabilidad.md` | Prueba con usuario externo: registro de lote y trazabilidad con mejoras. |
| **E07** | Operación, Respaldo y Mantenimiento | `documentos/E07_operacion.md` y `README.md` | Guía de instalación limpia, scripts de backup/restore y hoja de ruta 30 días. |
| **E08** | Declaración de IA y Fuentes Externas | `documentos/E08_IA_y_fuentes.md` | Bitácora de uso ético y transparente de IA y licenciamiento de librerías. |
| **E09** | Propuesta Comercial y Pitch | `pitch/` y `documentos/E09_piloto.md` | Diapositivas del pitch de 5 min y términos del piloto comercial de 30 días. |
| **E10** | Índice y Matriz de Trazabilidad | `ENTREGA.md` | Este documento de control y verificación. |

---

## 3. Matriz de Trazabilidad Integral (Requisito $\rightarrow$ Componente $\rightarrow$ Prueba $\rightarrow$ Evidencia)

| Requisito | Descripción | Componente / Pantalla | Archivo de Prueba | Resultado Obtenido | Estado |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **RF01** | Recepción de Lotes con validación | `backend/routers/lotes.py`<br>`frontend/pages/Operador.jsx` | `tests/test_rf01_recepcion.py` | Lote creado con ID único; rechazo inmediato ante $\le 0$ kg o vacío. | **Cumplido** |
| **RF02** | Transformación y vinculación | `backend/routers/transformaciones.py` | `tests/test_rf02_transformacion.py` | Salida vinculada a lote origen; descuento de stock verificado. | **Cumplido** |
| **RF03** | Trazabilidad de origen a fin | `backend/routers/trazabilidad.py`<br>`frontend/components/Timeline.jsx` | `tests/test_rf03_trazabilidad.py` | Reconstrucción completa de origen Huila a producto final en <3 seg. | **Cumplido** |
| **RF04** | Alerta de Merma > 15% | `backend/services/calculos.py` | `tests/test_rf04_alertas.py` | Merma del 20% calculada; alerta disparada con justificación explícita. | **Cumplido** |
| **RF05** | Indicador Económico y Margen | `backend/services/calculos.py` | `tests/test_rf05_costos.py` | Costo \$20.000/kg y margen 20% con fórmulas y supuestos visibles. | **Cumplido** |
| **RF06** | Ficha Comercial Pública (QR) | `frontend/pages/FichaPublica.jsx` | `tests/test_rf06_ficha.py` | Consulta por QR; costos internos y teléfonos estrictamente ocultos. | **Cumplido** |
| **RF07** | Persistencia tras reinicio | SQLite DB Engine | `tests/test_rf07_persistencia.py` | Cierre y reinicio de servidor conserva la totalidad de registros. | **Cumplido** |
| **RF08** | Control de Stock e Idempotencia | `backend/services/inventario.py` | `tests/test_rf08_stock.py` | Rechazo si consumo > disponible; doble clic no duplica consumo. | **Cumplido** |
| **RF09** | Gestión de Estados (Admin) | `backend/routers/lotes.py` | `tests/test_rf09_estados.py` | Bloqueo/liberación exige motivo; 403 Forbidden a operador. | **Cumplido** |
| **RF10** | Auditoría Mínima Inmutable | `backend/models.py` (Tabla Audit) | `tests/test_rf10_auditoria.py` | Registro de usuario, timestamp, valor previo y nuevo sin borrado. | **Cumplido** |
| **RF11** | Consulta y Exportación CSV | `backend/routers/export.py` | `tests/test_rf11_export.py` | Descarga de CSV funcional con filtros aplicados por origen y estado. | **Cumplido** |
| **RF12** | Balance Económico Robusto | `backend/services/calculos.py` | `tests/test_rf12_balance.py` | Cero divisiones por cero; costos directos desglosados con claridad. | **Cumplido** |

---

## 4. Instrucciones Rápidas de Verificación
1. **Ejecutar Backend**:
   ```bash
   cd src/backend
   pip install -r requirements.txt
   uvicorn main:app --reload --port 8000
   ```
2. **Ejecutar Pruebas Automatizadas**:
   ```bash
   pytest tests/ -v
   ```
3. **Ejecutar Frontend**:
   ```bash
   cd src/frontend
   npm install
   npm run dev
   ```
4. **Ver Documentación de APIs**:
   - Abrir en navegador: `http://localhost:8000/docs`
