# E05: INFORME DE TESTEO DE REQUISITOS 1 A 1 — AUDITORÍA DEL MVP PRELIMINAR
## Proyecto: CacaoTrace Huila / TrazaCao
### Metodología: Specification-Driven Development (SDD) + Peer Testing en Equipo
### Fecha: 16 de Octubre de 2026 | Sede: II Hackathon DEVURITY - Universidad Surcolombiana

---

## 1. INTRODUCCIÓN Y METODOLOGÍA DEL TESTEO

En cumplimiento de los principios de **Gobierno Ágil, Kanban y Verificación Continua (SDD)**, el equipo de desarrollo realizó una sesión formal de **testeo cruzado requisito por requisito (RF01 a RF12)** sobre la versión preliminar del MVP de TrazaCao Huila.

El propósito de esta prueba a ciegas interna fue:
1. Contrastar las 12 Historias de Usuario oficiales contra la experiencia real de la interfaz web (`http://127.0.0.1:5173`) y la consola del navegador.
2. Detectar fallas de contrato API (errores HTTP 404, 422, 403), inconsistencias de campos y desalineaciones de usabilidad antes de la presentación final ante el jurado.
3. Consignar la retroalimentación de los evaluadores del equipo para generar un **Plan de Remediación Inmediata de Ingeniería**.

---

## 2. MATRIZ DE TESTEO REQUISITO A REQUISITO (HALLAZGOS DEL EQUIPO)

A continuación se detalla el diagnóstico resultante de la auditoría preliminar para cada requerimiento:

| Requisito | Nombre del Requerimiento | Estado Preliminar | Hallazgos Críticos Detectados por el Equipo | Severidad |
| :--- | :--- | :---: | :--- | :---: |
| **RF01** | Recepción de Cacao en Grano | ⚠️ Observación | • **Origen**: Falta la ubicación específica de los cultivos (dónde se cultivan: vereda/finca además del municipio general).<br>• **Fecha**: Falta campo explícito visible de fecha de recolección/cosecha.<br>• **Productor**: Falta enriquecer el apartado del productor (cédula cacaotera/asociación).<br>• **Parámetros**: Se debatió si humedad y fermentación corresponden a recepción o a laboratorio técnico posterior. | Media |
| **RF02** | Transformación Agroindustrial | ❌ Fallo | • **Responsable**: Falta selector de encargado de la etapa.<br>• **Control Masas**: Desajuste entre nombres de entradas y salidas.<br>• **Error Bloqueante**: *No se puede registrar una transformación, la API rechaza con "Valor inválido en 'responsable'"* por desalineación de contrato Pydantic. | **Alta (Bloqueante)** |
| **RF03** | Trazabilidad Integral | ❌ Fallo | • **Falta de trazabilidad continua**: La pestaña de consulta arrojó error `HTTP 404 Not Found` en la consola debido a una discrepancia de prefijo de ruta (`/api/pasaporte` vs `/api/public/pasaporte`). | **Alta** |
| **RF04** | Alertas de Merma (> 15%) | ⚠️ Observación | • El semáforo alertaba por merma física ($>15\%$), pero **falta alerta integral por registro incompleto, retraso en días de fermentación o sobrecosto financiero**. | Media |
| **RF05** | Indicadores Económicos y Margen | ⚠️ Observación | • **Falta visualización de la fórmula aplicada**: El usuario no ve desglosada la fórmula matemática de cálculo automático del costo unitario (`costo / salida`) ni el margen estimado. | Media |
| **RF06** | Ficha Comercial Pública (QR) | ❌ Fallo | • **Falla de acceso a la Ficha Comercial**: El escaneo y consulta arrojaron `HTTP 404 Not Found` en `/api/pasaporte/CAC001` y `/api/pasaporte/CAC002` (evidenciado en consola del navegador). | **Alta** |
| **RF07** | Persistencia y Recuperación | ⚠️ Observación | • Falta una función o indicador visible en la UI para que el usuario o evaluador pueda comprobar interactivamente la persistencia y restauración de datos. | Baja |
| **RF08** | Control de Stock e Inventario | ⚠️ Observación | • **Falta inventario centralizado unificado** más prominente.<br>• **Falta alerta preventiva clara** en el formulario para evitar que el operador intente ingresar una transformación que consuma más de las existencias antes de enviar. | Media-Alta |
| **RF09** | Gestión de Estados y RBAC | ⚠️ Observación | • Falta claridad informativa visual al bloquear un lote.<br>• **Falta bloqueo efectivo**: Los lotes en estado `BLOQUEADO` no estaban siendo inhabilitados en el selector de transformaciones. | Media |
| **RF10** | Auditoría Inmutable | ⚠️ Observación | • **Falta sincronización horaria local**: Las marcas de tiempo se renderizaban en hora UTC universal (`Z`) en vez de la hora legal colombiana (`UTC-5` / COT). | Baja |
| **RF11** | Consulta y Exportación CSV | ❌ Fallo | • **Error al exportar CSV**: La consola del navegador registró `HTTP 404 Not Found` al presionar el botón de exportación por disparar a `/api/admin/export/lotes-csv` en vez de `/api/admin/export/csv`. | **Alta** |
| **RF12** | Balance Económico Robusto | ⚠️ Observación | • **"No se encuentra en la prueba"**: El balance robusto y la valorización de subproductos (cascarilla circular) estaban dispersos y no contaban con un panel consolidado de visualización. | Media |

