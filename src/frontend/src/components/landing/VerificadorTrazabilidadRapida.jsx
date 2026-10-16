import React, { useState } from 'react';
import { Search, QrCode, ShieldCheck, ArrowRight, Sparkles, Lock, ExternalLink } from 'lucide-react';

export function VerificadorTrazabilidadRapida({ onConsultarLote, onEntrarGestion, onExplorarCatalogo }) {
  const [codigoLote, setCodigoLote] = useState('CAC001');
  const [errorInput, setErrorInput] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    const limpio = codigoLote.trim().toUpperCase();
    if (!limpio) {
      setErrorInput('Por favor ingresa un código de lote válido (ej. CAC001)');
      return;
    }
    setErrorInput(null);
    if (onConsultarLote) {
      onConsultarLote(limpio);
    }
  };

  const sugerencias = ['CAC001', 'CAC002', 'CAC003'];

  return (
    <section id="verificador-rapido" className="py-24 bg-[#16120E] text-[#FAF7F0] relative overflow-hidden border-t border-[#3C2418]">
      {/* Fondo con textura sutil y resplandor de cacao tostado */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#234737]/30 via-transparent to-transparent pointer-events-none" />

      <div className="max-w-5xl mx-auto px-6 sm:px-12 relative z-10 text-center space-y-8">
        <div className="inline-flex items-center gap-2 bg-[#FAF7F0]/10 border border-[#D4AF37]/40 px-4 py-1.5 rounded-full text-xs font-mono text-[#D4AF37]">
          <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
          <span>Escena 07 / Consulta Directa de Trazabilidad</span>
        </div>

        <h2 className="font-serif-editorial text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-[#FAF7F0] max-w-3xl mx-auto leading-tight">
          La certeza de un cacao cultivado con orgullo
        </h2>

        <p className="font-sans text-sm sm:text-base md:text-lg text-[#E9DCC5]/80 font-light max-w-2xl mx-auto">
          Ingrese el código de cualquier lote o empaque para verificar su origen, fecha de acopio, análisis de fermentación y cadena de custodia certificada.
        </p>

        {/* Formulario de Verificación Rápida de Lote */}
        <form onSubmit={handleSubmit} className="max-w-xl mx-auto pt-4">
          <div className="flex flex-col sm:flex-row items-center gap-3 bg-[#FAF7F0]/10 p-2 rounded-2xl sm:rounded-full border border-[#D4AF37]/40 shadow-2xl backdrop-blur-md">
            <div className="flex items-center gap-3 px-4 w-full">
              <QrCode className="w-5 h-5 text-[#D4AF37] shrink-0" />
              <input
                type="text"
                value={codigoLote}
                onChange={(e) => {
                  setCodigoLote(e.target.value.toUpperCase());
                  setErrorInput(null);
                }}
                placeholder="Ingresa código (ej. CAC001)"
                className="w-full bg-transparent text-sm sm:text-base font-mono font-bold text-[#FAF7F0] placeholder-[#E9DCC5]/40 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#234737] hover:bg-[#1a3529] active:bg-[#16120E] text-[#FAF7F0] font-sans font-bold text-xs sm:text-sm px-6 py-3.5 rounded-xl sm:rounded-full transition-all shadow-lg cursor-pointer shrink-0"
            >
              <span>Consultar Pasaporte</span>
              <ArrowRight className="w-4 h-4 text-[#D4AF37]" />
            </button>
          </div>

          {errorInput && (
            <p className="text-xs text-rose-400 mt-2">{errorInput}</p>
          )}

          {/* Atajos Rápidos a Lotes Oficiales de la Hackathon */}
          <div className="flex items-center justify-center gap-2 mt-4 text-xs text-[#E9DCC5]/70">
            <span>Lotes disponibles en prueba:</span>
            {sugerencias.map((cod) => (
              <button
                type="button"
                key={cod}
                onClick={() => {
                  setCodigoLote(cod);
                  if (onConsultarLote) onConsultarLote(cod);
                }}
                className="font-mono bg-[#FAF7F0]/10 hover:bg-[#FAF7F0]/20 px-2.5 py-1 rounded-md text-[#D4AF37] border border-[#D4AF37]/30 transition-all cursor-pointer"
              >
                {cod}
              </button>
            ))}
          </div>
        </form>

        {/* Acciones Secundarias de Enlace */}
        <div className="pt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={onExplorarCatalogo}
            className="w-full sm:w-auto px-6 py-3 rounded-full bg-[#FAF7F0]/10 hover:bg-[#FAF7F0]/20 text-xs font-semibold text-[#FAF7F0] border border-[#FAF7F0]/20 transition-all cursor-pointer"
          >
            Explorar Catálogo Completo
          </button>

          <button
            onClick={onEntrarGestion}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[#B77A3C]/20 hover:bg-[#B77A3C]/30 text-xs font-semibold text-[#D4AF37] border border-[#B77A3C]/40 transition-all cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Acceso Cooperativa (Operador / Admin)</span>
          </button>
        </div>
      </div>
    </section>
  );
}
