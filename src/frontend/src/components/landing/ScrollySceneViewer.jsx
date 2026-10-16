import React, { useMemo } from 'react';
import { MapPin, Sparkles, Award, ShieldCheck, ArrowDown, ChevronRight } from 'lucide-react';

export function ScrollySceneViewer({ progress, onExplorarLotes, onConsultarTrazabilidad }) {
  // Escenas cinematográficas con imágenes locales auténticas
  const scenes = [
    {
      id: 'territorio',
      title: 'Cada cacao tiene una historia',
      subtitle: 'En las estribaciones de la cordillera andina del Huila, entre Rivera, Campoalegre y Algeciras, nace un cacao único en el mundo.',
      image: '/images/territorio.jpg',
      chapter: 'TERRITORIO',
      location: 'Cordillera Central · Huila, Colombia',
      meta: 'Clima tropical andino · 720 - 1.100 m.s.n.m.',
      detail: 'Suelos volcánicos enriquecidos por el río Magdalena y microclimas ideales para la concentración de aromas florales y frutales.',
      badge: 'Denominación de Origen Protegida',
    },
    {
      id: 'cultivo',
      title: 'El fruto sagrado en el árbol',
      subtitle: 'Theobroma Cacao: Alimento de los dioses. Árboles bajo sombra nativa protegidos de la deforestación.',
      image: '/images/cultivo.jpg',
      chapter: 'EL CULTIVO',
      location: 'Rivera & Campoalegre',
      meta: 'Variedades Criollo & Trinitario Fino de Aroma',
      detail: 'Caulifloria botánica: las mazorcas brotan directamente de los troncos maduros bajo doseles de plátano, guamo y nogal.',
      badge: 'Cero Deforestación · Calidad de Origen',
    },
    {
      id: 'recoleccion',
      title: 'Las manos que cuidan la cosecha',
      subtitle: 'La recolección es un arte manual paciente. Solo las mazorcas en su punto exacto de madurez son seleccionadas.',
      image: '/images/recoleccion.jpg',
      chapter: 'LA COSECHA',
      location: 'Asociación de Cacaocultores del Huila',
      meta: 'Corte manual selectivo con podón y tijera',
      detail: 'El respeto por el cojín floral garantiza que el árbol continúe produciendo año tras año sin daños mecánicos.',
      badge: 'Trabajo Campesino Justo & Directo',
    },
    {
      id: 'transformacion',
      title: 'La alquimia de la fermentación y el sol',
      subtitle: 'En cajones de madera laurel y marquesinas solares, el grano despierta sus notas de chocolate amargo, frutos rojos y miel.',
      image: '/images/grano.jpg',
      imageSecondary: '/images/secado.jpg',
      chapter: 'TRANSFORMACIÓN',
      location: 'Centros de Beneficio Asociativo',
      meta: 'Fermentación 6 días · Secado natural en elba',
      detail: 'Monitoreo diario de temperatura y volteo periódico para alcanzar el estándar NTC 1252: humedad ≤ 7.5% y fermentación ≥ 75%.',
      badge: 'Norma Técnica Colombiana NTC 1252',
    },
    {
      id: 'trazabilidad',
      title: 'Trazabilidad verificable de la semilla a la barra',
      subtitle: 'Cada lote conserva su identidad intacta. Sin intermediación opaca ni mezclas que borren el nombre de quien lo cultivó.',
      image: '/images/producto.jpg',
      chapter: 'TRAZABILIDAD',
      location: 'Cadena de Custodia Digital',
      meta: 'Registro Criptográfico Inmutable & Pasaporte QR',
      detail: 'Transparencia comercial para chocolateros internacionales: orígenes auténticos, análisis de calidad físico y cero fuga de costos internos.',
      badge: 'Pasaporte Digital B2B Verificado',
    },
  ];

  // Cálculo de opacidad y escalas suaves para cada escena según progress (0.0 a 1.0)
  // Cada escena tiene un centro y decae suavemente
  const step = 1 / (scenes.length - 1); // 0.25 por intervalo (5 escenas = 4 intervalos)

  const sceneStates = useMemo(() => {
    return scenes.map((_, index) => {
      const center = index * step;
      const distance = Math.abs(progress - center);
      // Ventana de visibilidad de ancho 0.35 con caída suave (cosine bell)
      const maxDist = step * 1.05;
      let opacity = 0;
      if (distance < maxDist) {
        opacity = 0.5 * (1 + Math.cos((Math.PI * distance) / maxDist));
      }
      // Zoom sutil continuo
      const zoom = 1.04 + (progress - center) * 0.08;
      return { opacity, zoom: Math.max(1.0, Math.min(1.15, zoom)), distance };
    });
  }, [progress, scenes.length, step]);

  // Encontrar la escena con mayor opacidad para los textos
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

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#16120E] select-none">
      {/* Fondo Fotográfico Dinámico con Cross-Fade */}
      <div className="absolute inset-0 z-0">
        {scenes.map((scene, i) => {
          const state = sceneStates[i];
          if (state.opacity <= 0.005) return null; // No renderizar capas transparentes para rendimiento

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
                className="w-full h-full object-cover object-center filter brightness-[0.72] contrast-[1.08] saturate-[1.12]"
                loading={i === 0 ? 'eager' : 'lazy'}
              />
            </div>
          );
        })}

        {/* Viñeta cinematográfica y gradientes orgánicos de profundidad */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#16120E] via-[#16120E]/40 to-black/60 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#16120E]/90 via-[#16120E]/30 to-transparent pointer-events-none hidden md:block" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(22,18,14,0.6)_100%)] pointer-events-none" />
      </div>

      {/* Contenido Editorial Flotante */}
      <div className="relative z-10 w-full h-full max-w-7xl mx-auto px-6 sm:px-12 flex flex-col justify-between py-12 md:py-16">
        {/* Cabecera de la Escena (Capítulo y Denominación) */}
        <div className="flex items-center justify-between gap-4 pt-16 md:pt-12">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs uppercase tracking-[0.25em] text-[#D4AF37] bg-[#234737]/80 backdrop-blur-md px-3 py-1 rounded-full border border-[#D4AF37]/30 shadow-lg">
              {activeScene.chapter}
            </span>
            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-[#FAF7F0]/80 font-sans tracking-wide">
              <MapPin className="w-3.5 h-3.5 text-[#B77A3C]" />
              {activeScene.location}
            </span>
          </div>

          <div className="inline-flex items-center gap-2 bg-[#FAF7F0]/10 backdrop-blur-md px-3.5 py-1 rounded-full border border-[#FAF7F0]/20 text-[11px] font-medium text-[#FAF7F0]">
            <Award className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>{activeScene.badge}</span>
          </div>
        </div>

        {/* Bloque Central Editorial: Titular Grande y Prosa */}
        <div className="max-w-2xl my-auto py-6">
          <div className="space-y-4 animate-in fade-in duration-500 key={activeScene.id}">
            <h1 className="font-serif-editorial text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-[#FAF7F0] tracking-tight leading-[1.08] drop-shadow-md">
              {activeScene.title}
            </h1>

            <p className="font-sans text-base sm:text-lg md:text-xl text-[#E9DCC5] font-light leading-relaxed max-w-xl">
              {activeScene.subtitle}
            </p>

            {/* Panel de Detalle Técnico / Botánico en Marfil Cálido */}
            <div className="pt-2">
              <div className="bg-[#FAF7F0]/95 text-[#16120E] rounded-2xl p-5 md:p-6 shadow-2xl border border-[#D4AF37]/40 backdrop-blur-sm max-w-lg">
                <div className="flex items-center gap-2 text-xs font-bold text-[#234737] uppercase tracking-wider mb-1">
                  <Sparkles className="w-4 h-4 text-[#B77A3C]" />
                  <span>{activeScene.meta}</span>
                </div>
                <p className="text-xs sm:text-sm text-[#3C2418] font-serif leading-relaxed mt-1">
                  {activeScene.detail}
                </p>

                {/* Acciones contextuales en la escena final */}
                {currentSceneIndex >= 3 && (
                  <div className="mt-4 pt-3 border-t border-[#3C2418]/15 flex items-center gap-3">
                    <button
                      onClick={onExplorarLotes}
                      className="inline-flex items-center gap-2 bg-[#234737] hover:bg-[#1a3529] text-[#FAF7F0] text-xs font-semibold px-4 py-2 rounded-lg transition-all shadow-md cursor-pointer active:scale-95"
                    >
                      <span>Ver Lotes Disponibles</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={onConsultarTrazabilidad}
                      className="text-xs text-[#3C2418] hover:text-[#234737] font-semibold underline underline-offset-4 cursor-pointer"
                    >
                      Pasaporte Digital
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Pie de Escena: Indicador de Navegación y Scroll */}
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 pb-4">
          <div className="flex items-center gap-2">
            {scenes.map((s, idx) => (
              <div
                key={s.id}
                className={`h-1.5 transition-all duration-300 rounded-full ${
                  idx === currentSceneIndex
                    ? 'w-10 bg-[#D4AF37] shadow-lg shadow-[#D4AF37]/50'
                    : 'w-2 bg-[#FAF7F0]/30'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-3 text-xs text-[#E9DCC5]/70 font-mono">
            <span className="hidden sm:inline">Desplaza o permite el recorrido cinematográfico</span>
            <div className="w-8 h-8 rounded-full border border-[#FAF7F0]/20 flex items-center justify-center animate-bounce">
              <ArrowDown className="w-3.5 h-3.5 text-[#D4AF37]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
