/**
 * Cliente HTTP para comunicarse con el backend FastAPI de TrazaCao Huila.
 * Maneja cabeceras RBAC, Idempotencia y conexión local.
 */
import { parseApiError } from '../utils/errorHandler';

const API_BASE = '/api';

// Generador de UUID v4 para idempotencia (RF08)
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

    // Si es respuesta CSV o blob
    if (res.headers.get('content-type')?.includes('text/csv')) {
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
  // Lotes (RF01, RF08)
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

  // Transformaciones (RF02, RF04, RF08)
  crearTransformacion: (data, auth, idempotencyKey = generarUUID()) =>
    request('/transformaciones', {
      method: 'POST',
      headers: {
        'X-Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify(data),
    }, auth),

  // Pasaporte Público QR (RF06 - Sanitizado sin costos)
  getPasaporte: (loteId) => request(`/pasaporte/${loteId}`, { method: 'GET' }),

  // Auditoría (RF10 - Solo Admin)
  getAuditoria: (filtro = {}, auth) => {
    const params = new URLSearchParams();
    if (filtro.lote_id) params.append('lote_id', filtro.lote_id);
    if (filtro.accion) params.append('accion', filtro.accion);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return request(`/admin/auditoria${qs}`, { method: 'GET' }, auth);
  },

  // Exportar CSV (RF11 - Solo Admin)
  exportarCSV: async (auth) => {
    return request('/admin/export/lotes-csv', { method: 'GET' }, auth);
  },

  // Disparar prueba de 403 Forbidden para el jurado en vivo
  test403Trigger: async (auth) => {
    // Intenta cambiar estado de CAC001 usando el rol actual
    return request('/lotes/CAC001/estado', {
      method: 'PATCH',
      body: JSON.stringify({
        nuevo_estado: 'BLOQUEADO',
        motivo: 'Prueba de Acceso no autorizado desde UI para verificación del Jurado',
      }),
    }, auth);
  },
};
