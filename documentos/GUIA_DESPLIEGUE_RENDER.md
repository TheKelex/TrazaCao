# GUÍA DE DESPLIEGUE EN PRODUCCIÓN - RENDER CLOUD
## Proyecto: TrazaCao Huila (CacaoTrace)
### II Hackathon de Programación DEVURITY - Universidad Surcolombiana
**Repositorio Oficial:** `https://github.com/TheKelex/TrazaCao.git`  
**Rama Oficial de Despliegue:** `develop` (o `main`)  
**URL de Producción Render:** `https://trazacao-huila.onrender.com`

---

## 1. RESUMEN DE LA ARQUITECTURA DE DESPLIEGUE

TrazaCao Huila opera bajo una arquitectura de **Monolito Modular de Alto Rendimiento**. Todo el sistema (Frontend React 19 + Backend FastAPI + Base de Datos SQLite WAL + Landing Page Institucional) se compila y ejecuta en una única instancia contenerizada optimizada, reduciendo el consumo de memoria a menos de **180 MB de RAM**, lo cual encaja perfectamente dentro de los límites del plan gratuito de Render (**512 MB de RAM / 0.5 vCPU**).

```
+-------------------------------------------------------------------------------+
|                             CLIENTE / NAVEGADOR / QR                          |
+-------------------------------------------------------------------------------+
                                      |
                                      v HTTPS (Puerto 443 -> $PORT)
+-------------------------------------------------------------------------------+
|                          RENDER WEB SERVICE (DOCKER)                          |
|                                                                               |
|  +-------------------------------------------------------------------------+  |
|  |                 FastAPI (Uvicorn ASGI - 0.0.0.0:$PORT)                  |  |
|  +-------------------------------------------------------------------------+  |
|         |                     |                          |                    |
|         v                     v                          v                    |
|  +--------------+    +-------------------+      +--------------------------+  |
|  | Frontend SPA |    | Landing Comercial |      |   API RESTful Modular    |  |
|  | (React+Vite) |    |  (/landing /ficha)|      | (/api/lotes, /pasaporte, |  |
|  |  dist/index  |    |     estática      |      |   /subproductos, etc.)   |  |
|  +--------------+    +-------------------+      +--------------------------+  |
|                                                              |                |
|                                                              v                |
|                                                 +--------------------------+  |
|                                                 | SQLite con Modo WAL      |  |
|                                                 | (cacao_dev.db + Triggers)|  |
|                                                 +--------------------------+  |
+-------------------------------------------------------------------------------+
```

---

## 2. ARTEFACTOS Y ARCHIVOS DE CONFIGURACIÓN

El proyecto cuenta con cuatro archivos clave para garantizar un despliegue sin fricción:

| Archivo | Función Técnica | Ubicación |
| :--- | :--- | :--- |
| **`Dockerfile`** | Compilación multi-stage: Node 20 compila el frontend en la Etapa 1; Python 3.11-slim ejecuta FastAPI y precarga los datos semilla canónicos (`seed.py`). | Raíz del proyecto |
| **`.dockerignore`** | Excluye `node_modules` de Windows, entornos virtuales, cachés y bases de datos locales para transferencias ultrarrápidas a los servidores de Render. | Raíz del proyecto |
| **`render.yaml`** | Render Blueprint para despliegue automatizado como Infraestructura como Código (IaC). | Raíz del proyecto |
| **`build.sh`** | Script ejecutable para compilación nativa en caso de seleccionar el entorno Python Web Service estándar en lugar de Docker. | Raíz del proyecto |

---

## 3. PASO A PASO: DESPLIEGUE EN RENDER

### Opción A (Recomendada): Vía Render Blueprint (`render.yaml`)

Este método configura el servicio automáticamente a partir de `render.yaml`:

