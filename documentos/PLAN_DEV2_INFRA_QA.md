# PLAN DE ESPECIFICACIÓN Y CONSTRUCCIÓN TÉCNICA - DEV 2
## Rol: Seguridad, Infraestructura de Datos & QA
**Rama:** `feature/security-qa`  
**Proyecto:** TrazaCao - Sistema de Trazabilidad, Calidad y Valor Comercial del Cacao del Huila  
**Repositorio Oficial:** https://github.com/TheKelex/TrazaCao.git  
**Evento:** II Hackathon de Programación - USCO / DEVURITY  
**Fecha de Elaboración:** Octubre 2026  
**Estado:** [4. EN CONSTRUCCIÓN]

---

## 1. OBJETIVO DEL ROL
Garantizar la integridad transaccional, inmutabilidad de auditoría, control de acceso basado en roles (RBAC en capa de datos), confiabilidad mediante pruebas automatizadas y continuidad operativa mediante respaldo/restauración de alto rendimiento para el sistema TrazaCao. Además, proveer la infraestructura de datos para auditar y controlar el plus diferenciador de Economía Circular (valorización de subproductos/merma).

---

## 2. ESPECIFICACIÓN DE PERSISTENCIA CONCURRENTE (SQLITE3)

### 2.1 Justificación Técnica
SQLite 3 en modo embebido elimina dependencias externas de red o contenedores, asegurando ejecución local inmediata ante caídas de conectividad. Para operar de forma segura ante accesos concurrentes (lecturas de la ficha pública y escrituras del operador/administrador), se configuran los siguientes PRAGMAs obligatorios en cada conexión del motor:

```sql
PRAGMA journal_mode = WAL;
PRAGMA busy_timeout = 5000;
PRAGMA foreign_keys = ON;
PRAGMA synchronous = NORMAL;
```

### 2.2 Rationale de los PRAGMAs
1. **`journal_mode = WAL` (Write-Ahead Logging):** Permite concurrencia real: múltiples lectores no bloquean a los escritores y los escritores no bloquean a los lectores.
2. **`busy_timeout = 5000`:** En caso de contención de escritura, la base de datos espera hasta 5000 ms antes de arrojar un error de `database is locked`.
3. **`foreign_keys = ON`:** SQLite por defecto ignora claves foráneas. Activarlo garantiza que ninguna transformación o log de auditoría quede huérfano.
4. **`synchronous = NORMAL`:** Proporciona un equilibrio óptimo entre durabilidad e I/O de alta velocidad en disco.

### 2.3 Implementación de Conexión en Python / SQLAlchemy
```python
# src/infra/database.py
import sqlite3
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, declarative_base

DATABASE_URL = "sqlite:///datos/cacao.db"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}
)

@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    if isinstance(dbapi_connection, sqlite3.Connection):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA journal_mode=WAL;")
        cursor.execute("PRAGMA busy_timeout=5000;")
        cursor.execute("PRAGMA foreign_keys=ON;")
        cursor.execute("PRAGMA synchronous=NORMAL;")
        cursor.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
```

---

## 3. DISEÑO DE TRIGGERS DE INMUTABILIDAD EN BASE DE DATOS (RF10)

El requisito RF10 exige: *"Registrar quién, cuándo y qué cambió en cantidades, transformación o estado. Conservar valor anterior y nuevo. No borrar historial para ocultar cambios."*

Para garantizar **inmutabilidad a nivel de motor de datos** y no solo a nivel de código de aplicación, se implementan triggers en SQL nativo que impiden cualquier `UPDATE` o `DELETE` sobre la tabla `audit_logs`.

### 3.1 DDL de la Tabla `audit_logs`
```sql
CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fecha_hora TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    usuario TEXT NOT NULL,
    rol TEXT NOT NULL,
    accion TEXT NOT NULL,
    entidad TEXT NOT NULL,
    entidad_id TEXT NOT NULL,
    valor_anterior TEXT,
    valor_nuevo TEXT,
    detalles TEXT
);
```

### 3.2 DDL de Triggers Inmutables con `RAISE(ABORT, ...)`
```sql
-- Trigger para bloquear cualquier intento de actualización
CREATE TRIGGER IF NOT EXISTS trg_audit_logs_no_update
BEFORE UPDATE ON audit_logs
BEGIN
    SELECT RAISE(ABORT, 'VIOLACION DE SEGURIDAD: Los registros de auditoria son inmutables y no pueden ser modificados.');
END;

-- Trigger para bloquear cualquier intento de eliminación
CREATE TRIGGER IF NOT EXISTS trg_audit_logs_no_delete
BEFORE DELETE ON audit_logs
BEGIN
    SELECT RAISE(ABORT, 'VIOLACION DE SEGURIDAD: Los registros de auditoria son inmutables y no pueden ser eliminados.');
END;
```

