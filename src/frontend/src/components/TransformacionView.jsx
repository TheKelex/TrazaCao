import React, { useState, useMemo, useEffect } from 'react';
import { 
  Flame, AlertTriangle, CheckCircle, Scale, Coins, Recycle, ArrowRight, 
  ShieldCheck, UserCheck, Ban, Calendar, Clock, AlertOctagon, Link2, Check
} from 'lucide-react';
import { api, generarUUID } from '../api/client';

export function TransformacionView({ auth, lotes, onTransformacionExitosa, defaultLoteId }) {
  // Encontrar el primer lote con saldo disponible si defaultLoteId no tiene saldo
  const loteInicial = useMemo(() => {
    if (defaultLoteId) {
      const match = lotes.find((l) => l.id === defaultLoteId);
      if (match) return match.id;
    }
    const conSaldo = lotes.find((l) => parseFloat(l.kg_disponibles) > 0);
    return conSaldo ? conSaldo.id : (lotes[0]?.id || 'CAC001');
  }, [lotes, defaultLoteId]);

  const [loteId, setLoteId] = useState(loteInicial);
  const [fechaTransformacion, setFechaTransformacion] = useState(new Date().toISOString().slice(0, 10));
  const [etapa, setEtapa] = useState('FERMENTACION_SECADO');
  const [responsable, setResponsable] = useState('Operador Rivera (Acopio y Fermentación)');
  const [kgEntrada, setKgEntrada] = useState('100.00');
  const [kgSalida, setKgSalida] = useState('80.00');
  const [costoEtapa, setCostoEtapa] = useState('1600000.00');
  const [precioVenta, setPrecioVenta] = useState('25000.00');
  const [justificacion, setJustificacion] = useState('Descascarillado, tostión uniforme y pérdida por humedad residual en planta Rivera.');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [resultado, setResultado] = useState(null);
  const [transformacionesLote, setTransformacionesLote] = useState([]);

  useEffect(() => {
    if (loteInicial) {
      setLoteId(loteInicial);
    }
  }, [loteInicial]);

  // Cargar transformaciones previas de este lote para mostrar la vinculación histórica
  const cargarHistorialTransformaciones = async (id) => {
    if (!id) return;
    try {
      const data = await api.getTransformaciones(auth);
      const filtradas = data.filter((t) => t.lote_id === id);
      setTransformacionesLote(filtradas);
    } catch (err) {
      console.warn('No se pudo cargar historial de transformaciones:', err);
    }
  };

  useEffect(() => {
    cargarHistorialTransformaciones(loteId);
  }, [loteId]);

  // Lote seleccionado actualmente
  const loteSeleccionado = useMemo(() => {
    return lotes.find((l) => l.id === loteId) || null;
  }, [lotes, loteId]);

  const loteBloqueado = loteSeleccionado?.estado === 'BLOQUEADO';
  const stockDisponible = parseFloat(loteSeleccionado?.kg_disponibles) || 0;
  const entradaNum = parseFloat(kgEntrada) || 0;
  const sobreconsumo = entradaNum > stockDisponible;

  // Detección de Retraso Operativo en beneficio
  const alertaRetraso = useMemo(() => {
    if (!loteSeleccionado?.fecha_recepcion) return null;
    const fechaRecepcion = new Date(loteSeleccionado.fecha_recepcion);
    const fechaActual = new Date(fechaTransformacion);
    const diasTranscurridos = Math.max(0, Math.floor((fechaActual - fechaRecepcion) / (1000 * 60 * 60 * 24)));
    
    if (diasTranscurridos > 6) {
      return {
        tipo: 'retraso',
        dias: diasTranscurridos,
        mensaje: `⚠ Alerta de Retraso en Proceso: Han transcurrido ${diasTranscurridos} días desde el acopio. Riesgo de fermentación ácida excesiva según NTC 1252.`,
      };
    }
    return {
      tipo: 'optimo',
      dias: diasTranscurridos,
      mensaje: `✓ Ciclo de proceso óptimo: ${diasTranscurridos} días transcurridos desde recepción (< 6 días recomendados).`,
    };
  }, [loteSeleccionado, fechaTransformacion]);

  // Detección de Registro Incompleto
  const alertaRegistroIncompleto = useMemo(() => {
    const problemas = [];
    if (!loteId) problemas.push('Lote de origen no seleccionado');
    if (!responsable || responsable.trim().length < 3) problemas.push('Responsable técnico no especificado');
    if (!fechaTransformacion) problemas.push('Fecha de transformación no ingresada');
    if (entradaNum <= 0) problemas.push('Masa de entrada debe ser mayor a 0 kg');
    const salidaNum = parseFloat(kgSalida) || 0;
    if (salidaNum > entradaNum) problemas.push('Inconsistencia física: Masa de salida vendible supera la entrada');
    return problemas;
  }, [loteId, responsable, fechaTransformacion, entradaNum, kgSalida]);

  // Cálculos reactivos en tiempo real (Espejo exacto del Dominio Python)
  const calculosEnVivo = useMemo(() => {
    const entrada = parseFloat(kgEntrada) || 0;
    const salida = parseFloat(kgSalida) || 0;
    const costo = parseFloat(costoEtapa) || 0;
    const precio = parseFloat(precioVenta) || 0;

    if (entrada <= 0) {
      return { mermaPorcentaje: 0, alertaMerma: false, costoUnitario: 0, margen: 0, cascarillaKg: 0, ingresoCascarilla: 0, costoNeto: costo, errorValidacion: 'La entrada debe ser mayor a 0 kg' };
    }
    if (sobreconsumo) {
      return { mermaPorcentaje: 0, alertaMerma: false, costoUnitario: 0, margen: 0, cascarillaKg: 0, ingresoCascarilla: 0, costoNeto: costo, errorValidacion: `Stock insuficiente: Kilos de entrada (${entrada.toFixed(2)} kg) superan los disponibles en bodega (${stockDisponible.toFixed(2)} kg)` };
    }
    if (loteBloqueado) {
      return { mermaPorcentaje: 0, alertaMerma: false, costoUnitario: 0, margen: 0, cascarillaKg: 0, ingresoCascarilla: 0, costoNeto: costo, errorValidacion: 'Lote en cuarentena preventiva: No se pueden registrar transformaciones en lotes retenidos por calidad' };
    }
    if (salida > entrada) {
      return { mermaPorcentaje: 0, alertaMerma: false, costoUnitario: 0, margen: 0, cascarillaKg: 0, ingresoCascarilla: 0, costoNeto: costo, errorValidacion: 'La salida vendible no puede superar la masa de entrada (Ley de conservación de masa)' };
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
  }, [kgEntrada, kgSalida, costoEtapa, precioVenta, sobreconsumo, loteBloqueado, stockDisponible]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validaciones explícitas antes de enviar con alertas visuales claras
    if (loteBloqueado) {
      setError('Operación Bloqueada: El lote seleccionado se encuentra en cuarentena preventiva. Debe ser liberado formalmente por el Administrador para ser procesado.');
      return;
    }

    if (sobreconsumo) {
      setError(`Existencias Insuficientes: El lote ${loteId} solo tiene ${stockDisponible.toFixed(2)} kg disponibles en bodega. No puedes consumir ${entradaNum.toFixed(2)} kg.`);
      return;
    }

    if (alertaRegistroIncompleto.length > 0) {
      setError(`Registro Incompleto: Por favor corrige: ${alertaRegistroIncompleto.join(', ')}.`);
      return;
    }

    if (requiereJustificacion && !justificacionValida) {
      setError('Justificación Requerida: Al registrar una merma anómala superior al 15.0%, debes ingresar el motivo técnico de la incidencia (mínimo 10 caracteres).');
      return;
    }

    setLoading(true);
    setError(null);
    setResultado(null);

    const idempotencyKey = generarUUID();

    try {
      const payload = {
        lote_id: loteId,
        etapa,
        responsable: responsable.trim(),
        fecha_transformacion: new Date(fechaTransformacion).toISOString(),
        kg_entrada: parseFloat(kgEntrada),
        kg_salida: parseFloat(kgSalida),
        kg_salida_vendible: parseFloat(kgSalida),
        costo_etapa_cop: parseFloat(costoEtapa),
        precio_venta_estimado: parseFloat(precioVenta),
        incidencia_justificacion: requiereJustificacion ? justificacion.trim() : null,
      };

      const resp = await api.crearTransformacion(payload, auth, idempotencyKey);
      setResultado(resp);
      await cargarHistorialTransformaciones(loteId);

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
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Columna Izquierda: Formulario de Transformación */}
        <div className="lg:col-span-7 bg-stone-900 border border-stone-800 rounded-xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-800">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-orange-950/80 text-orange-400 border border-orange-800/60">
                <Flame className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-bold text-stone-100">Control de Etapas de Beneficio y Rendimiento</h2>
                <p className="text-xs text-stone-400">Consumo de stock en bodega y cálculo de balance de masa</p>
              </div>
            </div>
            <span className="text-xs font-mono bg-stone-800 text-amber-400 px-2.5 py-1 rounded-md border border-stone-700">
              Protección contra Duplicidad
            </span>
          </div>

          {/* Banner de Bloqueo Preventivo si el Lote está BLOQUEADO */}
          {loteBloqueado && (
            <div className="p-3.5 bg-rose-950/80 border-2 border-rose-600 rounded-lg text-rose-200 text-xs flex items-start gap-2.5">
              <Ban className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
              <div>
                <p className="font-bold text-sm">⛔ LOTE EN RETENCIÓN PREVENTIVA (BLOQUEADO)</p>
                <p className="mt-0.5 text-rose-300">
                  Este lote fue retenido por el Administrador por sospecha de no conformidad de calidad. El sistema impide consumir existencias o registrar etapas hasta que sea formalmente liberado.
                </p>
              </div>
            </div>
          )}

          {/* Alerta de Sobreconsumo Preventiva */}
          {sobreconsumo && !loteBloqueado && (
            <div className="p-3 bg-amber-950/80 border border-amber-600 rounded-lg text-amber-200 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
              <div>
                <span className="font-bold">Aviso de Existencias Insuficientes: </span>
                <span>La masa solicitada ({entradaNum.toFixed(2)} kg) supera los kilos disponibles en bodega ({stockDisponible.toFixed(2)} kg). Reduce la masa de entrada o selecciona un lote con saldo.</span>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3.5 bg-rose-950/70 border border-rose-700 rounded-lg text-rose-200 text-xs flex items-start gap-2">
              <AlertOctagon className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {resultado && (
            <div className="p-3.5 bg-emerald-950/70 border border-emerald-700 rounded-lg text-emerald-200 text-xs flex items-start gap-2">
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
              <div>
                <p className="font-bold">¡Transformación registrada y vinculada con éxito!</p>
                <p className="text-[11px] text-emerald-300 mt-0.5">
                  ID Salida: <span className="font-mono font-bold">SAL-{loteId}-{resultado.id.slice(0, 8)}</span> | Vinculada al Lote: <span className="font-mono font-bold">{loteId}</span> | Saldo Restante en Bodega: <span className="font-mono font-bold">{(stockDisponible - entradaNum).toFixed(2)} kg</span>
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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
                      {lote.id} · {lote.origen_municipio} ({lote.estado === 'BLOQUEADO' ? '⛔ BLOQUEADO' : `Disp: ${parseFloat(lote.kg_disponibles).toFixed(2)} kg`})
                    </option>
                  ))}
                </select>
                {loteSeleccionado && (
                  <div className="mt-1 flex items-center justify-between text-[11px] text-stone-400">
                    <span>Finca: {loteSeleccionado.productor}</span>
                    <span className={`font-mono font-bold ${loteBloqueado ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {loteBloqueado ? 'EN CUARENTENA' : `Disponible: ${stockDisponible.toFixed(2)} kg`}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  Fecha de la Transformación *
                </label>
                <input
                  type="date"
                  required
                  value={fechaTransformacion}
                  onChange={(e) => setFechaTransformacion(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-700 rounded-lg px-3 py-2 text-stone-100 text-sm focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                  Responsable Encargado de la Etapa *
                </label>
                <select
                  value={responsable}
                  onChange={(e) => setResponsable(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-700 rounded-lg px-3 py-2 text-stone-100 text-sm focus:outline-none focus:border-amber-500"
                >
                  <option value="Operador Rivera (Acopio y Fermentación)">Operador Rivera (Acopio y Fermentación)</option>
                  <option value="Maestro Tostador (Planta Campoalegre)">Maestro Tostador (Planta Campoalegre)</option>
                  <option value="Jefe de Planta (Asociación Huila)">Jefe de Planta (Asociación Huila)</option>
                  <option value="Inspector de Calidad">Inspector de Calidad</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1 flex items-center gap-1">
                  <Scale className="w-3.5 h-3.5 text-amber-400" />
                  Masa de Entrada (kg a consumir) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={kgEntrada}
                  onChange={(e) => setKgEntrada(e.target.value)}
                  className={`w-full bg-stone-950 border rounded-lg px-3 py-2 text-stone-100 text-sm focus:outline-none font-mono ${
                    sobreconsumo ? 'border-rose-500 focus:border-rose-400 text-rose-200' : 'border-stone-700 focus:border-amber-500'
                  }`}
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

            {/* Campo Condicional: Justificación de Incidencia si Merma > 15% */}
            {requiereJustificacion && (
              <div className="p-3.5 bg-rose-950/40 border-2 border-rose-600/80 rounded-lg">
                <label className="block text-xs font-bold text-rose-300 mb-1 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  Justificación de Incidencia (Obligatorio por merma &gt; 15.00%) *
                </label>
                <textarea
                  rows={2}
                  required
                  value={justificacion}
                  onChange={(e) => setJustificacion(e.target.value)}
                  placeholder="Explica la causa técnica de la merma anómala... Mínimo 10 caracteres."
                  className="w-full bg-stone-950 border border-rose-700 rounded-md p-2 text-stone-100 text-xs focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
                <div className="flex items-center justify-between mt-1 text-[11px]">
                  <span className="text-rose-400">
                    Caracteres: {justificacion.length}/10 {justificacion.length < 10 ? '(Insuficiente)' : '(Aprobado)'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setJustificacion('Merma esperada por deshidratación en secado solar y cascarilla de cacao fino.')}
                    className="text-amber-400 hover:underline cursor-pointer"
                  >
                    Insertar motivo sugerido
                  </button>
                </div>
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-stone-950 font-bold py-2.5 rounded-lg text-sm transition-all shadow-lg hover:shadow-amber-900/30 cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Registrando en Bodega...' : 'Registrar Proceso y Actualizar Saldos'}
              </button>
            </div>
          </form>
        </div>

        {/* Columna Derecha: Alertas, Cálculos Transparentes y Residuos */}
        <div className="lg:col-span-5 space-y-4">
          {/* PANEL DE ALERTAS OPERATIVAS Y CALIDAD */}
          <div className="bg-stone-900 border border-stone-800 rounded-xl p-5 shadow-xl space-y-3 text-xs">
            <h3 className="font-bold text-stone-200 text-sm flex items-center gap-2 pb-2 border-b border-stone-800">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Monitoreo Operativo y Alertas de Calidad
            </h3>

            {/* 1. Alerta de Merma */}
            <div className={`p-3 rounded-lg border flex items-start gap-2.5 ${
              calculosEnVivo.alertaMerma 
                ? 'bg-rose-950/60 border-rose-700 text-rose-200 animate-pulse' 
                : 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
            }`}>
              <div className="shrink-0 mt-0.5">
                {calculosEnVivo.alertaMerma ? <AlertOctagon className="w-4 h-4 text-rose-400" /> : <CheckCircle className="w-4 h-4 text-emerald-400" />}
              </div>
              <div>
                <p className="font-bold">
                  {calculosEnVivo.alertaMerma ? 'ALERTA DE MERMA CRÍTICA (> 15%)' : 'MERMA EN RANGO TOLERADO (≤ 15%)'}
                </p>
                <p className="text-[11px] mt-0.5">
                  Merma física calculada: <span className="font-mono font-bold">{calculosEnVivo.mermaPorcentaje.toFixed(2)}%</span>.
                  {calculosEnVivo.alertaMerma ? ' Exige justificación técnica obligatoria.' : ' Proceso conforme a estándares de planta.'}
                </p>
              </div>
            </div>

            {/* 2. Alerta de Retraso Operativo */}
            {alertaRetraso && (
              <div className={`p-3 rounded-lg border flex items-start gap-2.5 ${
                alertaRetraso.tipo === 'retraso'
                  ? 'bg-amber-950/60 border-amber-700 text-amber-200'
                  : 'bg-stone-950 border-stone-800 text-stone-300'
              }`}>
                <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Alerta de Tiempo de Beneficio</p>
                  <p className="text-[11px] mt-0.5">{alertaRetraso.mensaje}</p>
                </div>
              </div>
            )}

            {/* 3. Alerta de Registro Incompleto */}
            <div className={`p-3 rounded-lg border flex items-start gap-2.5 ${
              alertaRegistroIncompleto.length > 0
                ? 'bg-rose-950/40 border-rose-800 text-rose-300'
                : 'bg-stone-950 border-stone-800 text-stone-300'
            }`}>
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Verificación de Integridad de Datos</p>
                {alertaRegistroIncompleto.length > 0 ? (
                  <p className="text-[11px] text-rose-300 mt-0.5">
                    Pendientes: {alertaRegistroIncompleto.join(' · ')}
                  </p>
                ) : (
                  <p className="text-[11px] text-emerald-400 mt-0.5">
                    ✓ Registro 100% completo y validado conforme a Norma NTC 1252.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* ESTRUCTURA DE COSTOS Y ECONOMÍA CIRCULAR */}
          <div className="bg-stone-900 border border-stone-800 rounded-xl p-5 shadow-xl space-y-3 text-xs">
            <h3 className="font-bold text-stone-200 text-sm flex items-center gap-2 pb-2 border-b border-stone-800">
              <Coins className="w-4 h-4 text-amber-500" />
              Estructura de Costos y Economía Circular
            </h3>

            <div className="space-y-2 text-[11px] font-mono">
              <div className="p-2.5 bg-stone-950 rounded border border-stone-800">
                <span className="text-amber-400 font-bold block">1. Costo Unitario de Producción:</span>
                <span className="text-stone-300">Costo = Costo Etapa ({formatearCOP(costoEtapa)}) / Salida ({kgSalida} kg)</span>
                <span className="block font-bold text-stone-100 text-xs mt-1">
                  Resultado: {formatearCOP(calculosEnVivo.costoUnitario)} / kg
                </span>
              </div>

              <div className="p-2.5 bg-stone-950 rounded border border-stone-800">
                <span className="text-emerald-400 font-bold block">2. Margen sobre Venta Estimado:</span>
                <span className="text-stone-300">Margen = (Precio Venta - Costo Unitario) / Precio Venta</span>
                <span className="block font-bold text-emerald-400 text-xs mt-1">
                  Resultado: {calculosEnVivo.margen.toFixed(2)}%
                </span>
              </div>

              {/* DIFERENCIADOR: APROVECHAMIENTO DE MERMA EN CATÁLOGO INDUSTRIAL & BOTÁNICO B2B */}
              <div className="p-3.5 bg-emerald-950/40 rounded-xl border border-emerald-800/80 text-emerald-200 space-y-2">
                <div className="flex items-center justify-between pb-1.5 border-b border-emerald-800/60 font-sans">
                  <span className="font-bold flex items-center gap-1.5 text-xs text-emerald-300">
                    <Recycle className="w-3.5 h-3.5 text-emerald-400" />
                    Valorización B2B: Catálogo Industrial & Botánico
                  </span>
                  <span className="text-[10px] bg-emerald-900 text-emerald-200 px-2 py-0.5 rounded-full font-mono font-bold">
                    Biomasa B2B
                  </span>
                </div>
                <p className="font-sans text-[11px] text-stone-300 leading-relaxed">
                  La merma recuperada ({calculosEnVivo.cascarillaKg.toFixed(2)} kg) alimenta el <strong className="text-emerald-300">Catálogo Industrial y Botánico B2B</strong> como materia prima para laboratorios de cosmética (mascarillas y exfoliantes) y fabricantes de biofertilizantes.
                </p>
                <div className="p-2 rounded bg-black/40 border border-emerald-900 text-[10px] text-emerald-400 font-sans leading-tight">
                  <em>Principio operativo: TrazaCao suministra la biomasa limpia como insumo; no manufacturamos productos comerciales terminados.</em>
                </div>
                <div className="flex items-center justify-between pt-1.5 border-t border-emerald-900/80 font-sans text-xs">
                  <span className="text-stone-300">Ingreso Circular Estimado:</span>
                  <span className="font-mono font-bold text-emerald-400">{formatearCOP(calculosEnVivo.ingresoCascarilla)}</span>
                </div>
                <div className="flex items-center justify-between font-sans text-xs">
                  <span className="text-stone-300">Costo Neto Post-Aprovechamiento:</span>
                  <span className="font-mono font-bold text-emerald-300">{formatearCOP(calculosEnVivo.costoNeto)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TABLA DE SALIDAS VINCULADAS AL LOTE DE ORIGEN */}
      <div className="bg-stone-900 border border-stone-800 rounded-xl p-5 shadow-xl space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-stone-800">
          <div className="flex items-center gap-2">
            <Link2 className="w-4 h-4 text-amber-500" />
            <h3 className="font-bold text-stone-100 text-sm">
              Salidas Vendibles Vinculadas al Lote de Origen
            </h3>
          </div>
          <span className="text-xs text-stone-400 font-mono">
            Lote Activo: <strong className="text-amber-400">{loteId}</strong> ({transformacionesLote.length} salidas generadas)
          </span>
        </div>

        {transformacionesLote.length === 0 ? (
          <div className="p-6 text-center text-xs text-stone-500 italic bg-stone-950 rounded-lg border border-stone-800">
            Aún no se han registrado transformaciones para este lote de origen. Completa el formulario superior para generar la primera salida vinculada.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse font-sans">
              <thead>
                <tr className="bg-stone-950 text-stone-400 border-b border-stone-800 font-mono text-[11px]">
                  <th className="p-2.5">Código Salida</th>
                  <th className="p-2.5">Lote Origen</th>
                  <th className="p-2.5">Fecha</th>
                  <th className="p-2.5">Etapa</th>
                  <th className="p-2.5">Responsable</th>
                  <th className="p-2.5 text-right">Entrada</th>
                  <th className="p-2.5 text-right">Salida</th>
                  <th className="p-2.5 text-right">Merma</th>
                  <th className="p-2.5 text-center">Estado Vinculación</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/80">
                {transformacionesLote.map((t) => (
                  <tr key={t.id} className="hover:bg-stone-800/30">
                    <td className="p-2.5 font-mono text-amber-400 font-bold">
                      SAL-{t.lote_id}-{t.id.slice(0, 8)}
                    </td>
                    <td className="p-2.5 font-mono font-semibold text-stone-300">
                      {t.lote_id}
                    </td>
                    <td className="p-2.5 text-stone-400 font-mono text-[11px]">
                      {new Date(t.fecha_transformacion).toLocaleDateString('es-CO')}
                    </td>
                    <td className="p-2.5 text-stone-200">
                      {t.etapa}
                    </td>
                    <td className="p-2.5 text-stone-400">
                      {t.responsable}
                    </td>
                    <td className="p-2.5 text-right font-mono text-stone-300">
                      {parseFloat(t.kg_entrada).toFixed(2)} kg
                    </td>
                    <td className="p-2.5 text-right font-mono text-emerald-400 font-bold">
                      {parseFloat(t.kg_salida_vendible).toFixed(2)} kg
                    </td>
                    <td className="p-2.5 text-right font-mono">
                      <span className={parseFloat(t.merma_porcentaje) > 15 ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                        {parseFloat(t.merma_porcentaje).toFixed(2)}%
                      </span>
                    </td>
                    <td className="p-2.5 text-center">
                      <span className="inline-flex items-center gap-1 bg-emerald-950 text-emerald-400 border border-emerald-800/80 px-2 py-0.5 rounded text-[10px] font-semibold">
                        <Check className="w-3 h-3" />
                        Vinculado a {t.lote_id}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