1. Ingresar a [Render Dashboard](https://dashboard.render.com/).
2. Hacer clic en el botón superior **"New +"** y seleccionar **"Blueprint"**.
3. Conectar la cuenta de GitHub y elegir el repositorio `TheKelex/TrazaCao` (o su fork autorizado).
4. Seleccionar la rama: `develop` (o `main`).
5. Render detectará automáticamente el archivo `render.yaml`:
   - **Service Name:** `trazacao-huila`
   - **Environment:** `Docker`
   - **Region:** `Oregon (US West)`
   - **Plan:** `Free`
   - **Health Check:** `/api/health`
6. Hacer clic en **"Apply"**. Render iniciará la construcción de la imagen y desplegará la URL en vivo.

---

### Opción B: Creación Manual con Docker

1. En Render Dashboard, hacer clic en **"New +"** $\rightarrow$ **"Web Service"**.
2. Seleccionar **"Build and deploy from a Git repository"** y conectar `TheKelex/TrazaCao`.
3. Configurar los parámetros básicos:
   - **Name:** `trazacao-huila`
   - **Region:** `Oregon (US West)` o la más cercana
   - **Branch:** `develop`
   - **Language / Runtime:** `Docker`
   - **Dockerfile Path:** `Dockerfile`
   - **Docker Context Path:** `.`
   - **Plan Type:** `Free`
4. En la sección **Advanced**:
   - **Health Check Path:** `/api/health`
   - **Auto-Deploy:** `Yes`
5. Agregar variables de entorno:
   - `PYTHONUNBUFFERED` = `1`
   - `DATABASE_PATH` = `/app/cacao_dev.db`
6. Hacer clic en **"Create Web Service"**.

---

### Opción C: Creación Manual con Python Nativo (Alternativa Rápida)

Si se desea evitar Docker y compilar directamente sobre el entorno nativo de Render:

1. Seleccionar **Language:** `Python 3`.
2. **Build Command:** `./build.sh` (o `pip install -r requirements.txt && cd src/frontend && npm install && npm run build && cd ../.. && python src/backend/seed.py`).
3. **Start Command:** `uvicorn src.backend.main:app --host 0.0.0.0 --port $PORT`
4. **Health Check Path:** `/api/health`

---

## 4. VARIABLES DE ENTORNO EN PRODUCCIÓN

Render inyecta dinámicamente la variable `$PORT`. El sistema está configurado para enlazar a `${PORT:-8000}`.

| Variable | Valor por Defecto | Propósito |
| :--- | :--- | :--- |
| `PORT` | Asignado por Render (ej. 10000) | Puerto de enlace de Uvicorn. |
| `PYTHONUNBUFFERED` | `1` | Permite ver logs de FastAPI en la consola de Render en tiempo real sin búfer. |
| `DATABASE_PATH` | `/app/cacao_dev.db` | Ruta absoluta al archivo SQLite dentro del contenedor. |

---

## 5. COMPORTAMIENTO DEL PLAN GRATUITO DE RENDER & CONSIDERACIONES

1. **Suspensión por Inactividad (Spin-Down):**
   - El plan gratuito suspende la instancia tras **15 minutos** de inactividad de tráfico.
   - La primera solicitud tras la suspensión tardará entre **40 y 50 segundos** mientras Render levanta el contenedor.
   - Las solicitudes subsiguientes responderán en **menos de 80 milisegundos**.
2. **Precarga de Datos Canónicos:**
   - Cada vez que el contenedor se inicia o se reconstruye, el script `python src/backend/seed.py` garantiza que los lotes oficiales (`CAC001`, `CAC002`, `CAC003`), la transformación canónica de 100 kg a 80 kg, y los usuarios de prueba (`admin` y `operador`) estén presentes e íntegros.
3. **Credenciales Preconfiguradas para Demostración en Vivo:**
   - **Administrador:** Usuario: `admin` | Contraseña: `AdminTrazaCao2026!`
   - **Operador de Planta:** Usuario: `operador` | Contraseña: `OperadorCacao2026!`
   - **Portal Público de Comprador / Pasaporte QR:** No requiere credenciales (acceso abierto en `/ficha` y `/pasaporte/{lote_id}`).

---

## 6. PRUEBAS DE HUMO EN VIVO (SMOKE TESTS)

Una vez completado el despliegue, ejecutar los siguientes comandos para verificar la disponibilidad de todos los servicios:

```bash
# 1. Comprobar salud y conexión a SQLite
curl -X GET "https://trazacao-huila.onrender.com/api/health"

# Respuesta esperada:
# {"status":"online","database":"connected","sistema":"TrazaCao Huila","version":"1.1.0",...}

# 2. Consultar catálogo de lotes
curl -X GET "https://trazacao-huila.onrender.com/api/lotes"

# 3. Consultar pasaporte comercial público de CAC001 (sin costos internos)
curl -X GET "https://trazacao-huila.onrender.com/api/pasaporte/CAC001"

# 4. Consultar catálogo industrial y botánico B2B de mermas
curl -X GET "https://trazacao-huila.onrender.com/api/subproductos/catalogo-industrial"

# 5. Visualizar frontend en el navegador
# https://trazacao-huila.onrender.com/
# https://trazacao-huila.onrender.com/ficha
# https://trazacao-huila.onrender.com/pasaporte/CAC001
```

---

## 7. MATRIZ DE RUTA Y EXPERIENCIA QR MÓVIL

| Enlace / Ruta | Tipo de Vista | Descripción para Jurados y Usuarios |
| :--- | :--- | :--- |
| `/` | SPA React 19 | Aplicación completa con cambio dinámico entre Landing, Modo Comprador y Panel de Gestión. |
| `/ficha` | Web Estática | Experiencia visual inmersiva de origen para compradores internacionales. |
| `/pasaporte/CAC001` | Pasaporte Digital | Vista directa de trazabilidad y ficha técnica cargada al escanear el código QR con el celular. |
| `/docs` | OpenAPI Swagger | Documentación interactiva de todos los endpoints REST con pruebas en vivo. |