---

## 4. MATRIZ Y CONTROL DE ACCESO BASADO EN ROLES (RBAC) EN CAPA DE DATOS (RF09)

### 4.1 Definición de Roles
- **`OPERADOR`**: Registro de recepción de lotes, registro de transformaciones y registro de incidencias técnicas.
- **`ADMIN`**: Liberación de lotes, bloqueo de lotes con motivo obligatorio, consulta de costos internos/márgenes, exportación CSV y consulta de auditoría.
- **`PUBLICO` (Comprador)**: Consulta exclusiva de ficha pública sanitizada (RF06 / QR) sin acceso a endpoints internos.

### 4.2 Matriz de Permisos por Endpoint

| Endpoint | Método | Roles Permitidos | Código si rol denegado |
| :--- | :---: | :---: | :---: |
| `/api/lotes` (Crear) | POST | OPERADOR, ADMIN | 403 Forbidden |
| `/api/transformaciones` | POST | OPERADOR, ADMIN | 403 Forbidden |
| `/api/lotes/{id}/estado` (Liberar / Bloquear) | PATCH | **Solo ADMIN** | **403 Forbidden** |
| `/api/admin/auditoria` | GET | **Solo ADMIN** | **403 Forbidden** |
| `/api/admin/exportar-csv` | GET | **Solo ADMIN** | **403 Forbidden** |
| `/api/publico/lotes/{id}` | GET | TODOS (Público) | 200 OK |

### 4.3 Especificación del Middleware / Dependencia FastAPI
Para cumplir la exigencia de evaluar la restricción en la capa de datos:

```python
# src/infra/security.py
from fastapi import Header, HTTPException, status, Depends
from typing import List

class RequireRole:
    def __init__(self, allowed_roles: List[str]):
        self.allowed_roles = allowed_roles

    def __call__(
        self,
        x_user: str = Header(default="anonimo"),
        x_role: str = Header(default="OPERADOR")
    ):
        rol_normalizado = x_role.upper()
        if rol_normalizado not in self.allowed_roles:
            # Registrar intento no autorizado en auditoría antes de abortar
            registrar_evento_auditoria_insegura(
                usuario=x_user,
                rol=x_role,
                accion="INTENTO_NO_AUTORIZADO",
                entidad="SISTEMA",
                entidad_id="SEGURIDAD",
                detalles=f"Acceso denegado a recurso restringido. Roles requeridos: {self.allowed_roles}"
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Acceso denegado. Se requiere uno de los siguientes roles: {self.allowed_roles}"
            )
        return {"usuario": x_user, "rol": rol_normalizado}
```

---

## 5. ESPECIFICACIÓN DEL REPORTE CSV PARA ADMINISTRADOR (RF11)

### 5.1 Endpoint y Parámetros
- **Ruta:** `GET /api/admin/lotes/exportar-csv`
- **Filtros opcionales:** `?origen=Rivera&estado=LIBERADO`
- **Seguridad:** Requiere rol `ADMIN`. Si operador intenta acceder: HTTP 403.
- **Codificación:** `utf-8-sig` (permite que Excel en Windows reconozca tildes y caracteres especiales automáticamente sin dañar el formato).

### 5.2 Estructura del Archivo CSV Generado
Columnas:
1. `identificador_lote` (ej: CAC001)
2. `productor` (ej: Productor A)
3. `origen_municipio` (ej: Rivera)
4. `fecha_recepcion` (ej: 2026-10-15)
5. `kg_recibidos`
6. `kg_disponibles`
7. `estado` (PENDIENTE, LIBERADO, BLOQUEADO)
8. `motivo_bloqueo`
9. `costo_acumulado_cop`

---

## 6. PLAN DE AUTOMATIZACIÓN DE PRUEBAS (`tests/`)

Se especifican 6 pruebas automatizadas obligatorias ejecutables con el comando `pytest -v tests/`:

```python
# tests/test_seguridad_calidad.py
```