---

## 3. ANÁLISIS DE CAUSA RAÍZ (EVIDENCIA EN CONSOLA)

En la captura de pantalla de la sesión de testeo, se comprobaron las siguientes anomalías en las herramientas de desarrollo del navegador:
1. `GET :5173/api/pasaporte/CAC001` $\rightarrow$ `404 Not Found`. Causa: El router en FastAPI estaba registrado bajo el prefijo `/api/public/pasaporte` mientras que el cliente web consumía `/api/pasaporte`.
2. `GET :5173/api/admin/export/lotes-csv` $\rightarrow$ `404 Not Found`. Causa: El endpoint de exportación en el backend fue nombrado `/api/admin/export/csv`.
3. `POST :5173/api/transformaciones` $\rightarrow$ `422 Unprocessable Entity` con detalle: `Valor inválido en 'responsable': Field required`. Causa: El formulario web no incluía el campo `responsable` ni mapeaba `kg_salida` hacia `kg_salida_vendible`.
4. `PATCH :5173/api/lotes/CAC001/estado` $\rightarrow$ `403 Forbidden`. **Comportamiento Correcto**: Prueba satisfactoria de rechazo de seguridad por RBAC cuando el rol activo es Operador.

---

## 4. PLAN DE REMEDIACIÓN INMEDIATA (ACCIÓN DEV 1 - TECH LEAD)

Para subsanar el 100% de las observaciones del equipo, se ejecutan las siguientes correcciones en el backend y frontend:

```
+--------------------------------------------------------------------------------------------------+
| 1. ALINEACIÓN DE RUTAS API (RF03, RF06, RF11)                                                    |
|    - Habilitar alias '/api/pasaporte/{lote_id}' y '/api/admin/export/lotes-csv' en FastAPI.     |
+--------------------------------------------------------------------------------------------------+
| 2. CORRECCIÓN DEL CONTRATO DE TRANSFORMACIÓN (RF02)                                             |
|    - Incluir selector de Responsable: Operador Rivera, Maestro Fermentador, Jefe de Planta.       |
|    - Mapear 'kg_salida' <-> 'kg_salida_vendible' en Pydantic y en el payload del cliente.        |
+--------------------------------------------------------------------------------------------------+
| 3. ENRIQUECIMIENTO DE RECEPCIÓN (RF01)                                                          |
|    - Agregar campo de Vereda / Ubicación del Cultivo y Fecha de Cosecha / Acopio.                |
|    - Clarificar propósito de Humedad y Fermentación bajo Norma NTC 1252.                        |
+--------------------------------------------------------------------------------------------------+
| 4. BLINDAJE PREVENTIVO DE STOCK Y LOTES BLOQUEADOS (RF08, RF09)                                  |
|    - Alerta en vivo si 'kg_entrada > disponible' antes de hacer submit.                          |
|    - Inhabilitar lotes BLOQUEADOS en el selector de transformación.                              |
+--------------------------------------------------------------------------------------------------+
| 5. HORARIO LOCAL Y BALANCE ROBUSTO CONSOLIDADO (RF10, RF12)                                      |
|    - Formatear timestamps con 'America/Bogota' (UTC-5).                                          |
|    - Agregar tarjeta de Balance Consolidado RF12 con fórmulas visibles (RF05).                   |
+--------------------------------------------------------------------------------------------------+
```

---

## 5. CONCLUSIÓN DEL EQUIPO
Este ejercicio de testeo conjunto valida la efectividad de la metodología **SDD y Kanban**: los defectos fueron detectados tempranamente por el propio equipo mediante pruebas de integración antes de la evaluación oficial del jurado, garantizando que el producto final alcance la máxima calificación en los 25 puntos de funcionamiento de E04.
