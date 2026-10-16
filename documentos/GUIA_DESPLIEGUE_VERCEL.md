# GUÍA DE DESPLIEGUE EN PRODUCCIÓN - VERCEL (FRONTEND DESACOPLADO)
## Proyecto: TrazaCao Huila (CacaoTrace)
### Arquitectura Desacoplada: Frontend en Vercel (Fork) + Backend en Render Cloud

---

## 1. RESUMEN DE LA ARQUITECTURA HÍBRIDA

En esta modalidad de despliegue:
* **Render (Compañero)**: Hospeda el backend FastAPI, la base de datos transaccional SQLite con WAL y los endpoints REST en `https://<servicio-render>.onrender.com/api`.
* **Vercel (Tú / Fork)**: Hospeda la interfaz de usuario en React 19 + Tailwind CSS distribuida a través del CDN global de Vercel en `https://<tu-proyecto>.vercel.app`.

```
[ Celular del Jurado / Comprador ]
                │
                ├─────── HTTPS ───────► [ VERCEL CDN GLOBAL ]
                │                       - Frontend SPA React 19
                │                       - Landing Page & Catálogo
                │                       - QR Pasaporte Digital
                │
                └─────── API REST ────► [ RENDER CLOUD (Compañero) ]
                   (/api/lotes, etc.)   - Backend FastAPI
                                        - Base de Datos SQLite WAL
                                        - Autenticación PBKDF2
```

---

## 2. PASO A PASO: DESPLIEGUE DE TU FORK EN VERCEL

### Paso 1: Crear el Fork en GitHub
1. Ingresa al repositorio oficial: `https://github.com/TheKelex/TrazaCao`.
2. En la esquina superior derecha, haz clic en el botón **"Fork"**.
3. Asegúrate de marcar la casilla **"Copy the develop branch only"** (o desmárcala para copiar todas las ramas).
4. Haz clic en **"Create fork"**. Ahora tendrás tu propia copia en `https://github.com/TU_USUARIO/TrazaCao`.

---

### Paso 2: Importar el Fork en Vercel
1. Ingresa a [Vercel](https://vercel.com/) e inicia sesión con tu cuenta de GitHub.
2. En el panel principal (Dashboard), haz clic en **"Add New..."** $\rightarrow$ **"Project"**.
3. En la lista de repositorios, localiza y selecciona tu fork: `TU_USUARIO/TrazaCao` y haz clic en **"Import"**.

---

### Paso 3: Configuración del Proyecto en Vercel
Vercel leerá automáticamente el archivo [`vercel.json`](../vercel.json) de la raíz del proyecto.
Verifica que los siguientes parámetros coincidan:

* **Framework Preset:** `Vite`
* **Root Directory:** `./` *(dejar en la raíz, o si Vercel te pide subcarpeta selecciona `src/frontend`)*
* **Build Command:** `npm run build --prefix src/frontend`
* **Output Directory:** `src/frontend/dist`

---

### Paso 4: Conectar con el Render de tu Compañero (Variable de Entorno)
1. En la misma pantalla de configuración antes de desplegar (o en **Settings** $\rightarrow$ **Environment Variables**):
2. Despliega la sección **"Environment Variables"** y agrega:

| Nombre de la Variable | Valor a Configurar |
| :--- | :--- |
| **`VITE_API_URL`** | `https://<render-de-tu-compañero>.onrender.com/api` |

*(Por ejemplo: `https://trazacao-huila.onrender.com/api`)*

3. Haz clic en **"Add"**.
4. Haz clic en el botón azul **"Deploy"**.

---

### Paso 5: ¡Listo y Verificado!
* En menos de **45 segundos**, Vercel compilará la aplicación y te entregará una URL HTTPS pública (ejemplo: `https://trazacao-tu-usuario.vercel.app`).
* Abre esa URL desde tu celular para verificar la experiencia completa:
  - `/` $\rightarrow$ Aplicación interactiva con catálogo de lotes y login.
  - `/landing` $\rightarrow$ Landing inmersiva de origen del Huila.
  - Escaneo de QR $\rightarrow$ Pasaporte digital en tiempo real conectado al backend de Render.

---

## 3. ACTUALIZACIONES AUTOMÁTICAS (CI/CD)

* Cada vez que realices cambios en tu fork o sincronices con el repositorio principal (`git push origin develop`), Vercel detectará el commit automáticamente y actualizará la aplicación en vivo en segundos sin caídas de servicio.
