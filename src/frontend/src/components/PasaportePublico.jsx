import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { QrCode, Smartphone, Copy, Check, ExternalLink, ShieldCheck, AlertOctagon, Sparkles, MapPin, Calendar, Award } from 'lucide-react';
import { api } from '../api/client';

export function PasaportePublico({ loteIdSeleccionado, lotes }) {
  const [loteId, setLoteId] = useState(loteIdSeleccionado || (lotes[0]?.id || 'CAC001'));
  const [pasaporte, setPasaporte] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Modo vista móvil simulada (marco de smartphone 375px)
  const [vistaMovilSimulada, setVistaMovilSimulada] = useState(false);
  
  // Modal de solicitud B2B offline
  const [modalB2B, setModalB2B] = useState(false);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    if (loteIdSeleccionado) {
      setLoteId(loteIdSeleccionado);
    }
  }, [loteIdSeleccionado]);

  useEffect(() => {
    cargarPasaporte(loteId);
  }, [loteId]);

  const cargarPasaporte = async (id) => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.getPasaporte(id);
      setPasaporte(data);
    } catch (err) {
      setError(err.message);
      setPasaporte(null);
    } finally {
      setLoading(false);
    }
  };

  const urlQR = typeof window !== 'undefined'
    ? `${window.location.origin}/pasaporte/${loteId}`
    : `http://127.0.0.1:5173/pasaporte/${loteId}`;

  const generarMensajeB2B = () => {
    if (!pasaporte) return '';
    return `Hola Asociación de Cacaocultores del Huila. Estoy interesado en solicitar una muestra comercial del Lote ${pasaporte.lote_id} (${pasaporte.variedad}), originario de ${pasaporte.origen_municipio}, Huila. Verifiqué su Pasaporte Digital con certificación ${pasaporte.sello_calidad}.`;
  };

  const copiarAlPortapapeles = () => {
    navigator.clipboard.writeText(generarMensajeB2B());
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Barra Superior del Pasaporte: Selector y Modos */}
      <div className="bg-stone-900 border border-stone-800 rounded-xl p-4 shadow-md flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-950/80 text-amber-400 border border-amber-800/60">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-stone-100">Pasaporte Digital de Cacao (Ficha QR - RF06)</h2>
            <p className="text-xs text-stone-400">DTO sanitizado para compradores internacionales (sin fuga de costos internos)</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Selector de Lote */}
          <select
            value={loteId}
            onChange={(e) => setLoteId(e.target.value)}
            className="bg-stone-950 border border-stone-700 rounded-lg px-3 py-1.5 text-xs text-stone-100 font-mono focus:outline-none focus:border-amber-500"
          >
            {lotes.map((l) => (
              <option key={l.id} value={l.id}>
                {l.id} · {l.origen_municipio} ({l.estado})
              </option>
            ))}
          </select>

          {/* Botón Simular Escaneo Móvil */}
          <button
            onClick={() => setVistaMovilSimulada(!vistaMovilSimulada)}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
              vistaMovilSimulada
                ? 'bg-amber-600 text-stone-950 border-amber-500'
                : 'bg-stone-800 hover:bg-stone-700 text-stone-200 border-stone-600'
            }`}
            title="Previsualizar en marco de smartphone (375px) para prueba sin internet en Oasis Plaza"
          >
            <Smartphone className="w-4 h-4" />
            <span>{vistaMovilSimulada ? 'Vista Completa' : 'Simular Escaneo QR (Móvil)'}</span>
          </button>
        </div>
      </div>

      {loading && (
        <div className="p-12 text-center text-stone-400 text-xs font-mono">
          Cargando pasaporte público de trazabilidad...
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-950/60 border border-rose-800 rounded-xl text-rose-200 text-xs">
          Error al cargar pasaporte: {error}
        </div>
      )}

      {pasaporte && (
        <div className={vistaMovilSimulada ? 'max-w-[390px] mx-auto' : 'max-w-4xl mx-auto'}>
          {/* Marco de Teléfono cuando la simulación está activa */}
          <div className={vistaMovilSimulada ? 'border-8 border-stone-800 rounded-[2.5rem] p-4 bg-stone-950 shadow-2xl relative' : ''}>
            {vistaMovilSimulada && (
              <div className="w-24 h-4 bg-stone-800 rounded-full mx-auto mb-4"></div>
            )}

            {/* Contenido del Pasaporte */}
            <div className="bg-stone-900 border border-amber-950/80 rounded-2xl overflow-hidden shadow-2xl">
              {/* Encabezado con Denominación de Origen Huila */}
              <div className="bg-gradient-to-r from-amber-950 via-stone-900 to-amber-900 p-5 border-b border-amber-800/40 text-center relative">
                <span className="text-[10px] uppercase font-bold tracking-widest text-amber-400 block mb-1">
                  República de Colombia · Denominación de Origen
                </span>
                <h1 className="text-xl font-black text-stone-100 tracking-tight">
                  CACAO FINO DE AROMA DEL HUILA
                </h1>
                <p className="text-xs text-amber-200/80 mt-1 flex items-center justify-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  {pasaporte.origen_municipio}, {pasaporte.departamento}
                </p>

                {/* Badge de Sello Calidad */}
                <div className="mt-3 inline-flex items-center gap-1.5 bg-stone-950/70 border border-amber-600/60 text-amber-300 px-3 py-1 rounded-full text-xs font-semibold">
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                  <span>{pasaporte.sello_calidad}</span>
                </div>
              </div>

              {/* Banner de Cuarentena (si está bloqueado) */}
              {pasaporte.estado === 'BLOQUEADO' && (
                <div className="bg-rose-700 text-white p-3 text-center text-xs font-bold flex items-center justify-center gap-2">
                  <AlertOctagon className="w-4 h-4" />
                  <span>LOTE EN RETENCIÓN PREVENTIVA DE CALIDAD (NO APTO PARA EXPORTACIÓN)</span>
                </div>
              )}

              <div className="p-6 space-y-6">
                {/* QR y Datos Principales */}
                <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-stone-800">
                  <div className="p-3 bg-white rounded-xl shadow-lg shrink-0">
                    <QRCodeSVG
                      value={urlQR}
                      size={150}
                      level="M"
                      includeMargin={false}
                    />
                    <span className="block text-center font-mono text-[10px] text-stone-600 font-bold mt-1">
                      {pasaporte.lote_id}
                    </span>
                  </div>

                  <div className="flex-1 space-y-2 text-xs">
                    <div>
                      <span className="text-stone-400 block text-[11px]">Identificador de Lote:</span>
                      <span className="text-lg font-mono font-bold text-amber-400">{pasaporte.lote_id}</span>
                    </div>

                    <div>
                      <span className="text-stone-400 block text-[11px]">Productor Cacaocultor:</span>
                      <span className="text-stone-200 font-semibold">{pasaporte.productor}</span>
                    </div>

                    <div>
                      <span className="text-stone-400 block text-[11px]">Variedad Genética:</span>
                      <span className="text-stone-300">{pasaporte.variedad}</span>
                    </div>

                    <div className="flex items-center gap-3 pt-1">
                      <div>
                        <span className="text-stone-400 block text-[10px]">Humedad:</span>
                        <span className="font-mono font-bold text-emerald-400 text-sm">
                          {parseFloat(pasaporte.humedad_porcentaje).toFixed(1)}%
                        </span>
                      </div>
                      <div>
                        <span className="text-stone-400 block text-[10px]">Fermentación:</span>
                        <span className="font-mono font-bold text-purple-400 text-sm">
                          {parseFloat(pasaporte.fermentacion_porcentaje).toFixed(1)}%
                        </span>
                      </div>
                      <div>
                        <span className="text-stone-400 block text-[10px]">Estado Comercial:</span>
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                          pasaporte.es_comercializable
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-rose-950 text-rose-400 border border-rose-800'
                        }`}>
                          {pasaporte.es_comercializable ? 'Apto para Venta' : 'En Cuarentena'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Línea de Tiempos / Etapas de Trazabilidad */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-3 flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-amber-400" />
                    Etapas de Transformación Registradas
                  </h3>

                  {pasaporte.etapas.length === 0 ? (
                    <p className="text-xs text-stone-500 italic">
                      Lote en grano recién acopiado. Aún no se han registrado etapas de transformación física.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {pasaporte.etapas.map((etapa, idx) => (
                        <div key={idx} className="p-3 bg-stone-950 rounded-lg border border-stone-800/80 text-xs flex items-center justify-between">
                          <div>
                            <span className="font-bold text-stone-200 block">{etapa.etapa}</span>
                            <span className="text-[11px] text-stone-400">
                              Responsable: {etapa.responsable} · {new Date(etapa.fecha).toLocaleDateString('es-CO')}
                            </span>
                          </div>
                          <span className="text-[11px] font-semibold text-emerald-400 font-mono">
                            {etapa.conformidad}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Blindaje de Privacidad */}
                <div className="p-3 bg-stone-950/50 rounded-lg border border-stone-800 text-[11px] text-stone-400 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    <strong>Garantía de Confidencialidad:</strong> Los costos internos de transformación, márgenes comerciales y teléfonos personales están estrictamente excluidos de esta ficha según la Política de Datos de la Asociación.
                  </span>
                </div>

                {/* Botón de Contacto Comercial / Lead B2B */}
                <div>
                  <button
                    onClick={() => setModalB2B(true)}
                    disabled={!pasaporte.es_comercializable}
                    className={`w-full py-2.5 rounded-lg text-xs font-bold transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer ${
                      pasaporte.es_comercializable
                        ? 'bg-amber-600 hover:bg-amber-500 text-stone-950'
                        : 'bg-stone-800 text-stone-500 cursor-not-allowed'
                    }`}
                  >
                    <span>Solicitar Muestra o Cotización B2B (Exportación)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal B2B Resiliente (Offline Proof) */}
      {modalB2B && pasaporte && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-stone-900 border border-stone-700 max-w-md w-full rounded-xl p-5 shadow-2xl animate-in fade-in zoom-in-95">
            <h3 className="font-bold text-stone-100 text-sm pb-2 border-b border-stone-800">
              Solicitud de Muestra Comercial B2B
            </h3>
            <p className="text-xs text-stone-400 mt-2">
              Mensaje institucional autogenerado con certificación EUDR y trazabilidad de origen:
            </p>

            <div className="mt-3 p-3 bg-stone-950 rounded-lg border border-stone-800 text-xs font-mono text-stone-300 whitespace-pre-wrap">
              {generarMensajeB2B()}
            </div>

            <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setModalB2B(false)}
                className="px-3 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold rounded-lg cursor-pointer"
              >
                Cerrar
              </button>

              <button
                type="button"
                onClick={copiarAlPortapapeles}
                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-600 hover:bg-amber-500 text-stone-950 text-xs font-bold rounded-lg transition-all cursor-pointer shadow-md"
              >
                {copiado ? <Check className="w-4 h-4 text-stone-950" /> : <Copy className="w-4 h-4" />}
                <span>{copiado ? '¡Copiado al Portapapeles!' : 'Copiar Orden (Modo Offline)'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
