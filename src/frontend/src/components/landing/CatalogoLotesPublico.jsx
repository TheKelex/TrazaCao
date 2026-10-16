import React, { useState, useMemo } from 'react';
import { 
  Award, QrCode, MapPin, Scale, Droplets, Flame, AlertOctagon, 
  CheckCircle2, ArrowUpRight, Search, Filter, ShieldCheck, Mail
} from 'lucide-react';

export function CatalogoLotesPublico({ lotes = [], onVerPasaporte, onSolicitarMuestra }) {
  const [filtroMunicipio, setFiltroMunicipio] = useState('TODOS');
  const [busqueda, setBusqueda] = useState('');

  // Lotes sintéticos canónicos de respaldo si la base de datos aún no ha cargado
  const lotesCanónicos = [
    {
      id: 'CAC001',
      productor: 'Carlos Alberto Gómez',
      finca: 'Finca Villa Esperanza',
      origen_municipio: 'Rivera',
      departamento: 'Huila',
      variedad: 'Cacao Fino de Aroma (Criollo / Trinitario)',
      kg_recibidos: '100.00',
      kg_disponibles: '80.00',
      humedad_porcentaje: '6.80',
      fermentacion_porcentaje: '82.50',
      estado: 'LIBERADO',
      imagen: '/images/producto.jpg',
      notas: 'Notas a frutos rojos, panela, madera noble y baja acidez.',
      sello: 'Denominación de Origen Huila · Calidad NTC 1252',
    },
    {
      id: 'CAC002',
      productor: 'María Algeciras',
      finca: 'Finca El Paraíso',
      origen_municipio: 'Campoalegre',
      departamento: 'Huila',
      variedad: 'Trinitario Selección Regional',
      kg_recibidos: '120.00',
      kg_disponibles: '120.00',
      humedad_porcentaje: '7.10',
      fermentacion_porcentaje: '78.00',
      estado: 'LIBERADO',
      imagen: '/images/cultivo.jpg',
      notas: 'Aroma floral dulce, cacao intenso, notas cítricas balanceadas.',
      sello: 'Cero Deforestación · Compatible EUDR',
    },
    {
      id: 'CAC003',
      productor: 'Hernando Trujillo',
      finca: 'Finca La Esperanza',
      origen_municipio: 'Algeciras',
      departamento: 'Huila',
      variedad: 'Criollo Andino Tradicional',
      kg_recibidos: '90.00',
      kg_disponibles: '90.00',
      humedad_porcentaje: '7.40',
      fermentacion_porcentaje: '76.00',
      estado: 'PENDIENTE',
      imagen: '/images/recoleccion.jpg',
      notas: 'Perfil en maduración: tonos nuez, malta y caramelo.',
      sello: 'En Proceso de Certificación NTC 1252',
    },
  ];

  // Usar datos reales del backend si existen; si no, el catálogo canónico
  const lotesMostrados = useMemo(() => {
    const fuente = (lotes && lotes.length > 0) ? lotes : lotesCanónicos;
    return fuente.filter((lote) => {
      const muni = lote.origen_municipio || lote.origen || '';
      if (filtroMunicipio !== 'TODOS' && muni !== filtroMunicipio) return false;
      if (busqueda.trim()) {
        const query = busqueda.toLowerCase();
        const coincideId = lote.id.toLowerCase().includes(query);
        const coincideProd = (lote.productor || '').toLowerCase().includes(query);
        const coincideMuni = muni.toLowerCase().includes(query);
        if (!coincideId && !coincideProd && !coincideMuni) return false;
      }
      return true;
    });
  }, [lotes, filtroMunicipio, busqueda]);

  return (
    <section id="lotes-disponibles" className="py-24 bg-[#16120E] text-[#FAF7F0] border-t border-[#3C2418]">
      <div className="max-w-7xl mx-auto px-6 sm:px-12">
        {/* Encabezado Editorial de Sección */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-12 border-b border-[#3C2418]">
          <div className="space-y-3 max-w-2xl">
            <span className="font-mono text-xs uppercase tracking-[0.25em] text-[#D4AF37] block">
              Escena 06 / Catálogo Comercial B2B
            </span>
            <h2 className="font-serif-editorial text-4xl sm:text-5xl font-bold tracking-tight text-[#FAF7F0]">
              Lotes Certificados de Cacao del Huila
            </h2>
            <p className="font-sans text-sm sm:text-base text-[#E9DCC5]/80 font-light">
              Explore los lotes acopiados por los productores asociados. Cada lote cuenta con análisis físico, trazabilidad completa y pasaporte digital accesible sin intermediación opaca.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs text-[#E9DCC5]/60 font-mono">
              * Datos sintéticos de demostración oficial (II Hackathon USCO)
            </span>
          </div>
        </div>

        {/* Filtros por Municipio y Buscador */}
        <div className="py-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
            {['TODOS', 'Rivera', 'Campoalegre', 'Algeciras'].map((muni) => (
              <button
                key={muni}
                onClick={() => setFiltroMunicipio(muni)}
                className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  filtroMunicipio === muni
                    ? 'bg-[#234737] text-[#FAF7F0] shadow-md border border-[#D4AF37]/40'
                    : 'bg-[#FAF7F0]/5 hover:bg-[#FAF7F0]/10 text-[#E9DCC5] border border-[#FAF7F0]/10'
                }`}
              >
                {muni === 'TODOS' ? 'Todos los Municipios' : `${muni}, Huila`}
              </button>
            ))}
          </div>

          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-[#E9DCC5]/50 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Buscar por lote o productor..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full bg-[#FAF7F0]/5 border border-[#FAF7F0]/15 rounded-full pl-10 pr-4 py-2 text-xs text-[#FAF7F0] placeholder-[#E9DCC5]/40 focus:outline-none focus:border-[#D4AF37]"
            />
          </div>
        </div>

        {/* Grid Editorial de Lotes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {lotesMostrados.map((lote, index) => {
            const muni = lote.origen_municipio || lote.origen || 'Huila';
            const esLiberado = lote.estado === 'LIBERADO';
            const esBloqueado = lote.estado === 'BLOQUEADO';
            const imagenLote = lote.imagen || (index % 2 === 0 ? '/images/producto.jpg' : '/images/grano.jpg');

            return (
              <div
                key={lote.id}
                className={`group bg-[#FAF7F0]/95 text-[#16120E] rounded-3xl overflow-hidden shadow-2xl border transition-all duration-300 hover:-translate-y-1.5 ${
                  esBloqueado ? 'border-rose-600/60' : 'border-[#D4AF37]/30 hover:border-[#D4AF37]'
                }`}
              >
                {/* Cabecera con Imagen y Badges */}
                <div className="relative h-56 overflow-hidden bg-[#234737]">
                  <img
                    src={imagenLote}
                    alt={lote.id}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                  {/* ID de Lote y Municipio */}
                  <div className="absolute top-4 left-4 flex items-center gap-2">
                    <span className="font-mono text-xs font-bold bg-[#16120E]/90 text-[#D4AF37] px-3 py-1 rounded-full border border-[#D4AF37]/40 shadow">
                      {lote.id}
                    </span>
                    <span className="text-[11px] font-medium bg-[#234737]/90 text-[#FAF7F0] px-3 py-1 rounded-full border border-white/20 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-[#D4AF37]" />
                      {muni}, Huila
                    </span>
                  </div>

                  {/* Estado de Calidad */}
                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full shadow ${
                        esLiberado
                          ? 'bg-emerald-900/90 text-emerald-200 border border-emerald-500/50'
                          : esBloqueado
                          ? 'bg-rose-900/95 text-rose-200 border border-rose-500'
                          : 'bg-amber-900/90 text-amber-200 border border-amber-500/50'
                      }`}
                    >
                      {esLiberado && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                      {esBloqueado && <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />}
                      <span>{lote.estado || 'PENDIENTE'}</span>
                    </span>

                    <span className="font-mono text-xs text-[#FAF7F0] font-semibold bg-black/60 px-2.5 py-1 rounded-md">
                      {parseFloat(lote.kg_disponibles || lote.kg_recibidos || 0).toFixed(0)} kg disp.
                    </span>
                  </div>
                </div>

                {/* Contenido Editorial del Lote */}
                <div className="p-6 space-y-4">
                  <div>
                    <h3 className="font-serif-editorial text-xl font-bold text-[#16120E] leading-snug">
                      {lote.productor || 'Cacaocultor Asociado'}
                    </h3>
                    <p className="text-xs text-[#3C2418]/70 font-sans mt-0.5">
                      {lote.finca || 'Finca Tradicional Huilense'} · {lote.variedad || 'Fino de Aroma'}
                    </p>
                  </div>

                  {/* Alerta de Retención (si está bloqueado) */}
                  {esBloqueado && (
                    <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-rose-900 text-xs flex items-start gap-2">
                      <AlertOctagon className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="block">Retención Preventiva (Hora 12)</strong>
                        <span>Lote en cuarentena técnica. Comercialización no autorizada.</span>
                      </div>
                    </div>
                  )}

                  {/* Métricas Físicas NTC 1252 */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#3C2418]/10 text-xs">
                    <div className="p-2.5 bg-[#E9DCC5]/40 rounded-xl">
                      <span className="text-[10px] uppercase font-bold text-[#3C2418]/70 block flex items-center gap-1">
                        <Droplets className="w-3 h-3 text-[#234737]" /> Humedad
                      </span>
                      <span className="font-mono font-bold text-sm text-[#16120E] mt-0.5 block">
                        {parseFloat(lote.humedad_porcentaje || 7.0).toFixed(1)}%
                      </span>
                    </div>

                    <div className="p-2.5 bg-[#E9DCC5]/40 rounded-xl">
                      <span className="text-[10px] uppercase font-bold text-[#3C2418]/70 block flex items-center gap-1">
                        <Flame className="w-3 h-3 text-[#B77A3C]" /> Fermentación
                      </span>
                      <span className="font-mono font-bold text-sm text-[#16120E] mt-0.5 block">
                        {parseFloat(lote.fermentacion_porcentaje || 80.0).toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  {/* Notas de Cata / Perfil */}
                  <p className="text-xs text-[#3C2418] italic font-serif">
                    "{lote.notas || 'Notas sensoriales a chocolate amargo, frutos secos y dulce de caña característico del Huila.'}"
                  </p>

                  {/* Botón de Acción Principal */}
                  <div className="pt-2">
                    <button
                      onClick={() => onVerPasaporte && onVerPasaporte(lote.id)}
                      className="w-full flex items-center justify-center gap-2 bg-[#234737] hover:bg-[#1b362a] active:bg-[#16120E] text-[#FAF7F0] font-sans font-semibold text-xs py-3 px-4 rounded-xl transition-all shadow-md cursor-pointer"
                    >
                      <QrCode className="w-4 h-4 text-[#D4AF37]" />
                      <span>Consultar Pasaporte QR & Trazabilidad</span>
                      <ArrowUpRight className="w-4 h-4 ml-auto" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Garantía de Confidencialidad y Cumplimiento Internacional */}
        <div className="mt-16 p-6 sm:p-8 rounded-3xl bg-[#FAF7F0]/5 border border-[#FAF7F0]/15 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-[#E9DCC5]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#234737] border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-serif-editorial text-base font-bold text-[#FAF7F0]">
                Trazabilidad 100% Verificable sin Fuga de Costos Internos
              </h4>
              <p className="text-xs text-[#E9DCC5]/80 mt-1 max-w-2xl font-light">
                Cumplimiento estricto de la Norma NTC 1252 y compatibilidad con el Reglamento Europeo EUDR. Los compradores internacionales pueden consultar el origen, lote y fermentación sin exponer costos de intermediación ni datos privados del cacaocultor.
              </p>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-3">
            <span className="font-mono text-[11px] bg-[#FAF7F0]/10 px-3 py-1.5 rounded-full border border-white/10">
              Arquitectura Offline Local
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
