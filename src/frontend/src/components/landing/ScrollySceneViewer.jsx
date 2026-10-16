import React, { useMemo, useState } from 'react';
import { 
  MapPin, Sparkles, Award, ShieldCheck, ArrowDown, ChevronRight, 
  QrCode, FileText, CheckCircle, AlertTriangle, Cpu, Database, 
  EyeOff, Recycle, ArrowUpRight, X, ExternalLink, Flame, Scale, Clock
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export function ScrollySceneViewer({ 
  progress = 0, 
  lotes = [], 
  onExplorarLotes, 
  onVerPasaporte,
  onIrAEscena 
}) {
  // Lote seleccionado para la Escena 5 interactiva
  const [loteSeleccionadoId, setLoteSeleccionadoId] = useState('CAC001');
  const [modalQrAbierto, setModalQrAbierto] = useState(false);

  // Fallbacks de lotes representativos de origen Huila
  const lotesDisponibles = useMemo(() => {
    const base = [
      {
        id: 'CAC001',
        municipio: 'Rivera',
        departamento: 'Huila',
        finca: 'La Esmeralda',
        cacaocultor: 'Don Carlos Alberto Perdomo',
        estado: 'LIBERADO',
        humedad_porcentaje: 7.50,
        fermentacion_porcentaje: 78.00,
        kg_disponibles: 100.00,
        variedad: 'Criollo Huilense Seleccionado',
        altitud: 1100,
      },
      {
        id: 'CAC002',
        municipio: 'Campoalegre',
        departamento: 'Huila',
        finca: 'El Paraíso',
        cacaocultor: 'Doña Rosa Helena Méndez',
        estado: 'LIBERADO',
        humedad_porcentaje: 7.10,
        fermentacion_porcentaje: 82.00,
        kg_disponibles: 85.00,
        variedad: 'Trinitario Fino de Aroma',
        altitud: 920,
      },
      {
        id: 'CAC003',
        municipio: 'Algeciras',
        departamento: 'Huila',
        finca: 'Villa Esperanza',
        cacaocultor: 'Don Álvaro Andrade',
        estado: 'LIBERADO',
        humedad_porcentaje: 6.90,
        fermentacion_porcentaje: 85.00,
        kg_disponibles: 120.00,
        variedad: 'Híbrido Regional Clonal',
        altitud: 1450,
      },
    ];

    if (!lotes || lotes.length === 0) return base;

    // Si vienen lotes reales del backend, enriquecer la lista base
    return base.map((b) => {
      const real = lotes.find((l) => l.id === b.id);
      if (!real) return b;
      return {
        ...b,
        estado: real.estado || b.estado,
        humedad_porcentaje: parseFloat(real.humedad_porcentaje || b.humedad_porcentaje),
        fermentacion_porcentaje: parseFloat(real.fermentacion_porcentaje || b.fermentacion_porcentaje),
        kg_disponibles: parseFloat(real.kg_disponibles || b.kg_disponibles),
        cacaocultor: real.cacaocultor || b.cacaocultor,
        finca: real.finca || b.finca,
        municipio: real.municipio || b.municipio,
      };
    });
  }, [lotes]);

  const loteActivo = useMemo(() => {
    return lotesDisponibles.find((l) => l.id === loteSeleccionadoId) || lotesDisponibles[0];
  }, [lotesDisponibles, loteSeleccionadoId]);

  // Definición de las 5 Escenas Estratégicas de Marca TRAZACAO
  const scenes = [
    {
      id: 'scene-hero',
      chapter: '01 / IDENTIDAD & ORIGEN',
      tag: '◆ TRAZACAO • INFRAESTRUCTURA AGROINDUSTRIAL Y B2B',
      title: 'Donde el cacao del Huila deja el papel y se convierte en ',
      titleAccent: 'origen verificable.',
      image: '/images/huila-panoramica.jpg',
      imageSecondary: '/images/territorio.jpg',
      badge: 'Infraestructura Tecnológica Rural',
      location: 'Valle del Magdalena · Huila, Colombia',
    },
    {
      id: 'scene-proposito',
      chapter: '02 / NUESTRO PROPÓSITO',
      tag: '◆ NUESTRO PROPÓSITO • POR QUÉ EXISTE TRAZACAO',
      title: 'El mejor cacao de aroma no puede perder su historia ',
      titleAccent: 'en cuadernos y chats.',
      image: '/images/cacao-arbol-mazorcas.jpg',
      imageSecondary: '/images/cacao-mazorca-abierta.jpg',
      badge: 'Cero Pérdida de Identidad',
      location: 'Rivera, Campoalegre & Algeciras',
    },
    {
      id: 'scene-proceso',
      chapter: '03 / RIGUROSIDAD AGROINDUSTRIAL',
      tag: '◆ QUÉ HACEMOS • TRAZABILIDAD DE PROCESO Y CALIDAD',
      title: 'Rigurosidad poscosecha y control milimétrico de ',
      titleAccent: 'cada kilogramo transformado.',
      image: '/images/cacao-fermentacion-cajones.jpg',
      imageSecondary: '/images/cacao-secado-solar-colombia.jpg',
      badge: 'Estándar NTC 1252 · Balance de Masa',
      location: 'Centros de Beneficio Asociativo',
    },
    {
      id: 'scene-diferenciadores',
      chapter: '04 / VENTAJA COMPETITIVA',
      tag: '◆ QUÉ NOS DISTINGUE • VENTAJA COMPETITIVA TRAZACAO',
      title: 'Tecnología rural a prueba de fallos y ',
      titleAccent: 'economía circular del cacao.',
      image: '/images/cacao-granos-tostados.jpg',
      imageSecondary: '/images/cacao-chocolate-artesanal.jpg',
      badge: '4 Diferenciadores Clave',
      location: 'Arquitectura Diseñada para el Campo',
    },
    {
      id: 'scene-pasaporte',
      chapter: '05 / DEMOSTRACIÓN EN VIVO',
      tag: '◆ PASAPORTE DIGITAL TRAZACAO • VERIFICACIÓN EN TIEMPO REAL',
      title: 'Pasaporte Digital QR & ',
      titleAccent: 'Catálogo de Lotes B2B.',
      image: '/images/cacao-chocolate-artesanal.jpg',
      imageSecondary: '/images/producto.jpg',
      badge: 'Verificación en < 3s · Sin Costos Internos',
      location: 'Trazabilidad Criptográfica Inmutable',
    },
  ];

  // Cálculo de opacidades y escalas para 5 escenas (4 intervalos de 0.25)
  const step = 1 / (scenes.length - 1);

  const sceneStates = useMemo(() => {
    return scenes.map((_, index) => {
      const center = index * step;
      const distance = Math.abs(progress - center);
      const maxDist = step * 1.05;
      let opacity = 0;
      if (distance < maxDist) {
        opacity = 0.5 * (1 + Math.cos((Math.PI * distance) / maxDist));
      }
      const zoom = 1.03 + (progress - center) * 0.07;
      return { opacity, zoom: Math.max(1.0, Math.min(1.14, zoom)), distance };
    });
  }, [progress, scenes.length, step]);

  const currentSceneIndex = useMemo(() => {
    let maxIdx = 0;
    let maxOp = -1;
    sceneStates.forEach((s, i) => {
      if (s.opacity > maxOp) {
        maxOp = s.opacity;
        maxIdx = i;
      }
    });
    return maxIdx;
  }, [sceneStates]);

  const activeScene = scenes[currentSceneIndex];

  // URL del pasaporte para el QR
  const passportUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/pasaporte/${loteActivo.id}`
    : `https://trazacao-huila.onrender.com/pasaporte/${loteActivo.id}`;

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#0B0907] select-none text-[#F5EFE6]">
      {/* ========================================================================= */}
      {/* FONDOS FOTOGRÁFICOS REALES DINÁMICOS CON CROSS-FADE                       */}
      {/* ========================================================================= */}
      <div className="absolute inset-0 z-0">
        {scenes.map((scene, i) => {
          const state = sceneStates[i];
          if (state.opacity <= 0.005) return null;

          return (
            <div
              key={scene.id}
              className="absolute inset-0 transition-opacity duration-300 ease-out will-change-transform"
              style={{
                opacity: state.opacity,
                transform: `scale(${state.zoom})`,
              }}
            >
              <img
                src={scene.image}
                alt={scene.title}
                className="w-full h-full object-cover object-center filter brightness-[0.62] contrast-[1.12] saturate-[1.15]"
                loading={i === 0 ? 'eager' : 'lazy'}
              />
            </div>
          );
        })}

        {/* Viñeta cinematográfica y gradientes orgánicos de profundidad Dark Editorial Cacao */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0907] via-[#0B0907]/50 to-black/75 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0B0907]/90 via-[#0B0907]/40 to-transparent pointer-events-none hidden md:block" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(11,9,7,0.7)_100%)] pointer-events-none" />
      </div>

      {/* ========================================================================= */}
      {/* CONTENIDO EDITORIAL FLOTANTE — REGLA DARK EDITORIAL CACAO                  */}
      {/* ========================================================================= */}
      <div className="relative z-10 w-full h-full max-w-7xl mx-auto px-6 sm:px-12 flex flex-col justify-between py-10 md:py-14">
        {/* Sub-Cabecera de la Escena (Capítulo y Denominación) */}
        <div className="flex items-center justify-between gap-4 pt-16 md:pt-14">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-[#E5B85B] bg-[#16120E]/90 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-[#D4AF37]/30 shadow-lg">
              {activeScene.chapter}
            </span>
            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-[#F5EFE6]/75 font-sans tracking-wide">
              <MapPin className="w-3.5 h-3.5 text-[#E5B85B]" />
              {activeScene.location}
            </span>
          </div>

          <div className="inline-flex items-center gap-2 bg-[#120E0A]/80 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-[#D4AF37]/25 text-[11px] font-medium text-[#F5EFE6] shadow-md">
            <Award className="w-3.5 h-3.5 text-[#E5B85B]" />
            <span>{activeScene.badge}</span>
          </div>
        </div>

        {/* ======================================================================= */}
        {/* CUERPO PRINCIPAL SEGÚN LA ESCENA ACTIVA                                 */}
        {/* ======================================================================= */}
        <div className="w-full my-auto py-4">
          {/* ------------------------------------------------------------------- */}
          {/* ESCENA 1: HERO — QUIÉNES SOMOS Y A QUÉ NOS DEDICAMOS               */}
          {/* ------------------------------------------------------------------- */}
          {currentSceneIndex === 0 && (
            <div className="max-w-3xl space-y-5 animate-in fade-in duration-500">
              <span className="font-mono text-xs uppercase tracking-[0.25em] text-[#E5B85B] block font-semibold">
                {activeScene.tag}
              </span>

              <h1 className="font-serif text-3xl sm:text-5xl md:text-6xl font-bold text-[#F5EFE6] tracking-tight leading-[1.08] drop-shadow-md">
                Donde el cacao del Huila deja el papel y se convierte en{' '}
                <em className="italic text-[#E5B85B] font-serif not-italic">origen verificable.</em>
              </h1>

              {/* Tarjeta Translúcida Quiénes Somos y A Qué Nos Dedicamos */}
              <div className="bg-[#120E0A]/85 backdrop-blur-md rounded-3xl p-6 sm:p-7 border border-[#D4AF37]/25 shadow-2xl space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#E5B85B]">
                    <Sparkles className="w-4 h-4 text-[#E5B85B]" />
                    <span>Quiénes somos</span>
                  </div>
                  <p className="font-sans text-sm sm:text-base text-[#F5EFE6]/90 leading-relaxed font-light">
                    Somos <strong className="text-[#E5B85B] font-semibold">TrazaCao</strong>, el ecosistema tecnológico y comercial que conecta a las asociaciones cacaoteras de <strong>Rivera, Campoalegre y Algeciras</strong> con compradores exigentes de cacao especial.
                  </p>
                </div>

                <div className="space-y-2 pt-3 border-t border-[#D4AF37]/15">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#22C55E]">
                    <CheckCircle className="w-4 h-4 text-[#22C55E]" />
                    <span>A qué nos dedicamos</span>
                  </div>
                  <p className="font-sans text-xs sm:text-sm text-[#F5EFE6]/80 leading-relaxed font-light">
                    Digitalizamos toda la cadena de valor —desde la recepción en finca y el control industrial de mermas hasta la comercialización B2B con Pasaporte Digital QR— protegiendo la calidad del grano y la rentabilidad del productor.
                  </p>
                </div>

                {/* Píldoras de Territorio y Norma */}
                <div className="pt-2 flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-[#1A140F] border border-[#D4AF37]/25 text-[11px] font-mono text-[#E5B85B]">
                    Rivera • 1.100 msnm
                  </span>
                  <span className="px-3 py-1 rounded-full bg-[#1A140F] border border-[#D4AF37]/25 text-[11px] font-mono text-[#E5B85B]">
                    Campoalegre • 920 msnm
                  </span>
                  <span className="px-3 py-1 rounded-full bg-[#1A140F] border border-[#D4AF37]/25 text-[11px] font-mono text-[#E5B85B]">
                    Algeciras • 1.450 msnm
                  </span>
                  <span className="px-3 py-1 rounded-full bg-[#234737]/70 border border-[#22C55E]/40 text-[11px] font-medium text-[#22C55E]">
                    Alineado a la MNTC • Cero Deforestación
                  </span>
                </div>

                {/* CTAs de Tarjeta */}
                <div className="pt-4 flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => onIrAEscena ? onIrAEscena(4) : (onExplorarLotes && onExplorarLotes())}
                    className="inline-flex items-center gap-2 bg-[#E5B85B] hover:bg-[#d4a853] text-[#120E0A] text-xs font-bold px-5 py-3 rounded-xl transition-all shadow-lg shadow-[#E5B85B]/20 cursor-pointer active:scale-95"
                  >
                    <span>EXPLORAR PASAPORTE DIGITAL</span>
                    <ArrowDown className="w-4 h-4 text-[#120E0A]" />
                  </button>

                  <button
                    onClick={onExplorarLotes}
                    className="inline-flex items-center gap-2 bg-[#1A140F] hover:bg-[#261D16] text-[#F5EFE6] text-xs font-semibold px-4 py-3 rounded-xl border border-[#D4AF37]/35 transition-all cursor-pointer active:scale-95"
                  >
                    <span>IR AL CATÁLOGO B2B</span>
                    <ChevronRight className="w-4 h-4 text-[#E5B85B]" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------------- */}
          {/* ESCENA 2: POR QUÉ LO HACEMOS — EL PROBLEMA QUE RESOLVEMOS           */}
          {/* ------------------------------------------------------------------- */}
          {currentSceneIndex === 1 && (
            <div className="max-w-3xl space-y-5 animate-in fade-in duration-500">
              <span className="font-mono text-xs uppercase tracking-[0.25em] text-[#E5B85B] block font-semibold">
                {activeScene.tag}
              </span>

              <h2 className="font-serif text-3xl sm:text-5xl md:text-6xl font-bold text-[#F5EFE6] tracking-tight leading-[1.08] drop-shadow-md">
                El mejor cacao de aroma no puede perder su historia{' '}
                <em className="italic text-[#E5B85B] font-serif not-italic">en cuadernos y chats.</em>
              </h2>

              <div className="bg-[#120E0A]/85 backdrop-blur-md rounded-3xl p-6 sm:p-7 border border-[#D4AF37]/25 shadow-2xl space-y-4">
                <p className="font-sans text-xs sm:text-sm text-[#F5EFE6]/85 leading-relaxed font-light">
                  Durante décadas, el cacao cultivado bajo sombrío de guamo en el Huila ha perdido su identidad de origen al acopiarse en <span className="underline decoration-[#E5B85B]/50">cuadernos físicos y mensajes sueltos de WhatsApp</span>. Eso provoca mermas ocultas superiores al 15%, fugas de capital en planta y pérdida de valor comercial para el campesino.
                </p>

                {/* Comparativa Visual en 2 Columnas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  {/* Columna 1: Antes */}
                  <div className="bg-[#1A140F]/90 rounded-2xl p-4 border border-rose-950/60 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-rose-400 uppercase tracking-wider">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                      <span>Antes (Acopio Tradicional)</span>
                    </div>
                    <ul className="space-y-1.5 text-xs text-[#F5EFE6]/75">
                      <li className="flex items-start gap-1.5">
                        <span className="text-rose-400 font-bold">•</span>
                        <span>Cuadernos vulnerables a pérdida, agua y deterioro</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-rose-400 font-bold">•</span>
                        <span>Mezcla ciega de lotes que diluye la calidad de origen</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-rose-400 font-bold">•</span>
                        <span>Mermas invisibles &gt;15% sin responsable en planta</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-rose-400 font-bold">•</span>
                        <span>Cero respaldo ante compradores internacionales</span>
                      </li>
                    </ul>
                  </div>

                  {/* Columna 2: Con TrazaCao */}
                  <div className="bg-[#132018]/90 rounded-2xl p-4 border border-[#22C55E]/40 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#22C55E] uppercase tracking-wider">
                      <CheckCircle className="w-3.5 h-3.5 text-[#22C55E]" />
                      <span>Con TrazaCao</span>
                    </div>
                    <ul className="space-y-1.5 text-xs text-[#F5EFE6]/90">
                      <li className="flex items-start gap-1.5">
                        <span className="text-[#22C55E] font-bold">•</span>
                        <span>Identidad única e inmutable por lote (<strong className="text-[#E5B85B]">CAC001</strong>)</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-[#22C55E] font-bold">•</span>
                        <span>Trazabilidad punta a punta verificable en &lt; 3 segundos</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-[#22C55E] font-bold">•</span>
                        <span>Alerta automática si la merma supera el 15.0%</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-[#22C55E] font-bold">•</span>
                        <span>Respaldo oficial bajo la Mesa Nacional de Cacao (MNTC)</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------------- */}
          {/* ESCENA 3: QUÉ HACEMOS — DEL BENEFICIO AL CONTROL DE TRANSFORMACIÓN  */}
          {/* ------------------------------------------------------------------- */}
          {currentSceneIndex === 2 && (
            <div className="max-w-3xl space-y-5 animate-in fade-in duration-500">
              <span className="font-mono text-xs uppercase tracking-[0.25em] text-[#E5B85B] block font-semibold">
                {activeScene.tag}
              </span>

              <h2 className="font-serif text-3xl sm:text-5xl md:text-6xl font-bold text-[#F5EFE6] tracking-tight leading-[1.08] drop-shadow-md">
                Rigurosidad poscosecha y control milimétrico de{' '}
                <em className="italic text-[#E5B85B] font-serif not-italic">cada kilogramo transformado.</em>
              </h2>

              <div className="bg-[#120E0A]/85 backdrop-blur-md rounded-3xl p-6 sm:p-7 border border-[#D4AF37]/25 shadow-2xl space-y-4">
                <p className="font-sans text-xs sm:text-sm text-[#F5EFE6]/85 leading-relaxed font-light">
                  No solo contamos la historia del campo; <strong className="text-[#E5B85B] font-semibold">auditamos físicamente el proceso agroindustrial</strong>. Registramos la fermentación y secado bajo el estándar <strong>NTC 1252</strong>, vinculamos cada etapa de transformación (tostión, descascarillado, molienda) al lote de origen y calculamos automáticamente el balance de masa.
                </p>

                {/* Métricas Operativas en 3 Bloques */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
                  <div className="bg-[#1A140F] border border-[#D4AF37]/25 rounded-2xl p-4 space-y-1.5">
                    <span className="font-mono text-[10px] uppercase font-bold text-[#E5B85B] flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 text-[#E5B85B]" /> Curva Térmica & Secado
                    </span>
                    <span className="font-mono font-bold text-lg text-[#F5EFE6] block">
                      48.5 °C / 7.2%
                    </span>
                    <p className="text-[11px] text-[#F5EFE6]/70 leading-snug">
                      Pico térmico al día 4 y secado solar bajo norma NTC 1252.
                    </p>
                  </div>

                  <div className="bg-[#1A140F] border border-[#D4AF37]/25 rounded-2xl p-4 space-y-1.5">
                    <span className="font-mono text-[10px] uppercase font-bold text-amber-400 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Alerta de Merma
                    </span>
                    <span className="font-mono font-bold text-lg text-amber-300 block">
                      Umbral 15.0%
                    </span>
                    <p className="text-[11px] text-[#F5EFE6]/70 leading-snug">
                      Disparo automático si la merma de transformación excede el límite.
                    </p>
                  </div>

                  <div className="bg-[#1A140F] border border-[#22C55E]/30 rounded-2xl p-4 space-y-1.5">
                    <span className="font-mono text-[10px] uppercase font-bold text-[#22C55E] flex items-center gap-1">
                      <Scale className="w-3.5 h-3.5 text-[#22C55E]" /> Inventario Atómico
                    </span>
                    <span className="font-mono font-bold text-lg text-[#22C55E] block">
                      Cero Duplicidad
                    </span>
                    <p className="text-[11px] text-[#F5EFE6]/70 leading-snug">
                      Control atómico en base de datos: Recibido - Consumido sin saldos negativos.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------------- */}
          {/* ESCENA 4: QUÉ NOS DISTINGUE — NUESTROS 4 DIFERENCIADORES            */}
          {/* ------------------------------------------------------------------- */}
          {currentSceneIndex === 3 && (
            <div className="max-w-4xl space-y-5 animate-in fade-in duration-500">
              <span className="font-mono text-xs uppercase tracking-[0.25em] text-[#E5B85B] block font-semibold">
                {activeScene.tag}
              </span>

              <h2 className="font-serif text-3xl sm:text-5xl font-bold text-[#F5EFE6] tracking-tight leading-[1.08] drop-shadow-md">
                Tecnología rural a prueba de fallos y{' '}
                <em className="italic text-[#E5B85B] font-serif not-italic">economía circular del cacao.</em>
              </h2>

              {/* Cuadrícula Limpia de 4 Diferenciadores Clave */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-[#120E0A]/90 backdrop-blur-md rounded-2xl p-5 border border-[#D4AF37]/25 shadow-xl space-y-2">
                  <div className="w-9 h-9 rounded-xl bg-[#E5B85B]/15 border border-[#E5B85B]/30 flex items-center justify-center text-[#E5B85B]">
                    <Database className="w-5 h-5" />
                  </div>
                  <h3 className="font-serif text-base font-bold text-[#F5EFE6]">
                    1. 100% Offline-First en Planta Rural
                  </h3>
                  <p className="text-xs text-[#F5EFE6]/75 leading-relaxed font-light">
                    Funciona sin internet en los centros de acopio de Rivera, Campoalegre o Algeciras con persistencia local SQLite WAL inmediata y cero dependencia de conectividad.
                  </p>
                </div>

                <div className="bg-[#120E0A]/90 backdrop-blur-md rounded-2xl p-5 border border-[#D4AF37]/25 shadow-xl space-y-2">
                  <div className="w-9 h-9 rounded-xl bg-[#22C55E]/15 border border-[#22C55E]/30 flex items-center justify-center text-[#22C55E]">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <h3 className="font-serif text-base font-bold text-[#F5EFE6]">
                    2. Auditoría Inmutable & Bloqueo Sanitario
                  </h3>
                  <p className="text-xs text-[#F5EFE6]/75 leading-relaxed font-light">
                    Historial criptográfico inalterable de quién, cuándo y por qué cambió un lote (PENDIENTE, LIBERADO, BLOQUEADO), aislando partidas defectuosas con total certidumbre.
                  </p>
                </div>

                <div className="bg-[#120E0A]/90 backdrop-blur-md rounded-2xl p-5 border border-[#D4AF37]/25 shadow-xl space-y-2">
                  <div className="w-9 h-9 rounded-xl bg-[#E5B85B]/15 border border-[#E5B85B]/30 flex items-center justify-center text-[#E5B85B]">
                    <EyeOff className="w-5 h-5" />
                  </div>
                  <h3 className="font-serif text-base font-bold text-[#F5EFE6]">
                    3. Privacidad Financiera por Diseño
                  </h3>
                  <p className="text-xs text-[#F5EFE6]/75 leading-relaxed font-light">
                    La ficha pública QR demuestra la calidad, pureza y procedencia al comprador ocultando estrictamente costos internos, precios de compra y márgenes de la cooperativa.
                  </p>
                </div>

                <div className="bg-[#120E0A]/90 backdrop-blur-md rounded-2xl p-5 border border-[#D4AF37]/25 shadow-xl space-y-2">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <Recycle className="w-5 h-5" />
                  </div>
                  <h3 className="font-serif text-base font-bold text-[#F5EFE6]">
                    4. Economía Circular B2B (Cero Desperdicio)
                  </h3>
                  <p className="text-xs text-[#F5EFE6]/75 leading-relaxed font-light">
                    Transformamos la merma física (cascarilla tostada sin tratar vendida por kilo) en una nueva línea de ingresos B2B para industrias cosméticas, extractos y bioinsumos.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------------- */}
          {/* ESCENA 5: DEMO INTERACTIVA EN VIVO — PASAPORTE DIGITAL QR Y CATÁLOGO */}
          {/* ------------------------------------------------------------------- */}
          {currentSceneIndex === 4 && (
            <div className="max-w-3xl space-y-5 animate-in fade-in duration-500">
              <span className="font-mono text-xs uppercase tracking-[0.25em] text-[#E5B85B] block font-semibold">
                {activeScene.tag}
              </span>

              {/* Terminal del Pasaporte Comercial */}
              <div className="bg-[#120E0A]/90 backdrop-blur-md rounded-3xl p-6 sm:p-8 border-2 border-[#D4AF37]/45 shadow-2xl space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="font-mono text-xs uppercase text-[#E5B85B] tracking-wider block font-semibold">
                      Pasaporte Digital de Origen TrazaCao
                    </span>
                    <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#F5EFE6] mt-0.5">
                      {loteActivo.id} • {loteActivo.municipio}, Huila
                    </h3>
                  </div>

                  <span className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    loteActivo.estado === 'LIBERADO'
                      ? 'bg-emerald-950/80 border border-emerald-500/60 text-emerald-300'
                      : 'bg-amber-950/80 border border-amber-500/60 text-amber-300'
                  }`}>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    • Lote {loteActivo.estado}
                  </span>
                </div>

                {/* Selector Interactivo de Lotes Reales */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {lotesDisponibles.map((lote) => (
                    <button
                      key={lote.id}
                      onClick={() => setLoteSeleccionadoId(lote.id)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                        loteSeleccionadoId === lote.id
                          ? 'bg-[#E5B85B] text-[#120E0A] font-bold shadow-md'
                          : 'bg-[#1A140F] text-[#F5EFE6]/70 hover:text-[#F5EFE6] border border-[#D4AF37]/20'
                      }`}
                    >
                      {lote.id} ({lote.municipio})
                    </button>
                  ))}
                </div>

                {/* Métricas Técnicas por Lote */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-[#1A140F] border border-[#D4AF37]/25 p-3 rounded-2xl">
                    <span className="text-[10px] uppercase font-mono font-bold text-[#E5B85B] block">Humedad</span>
                    <strong className="font-serif text-lg sm:text-xl text-[#F5EFE6] block mt-0.5">
                      {parseFloat(loteActivo.humedad_porcentaje).toFixed(2)}%
                    </strong>
                  </div>
                  <div className="bg-[#1A140F] border border-[#D4AF37]/25 p-3 rounded-2xl">
                    <span className="text-[10px] uppercase font-mono font-bold text-[#E5B85B] block">Fermentación</span>
                    <strong className="font-serif text-lg sm:text-xl text-[#F5EFE6] block mt-0.5">
                      {parseFloat(loteActivo.fermentacion_porcentaje).toFixed(2)}%
                    </strong>
                  </div>
                  <div className="bg-[#1A140F] border border-[#D4AF37]/25 p-3 rounded-2xl">
                    <span className="text-[10px] uppercase font-mono font-bold text-[#22C55E] block">Disponible</span>
                    <strong className="font-serif text-lg sm:text-xl text-[#22C55E] block mt-0.5">
                      {parseFloat(loteActivo.kg_disponibles).toFixed(1)} kg
                    </strong>
                  </div>
                </div>

                {/* Apertura de Nueva Línea B2B: Residuos y Merma del Cacao en Bruto */}
                <div className="bg-[#E5B85B]/10 border border-[#E5B85B]/35 rounded-2xl p-4 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="bg-[#E5B85B] text-[#120E0A] text-[10px] font-black uppercase px-2 py-0.5 rounded tracking-wider">
                      Nueva Línea B2B
                    </span>
                    <strong className="text-xs text-[#E5B85B] font-serif">
                      Residuos y Merma del Cacao en Bruto
                    </strong>
                  </div>
                  <p className="text-[11px] text-[#F5EFE6]/85 leading-relaxed font-light">
                    Además de comercializar el grano y los derivados de la transformación (licor y chocolate fino de origen), en TrazaCao suministramos exclusivamente <strong className="text-[#E5B85B]">cascarilla tostada por kilo (sin tratar)</strong> a precios justos para que industrias adquirentes elaboren cosmética, tisanas y bioinsumos.
                  </p>
                </div>

                {/* Micro-etiqueta o Sello Visual de Confianza */}
                <div className="flex items-center gap-2 text-[11px] text-[#22C55E] font-medium bg-[#132018] border border-[#22C55E]/30 px-3 py-2 rounded-xl">
                  <ShieldCheck className="w-4 h-4 text-[#22C55E] shrink-0" />
                  <span>Verificado por TrazaCao • Consulta &lt; 3s • Sin exposición de costos internos</span>
                </div>

                {/* Botones de Acción Comercial */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-[#D4AF37]/20">
                  <button
                    onClick={() => setModalQrAbierto(true)}
                    className="inline-flex items-center gap-2 bg-[#1A140F] hover:bg-[#261D16] text-[#E5B85B] text-xs font-bold px-4 py-3 rounded-xl border border-[#E5B85B]/50 transition-all cursor-pointer shadow-md active:scale-95"
                  >
                    <QrCode className="w-4 h-4 text-[#E5B85B]" />
                    <span>VER QR DEL LOTE</span>
                  </button>

                  <button
                    onClick={onExplorarLotes}
                    className="inline-flex items-center gap-2 bg-[#E5B85B] hover:bg-[#d4a853] text-[#120E0A] text-xs font-bold px-5 py-3 rounded-xl transition-all shadow-lg shadow-[#E5B85B]/20 cursor-pointer active:scale-95"
                  >
                    <span>IR AL CATÁLOGO B2B</span>
                    <ChevronRight className="w-4 h-4 text-[#120E0A]" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ======================================================================= */}
        {/* PIE DE ESCENA: INDICADOR DE PROGRESO Y ACCESO RÁPIDO                    */}
        {/* ======================================================================= */}
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 pb-2">
          <div className="flex items-center gap-2.5">
            {scenes.map((s, idx) => (
              <button
                key={s.id}
                onClick={() => onIrAEscena && onIrAEscena(idx)}
                title={`Ir a Escena 0${idx + 1}`}
                className={`h-2 transition-all duration-300 rounded-full cursor-pointer ${
                  idx === currentSceneIndex
                    ? 'w-10 bg-[#E5B85B] shadow-lg shadow-[#E5B85B]/50'
                    : 'w-2.5 bg-[#F5EFE6]/25 hover:bg-[#F5EFE6]/50'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-3 text-xs text-[#F5EFE6]/60 font-mono">
            <span className="hidden sm:inline">Desplaza para recorrer la narrativa de TrazaCao</span>
            <div className="w-7 h-7 rounded-full border border-[#D4AF37]/30 flex items-center justify-center animate-bounce">
              <ArrowDown className="w-3.5 h-3.5 text-[#E5B85B]" />
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL VECTORIAL DE QR DEL LOTE SELECCIONADO                               */}
      {/* ========================================================================= */}
      {modalQrAbierto && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#120E0A] border-2 border-[#D4AF37]/50 rounded-3xl max-w-sm w-full p-6 text-[#F5EFE6] shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 text-center space-y-4">
            <button
              onClick={() => setModalQrAbierto(false)}
              className="absolute top-4 right-4 text-[#F5EFE6]/60 hover:text-[#F5EFE6] p-1 rounded-full cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#E5B85B] block font-bold">
                Pasaporte Digital • Mesa Nacional MNTC
              </span>
              <h4 className="font-serif text-2xl font-bold text-[#F5EFE6] mt-0.5">
                {loteActivo.id}
              </h4>
              <p className="text-xs text-[#F5EFE6]/70">
                {loteActivo.municipio}, Huila · {loteActivo.finca}
              </p>
            </div>

            {/* Código QR Vectorial Nítido SVG */}
            <div className="p-4 bg-white rounded-2xl inline-block shadow-inner">
              <QRCodeSVG
                value={passportUrl}
                size={180}
                level="M"
                includeMargin={false}
              />
            </div>

            <div className="text-[11px] text-[#22C55E] flex items-center justify-center gap-1.5 font-medium">
              <CheckCircle className="w-3.5 h-3.5 text-[#22C55E]" />
              <span>Escaneo público offline • Consulta &lt; 3s</span>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                onClick={() => {
                  setModalQrAbierto(false);
                  onVerPasaporte && onVerPasaporte(loteActivo.id);
                }}
                className="w-full py-2.5 bg-[#E5B85B] hover:bg-[#d4a853] text-[#120E0A] font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>Abrir Ficha Completa</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
