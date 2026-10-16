/**
 * Cliente HTTP para comunicarse con el backend FastAPI de TrazaCao Huila.
 * Maneja cabeceras RBAC, Idempotencia y conexión local.
 */
import { parseApiError } from '../utils/errorHandler';

// Base URL de la API: soporta variable de entorno en Vercel (VITE_API_URL / VITE_API_BASE_URL)
// o ruta relativa '/api' cuando se usa proxy o despliegue unificado.
const rawEnvBase = (typeof import.meta !== 'undefined' && import.meta.env && (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL)) || '/api';
let cleanBase = String(rawEnvBase).trim();
if (cleanBase.endsWith('/')) {
  cleanBase = cleanBase.slice(0, -1);
}
// Si es una URL absoluta HTTP/HTTPS y no incluye '/api', anexar '/api' para coincidir con los routers FastAPI
if (cleanBase.startsWith('http') && !cleanBase.endsWith('/api') && !cleanBase.includes('/api/')) {
  cleanBase = `${cleanBase}/api`;
}
const API_BASE = cleanBase;

// Generador de UUID v4 para idempotencia y prevención de doble clic
export function generarUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Wrapper común de peticiones
async function request(endpoint, options = {}, authState = { role: 'OPERADOR', user: 'Operador Rivera' }) {
  const headers = {
    'Content-Type': 'application/json',
    'X-User-Role': authState.role,
    'X-User-Name': authState.user,
    ...(options.headers || {}),
  };

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (!res.ok) {
      let errorBody = null;
      try {
        errorBody = await res.json();
      } catch (e) {
        errorBody = { detail: res.statusText };
      }
      const mensaje = parseApiError(errorBody, res.status);
      const error = new Error(mensaje);
      error.status = res.status;
      error.raw = errorBody;
      throw error;
    }

    // Si es respuesta CSV, Excel o blob binario
    const contentType = res.headers.get('content-type') || '';
    if (
      contentType.includes('text/csv') ||
      contentType.includes('application/vnd.ms-excel') ||
      contentType.includes('application/octet-stream')
    ) {
      return await res.blob();
    }

    return await res.json();
  } catch (err) {
    if (err.status) throw err;
    const msg = parseApiError(null, 0);
    const error = new Error(msg);
    error.status = 0;
    throw error;
  }
}

export const api = {
  // Autenticación y Sesión
  login: (username, password) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  getAuthProfile: (auth) => request('/auth/me', { method: 'GET' }, auth),

  // Gestión de Lotes e Inventario
  getLotes: (filtro = {}, auth) => {
    const params = new URLSearchParams();
    if (filtro.municipio) params.append('municipio', filtro.municipio);
    if (filtro.estado) params.append('estado', filtro.estado);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return request(`/lotes${qs}`, { method: 'GET' }, auth);
  },

  getLoteById: (id, auth) => request(`/lotes/${id}`, { method: 'GET' }, auth),

  crearLote: (loteData, auth) =>
    request('/lotes', {
      method: 'POST',
      body: JSON.stringify(loteData),
    }, auth),

  cambiarEstadoLote: (id, { nuevo_estado, motivo }, auth) =>
    request(`/lotes/${id}/estado`, {
      method: 'PATCH',
      body: JSON.stringify({ nuevo_estado, motivo }),
    }, auth),

  // Transformaciones y Rendimientos de Proceso
  getTransformaciones: (auth) => request('/transformaciones', { method: 'GET' }, auth),

  crearTransformacion: (data, auth, idempotencyKey = generarUUID()) =>
    request('/transformaciones', {
      method: 'POST',
      headers: {
        'X-Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify(data),
    }, auth),

  // Pasaporte Digital QR (Ficha de Exportación)
  getPasaporte: (loteId) => request(`/pasaporte/${loteId}`, { method: 'GET' }),

  // Catálogo Industrial & Botánico B2B (Mermas & Biomasa)
  getCatalogoSubproductos: () => request('/subproductos/catalogo-industrial', { method: 'GET' }),

  solicitarCotizacionB2B: (datos) =>
    request('/subproductos/solicitar-cotizacion-b2b', {
      method: 'POST',
      body: JSON.stringify(datos),
    }),

  // Registro de Auditoría y Seguridad (Solo Admin)
  getAuditoria: (filtro = {}, auth) => {
    const params = new URLSearchParams();
    if (filtro.lote_id) params.append('lote_id', filtro.lote_id);
    if (filtro.accion) params.append('accion', filtro.accion);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return request(`/admin/auditoria${qs}`, { method: 'GET' }, auth);
  },

  // Exportar Reporte Consolidado CSV compatible con Excel
  exportarCSV: async (auth) => {
    return request('/admin/export/lotes-csv', { method: 'GET' }, auth);
  },

  // Exportar Reporte Estilizado Excel (.xls) con diseño y KPIs
  exportarExcel: async (auth) => {
    return request('/admin/export/lotes-excel', { method: 'GET' }, auth);
  },

  // Respaldo y Copias de Seguridad
  generarBackup: async (auth) => {
    return request('/admin/export/backup', { method: 'POST' }, auth);
  },

  getPersistenciaInfo: async (auth) => {
    return request('/admin/export/persistencia-info', { method: 'GET' }, auth);
  },

  // Health Check Backend
  healthCheck: async () => {
    try {
      const res = await fetch(`${API_BASE}/health`, { method: 'GET' });
      if (res.ok) return true;
      const fallback = await fetch(`${API_BASE}/`, { method: 'GET' });
      return fallback.ok;
    } catch {
      return false;
    }
  },

  // Gestión de Operarios (Solo Admin - CRUD con Vetar, NO eliminar)
  getOperarios: (auth) => request('/admin/operarios', { method: 'GET' }, auth),
  crearOperario: (data, auth) =>
    request('/admin/operarios', {
      method: 'POST',
      body: JSON.stringify(data),
    }, auth),
  actualizarOperario: (id, data, auth) =>
    request(`/admin/operarios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }, auth),
  cambiarEstadoOperario: (id, { activo, motivo }, auth) =>
    request(`/admin/operarios/${id}/estado`, {
      method: 'PATCH',
      body: JSON.stringify({ activo, motivo }),
    }, auth),

  // Portal y Autenticación de Compradores Comerciales
  registroComprador: (data) =>
    request('/compradores/registro', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  loginComprador: (data) =>
    request('/compradores/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getCompradoresAdmin: (auth) => request('/compradores/admin/listado', { method: 'GET' }, auth),

  // Ventas Efectivas Directas con Descuento Atómico de Stock
  comprarDirecto: (datosCompra) =>
    request('/ventas/comprar', {
      method: 'POST',
      body: JSON.stringify(datosCompra),
    }),
  getMisComprasComprador: (compradorId) =>
    request(`/ventas/comprador/${compradorId}`, { method: 'GET' }),
  getVentasAdmin: (auth) => request('/ventas/todas', { method: 'GET' }, auth),

  // Verificación de autorización de seguridad
  test403Trigger: async (auth) => {
    return request('/lotes/CAC001/estado', {
      method: 'PATCH',
      body: JSON.stringify({
        nuevo_estado: 'BLOQUEADO',
        motivo: 'Verificación de autorización de seguridad',
      }),
    }, auth);
  },
};
