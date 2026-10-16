/**
 * Normalizador y traductor de errores de API para CacaoTrace Huila
 * Diseñado según auditoría de interfaz para evitar crasheos de React por objetos Pydantic.
 */

const DICCIONARIO_ERRORES = {
  "kg_salida no puede ser mayor a kg_entrada": "Los kilos de salida no pueden superar los kilos de entrada.",
  "Stock insuficiente": "El lote seleccionado no tiene suficientes kilos disponibles en bodega.",
  "X-Idempotency-Key": "Esta operación ya fue procesada (protección contra doble clic activa).",
  "403": "Acceso denegado (Rol insuficiente): Solo el Administrador puede ejecutar esta acción.",
  "DivisionByZero": "Los valores de entrada, salida y precio deben ser mayores a cero.",
  "UNIQUE constraint failed": "Ya existe un registro con este identificador único en el sistema.",
  "CHECK constraint failed": "Los valores ingresados no cumplen con las restricciones de calidad o inventario.",
};

export function parseApiError(errorResponse, status) {
  if (status === 403) return DICCIONARIO_ERRORES["403"];
  if (!errorResponse) return "No se pudo conectar con el servidor local (127.0.0.1:8000). Verifica que el backend esté activo.";

  const detail = errorResponse.detail;

  // Caso 1: Error de validación Pydantic (HTTP 422 - Array de objetos)
  if (Array.isArray(detail)) {
    const primerError = detail[0];
    const campo = primerError?.loc?.[primerError.loc.length - 1] || "campo";
    const msg = primerError?.msg || "valor no válido";
    return `Valor inválido en '${campo}': ${msg}. Verifica que sea un valor positivo y cumpla los requisitos.`;
  }

  // Caso 2: Error controlado del Dominio/Aplicación (HTTP 400 / 409 - String)
  if (typeof detail === "string") {
    for (const [clave, mensajeAmigable] of Object.entries(DICCIONARIO_ERRORES)) {
      if (detail.includes(clave)) return mensajeAmigable;
    }
    return detail; // Si ya viene en español limpio desde el dominio
  }

  return "Ocurrió un error inesperado al procesar la solicitud.";
}
