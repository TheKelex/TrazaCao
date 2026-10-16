import React, { useState, useMemo } from 'react';
import { Flame, AlertTriangle, CheckCircle, Scale, Coins, Recycle, ArrowRight, ShieldCheck } from 'lucide-react';
import { api, generarUUID } from '../api/client';

export function TransformacionView({ auth, lotes, onTransformacionExitosa, defaultLoteId }) {
  const [loteId, setLoteId] = useState(defaultLoteId || (lotes[0]?.id || 'CAC001'));
  const [etapa, setEtapa] = useState('FERMENTACION_SECADO');
  const [kgEntrada, setKgEntrada] = useState('100.00');
  const [kgSalida, setKgSalida] = useState('80.00');
  const [costoEtapa, setCostoEtapa] = useState('1600000.00');
  const [precioVenta, setPrecioVenta] = useState('25000.00');
  const [justificacion, setJustificacion] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [resultado, setResultado] = useState(null);

  // Lote seleccionado actualmente
  const loteSeleccionado = useMemo(() => {
    return lotes.find((l) => l.id === loteId) || null;
  }, [lotes, loteId]);

  // Cálculos reactivos en tiempo real (Espejo exacto del Dominio Python)
  const calculosEnVivo = useMemo(() => {
    const entrada = parseFloat(kgEntrada) || 0;
    const salida = parseFloat(kgSalida) || 0;
    const costo = parseFloat(costoEtapa) || 0;
    const precio = parseFloat(precioVenta) || 0;

    if (entrada <= 0) {
      return { mermaPorcentaje: 0, alertaMerma: false, costoUnitario: 0, margen: 0, cascarillaKg: 0, ingresoCascarilla: 0, costoNeto: costo, errorValidacion: 'La entrada debe ser mayor a 0 kg' };
    }
    if (salida > entrada) {
      return { mermaPorcentaje: 0, alertaMerma: false, costoUnitario: 0, margen: 0, cascarillaKg: 0, ingresoCascarilla: 0, costoNeto: costo, errorValidacion: 'La salida vendible no puede superar la masa de entrada' };
    }

    const kgMerma = entrada - salida;
    const mermaPorcentaje = (kgMerma / entrada) * 100;
    const alertaMerma = mermaPorcentaje > 15.0;

    const costoUnitario = salida > 0 ? costo / salida : 0;
    const margen = precio > 0 && salida > 0 ? ((precio - costoUnitario) / precio) * 100 : 0;

    // Subproducto de economía circular: cascarilla valorizada a 3.000 COP/kg
    const cascarillaKg = entrada * 0.10;
    const ingresoCascarilla = cascarillaKg * 3000;
    const costoNeto = costo - ingresoCascarilla;

    return {
      mermaPorcentaje,
      alertaMerma,
      costoUnitario,
      margen,
      cascarillaKg,
      ingresoCascarilla,
      costoNeto,
      errorValidacion: null,
    };
  }, [kgEntrada, kgSalida, costoEtapa, precioVenta]);

  const formatearCOP = (valor) => {
    const num = parseFloat(valor);
    if (isNaN(num)) return '$ 0 COP';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 2,
    }).format(num);
  };

  const requiereJustificacion = calculosEnVivo.alertaMerma;
  const justificacionValida = !requiereJustificacion || (justificacion && justificacion.trim().length >= 10);
  const puedeEnviar = !calculosEnVivo.errorValidacion && justificacionValida && !loading;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!puedeEnviar) return;

    setLoading(true);
    setError(null);
    setResultado(null);

    const idempotencyKey = generarUUID();

    try {
      const payload = {
        lote_id: loteId,
        etapa,
        kg_entrada: parseFloat(kgEntrada),
        kg_salida: parseFloat(kgSalida),
        costo_etapa_cop: parseFloat(costoEtapa),
        precio_venta_estimado: parseFloat(precioVenta),
        incidencia_justificacion: requiereJustificacion ? justificacion.trim() : null,
      };

      const resp = await api.crearTransformacion(payload, auth, idempotencyKey);
      setResultado(resp);
      if (onTransformacionExitosa) {
        await onTransformacionExitosa(resp);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Columna Izquierda: Formulario de Transformación */}
      <div className="lg:col-span-7 bg-stone-900 border border-stone-800 rounded-xl p-6 shadow-xl">
        <div className="flex items-center justify-between pb-4 border-b border-stone-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-orange-950/80 text-orange-400 border border-orange-800/60">
              <Flame className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-stone-100">Transformación y Merma Agroindustrial (RF02, RF04)</h2>
              <p className="text-xs text-stone-400">Consumo atómico de stock y cálculo con precisión Decimal</p>
            </div>
          </div>
          <span className="text-xs font-mono bg-stone-800 text-amber-400 px-2.5 py-1 rounded-md border border-stone-700">
            Idempotencia RF08
          </span>
        </div>

        {error && (
          <div className="mt-4 p-3.5 bg-rose-950/60 border border-rose-800/80 rounded-lg text-rose-200 text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {resultado && (
          <div className="mt-4 p-3.5 bg-emerald-950/60 border border-emerald-800/80 rounded-lg text-emerald-200 text-xs flex items-start gap-2">
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
            <div>
              <p className="font-bold">¡Transformación #{resultado.id} registrada exitosamente!</p>
              <p className="text-[11px] text-emerald-300 mt-0.5">
                Costo Unitario: {formatearCOP(resultado.costo_unitario_cop)}/kg | Margen: {parseFloat(resultado.margen_venta_porcentaje).toFixed(2)}% | Cascarilla Circular: {formatearCOP(resultado.ingreso_cascarilla_cop)}
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-stone-300 mb-1">
                Lote de Origen en Bodega *
              </label>
              <select
                value={loteId}
                onChange={(e) => setLoteId(e.target.value)}
                className="w-full bg-stone-950 border border-stone-700 rounded-lg px-3 py-2 text-stone-100 text-sm focus:outline-none focus:border-amber-500 font-mono"
              >
                {lotes.map((lote) => (
                  <option key={lote.id} value={lote.id}>
                    {lote.id} · {lote.origen_municipio} (Disp: {parseFloat(lote.kg_disponibles).toFixed(2)} kg)
                  </option>
                ))}
              </select>
              {loteSeleccionado && (
                <div className="mt-1 flex items-center justify-between text-[11px] text-stone-400">
                  <span>Productor: {loteSeleccionado.productor}</span>
                  <span className="font-mono text-emerald-400 font-bold">
                    Disponible: {parseFloat(loteSeleccionado.kg_disponibles).toFixed(2)} kg
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-300 mb-1">
                Etapa del Proceso *
              </label>
              <select
                value={etapa}
                onChange={(e) => setEtapa(e.target.value)}
                className="w-full bg-stone-950 border border-stone-700 rounded-lg px-3 py-2 text-stone-100 text-sm focus:outline-none focus:border-amber-500"
              >
                <option value="FERMENTACION_SECADO">Fermentación & Secado Técnico</option>
                <option value="TOSTION">Tostión Controlada de Grano</option>
                <option value="MOLIENDA_LICOR">Molienda & Licor de Cacao</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-stone-300 mb-1 flex items-center gap-1">
                <Scale className="w-3.5 h-3.5 text-amber-400" />
                Masa de Entrada (kg) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={kgEntrada}
                onChange={(e) => setKgEntrada(e.target.value)}
                className="w-full bg-stone-950 border border-stone-700 rounded-lg px-3 py-2 text-stone-100 text-sm focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-300 mb-1 flex items-center gap-1">
                <Scale className="w-3.5 h-3.5 text-emerald-400" />
                Masa de Salida Vendible (kg) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={kgSalida}
                onChange={(e) => setKgSalida(e.target.value)}
                className="w-full bg-stone-950 border border-stone-700 rounded-lg px-3 py-2 text-stone-100 text-sm focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-stone-300">
                  Costo Total de la Etapa (COP) *
                </label>
                <span className="text-xs font-semibold text-stone-400 font-mono">
                  {formatearCOP(costoEtapa)}
                </span>
              </div>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={costoEtapa}
                onChange={(e) => setCostoEtapa(e.target.value)}
                className="w-full bg-stone-950 border border-stone-700 rounded-lg px-3 py-2 text-stone-100 text-sm focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-stone-300">
                  Precio de Venta Estimado (COP/kg) *
                </label>
                <span className="text-xs font-semibold text-emerald-400 font-mono">
                  {formatearCOP(precioVenta)}
                </span>
              </div>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={precioVenta}
                onChange={(e) => setPrecioVenta(e.target.value)}
                className="w-full bg-stone-950 border border-stone-700 rounded-lg px-3 py-2 text-stone-100 text-sm focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>
          </div>

          {/* Campo Condicional Obligatorio: Justificación de Incidencia si Merma > 15% */}
          {requiereJustificacion && (
            <div className="p-3.5 bg-rose-950/40 border-2 border-rose-600/80 rounded-lg animate-pulse">
              <label className="block text-xs font-bold text-rose-300 mb-1 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                Justificación de Incidencia (Obligatorio por merma &gt; 15.00%) *
              </label>
              <textarea
                rows={2}
                required
                value={justificacion}
                onChange={(e) => setJustificacion(e.target.value)}
                placeholder="Explica la causa técnica de la merma anómala (ej. Grano sobre-fermentado por lluvia prolongada en Rivera)... Mínimo 10 caracteres."
                className="w-full bg-stone-950 border border-rose-700 rounded-md p-2 text-stone-100 text-xs focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
              <span className="text-[11px] text-rose-400 block mt-1">
                Caracteres: {justificacion.length}/10 {justificacion.length < 10 ? '(Insuficiente)' : '(Aprobado)'}
              </span>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={!puedeEnviar}
              className={`w-full font-bold py-2.5 rounded-lg text-sm transition-all shadow-lg cursor-pointer ${
                puedeEnviar
                  ? 'bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-stone-950 hover:shadow-amber-900/30'
                  : 'bg-stone-800 text-stone-500 cursor-not-allowed'
              }`}
            >
              {loading ? 'Procesando Transacción Atómica...' : 'Guardar Transformación y Descontar Stock (RF02)'}
            </button>
            {!justificacionValida && (
              <p className="text-[11px] text-center text-rose-400 mt-1.5 font-medium">
                * Ingresa el motivo de la merma alta (mínimo 10 caracteres) para habilitar el guardado
              </p>
            )}
          </div>
        </form>
      </div>

      {/* Columna Derecha: Tablero de Cálculos y Semáforo en Tiempo Real */}
      <div className="lg:col-span-5 space-y-4">
        {/* Semáforo de Merma (RF04) */}
        <div className={`p-5 rounded-xl border transition-all shadow-xl ${
          calculosEnVivo.alertaMerma
            ? 'bg-rose-950/50 border-rose-700/80 text-rose-200'
            : 'bg-stone-900 border-emerald-950/80 text-stone-200'
        }`}>
          <div className="flex items-center justify-between pb-3 border-b border-stone-800">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
              Semáforo de Merma Agroindustrial
            </span>
            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
              calculosEnVivo.alertaMerma
                ? 'bg-rose-900 text-rose-200 animate-pulse'
                : 'bg-emerald-900 text-emerald-300'
            }`}>
              {calculosEnVivo.alertaMerma ? 'ALERTA CRÍTICA > 15%' : 'MERMA NORMAL (≤ 15%)'}
            </span>
          </div>

          <div className="mt-4 flex items-baseline justify-between">
            <div>
              <span className="text-3xl font-mono font-black text-stone-100">
                {calculosEnVivo.mermaPorcentaje.toFixed(2)}%
              </span>
              <p className="text-xs text-stone-400 mt-0.5">
                Pérdida física: {(parseFloat(kgEntrada) - parseFloat(kgSalida)).toFixed(2)} kg
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-stone-400 block">Umbral de Alerta:</span>
              <span className="font-mono text-sm font-bold text-amber-400">15.00%</span>
            </div>
          </div>
        </div>

        {/* Balance Económico y Margen (RF04) */}
        <div className="bg-stone-900 border border-stone-800 rounded-xl p-5 shadow-xl space-y-3 text-xs">
          <h3 className="font-bold text-stone-200 text-sm flex items-center gap-2 pb-2 border-b border-stone-800">
            <Coins className="w-4 h-4 text-amber-500" />
            Balance Unitario y Rentabilidad
          </h3>

          <div className="flex justify-between py-1">
            <span className="text-stone-400">Costo Unitario Real:</span>
            <span className="font-mono font-bold text-stone-200">
              {formatearCOP(calculosEnVivo.costoUnitario)} / kg
            </span>
          </div>

          <div className="flex justify-between py-1">
            <span className="text-stone-400">Precio de Venta Mercado:</span>
            <span className="font-mono font-bold text-emerald-400">
              {formatearCOP(precioVenta)} / kg
            </span>
          </div>

          <div className="flex justify-between py-1 pt-2 border-t border-stone-800">
            <span className="text-stone-300 font-semibold">Margen Comercial Bruto:</span>
            <span className={`font-mono font-bold text-sm ${
              calculosEnVivo.margen >= 20 ? 'text-emerald-400' : 'text-amber-400'
            }`}>
              {calculosEnVivo.margen.toFixed(2)}%
            </span>
          </div>
        </div>

        {/* Subproducto Circular: Cascarilla de Cacao (RF04) */}
        <div className="bg-stone-900 border border-emerald-950/60 rounded-xl p-5 shadow-xl text-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-stone-800">
            <h3 className="font-bold text-emerald-400 flex items-center gap-1.5 text-sm">
              <Recycle className="w-4 h-4 text-emerald-400" />
              Economía Circular: Cascarilla
            </h3>
            <span className="text-[10px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800">
              $3.000 COP/kg
            </span>
          </div>

          <p className="text-stone-400">
            Aprovechamiento de subproductos del 10% del peso procesado para té de cacao o abono orgánico en Rivera.
          </p>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="p-2.5 bg-stone-950 rounded-lg border border-stone-800">
              <span className="text-[11px] text-stone-400 block">Cascarilla Recuperada:</span>
              <span className="font-mono font-bold text-stone-200 text-sm">
                {calculosEnVivo.cascarillaKg.toFixed(2)} kg
              </span>
            </div>

            <div className="p-2.5 bg-stone-950 rounded-lg border border-stone-800">
              <span className="text-[11px] text-stone-400 block">Ingreso Adicional:</span>
              <span className="font-mono font-bold text-emerald-400 text-sm">
                {formatearCOP(calculosEnVivo.ingresoCascarilla)}
              </span>
            </div>
          </div>

          <div className="p-2.5 bg-emerald-950/30 rounded-lg border border-emerald-800/40 flex justify-between items-center text-xs">
            <span className="text-stone-300">Costo Neto de Etapa (Post-Cascarilla):</span>
            <span className="font-mono font-bold text-emerald-300">
              {formatearCOP(calculosEnVivo.costoNeto)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
