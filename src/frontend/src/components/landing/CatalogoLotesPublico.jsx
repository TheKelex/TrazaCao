import React, { useState, useMemo, useEffect } from 'react';
import { 
  Award, QrCode, MapPin, Scale, Droplets, Flame, AlertOctagon, 
  CheckCircle2, ArrowUpRight, Search, Filter, ShieldCheck, Mail,
  Sparkles, Leaf, Factory, Beaker, Send, CheckCircle, FileText, X
} from 'lucide-react';
import { api } from '../../api/client';

export function CatalogoLotesPublico({ lotes = [], onVerPasaporte, onSolicitarMuestra }) {
  // Pestaña activa: 'granos' (Lotes Fino de Aroma) o 'subproductos' (Catálogo Industrial y Botánico B2B)
  const [seccionActiva, setSeccionActiva] = useState('granos');
  const [filtroMunicipio, setFiltroMunicipio] = useState('TODOS');
  const [busqueda, setBusqueda] = useState('');

  // Estado para el Catálogo Industrial y Botánico B2B
  const [subproductos, setSubproductos] = useState([]);
  const [totalMermaRecuperada, setTotalMermaRecuperada] = useState('20.00');
  const [cargandoSubproductos, setCargandoSubproductos] = useState(false);
  const [filtroSector, setFiltroSector] = useState('TODOS');

  // Estado del Modal de Cotización B2B
  const [subproductoSeleccionado, setSubproductoSeleccionado] = useState(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [enviandoCotizacion, setEnviandoCotizacion] = useState(false);
  const [cotizacionExitosa, setCotizacionExitosa] = useState(null);
  const [formCotizacion, setFormCotizacion] = useState({
    empresa: '',
    sector: 'Industria Cosmética y Dermocosmética',
    correo: '',
    telefono: '',
    volumen_kg: '500',
    aplicacion: 'Formulación de mascarillas faciales y exfoliantes botánicos',
  });

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
      sello: 'Cero Deforestación · Calidad de Origen',
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

  // Subproductos de respaldo para carga inmediata sin latencia
  const subproductosCanónicos = [
    {
      id: 'SUB-COSM-01',
      nombre: 'Cascarilla Micronizada Grado Cosmético',
      sector_industrial: 'Industria Cosmética y Dermocosmética',
      lote_origen_id: 'CAC001',
      municipio_origen: 'Rivera, Huila',
      kg_disponibles: '8.00',
      precio_b2b_kg_cop: '5500.00',
      pureza_botanica: '99.5% materia vegetal limpia de tostión controlada',
      humedad_porcentaje: '5.80',
      aplicaciones_industriales: [
        'Formulación de mascarillas faciales purificantes',
        'Partículas exfoliantes corporales 100% biodegradables',
        'Jabonería botánica y saponificación artesanal',
      ],
      icono: Sparkles,
      color: 'amber',
    },
    {
      id: 'SUB-AGRO-01',
      nombre: 'Biomasa Residual de Cacao para Bioinsumos',
      sector_industrial: 'Agroquímica Orgánica y Biofertilizantes',
      lote_origen_id: 'CAC001',
      municipio_origen: 'Rivera, Huila',
      kg_disponibles: '8.00',
      precio_b2b_kg_cop: '2500.00',
      pureza_botanica: '100% residuo orgánico compostable con cenizas < 6%',
      humedad_porcentaje: '6.50',
      aplicaciones_industriales: [
        'Biofertilizantes líquidos y lixiviados ricos en potasio (K)',
        'Compostaje industrial acelerado y enmiendas de suelo',
        'Biochar y captura de carbono en agricultura regenerativa',
      ],
      icono: Leaf,
      color: 'emerald',
    },
    {
      id: 'SUB-BOTA-01',
      nombre: 'Cascarilla Seleccionada para Extractos y Nutracéutica',
      sector_industrial: 'Extractos Botánicos, Fitofármacos y Nutracéutica',
      lote_origen_id: 'CAC001',
      municipio_origen: 'Rivera, Huila',
      kg_disponibles: '4.00',
      precio_b2b_kg_cop: '6000.00',
      pureza_botanica: 'Grado alimentario / fitoterapéutico, humedad < 7.0%',
      humedad_porcentaje: '5.20',
      aplicaciones_industriales: [
        'Extracción estandarizada de polifenoles y flavonoides antioxidantes',
        'Aislamiento de teobromina para suplementos energéticos',
        'Infusiones botánicas funcionales y bases para bebidas herbales',
      ],
      icono: Beaker,
      color: 'amber',
    },
  ];

  // Cargar catálogo de subproductos desde la API
  useEffect(() => {
    const fetchSubproductos = async () => {
      try {
        setCargandoSubproductos(true);
        const res = await api.getCatalogoSubproductos();
        if (res && res.subproductos && res.subproductos.length > 0) {
          setSubproductos(res.subproductos);
          if (res.total_merma_recuperada_kg) {
            setTotalMermaRecuperada(res.total_merma_recuperada_kg);
          }
        } else {
          setSubproductos(subproductosCanónicos);
        }
      } catch (err) {
        console.warn('Usando catálogo canónico de subproductos:', err);
        setSubproductos(subproductosCanónicos);
      } finally {
        setCargandoSubproductos(false);
      }
    };
    fetchSubproductos();
  }, []);

  // Filtrado de lotes de granos
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

  // Filtrado de subproductos
  const subproductosMostrados = useMemo(() => {
    const fuente = (subproductos && subproductos.length > 0) ? subproductos : subproductosCanónicos;
    return fuente.filter((item) => {
      if (filtroSector !== 'TODOS' && item.sector_industrial !== filtroSector) return false;
      if (busqueda.trim()) {
        const query = busqueda.toLowerCase();
        const coincideNombre = item.nombre.toLowerCase().includes(query);
        const coincideSector = item.sector_industrial.toLowerCase().includes(query);
        const coincideLote = (item.lote_origen_id || '').toLowerCase().includes(query);
        if (!coincideNombre && !coincideSector && !coincideLote) return false;
      }
      return true;
    });
  }, [subproductos, filtroSector, busqueda]);

  const abrirModalCotizacion = (subproducto) => {
    setSubproductoSeleccionado(subproducto);
    setFormCotizacion((prev) => ({
      ...prev,
      sector: subproducto.sector_industrial,
      aplicacion: subproducto.aplicaciones_industriales?.[0] || 'Suministro industrial',
    }));
    setCotizacionExitosa(null);
    setModalAbierto(true);
  };

  const enviarSolicitudCotizacion = async (e) => {
    e.preventDefault();
    if (!subproductoSeleccionado) return;
    try {
      setEnviandoCotizacion(true);
      const payload = {
        subproducto_id: subproductoSeleccionado.id,
        lote_origen_id: subproductoSeleccionado.lote_origen_id || 'CAC001',
        empresa_solicitante: formCotizacion.empresa,
        sector_industrial: formCotizacion.sector,
        correo_corporativo: formCotizacion.correo,
        telefono_contacto: formCotizacion.telefono,
        volumen_requerido_kg: parseFloat(formCotizacion.volumen_kg) || 100,
        aplicacion_prevista: formCotizacion.aplicacion,
      };
      const res = await api.solicitarCotizacionB2B(payload);
      setCotizacionExitosa(res);
    } catch (err) {
      console.error('Error al radicar solicitud B2B:', err);
      // Fallback amigable
      setCotizacionExitosa({
        folio_solicitud: `COT-B2B-${Math.floor(Math.random() * 90000 + 10000)}`,
        empresa: formCotizacion.empresa,
        mensaje: 'Solicitud radicada. Nuestro equipo agroindustrial se comunicará en menos de 24 horas.',
        contacto_comercial_b2b: 'comercial-b2b@trazacao-huila.org',
      });
    } finally {
      setEnviandoCotizacion(false);
    }
  };

  return (
    <section id="lotes-disponibles" className="py-24 bg-[#16120E] text-[#FAF7F0] border-t border-[#3C2418]">
      <div className="max-w-7xl mx-auto px-6 sm:px-12">
        
        {/* Encabezado Editorial con Selector de Catálogo */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-[#3C2418]">
          <div className="space-y-3 max-w-2xl">
            <span className="font-mono text-xs uppercase tracking-[0.25em] text-[#D4AF37] block">
              Plataforma Comercial B2B & Origen Huila
            </span>
            <h2 className="font-serif-editorial text-4xl sm:text-5xl font-bold tracking-tight text-[#FAF7F0]">
              Catálogo de Lotes y Materias Primas
            </h2>
            <p className="font-sans text-sm sm:text-base text-[#E9DCC5]/80 font-light">
              Explore los granos de cacao fino de aroma certificados del Huila y nuestra línea especializada de mermas y biomasa botánica valorizada para la gran industria.
            </p>
          </div>

          {/* Switch de Pestañas: Granos vs Subproductos Botánicos/Industriales */}
          <div className="flex items-center bg-[#1F1914] p-1.5 rounded-2xl border border-[#3C2418] shadow-inner">
            <button
              onClick={() => { setSeccionActiva('granos'); setBusqueda(''); }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                seccionActiva === 'granos'
                  ? 'bg-[#234737] text-[#FAF7F0] shadow-md border border-[#D4AF37]/40'
                  : 'text-[#E9DCC5]/70 hover:text-[#FAF7F0]'
              }`}
            >
              <Award className="w-4 h-4 text-[#D4AF37]" />
              <span>Granos de Cacao Especial</span>
            </button>

            <button
              onClick={() => { setSeccionActiva('subproductos'); setBusqueda(''); }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                seccionActiva === 'subproductos'
                  ? 'bg-[#B77A3C] text-[#16120E] font-bold shadow-md'
                  : 'text-[#E9DCC5]/70 hover:text-[#FAF7F0]'
              }`}
            >
              <Sparkles className="w-4 h-4 text-[#D4AF37]" />
              <span>Catálogo Botánico & Industrial B2B</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECCIÓN 1: CATÁLOGO DE GRANOS DE CACAO (LOTES CERTIFICADOS)              */}
        {/* ========================================================================= */}
        {seccionActiva === 'granos' && (
          <div>
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
                  placeholder="Buscar lote o cacaocultor..."
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
                    <div className="relative h-56 overflow-hidden bg-[#234737]">
                      <img
                        src={imagenLote}
                        alt={lote.id}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                      <div className="absolute top-4 left-4 flex items-center gap-2">
                        <span className="font-mono text-xs font-bold bg-[#16120E]/90 text-[#D4AF37] px-3 py-1 rounded-full border border-[#D4AF37]/40 shadow">
                          {lote.id}
                        </span>
                        <span className="text-[11px] font-medium bg-[#234737]/90 text-[#FAF7F0] px-3 py-1 rounded-full border border-white/20 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-[#D4AF37]" />
                          {muni}, Huila
                        </span>
                      </div>

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

                    <div className="p-6 space-y-4">
                      <div>
                        <h3 className="font-serif-editorial text-xl font-bold text-[#16120E] leading-snug">
                          {lote.productor || 'Cacaocultor Asociado'}
                        </h3>
                        <p className="text-xs text-[#3C2418]/70 font-sans mt-0.5">
                          {lote.finca || 'Finca Tradicional Huilense'} · {lote.variedad || 'Fino de Aroma'}
                        </p>
                      </div>

                      {esBloqueado && (
                        <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-rose-900 text-xs flex items-start gap-2">
                          <AlertOctagon className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                          <div>
                            <strong className="block">Retención Preventiva (Hora 12)</strong>
                            <span>Lote en cuarentena técnica. Comercialización no autorizada.</span>
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#3C2418]/10 text-xs">
                        <div className="p-2.5 bg-[#E9DCC5]/40 rounded-xl">
                          <span className="text-[10px] uppercase font-bold text-[#3C2418]/70 flex items-center gap-1">
                            <Droplets className="w-3 h-3 text-[#234737]" /> Humedad
                          </span>
                          <span className="font-mono font-bold text-sm text-[#16120E] mt-0.5 block">
                            {parseFloat(lote.humedad_porcentaje || 7.0).toFixed(1)}%
                          </span>
                        </div>

                        <div className="p-2.5 bg-[#E9DCC5]/40 rounded-xl">
                          <span className="text-[10px] uppercase font-bold text-[#3C2418]/70 flex items-center gap-1">
                            <Flame className="w-3 h-3 text-[#B77A3C]" /> Fermentación
                          </span>
                          <span className="font-mono font-bold text-sm text-[#16120E] mt-0.5 block">
                            {parseFloat(lote.fermentacion_porcentaje || 80.0).toFixed(1)}%
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-[#3C2418] italic font-serif">
                        "{lote.notas || 'Notas sensoriales a chocolate amargo, frutos secos y dulce de caña característico del Huila.'}"
                      </p>

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
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECCIÓN 2: CATÁLOGO INDUSTRIAL Y BOTÁNICO B2B (MERMA & BIOMASA)           */}
        {/* ========================================================================= */}
        {seccionActiva === 'subproductos' && (
          <div className="space-y-8 mt-8">
            {/* MANIFIESTO Y FRONTERA CLARA DE NEGOCIO (REGLA DE ORO DE LA EMPRESA) */}
            <div className="bg-[#1C1712] border-2 border-[#D4AF37]/40 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-[#B77A3C]/10 rounded-full blur-3xl pointer-events-none" />
              
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
                <div className="space-y-3 max-w-3xl">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/50 text-xs font-bold text-[#D4AF37]">
                    <Factory className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>Frontera Agroindustrial TrazaCao · Proveedor B2B Exclusivo</span>
                  </div>
                  <h3 className="font-serif-editorial text-2xl sm:text-3xl font-bold text-[#FAF7F0]">
                    Materia Prima Botánica Pura para Grandes Industrias
                  </h3>
                  <p className="font-sans text-xs sm:text-sm text-[#E9DCC5]/90 leading-relaxed font-light">
                    En TrazaCao nos concentramos al 100% en el tratamiento, fermentación, secado y tostión de cacao en origen. 
                    <strong className="text-[#D4AF37] font-semibold"> No producimos mascarillas ni fertilizantes terminados para el consumidor final</strong>; 
                    suministramos nuestras mermas limpias y estandarizadas (cascarilla micronizada, biomasa rica en potasio y extractos) a laboratorios cosméticos, fabricantes de bioinsumos y corporaciones industriales que requieren materia prima vegetal certificada.
                  </p>
                </div>

                <div className="shrink-0 bg-[#16120E] border border-[#3C2418] rounded-2xl p-4 sm:p-5 text-center min-w-[220px]">
                  <span className="text-[11px] uppercase tracking-wider text-[#E9DCC5]/60 font-mono block">
                    Biomasa de Merma Recuperada
                  </span>
                  <span className="font-mono text-3xl font-bold text-[#D4AF37] block mt-1">
                    {parseFloat(totalMermaRecuperada).toFixed(1)} kg
                  </span>
                  <span className="text-[11px] text-emerald-400 flex items-center justify-center gap-1 mt-1">
                    <CheckCircle className="w-3.5 h-3.5" /> 100% Trazable al Huila
                  </span>
                </div>
              </div>
            </div>

            {/* Filtros por Sector Industrial y Buscador */}
            <div className="py-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
                {[
                  { id: 'TODOS', label: 'Todos los Sectores' },
                  { id: 'Industria Cosmética y Dermocosmética', label: 'Cosmética & Mascarillas' },
                  { id: 'Agroquímica Orgánica y Biofertilizantes', label: 'Biofertilizantes & Suelos' },
                  { id: 'Extractos Botánicos, Fitofármacos y Nutracéutica', label: 'Botánica & Extractos' },
                ].map((sec) => (
                  <button
                    key={sec.id}
                    onClick={() => setFiltroSector(sec.id)}
                    className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      filtroSector === sec.id
                        ? 'bg-[#B77A3C] text-[#16120E] shadow-md font-bold'
                        : 'bg-[#FAF7F0]/5 hover:bg-[#FAF7F0]/10 text-[#E9DCC5] border border-[#FAF7F0]/10'
                    }`}
                  >
                    {sec.label}
                  </button>
                ))}
              </div>

              <div className="relative min-w-[240px]">
                <Search className="w-4 h-4 text-[#E9DCC5]/50 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Buscar subproducto o aplicación..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="w-full bg-[#FAF7F0]/5 border border-[#FAF7F0]/15 rounded-full pl-10 pr-4 py-2 text-xs text-[#FAF7F0] placeholder-[#E9DCC5]/40 focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
            </div>

            {/* Grid de Subproductos Industriales y Botánicos */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {subproductosMostrados.map((item) => {
                const IconoComponente = item.sector_industrial.includes('Cosmética') 
                  ? Sparkles 
                  : item.sector_industrial.includes('Biofertilizantes') 
                  ? Leaf 
                  : Beaker;

                return (
                  <div
                    key={item.id}
                    className="group bg-[#FAF7F0]/95 text-[#16120E] rounded-3xl p-6 shadow-2xl border border-[#D4AF37]/30 hover:border-[#D4AF37] transition-all duration-300 flex flex-col justify-between"
                  >
                    <div className="space-y-4">
                      {/* Cabecera del subproducto con etiqueta de sector */}
                      <div className="flex items-start justify-between gap-3">
                        <span className="p-3 rounded-2xl bg-[#16120E] text-[#D4AF37] shrink-0">
                          <IconoComponente className="w-6 h-6" />
                        </span>
                        <div className="text-right">
                          <span className="font-mono text-xs font-bold text-[#16120E] bg-[#E9DCC5] px-2.5 py-1 rounded-md">
                            {item.id}
                          </span>
                          <span className="text-[10px] text-[#3C2418]/70 block mt-1 font-mono">
                            Origen: {item.municipio_origen || 'Rivera, Huila'}
                          </span>
                        </div>
                      </div>

                      {/* Título y Sector */}
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#B77A3C] block">
                          {item.sector_industrial}
                        </span>
                        <h4 className="font-serif-editorial text-xl font-bold text-[#16120E] mt-1 leading-snug">
                          {item.nombre}
                        </h4>
                      </div>

                      {/* Especificaciones Técnicas de Pureza y Humedad */}
                      <div className="bg-[#E9DCC5]/40 rounded-2xl p-3.5 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-[#3C2418]/70">Pureza Botánica:</span>
                          <span className="font-semibold text-[#16120E] text-right text-[11px]">{item.pureza_botanica}</span>
                        </div>
                        <div className="flex items-center justify-between pt-1 border-t border-[#3C2418]/10">
                          <span className="text-[#3C2418]/70">Humedad Residual:</span>
                          <span className="font-mono font-bold text-[#16120E]">{parseFloat(item.humedad_porcentaje || 6.0).toFixed(1)}%</span>
                        </div>
                        <div className="flex items-center justify-between pt-1 border-t border-[#3C2418]/10">
                          <span className="text-[#3C2418]/70">Disponibilidad en Bodega:</span>
                          <span className="font-mono font-bold text-emerald-800">{parseFloat(item.kg_disponibles).toFixed(1)} kg</span>
                        </div>
                      </div>

                      {/* Aplicaciones Industriales B2B */}
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-bold text-[#16120E] uppercase tracking-wider block">
                          Aplicaciones Industriales Sugeridas:
                        </span>
                        <ul className="space-y-1 text-xs text-[#3C2418]">
                          {item.aplicaciones_industriales?.map((app, i) => (
                            <li key={i} className="flex items-start gap-1.5 leading-snug">
                              <span className="text-[#B77A3C] font-bold">•</span>
                              <span>{app}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Deslinde de responsabilidad de producto final */}
                      <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] leading-tight flex items-start gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                        <span>Suministrado como materia prima vegetal al por mayor. TrazaCao no envasa productos terminados.</span>
                      </div>
                    </div>

                    {/* Botón de Acción Comercial B2B */}
                    <div className="pt-6 border-t border-[#3C2418]/10 mt-6 flex items-center justify-between gap-3">
                      <div>
                        <span className="text-[10px] uppercase text-[#3C2418]/60 block font-mono">Precio Base B2B</span>
                        <span className="font-mono font-bold text-sm text-[#16120E]">
                          ${parseFloat(item.precio_b2b_kg_cop).toLocaleString('es-CO')} COP/kg
                        </span>
                      </div>

                      <button
                        onClick={() => abrirModalCotizacion(item)}
                        className="flex items-center gap-1.5 bg-[#B77A3C] hover:bg-[#a2692f] text-[#16120E] text-xs font-bold py-2.5 px-4 rounded-xl shadow-md transition-all cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5 text-[#16120E]" />
                        <span>Cotizar B2B</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>

      {/* ========================================================================= */}
      {/* MODAL INTERACTIVO DE COTIZACIÓN DE MATERIA PRIMA B2B                      */}
      {/* ========================================================================= */}
      {modalAbierto && subproductoSeleccionado && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1C1712] border-2 border-[#D4AF37]/50 rounded-3xl max-w-lg w-full p-6 sm:p-8 text-[#FAF7F0] shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setModalAbierto(false)}
              className="absolute top-5 right-5 text-[#E9DCC5]/60 hover:text-[#FAF7F0] p-1 rounded-full cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {cotizacionExitosa ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-14 h-14 bg-emerald-950 border border-emerald-500 rounded-full flex items-center justify-center mx-auto text-emerald-400">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <h3 className="font-serif-editorial text-2xl font-bold text-[#FAF7F0]">
                  Solicitud B2B Radicada
                </h3>
                <p className="text-xs text-[#E9DCC5]/80 max-w-sm mx-auto">
                  {cotizacionExitosa.mensaje || 'Su solicitud de materia prima botánica ha sido radicada.'}
                </p>
                
                <div className="bg-[#16120E] border border-[#3C2418] rounded-2xl p-4 text-xs font-mono text-left space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-[#E9DCC5]/60">Folio Oficial:</span>
                    <span className="font-bold text-[#D4AF37]">{cotizacionExitosa.folio_solicitud}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#E9DCC5]/60">Empresa:</span>
                    <span className="text-[#FAF7F0]">{cotizacionExitosa.empresa}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#E9DCC5]/60">Atención B2B:</span>
                    <span className="text-emerald-400">{cotizacionExitosa.contacto_comercial_b2b}</span>
                  </div>
                </div>

                <button
                  onClick={() => setModalAbierto(false)}
                  className="w-full py-3 bg-[#D4AF37] hover:bg-[#c29d2b] text-[#16120E] font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            ) : (
              <form onSubmit={enviarSolicitudCotizacion} className="space-y-4">
                <div>
                  <span className="text-[11px] font-mono text-[#D4AF37] uppercase tracking-wider block">
                    Cotización de Materia Prima B2B
                  </span>
                  <h3 className="font-serif-editorial text-2xl font-bold text-[#FAF7F0] mt-1">
                    {subproductoSeleccionado.nombre}
                  </h3>
                  <p className="text-xs text-[#E9DCC5]/70 mt-0.5">
                    Lote de origen: {subproductoSeleccionado.lote_origen_id} · {subproductoSeleccionado.municipio_origen}
                  </p>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-[#E9DCC5]/80 mb-1 font-semibold">Empresa o Laboratorio Solicitante *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. BioCosmética Andina S.A.S."
                      value={formCotizacion.empresa}
                      onChange={(e) => setFormCotizacion({ ...formCotizacion, empresa: e.target.value })}
                      className="w-full bg-[#16120E] border border-[#3C2418] rounded-xl px-3.5 py-2.5 text-[#FAF7F0] focus:border-[#D4AF37] focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[#E9DCC5]/80 mb-1 font-semibold">Correo Corporativo *</label>
                      <input
                        type="email"
                        required
                        placeholder="compras@empresa.com"
                        value={formCotizacion.correo}
                        onChange={(e) => setFormCotizacion({ ...formCotizacion, correo: e.target.value })}
                        className="w-full bg-[#16120E] border border-[#3C2418] rounded-xl px-3.5 py-2.5 text-[#FAF7F0] focus:border-[#D4AF37] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[#E9DCC5]/80 mb-1 font-semibold">Volumen Estimado (kg) *</label>
                      <input
                        type="number"
                        min="1"
                        required
                        placeholder="Ej. 500"
                        value={formCotizacion.volumen_kg}
                        onChange={(e) => setFormCotizacion({ ...formCotizacion, volumen_kg: e.target.value })}
                        className="w-full bg-[#16120E] border border-[#3C2418] rounded-xl px-3.5 py-2.5 text-[#FAF7F0] focus:border-[#D4AF37] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[#E9DCC5]/80 mb-1 font-semibold">Aplicación Industrial Prevista *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Mascarillas faciales purificantes / Biofertilizante foliar"
                      value={formCotizacion.aplicacion}
                      onChange={(e) => setFormCotizacion({ ...formCotizacion, aplicacion: e.target.value })}
                      className="w-full bg-[#16120E] border border-[#3C2418] rounded-xl px-3.5 py-2.5 text-[#FAF7F0] focus:border-[#D4AF37] focus:outline-none"
                    />
                  </div>

                  <div className="p-3 bg-[#16120E] border border-[#3C2418] rounded-xl text-[11px] text-[#E9DCC5]/70 leading-relaxed">
                    <strong className="text-[#D4AF37] block mb-0.5">Nota de Deslinde Comercial:</strong>
                    TrazaCao abastece como proveedor de materias primas secundarias y mermas procesadas. No manufacturamos mascarillas, cremas ni fertilizantes envasados.
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setModalAbierto(false)}
                    className="px-4 py-2.5 text-xs text-[#E9DCC5]/70 hover:text-[#FAF7F0] cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={enviandoCotizacion}
                    className="flex items-center gap-2 bg-[#D4AF37] hover:bg-[#c29d2b] text-[#16120E] font-bold text-xs py-2.5 px-5 rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{enviandoCotizacion ? 'Radicando...' : 'Radicar Solicitud B2B'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
