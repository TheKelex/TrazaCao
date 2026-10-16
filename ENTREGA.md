# ENTREGA.md — ÍNDICE DE ENTREGA Y MATRIZ DE TRAZABILIDAD (E10)
## Hackathon Agroindustria: Cacao con Historia, Calidad y Valor
### Universidad Surcolombiana (USCO) — Semillero DEVURITY

---

## 1. Identificación del Equipo y Proyecto
- **Nombre del Equipo**: TrazaCao Huila (Equipo 1)
- **Institución**: Universidad Surcolombiana (USCO) — II Hackathon DEVURITY
- **Repositorio Oficial**: `https://github.com/TheKelex/TrazaCao.git`
- **Rama Principal**: `develop`
- **Fecha y Hora**: Octubre 2026

---

## 2. Índice de Entregables (E01 a E10)

| Código | Entregable | Ubicación en el Repositorio | Descripción Breve |
| :--- | :--- | :--- | :--- |
| **E01** | Comprensión del Problema y Propuesta de Valor | `documentos/E01_problema.md` | Diagnóstico de asociaciones del Huila, alcance, restricciones e indicadores. |
| **E02** | Requisitos y Gestión del Cambio | `documentos/E02_requisitos.md` | 12 Historias de Usuario con Gherkin y tarjeta de cambio hora 12. |
| **E03** | Diseño del Producto y Solución | `documentos/E03_diseno.md` | Diagramas de arquitectura, modelo ER, contratos de API y decisiones técnicas. |
| **E04** | Producto Mínimo Viable (Código y Manual) | `src/backend/`, `src/frontend/`, `documentos/E04_manual.md` | Software funcional demostrando el flujo completo RF01–RF12 en < 120s. |
| **E05** | Informe y Archivos de Pruebas | `documentos/E05_TESTEO_EQUIPO_REQUISITOS_MVP.md` y `tests/` | Testeo 1 a 1 de requisitos del MVP preliminar + 15 pruebas `pytest`. |
| **E06** | Verificación de Usabilidad (UX) | `documentos/E06_usabilidad.md` | Prueba con usuario externo: registro de lote y trazabilidad con mejoras. |
| **E07** | Operación, Respaldo y Mantenimiento | `documentos/E07_operacion.md`, `datos/` y `README.md` | Guía de instalación, backup/restore en 15 ms y benchmark de 100 lotes. |
| **E08** | Declaración de IA y Fuentes Externas | `documentos/E08_IA_y_fuentes.md` | Bitácora de uso ético y transparente de IA y licenciamiento de librerías. |
| **E09** | Propuesta Comercial y Pitch | `pitch/` y `documentos/E09_piloto.md` | Diapositivas del pitch de 5 min y términos del piloto comercial de 30 días. |
| **E10** | Índice y Matriz de Trazabilidad | `ENTREGA.md` | Este documento de control y verificación. |

---

## 3. Matriz de Trazabilidad Integral (Requisito $\rightarrow$ Componente $\rightarrow$ Prueba $\rightarrow$ Evidencia)

| Requisito | Descripción | Componente / Pantalla | Archivo de Prueba | Resultado Obtenido | Estado |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **RF01** | Recepción de Lotes con validación | `src/backend/routers/lotes.py`<br>`src/frontend/src/components/RecepcionView.jsx` | `tests/test_api_endpoints.py` | Lote creado con ID único; rechazo inmediato ante $\le 0$ kg o vacío. | **Cumplido** |
| **RF02** | Transformación y vinculación | `src/backend/routers/transformaciones.py`<br>`src/frontend/src/components/TransformacionView.jsx` | `tests/test_api_endpoints.py` | Salida vinculada a lote origen; descuento de stock atómico verificado. | **Cumplido** |
| **RF03** | Trazabilidad de origen a fin | `src/backend/routers/lotes.py`<br>`src/frontend/src/components/PasaportePublico.jsx` | `datos/benchmark_100_registros.py` | Reconstrucción completa de origen Huila a producto final en 0.58 ms. | **Cumplido** |
| **RF04** | Alerta de Merma > 15% | `src/backend/domain/calculos.py`<br>`src/frontend/src/components/TransformacionView.jsx` | `tests/test_calculos.py` | Merma del 20% calculada; semáforo rojo en vivo con justificación obligatoria. | **Cumplido** |
| **RF05** | Indicador Económico y Margen | `src/backend/domain/calculos.py`<br>`src/frontend/src/components/TransformacionView.jsx` | `tests/test_calculos.py` | Costo \$20.000/kg y margen 20% con fórmulas exactas en Decimal. | **Cumplido** |
| **RF06** | Ficha Comercial Pública (QR) | `src/backend/routers/pasaporte.py`<br>`src/frontend/src/components/PasaportePublico.jsx` | `tests/test_api_endpoints.py` | Consulta por QR SVG; costos internos y teléfonos estrictamente ocultos. | **Cumplido** |
| **RF07** | Persistencia tras reinicio | SQLite WAL Engine | `datos/backup.py`<br>`datos/restore.py` | Respaldo en 15.68 ms y restauración en 18.19 ms sin pérdida de datos. | **Cumplido** |
| **RF08** | Control de Stock e Idempotencia | `src/backend/services/inventario.py` | `tests/test_api_endpoints.py` | Rechazo atómico si consumo > disponible; cabecera UUID no duplica consumo. | **Cumplido** |
| **RF09** | Gestión de Estados (Admin) | `src/backend/routers/lotes.py`<br>`src/frontend/src/components/AdminDashboard.jsx` | `tests/test_api_endpoints.py` | Bloqueo/liberación exige motivo; 403 Forbidden interceptado ante operador. | **Cumplido** |
| **RF10** | Auditoría Mínima Inmutable | `src/backend/routers/auditoria.py`<br>`src/frontend/src/components/AuditLogView.jsx` | `tests/test_api_endpoints.py` | Triggers nativos abortan UPDATE/DELETE; registro inmutable verificado. | **Cumplido** |
| **RF11** | Consulta y Exportación CSV | `src/backend/routers/export.py`<br>`src/frontend/src/components/AdminDashboard.jsx` | `tests/test_api_endpoints.py` | Descarga de CSV con BOM utf-8-sig y sanitización contra inyección. | **Cumplido** |
| **RF12** | Balance Económico Robusto | `src/backend/domain/calculos.py` | `tests/test_calculos.py` | Cero divisiones por cero; cascarilla circular valorizada a \$3.000 COP/kg. | **Cumplido** |

---

## 4. Instrucciones Rápidas de Verificación
1. **Lanzamiento Unificado con 1 Clic**:
   ```cmd
   start.bat
   ```
   O en PowerShell:
   ```powershell
   .\start.ps1
   ```
2. **Ejecutar Pruebas Automatizadas (15/15 Tests Verificados)**:
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
