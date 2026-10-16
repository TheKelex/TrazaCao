import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Compass, Play, Pause, SkipForward, ArrowDown, Lock, QrCode, 
  MapPin, Shield, RefreshCw, Volume2, VolumeX, Eye
} from 'lucide-react';
import { ScrollySceneViewer } from './ScrollySceneViewer';
import { CatalogoLotesPublico } from './CatalogoLotesPublico';
import { VerificadorTrazabilidadRapida } from './VerificadorTrazabilidadRapida';
import { TrazaCaoLogo } from '../TrazaCaoLogo';

export function CacaoExperienceLanding({ lotes, onEntrarGestion, onVerPasaporte, onSeleccionarProducto }) {
  // Estado del motor de Scrollytelling híbrido
  const [progress, setProgress] = useState(0); // 0.0 a 1.0
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [autoProgress, setAutoProgress] = useState(0); // 0 a 12s
  const [reducedMotion, setReducedMotion] = useState(false);
  const [userInteracted, setUserInteracted] = useState(false);

  const containerRef = useRef(null);
  const animFrameRef = useRef(null);
  const startTimeRef = useRef(null);
  const DURATION_MS = 20000; // 20 segundos de recorrido guiado

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

  // 3. Motor de Autoplay Introductorio (20 segundos)
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
          {/* Marca Editorial TrazaCao */}
          <div className="flex items-center gap-3">
            <TrazaCaoLogo 
              variant="dark" 
              size="md" 
              showSubtitle={false} 
            />
          </div>

          {/* Botones de Navegación Externa y Acceso */}
          <div className="flex items-center gap-2.5">
            <a
              href="/landing/"
              className="inline-flex items-center gap-1.5 bg-[#FAF7F0]/10 hover:bg-[#FAF7F0]/20 text-xs font-semibold px-3.5 py-1.5 rounded-full border border-[#D4AF37]/50 text-[#FAF7F0] transition-all shadow-md cursor-pointer"
              title="Conoce nuestra historia y origen"
            >
              <Compass className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span className="hidden sm:inline">Sobre nosotros</span>
            </a>

            <button
              onClick={onEntrarGestion}
              className="inline-flex items-center gap-1.5 bg-[#D4AF37] hover:bg-[#c29d2b] text-[#16120E] text-xs font-bold px-3.5 py-1.5 rounded-full transition-all shadow-md cursor-pointer"
              title="Abrir la consola operativa para operadores y administradores"
            >
              <Lock className="w-3.5 h-3.5 text-[#16120E]" />
              <span className="hidden sm:inline">Cooperativa</span>
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

          {/* Botón flotante para Ir al Catálogo */}
          <div className="absolute bottom-6 left-6 sm:left-12 z-30">
            <button
              onClick={saltarAlCatalogo}
              className="flex items-center gap-2 bg-[#16120E]/85 backdrop-blur-md px-4 py-2.5 rounded-full border border-[#FAF7F0]/15 shadow-2xl text-xs text-[#E9DCC5] hover:text-[#FAF7F0] transition-colors cursor-pointer"
              title="Ir directamente al catálogo de lotes"
            >
              <SkipForward className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Ir al Catálogo de Lotes</span>
            </button>
          </div>
        </div>
      </div>

      {/* ESCENA 06: CATÁLOGO COMERCIAL FUNCIONAL DE LOTES */}
      <CatalogoLotesPublico
        lotes={lotes}
        onVerPasaporte={onVerPasaporte}
        onSeleccionarProducto={onSeleccionarProducto}
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
              Plataforma de Trazabilidad Agroindustrial y Pasaporte Digital de Cacao Fino de Aroma del Huila.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 text-xs text-[#E9DCC5]/80">
            <div className="space-y-1">
              <span className="font-bold text-[#FAF7F0] block">Municipios Asociados</span>
              <span>Rivera · Campoalegre · Algeciras</span>
            </div>

            <div className="space-y-1">
              <span className="font-bold text-[#FAF7F0] block">Origen</span>
              <span>Departamento del Huila, Colombia</span>
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
          <span>© 2026 TrazaCao Huila. Todos los derechos reservados.</span>
          <span>Calidad y Trazabilidad de Cacao Fino de Aroma</span>
        </div>
      </footer>
    </div>
  );
}
