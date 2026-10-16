# GUÍA DE DESPLIEGUE EN PRODUCCIÓN - RENDER CLOUD
## Backend FastAPI REST & Base de Datos SQLite WAL Integrada
### Proyecto: TrazaCao Huila (CacaoTrace) - II Hackathon DEVURITY
**Repositorio Oficial:** `https://github.com/TheKelex/TrazaCao.git`  
**Rama Oficial de Despliegue:** `main`  
**URL de Producción Backend (Render):** `https://trazacao-backend.onrender.com`  
**URL de Producción Frontend (Vercel):** `https://trazacao.vercel.app` (o su dominio asignado)

---

## 1. RESUMEN DE LA ARQUITECTURA DE DESPLIEGUE DESACOPLADO

El sistema opera bajo un modelo desacoplado moderno de **Frontend en el Edge (Vercel)** y **Backend de Alto Rendimiento con Base de Datos Relacional Integrada (Render)**:

```
+---------------------------------------------------------------------------------------+
|                    FRONTEND SPA (Vercel Edge Network - React 19 + Vite)                |
|                    - Servido globalmente en CDN ultra-rápida.                         |
|                    - Consulta al backend mediante VITE_API_URL o proxy /api.          |
+---------------------------------------------------------------------------------------+
                                           |
                                           v HTTPS / JSON (CORS Habilitado)
+---------------------------------------------------------------------------------------+
|                       RENDER WEB SERVICE (Backend + Base de Datos)                    |
|                                                                                       |
|   +-------------------------------------------------------------------------------+   |
|   |                  FastAPI Monolito Modular (Uvicorn ASGI - 0.0.0.0:$PORT)       |   |
|   +-------------------------------------------------------------------------------+   |
|          |                  |                       |                  |              |
|          v                  v                       v                  v              |
|     /api/lotes      /api/pasaporte/*        /api/subproductos/*   /api/health         |
|     (Recepción)     (Ficha Pública QR)      (Catálogo B2B Merma)  (Probe Activo)      |
|          |                  |                       |                  |              |
|          +------------------+-----------------------+------------------+              |
|                                           |                                           |
|                                           v Conexión Directa I/O Local (Microsegundos)|
|   +-------------------------------------------------------------------------------+   |
|   |         BASE DE DATOS RELACIONAL INTEGRADA (SQLite con Modo WAL)               |   |
|   |   - Archivo: /app/cacao_dev.db                                                |   |
|   |   - Triggers DDL Nativos: Inmutabilidad estricta de Auditoría (RF10).          |   |
|   |   - Concurrencia: PRAGMA busy_timeout=5000, PRAGMA foreign_keys=ON.           |   |
|   |   - Precarga: Seed canónico automático (CAC001, CAC002, CAC003, usuarios).     |   |
|   +-------------------------------------------------------------------------------+   |
+---------------------------------------------------------------------------------------+
```

---

## 2. ¿CÓMO SE GESTIONA LA BASE DE DATOS EN RENDER?

1. **Base de Datos SQLite Integrada en el Servicio**:
   - SQLite es un motor relacional embebido que se ejecuta dentro del mismo contenedor del backend.
   - **Latencia cero de red**: Las consultas SQL no viajan por internet entre un servidor y otro; se ejecutan directamente en la memoria y disco del contenedor en microsegundos.
   - **Triggers de Auditoría Inmutables (RF10)**: Las sentencias `RAISE(ABORT)` de SQLite blindan la integridad de `audit_logs` ante cualquier intento de modificación.
2. **Ciclo de Vida y Resiliencia en el Plan Gratuito**:
   - Cada vez que Render inicia o suspende/reactiva el contenedor por inactividad, la base de datos se encuentra precargada mediante `seed.py`.
   - Esto garantiza que los evaluadores y jurados siempre encuentren el sistema con los datos canónicos listos para operar (`CAC001` con balance de tostión, `admin`, `operador`), sin riesgo de inconsistencias.

