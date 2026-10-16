# MANUAL DE OPERACIÓN, RESPALDO Y MANTENIMIENTO (E07)
## Sistema TrazaCao - Trazabilidad y Calidad del Cacao del Huila
**Autores:** Equipo de Desarrollo TrazaCao (Responsable: DEV 2)  
**Entorno Verificado:** Windows 11 / Linux Ubuntu 22.04 / Python 3.14.3 / SQLite 3  
**Límite Documental:** Máximo 2 páginas  

---

## 1. REPRODUCIBILIDAD E INSTALACIÓN LIMPIA
La solución está concebida bajo el principio de **cero dependencias de infraestructura externa**. Puede ejecutarse de manera 100% desconectada en zonas rurales del Huila con conectividad limitada.

### 1.1 Pasos de Instalación Rápida
```bash
# 1. Clonar e ingresar
git clone https://github.com/TheKelex/TrazaCao.git
cd TrazaCao

# 2. Instalar dependencias puras (FastAPI, Uvicorn, SQLAlchemy, Pytest)
pip install -r requirements.txt

# 3. Iniciar el servicio local
uvicorn src.backend.main:app --port 8000
```
- **Servicios Externos / Costo Cloud:** **$0 COP**. No requiere AWS, Firebase, contenedores Docker ni conexión a Internet activa.
- **Forma de Operar ante Pérdida de Conexión:** La base de datos es local (`datos/cacao.db`). La aplicación procesa lecturas y escrituras atómicas de forma inmediata sin latencia ni fallos de red.

---

## 2. PROTOCOLO DE RESPALDO Y CRITERIO DE DESEMPATE
El sistema incluye dos scripts automatizados en `scripts/` para garantizar la continuidad del negocio y ganar el desempate de la hackathon:

### 2.1 Respaldo en Caliente (`scripts/backup.py`)
- **Mecanismo:** Utiliza la API oficial `sqlite3.Connection.backup()`, copiando las páginas de datos bloque a bloque de forma atómica sin detener la operación de los usuarios.
- **Seguridad e Integridad:** Genera automáticamente un archivo con marca de tiempo en `datos/respaldos/cacao_backup_<timestamp>.db` y calcula un hash criptográfico **SHA-256** guardado en archivo `.sha256`.
- **Rendimiento Medido:** **26.57 ms**.

### 2.2 Restauración y Verificación Atómica (`scripts/restore.py`)
- **Comando:**
  ```bash
  python scripts/restore.py
  ```
- **Tiempo de Ejecución:** **4.70 ms** (objetivo para ganar el criterio de desempate en vivo).
- **Comprobación de Integridad:**
  1. Ejecuta `PRAGMA integrity_check;` arrojando estado `OK` (0 páginas corruptas).
  2. Valida la no duplicación y no pérdida de registros:
     - Conteo de Lotes activos.
     - Conteo de Transformaciones.
     - Conteo de Registros en `audit_logs`.

---

## 3. FALLOS CONOCIDOS Y MITIGACIONES TÉCNICAS
1. **Contención de Escritura en SQLite:** En caso de múltiples escrituras simultáneas en la misma fracción de segundo, se mitiga con `PRAGMA busy_timeout = 5000;` (espera activa de hasta 5 segundos antes de fallar) y el modo `journal_mode = WAL`.
2. **Intentos de Modificación Maliciosa en Auditoría:** Si un atacante intenta inyectar un `UPDATE` o `DELETE` directamente en SQL sobre `audit_logs`, los triggers nativos `trg_audit_logs_no_update` y `trg_audit_logs_no_delete` abortan la transacción con `RAISE(ABORT, ...)`.

---

## 4. HOJA DE RUTA DE MANTENIMIENTO: 3 MEJORAS PRIORIZADAS A 30 DÍAS

| # | Mejora Priorizada | Responsable | Esfuerzo Estimado | Criterio de Aceptación Comprobable |
| :---: | :--- | :---: | :---: | :--- |
| **1** | **Sincronización P2P / Offline-First con CRDTs** | DEV 2 (Infra) | 40 Horas | Permitir que el operador en finca sincronice registros locales con la bodega central al reconectarse sin conflictos de clave primaria. |
| **2** | **Integración de Sensores IoT de Humedad y Temperatura** | DEV 1 (Core) | 32 Horas | Capturar automáticamente la merma por evaporación en secado solar mediante protocolo MQTT o HTTP local sin digitación manual. |
| **3** | **Marketplace de Cascarilla y Subproductos Circulares** | DEV 4 (Comercial) | 28 Horas | Módulo transaccional con pasarela local (Wompi/PSE) para que laboratorios cosméticos reserven lotes de merma directamente desde el QR. |