### 6.1 Detalle de los Casos de Prueba
1. **`test_caso_feliz_cac001` (RF01, RF02, RF04, RF05):**
   - Entrada: 100 kg, Salida: 80 kg, Costo etapa: $1.600.000 COP, Precio: $25.000 COP/kg.
   - Verificaciones: Merma exacta = 20.0%, Alerta merma = True (por superar 15%), Costo unitario = $20.000 COP/kg, Margen = 20.0%.
2. **`test_rechazo_cantidad_invalida` (RF01):**
   - Intento de registrar un lote con `kg_recibidos = -50` o `0`.
   - Esperado: HTTP 422 Unprocessable Entity, base de datos sin modificaciones.
3. **`test_inventario_stock_insuficiente` (RF08):**
   - Lote CAC001 con 100 kg disponibles. Se solicita transformar 120 kg.
   - Esperado: HTTP 400 Bad Request ("Existencia insuficiente"), los 100 kg se conservan intactos.
4. **`test_resiliencia_division_cero` (RF12):**
   - Transformación con salida 0 kg o precio de venta 0 COP.
   - Esperado: El sistema no arroja error 500; retorna costo 0 o mensaje controlado sin excepciones no controladas.
5. **`test_rbac_operador_bloqueo_denegado` (RF09, RF10):**
   - Petición con `X-Role: OPERADOR` intentando cambiar estado a `BLOQUEADO`.
   - Esperado: HTTP 403 Forbidden. Registro automático del intento en la tabla `audit_logs`.
6. **`test_regresion_incidencia_hora_12` (Incidencia Oficial):**
   - Administrador (`X-Role: ADMIN`) bloquea lote CAC001 con motivo: *"Contaminación cruzada reportada por comprador"*.
   - Verificaciones: Lote pasa a estado `BLOQUEADO`, la ficha pública ya no lo muestra disponible, y existe un registro en `audit_logs` con `valor_anterior: LIBERADO` y `valor_nuevo: BLOQUEADO`.

---

## 7. PROTOCOLO DE RESPALDO Y RESTAURACIÓN (`backup.py` / `restore.py`)

### 7.1 Arquitectura del Respaldo
- **`scripts/backup.py`**:
  - Utiliza la API nativa `sqlite3.Connection.backup` para crear una copia consistente bloque a bloque incluso si hay lecturas activas.
  - Guarda el archivo en `datos/respaldos/cacao_backup_<timestamp>.db` y actualiza `datos/cacao_backup_latest.db`.
  - Calcula y guarda un hash SHA-256 para verificación de integridad.

- **`scripts/restore.py`**:
  - Cierra conexiones existentes.
  - Restaura `datos/cacao.db` a partir de `datos/cacao_backup_latest.db`.
  - Ejecuta validaciones de integridad atómica:
    ```sql
    PRAGMA integrity_check;
    SELECT COUNT(*) FROM lotes;
    SELECT COUNT(*) FROM transformaciones;
    SELECT COUNT(*) FROM audit_logs;
    ```
  - Mide y muestra el tiempo de restauración en consola (objetivo: < 200 ms para ganar desempate).

---

## 8. SCRIPT DE CARGA SINTÉTICA Y BENCHMARK (100 REGISTROS)

- **`scripts/benchmark_100_registros.py`**:
  - Inserta 100 lotes con transformaciones intermedias representativas de Rivera, Campoalegre y Algeciras.
  - Ejecuta una consulta de trazabilidad completa recursiva sobre los 100 registros.
  - Mide con `time.perf_counter()` el tiempo total de respuesta.
  - Requisito del PDF: Responder en menos de 3.0 segundos.
  - Tiempo proyectado en SQLite nativo: < 50 milisegundos.
  - Genera reporte estructurado de hardware, OS y tiempo para anexar en el entregable `E05_pruebas.pdf`.

---

## 9. DEFINITION OF READY (DoR) - VALIDACIÓN
- [x] Arquitectura de persistencia SQLite con WAL y PRAGMAs definida.
- [x] Triggers DDL inmutables diseñados y testeados sintácticamente.
- [x] Matriz RBAC y middleware de intercepción de roles especificado.
- [x] Especificación de exportación CSV con codificación `utf-8-sig`.
- [x] 6 casos de prueba unitarios en pytest definidos con criterios de aceptación.
- [x] Protocolo de respaldo/restauración y script de benchmark sobre 100 registros documentados.

**Estado:** Tarjeta DEV 2 aprobada para pasar a **[4. EN CONSTRUCCIÓN]**.