---

## 3. ARTEFACTOS DE CONFIGURACIÓN

| Archivo | Función Técnica |
| :--- | :--- |
| **`Dockerfile`** | Contenedor Python 3.11-slim optimizado exclusivamente para FastAPI y SQLite. Sin sobrecarga de Node/npm, logrando builds en Render de **menos de 20 segundos**. |
| **`render.yaml`** | Blueprint declarativo (IaC) enlazado a la rama `main`, con healthcheck en `/api/health` y variables de entorno. |
| **`build.sh`** | Script de respaldo para despliegue directo en el entorno nativo Python de Render (sin Docker). |
| **`.dockerignore`** | Excluye archivos locales, cachés y `node_modules` para enviar un contexto de construcción mínimo a Render. |

---

## 4. PASO A PASO: DESPLIEGUE EN RENDER

### Opción A (Recomendada: Blueprint 1 Clic con `render.yaml`)

1. Ingresar a [Render Dashboard](https://dashboard.render.com/).
2. Clic en **"New +"** $\rightarrow$ **"Blueprint"**.
3. Conectar el repositorio `https://github.com/TheKelex/TrazaCao.git`.
4. Seleccionar la rama: **`main`**.
5. Render detectará automáticamente `render.yaml` y preconfigurará el servicio `trazacao-backend`.
6. Clic en **"Apply"**. Render construirá el contenedor en ~20 segundos y asignará la URL pública.

---

### Opción B (Manual como Web Service Docker)

1. En Render Dashboard: **"New +"** $\rightarrow$ **"Web Service"**.
2. Conectar el repositorio `TheKelex/TrazaCao`.
3. Parámetros del servicio:
   - **Name:** `trazacao-backend`
   - **Branch:** `main`
   - **Language / Runtime:** `Docker`
   - **Dockerfile Path:** `Dockerfile`
   - **Docker Context Path:** `.`
   - **Plan:** `Free`
   - **Health Check Path:** `/api/health`
4. Variables de entorno:
   - `PYTHONUNBUFFERED` = `1`
   - `DATABASE_PATH` = `/app/cacao_dev.db`
5. Clic en **"Create Web Service"**.

---

### Opción C (Manual Nativo Python con `build.sh`)

1. **Language:** `Python 3`.
2. **Build Command:** `./build.sh`
3. **Start Command:** `uvicorn src.backend.main:app --host 0.0.0.0 --port $PORT`
4. **Health Check Path:** `/api/health`

---

## 5. POLÍTICA DE CORS Y CONEXIÓN CON VERCEL

El backend cuenta con middleware CORS configurado para aceptar solicitudes desde el frontend en Vercel, localhost y dominios de Render:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_origin_regex=r"https://.*\.vercel\.app|https://.*\.onrender\.com|http://localhost:.*|http://127\.0\.0\.1:.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

En el despliegue de **Vercel**, configurar la variable de entorno:
- `VITE_API_URL` = `https://trazacao-backend.onrender.com` (o la URL asignada por Render).

---

## 6. PRUEBAS DE HUMO EN VIVO (SMOKE TESTS)

```bash
# 1. Comprobar salud y conexión de base de datos
curl -X GET "https://trazacao-backend.onrender.com/api/health"

# 2. Consultar catálogo de lotes
curl -X GET "https://trazacao-backend.onrender.com/api/lotes"

# 3. Consultar pasaporte comercial público de CAC001 (sin costos internos)
curl -X GET "https://trazacao-backend.onrender.com/api/pasaporte/CAC001"

# 4. Consultar catálogo industrial y botánico B2B de mermas
curl -X GET "https://trazacao-backend.onrender.com/api/subproductos/catalogo-industrial"

# 5. Explorar documentación OpenAPI Swagger interactiva
# https://trazacao-backend.onrender.com/docs
```
