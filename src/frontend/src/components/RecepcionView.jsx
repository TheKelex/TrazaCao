import React, { useState } from 'react';
import { PackagePlus, CheckCircle, AlertCircle, Scale, Droplet, Sparkles, Building2 } from 'lucide-react';
import { api } from '../api/client';

export function RecepcionView({ auth, lotes, onLoteCreado, demoData }) {
  const [formData, setFormData] = useState(
    demoData || {
      id: 'CAC004',
      productor: 'Finca El Diamante (Rivera)',
      origen_municipio: 'Rivera',
      cantidad: '100.00',
      unidad_medida: 'kg',
      humedad_porcentaje: '7.00',
      fermentacion_porcentaje: '82.00',
      precio_compra_kg: '15000.00',
      ubicacion_cultivo: 'Vereda El Recreo',
      fecha_cosecha: new Date().toISOString().slice(0, 10),
    }
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const factoresConversion = {
    kg: 1.0,
    lb: 0.5,
    arroba: 12.5,
    quintal: 50.0,
    saco: 50.0,
    carga: 125.0,
  };

  const factorActual = factoresConversion[formData.unidad_medida] || 1.0;
  const kgCalculados = (parseFloat(formData.cantidad) || 0) * factorActual;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const formatearCOP = (valor) => {
    const num = parseFloat(valor);
    if (isNaN(num)) return '$ 0 COP';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(num);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const payload = {
        id: formData.id.trim(),
        productor: formData.productor.trim(),
        origen: formData.origen_municipio,
        origen_municipio: formData.origen_municipio,
        cantidad: parseFloat(formData.cantidad),
        unidad_medida: formData.unidad_medida,
        kg_recibidos: kgCalculados,
        humedad_porcentaje: parseFloat(formData.humedad_porcentaje),
        fermentacion_porcentaje: parseFloat(formData.fermentacion_porcentaje),
        precio_compra_kg: parseFloat(formData.precio_compra_kg),
        ubicacion_cultivo: formData.ubicacion_cultivo,
        fecha_cosecha: formData.fecha_cosecha,
      };

      const respuesta = await api.crearLote(payload, auth);
      setSuccess(`¡Lote ${respuesta.id} recibido con éxito! Stock inicial registrado: ${kgCalculados.toFixed(2)} kg.`);
      if (onLoteCreado) onLoteCreado(respuesta);
      
      // Preparar siguiente ID sugerido
      setFormData((prev) => ({
        ...prev,
        id: `CAC${String(Math.floor(Math.random() * 900) + 100)}`,
        cantidad: '',
      }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const humedadNum = parseFloat(formData.humedad_porcentaje) || 0;
  const fermNum = parseFloat(formData.fermentacion_porcentaje) || 0;
  const cumpleNTC = humedadNum <= 7.5 && fermNum >= 75;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Columna Izquierda: Formulario de Recepción */}
      <div className="lg:col-span-7 bg-stone-900 border border-amber-950/70 rounded-xl p-6 shadow-xl">
        <div className="flex items-center justify-between pb-4 border-b border-stone-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-950/80 text-amber-400 border border-amber-800/60">
              <PackagePlus className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-stone-100">Registro de Ingreso y Compra en Acopio</h2>
              <p className="text-xs text-stone-400">Pesaje inicial y liquidación a productores del Huila</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3.5 bg-rose-950/60 border border-rose-800/80 rounded-lg text-rose-200 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mt-4 p-3.5 bg-emerald-950/60 border border-emerald-800/80 rounded-lg text-emerald-200 text-xs flex items-start gap-2">
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-stone-300 mb-1">
                Identificador de Lote *
              </label>
              <input
                type="text"
                name="id"
                required
                value={formData.id}
                onChange={handleChange}
                placeholder="ej. CAC001"
                className="w-full bg-stone-950 border border-stone-700 rounded-lg px-3 py-2 text-stone-100 text-sm focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-300 mb-1">
                Municipio de Origen (Huila) *
              </label>
              <select
                name="origen_municipio"
                value={formData.origen_municipio}
                onChange={handleChange}
                className="w-full bg-stone-950 border border-stone-700 rounded-lg px-3 py-2 text-stone-100 text-sm focus:outline-none focus:border-amber-500"
              >
                <option value="Rivera">Rivera (Fino de Aroma)</option>
                <option value="Campoalegre">Campoalegre (Secano Calidad)</option>
                <option value="Algeciras">Algeciras (Montaña Cacaotera)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-stone-300 mb-1">
                Nombre de Productor o Finca *
              </label>
              <input
                type="text"
                name="productor"
                required
                value={formData.productor}
                onChange={handleChange}
                placeholder="ej. Pedro Nel (Finca La Esperanza)"
                className="w-full bg-stone-950 border border-stone-700 rounded-lg px-3 py-2 text-stone-100 text-sm focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-300 mb-1">
                Ubicación Específica del Cultivo (Vereda / Sector) *
              </label>
              <input
                type="text"
                name="ubicacion_cultivo"
                value={formData.ubicacion_cultivo || 'Vereda El Recreo'}
                onChange={handleChange}
                placeholder="ej. Vereda Arenoso, Finca El Porvenir"
                className="w-full bg-stone-950 border border-stone-700 rounded-lg px-3 py-2 text-stone-100 text-sm focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-stone-300 mb-1">
                Fecha de Acopio / Cosecha *
              </label>
              <input
                type="date"
                name="fecha_cosecha"
                value={formData.fecha_cosecha || new Date().toISOString().slice(0, 10)}
                onChange={handleChange}
                className="w-full bg-stone-950 border border-stone-700 rounded-lg px-3 py-2 text-stone-100 text-sm focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-stone-300 mb-1 flex items-center gap-1">
                <Scale className="w-3.5 h-3.5 text-amber-400" />
                Cantidad Recibida *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                name="cantidad"
                value={formData.cantidad}
                onChange={handleChange}
                placeholder="100.00"
                className="w-full bg-stone-950 border border-stone-700 rounded-lg px-3 py-2 text-stone-100 text-sm focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-300 mb-1">
                Unidad de Medida de Recepción *
              </label>
              <select
                name="unidad_medida"
                value={formData.unidad_medida}
                onChange={handleChange}
                className="w-full bg-stone-950 border border-stone-700 rounded-lg px-3 py-2 text-stone-100 text-sm focus:outline-none focus:border-amber-500"
              >
                <option value="kg">Kilogramos (kg) · Estándar</option>
                <option value="lb">Libras (lb) · (1 lb = 0.5 kg)</option>
                <option value="arroba">Arrobas (@) · (1 @ = 12.5 kg)</option>
                <option value="quintal">Quintales (qq) · (1 qq = 50 kg)</option>
                <option value="saco">Sacos de Fique · (1 saco = 50 kg)</option>
                <option value="carga">Cargas Cacaoteras · (1 carga = 125 kg)</option>
              </select>
            </div>
          </div>

          {/* Masa Neta Normalizada Calculada */}
          <div className="p-2.5 bg-stone-950 rounded-lg border border-stone-800 flex items-center justify-between text-xs">
            <span className="text-stone-400 flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-amber-500" />
              Masa Neta Normalizada en Bodega:
            </span>
            <span className="font-mono font-bold text-amber-400 text-sm">
              {kgCalculados.toFixed(2)} kg
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            <div>
              <label className="block text-xs font-medium text-stone-300 mb-1 flex items-center gap-1">
                <Droplet className="w-3.5 h-3.5 text-sky-400" />
                Humedad (%) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max="100.00"
                required
                name="humedad_porcentaje"
                value={formData.humedad_porcentaje}
                onChange={handleChange}
                placeholder="7.00"
                className="w-full bg-stone-950 border border-stone-700 rounded-lg px-3 py-2 text-stone-100 text-sm focus:outline-none focus:border-amber-500 font-mono"
              />
              <span className={`text-[10px] block mt-1 ${humedadNum <= 7.5 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {humedadNum <= 7.5 ? '✓ Cumple NTC 1252 (≤ 7.5%)' : '⚠ Humedad alta (> 7.5%)'}
              </span>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-300 mb-1 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                Fermentación (%) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max="100.00"
                required
                name="fermentacion_porcentaje"
                value={formData.fermentacion_porcentaje}
                onChange={handleChange}
                placeholder="80.00"
                className="w-full bg-stone-950 border border-stone-700 rounded-lg px-3 py-2 text-stone-100 text-sm focus:outline-none focus:border-amber-500 font-mono"
              />
              <span className={`text-[10px] block mt-1 ${fermNum >= 75 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {fermNum >= 75 ? '✓ Excelente sabor (≥ 75%)' : '⚠ Fermentación baja (< 75%)'}
              </span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-stone-300">
                Precio Compra por Kilo (COP) *
              </label>
              <span className="text-xs font-semibold text-emerald-400 font-mono">
                {formatearCOP(formData.precio_compra_kg)}
              </span>
            </div>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              name="precio_compra_kg"
              value={formData.precio_compra_kg}
              onChange={handleChange}
              placeholder="15000.00"
              className="w-full bg-stone-950 border border-stone-700 rounded-lg px-3 py-2 text-stone-100 text-sm focus:outline-none focus:border-amber-500 font-mono"
            />
          </div>

          {/* Calidad Indicator Banner */}
          <div className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
            cumpleNTC ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300' : 'bg-amber-950/40 border-amber-800/60 text-amber-300'
          }`}>
            <span>
              <strong>Norma Técnica NTC 1252:</strong> {cumpleNTC ? 'Aprobado para Cacao Premium Fino' : 'Requiere secado o fermentación adicional'}
            </span>
            <span className="font-mono text-[11px] font-bold">
              {cumpleNTC ? 'ESTADO: LIBERADO' : 'ESTADO: PENDIENTE'}
            </span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-stone-950 font-bold py-2.5 rounded-lg text-sm transition-all shadow-lg hover:shadow-amber-900/30 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Registrando en Bodega...' : 'Confirmar Ingreso y Liquidar Lote'}
          </button>
        </form>
      </div>

      {/* Columna Derecha: Lotes en Bodega y Saldos Activos */}
      <div className="lg:col-span-5 space-y-4">
        <div className="bg-stone-900 border border-stone-800 rounded-xl p-5 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-stone-800">
            <h3 className="text-sm font-bold text-stone-200 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-amber-500" />
              Saldos Disponibles en Bodega
            </h3>
            <span className="text-xs bg-stone-800 text-stone-400 px-2 py-0.5 rounded font-mono">
              {lotes.length} lotes
            </span>
          </div>

          <div className="mt-3 divide-y divide-stone-800/80 max-h-[380px] overflow-y-auto pr-1">
            {lotes.length === 0 ? (
              <p className="text-xs text-stone-500 py-6 text-center">No hay lotes registrados.</p>
            ) : (
              lotes.map((lote) => (
                <div key={lote.id} className="py-2.5 flex items-center justify-between gap-2 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-amber-300">{lote.id}</span>
                      <span className="text-[11px] text-stone-400">· {lote.origen_municipio}</span>
                    </div>
                    <p className="text-[11px] text-stone-500 truncate max-w-[180px]">{lote.productor}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-emerald-400 block">
                      {parseFloat(lote.kg_disponibles).toFixed(2)} kg
                    </span>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                      lote.estado === 'LIBERADO'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : lote.estado === 'BLOQUEADO'
                        ? 'bg-rose-950 text-rose-400 border border-rose-800'
                        : 'bg-amber-950 text-amber-400 border border-amber-800'
                    }`}>
                      {lote.estado}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
