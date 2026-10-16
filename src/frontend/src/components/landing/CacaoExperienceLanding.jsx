import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Compass, Play, Pause, SkipForward, ArrowDown, Lock, QrCode, 
  MapPin, Shield, RefreshCw, Volume2, VolumeX, Eye
} from 'lucide-react';
import { ScrollySceneViewer } from './ScrollySceneViewer';
import { CatalogoLotesPublico } from './CatalogoLotesPublico';
import { VerificadorTrazabilidadRapida } from './VerificadorTrazabilidadRapida';

export function CacaoExperienceLanding({ lotes, onEntrarGestion, onVerPasaporte }) {
  // Estado del motor de Scrollytelling híbrido
  const [progress, setProgress] = useState(0); // 0.0 a 1.0
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [autoProgress, setAutoProgress] = useState(0); // 0 a 12s
  const [reducedMotion, setReducedMotion] = useState(false);
  const [userInteracted, setUserInteracted] = useState(false);

  const containerRef = useRef(null);
  const animFrameRef = useRef(null);
  const startTimeRef = useRef(null);
  const DURATION_MS = 13000; // 13 segundos de recorrido guiado

  // 1. Detección de Preferencias de Movimiento Reducido
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setReducedMotion(mediaQuery.matches);
      if (mediaQuery.matches) {
        setIsAutoPlaying(false);
      }
    }
  }, []);

  // 2. Control de Visibilidad de Pestaña (Ahorro de batería y CPU)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsAutoPlaying(false);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // 3. Motor de Autoplay Introductorio (8 - 15 segundos)
  useEffect(() => {
    if (!isAutoPlaying || reducedMotion || userInteracted) return;

    const animateAutoPlay = (timestamp) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const rawProgress = Math.min(1, elapsed / DURATION_MS);
      
      // Easing cúbico suave
      const easeProgress = rawProgress < 0.5
        ? 4 * rawProgress * rawProgress * rawProgress
        : 1 - Math.pow(-2 * rawProgress + 2, 3) / 2;

      setProgress(easeProgress);
      setAutoProgress(rawProgress);

      if (rawProgress < 1) {
        animFrameRef.current = requestAnimationFrame(animateAutoPlay);
      } else {
        // Al culminar la intro, ceder el control al flujo normal
        setIsAutoPlaying(false);
      }
    };

    animFrameRef.current = requestAnimationFrame(animateAutoPlay);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isAutoPlaying, reducedMotion, userInteracted, DURATION_MS]);

  // 4. Captura de Interacción Manual (Toma de control del scroll)
  const cederControlManual = useCallback(() => {
    if (isAutoPlaying) {
      setIsAutoPlaying(false);
      setUserInteracted(true);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    }
  }, [isAutoPlaying]);

  // Sincronización continua de Scroll real en el track (500vh)
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const trackHeight = containerRef.current.offsetHeight - windowHeight;

      if (trackHeight <= 0) return;

      const currentScroll = -rect.top;
      const scrollFraction = Math.max(0, Math.min(1, currentScroll / trackHeight));

      // Si el usuario se desplaza físicamente, toma el mando
      if (Math.abs(scrollFraction - progress) > 0.02 && !isAutoPlaying) {
        setProgress(scrollFraction);
      }

      // Si el usuario hace scroll durante el autoplay, cancelar autoplay
      if (currentScroll > 20 && isAutoPlaying) {
        cederControlManual();
        setProgress(scrollFraction);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isAutoPlaying, progress, cederControlManual]);

  // 5. Escucha de eventos de interacción (Rueda, Touch, Teclado)
  useEffect(() => {
    const onWheel = () => cederControlManual();
    const onTouch = () => cederControlManual();
    const onKeyDown = (e) => {
      if (['ArrowDown', 'ArrowUp', 'Space', 'PageDown', 'PageUp'].includes(e.code)) {
        cederControlManual();
      }
      if (e.code === 'Escape') {
        saltarAlCatalogo();
      }
    };

    window.addEventListener('wheel', onWheel, { passive: true });
    window.addEventListener('touchmove', onTouch, { passive: true });
    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchmove', onTouch);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [cederControlManual]);

  // Acción: Saltar la introducción directamente al catálogo
  const saltarAlCatalogo = () => {
    cederControlManual();
    setProgress(1);
    const cat = document.getElementById('lotes-disponibles');
    if (cat) {
      cat.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const pausarReanudarIntro = () => {
    if (isAutoPlaying) {
      cederControlManual();
    } else {
      setUserInteracted(false);
      setIsAutoPlaying(true);
      startTimeRef.current = null;
    }
  };

  return (
    <div className="bg-[#16120E] text-[#FAF7F0] font-sans selection:bg-[#B77A3C] selection:text-[#16120E] relative">
      {/* Barra de Navegación Editorial Superior */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#16120E]/80 backdrop-blur-md border-b border-[#FAF7F0]/10 px-6 sm:px-12 py-3.5 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Marca Editorial */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#234737] border border-[#D4AF37]/50 flex items-center justify-center p-1.5 shadow">
              <svg viewBox="0 0 64 64" fill="none" className="w-full h-full">
                <path d="M32 6C18 14 10 30 16 48C20 60 30 62 32 62C34 62 44 60 48 48C54 30 46 14 32 6Z" fill="#B77A3C" stroke="#D4AF37" strokeWidth="2.5"/>
                <path d="M32 6V62" stroke="#FAF7F0" strokeWidth="2" strokeDasharray="3 3"/>
                <circle cx="32" cy="6" r="3" fill="#234737"/>
              </svg>
            </div>
            <div>
              <span className="font-serif-editorial text-lg sm:text-xl font-bold tracking-tight text-[#FAF7F0] block leading-none">
                TrazaCao Huila
              </span>
              <span className="font-mono text-[10px] text-[#D4AF37] tracking-widest uppercase">
                Denominación de Origen
              </span>
            </div>
          </div>

          {/* Menú Editorial de Enlaces */}
          <nav className="hidden md:flex items-center gap-6 text-xs text-[#E9DCC5] font-medium tracking-wide">
            <button
              onClick={() => {
                cederControlManual();
                setProgress(0.05);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="hover:text-[#D4AF37] transition-colors cursor-pointer"
            >
              Territorio
            </button>
            <button
              onClick={() => {
                cederControlManual();
                setProgress(0.30);
                window.scrollTo({ top: window.innerHeight * 1.5, behavior: 'smooth' });
              }}
              className="hover:text-[#D4AF37] transition-colors cursor-pointer"
            >
              Cultivo & Cosecha
            </button>
            <button
              onClick={() => {
                cederControlManual();
                setProgress(0.70);
                window.scrollTo({ top: window.innerHeight * 3, behavior: 'smooth' });
              }}
              className="hover:text-[#D4AF37] transition-colors cursor-pointer"
            >
              Transformación
            </button>
            <button
              onClick={saltarAlCatalogo}
              className="hover:text-[#D4AF37] transition-colors cursor-pointer"
            >
              Lotes Certificados
            </button>
            <button
              onClick={() => {
                const el = document.getElementById('verificador-rapido');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="hover:text-[#D4AF37] transition-colors cursor-pointer"
            >
              Consultar QR
            </button>
          </nav>

          {/* Botón de Acceso a la Plataforma Operativa */}
          <div className="flex items-center gap-3">
            <button
              onClick={onEntrarGestion}
              className="inline-flex items-center gap-2 bg-[#FAF7F0]/10 hover:bg-[#FAF7F0]/20 active:bg-[#FAF7F0]/30 text-xs font-semibold px-4 py-2 rounded-full border border-[#D4AF37]/50 text-[#FAF7F0] transition-all shadow-md cursor-pointer"
              title="Abrir la consola operativa para operadores y administradores"
            >
              <Lock className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span className="hidden sm:inline">Acceso Cooperativa</span>
              <span className="sm:hidden">Cooperativa</span>
            </button>
          </div>
        </div>
      </header>

      {/* CONTENEDOR DE SCROLLYTELLING CINEMATOGRÁFICO (500vh de recorrido narrativo) */}
      <div ref={containerRef} className="relative h-[450vh] w-full">
        {/* Viewport Fijo con la Escena Activa */}
        <div className="sticky top-0 h-screen w-full overflow-hidden">
          <ScrollySceneViewer
            progress={progress}
            onExplorarLotes={saltarAlCatalogo}
            onConsultarTrazabilidad={() => {
              const el = document.getElementById('verificador-rapido');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
          />

          {/* HUD Flotante Discreto de Control Cinemático */}
          <div className="absolute bottom-6 left-6 sm:left-12 z-30 flex items-center gap-3 bg-[#16120E]/85 backdrop-blur-md px-4 py-2 rounded-full border border-[#FAF7F0]/15 shadow-2xl text-xs text-[#E9DCC5]">
            {/* Indicador de Reproducción Automática */}
            <button
              onClick={pausarReanudarIntro}
              className="flex items-center gap-2 text-[#D4AF37] hover:text-[#FAF7F0] transition-colors cursor-pointer"
              title={isAutoPlaying ? 'Pausar recorrido cinematográfico' : 'Reanudar recorrido guiado'}
            >
              {isAutoPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <span className="font-mono text-[11px]">
                    Intro Guiada ({Math.round(autoProgress * 100)}%)
                  </span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span className="font-mono text-[11px]">Control Manual</span>
                </>
              )}
            </button>

            <span className="text-[#FAF7F0]/20">|</span>

            {/* Botón para Omitir al Catálogo */}
            <button
              onClick={saltarAlCatalogo}
              className="flex items-center gap-1.5 text-xs text-[#E9DCC5]/80 hover:text-[#FAF7F0] transition-colors cursor-pointer"
              title="Saltar directamente al catálogo de lotes"
            >
              <SkipForward className="w-3 h-3" />
              <span>Omitir intro</span>
            </button>
          </div>
        </div>
      </div>

      {/* ESCENA 06: CATÁLOGO COMERCIAL FUNCIONAL DE LOTES */}
      <CatalogoLotesPublico
        lotes={lotes}
        onVerPasaporte={onVerPasaporte}
        onSolicitarMuestra={(loteId) => {
          onVerPasaporte && onVerPasaporte(loteId);
        }}
      />

      {/* ESCENA 07: VERIFICADOR RÁPIDO DE TRAZABILIDAD & ACCIONES DE CIERRE */}
      <VerificadorTrazabilidadRapida
        onConsultarLote={onVerPasaporte}
        onEntrarGestion={onEntrarGestion}
        onExplorarCatalogo={saltarAlCatalogo}
      />

      {/* Pie de Página Editorial Premium */}
      <footer className="bg-[#100C09] text-[#FAF7F0]/60 py-16 px-6 sm:px-12 border-t border-[#3C2418]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div className="space-y-2 max-w-md">
            <span className="font-serif-editorial text-xl font-bold text-[#FAF7F0] block">
              TrazaCao Huila
            </span>
            <p className="text-xs text-[#E9DCC5]/70 leading-relaxed font-light">
              Plataforma de Trazabilidad Agroindustrial y Pasaporte Digital de Cacao Fino de Aroma. Desarrollado en Neiva, Huila para la II Hackathon de Programación DEVURITY — Universidad Surcolombiana.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 text-xs text-[#E9DCC5]/80">
            <div className="space-y-1">
              <span className="font-bold text-[#FAF7F0] block">Municipios Participantes</span>
              <span>Rivera · Campoalegre · Algeciras</span>
            </div>

            <div className="space-y-1">
              <span className="font-bold text-[#FAF7F0] block">Normatividad</span>
              <span>NTC 1252 · EUDR Cero Deforestación</span>
            </div>

            <div>
              <button
                onClick={onEntrarGestion}
                className="px-4 py-2 bg-[#234737] hover:bg-[#1a3529] text-[#FAF7F0] rounded-lg text-xs font-semibold border border-[#D4AF37]/30 transition-all cursor-pointer"
              >
                Panel de la Cooperativa
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-12 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-[#E9DCC5]/40 font-mono">
          <span>© 2026 TrazaCao Huila. Arquitectura Local Offline SQLite WAL.</span>
          <span>Aritmética Exacta Decimal · Cero Fuga de Costos Comerciales</span>
        </div>
      </footer>
    </div>
  );
}
