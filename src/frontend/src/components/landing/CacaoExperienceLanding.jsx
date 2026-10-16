import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Play, Pause, SkipForward, ArrowDown, Lock, QrCode, 
  MapPin, Shield, RefreshCw, Volume2, VolumeX, Eye, 
  Compass, ExternalLink, Sparkles, LayoutGrid, CheckCircle
} from 'lucide-react';
import { ScrollySceneViewer } from './ScrollySceneViewer';
import { CatalogoLotesPublico } from './CatalogoLotesPublico';
import { VerificadorTrazabilidadRapida } from './VerificadorTrazabilidadRapida';

export function CacaoExperienceLanding({ lotes = [], onEntrarGestion, onVerPasaporte }) {
  // Estado del motor de Scrollytelling
  const [progress, setProgress] = useState(0); // 0.0 a 1.0
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [autoProgress, setAutoProgress] = useState(0); // 0 a 1
  const [reducedMotion, setReducedMotion] = useState(false);
  const [userInteracted, setUserInteracted] = useState(false);

  const containerRef = useRef(null);
  const animFrameRef = useRef(null);
  const startTimeRef = useRef(null);
  const DURATION_MS = 24000; // 24 segundos de recorrido guiado para 5 escenas

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

  // 3. Motor de Autoplay Introductorio (24 segundos)
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
        setIsAutoPlaying(false);
      }
    };

    animFrameRef.current = requestAnimationFrame(animateAutoPlay);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isAutoPlaying, reducedMotion, userInteracted, DURATION_MS]);

  // 4. Captura de Interacción Manual
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

      if (Math.abs(scrollFraction - progress) > 0.015 && !isAutoPlaying) {
        setProgress(scrollFraction);
      }

      if (currentScroll > 20 && isAutoPlaying) {
        cederControlManual();
        setProgress(scrollFraction);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isAutoPlaying, progress, cederControlManual]);

  // Escucha de eventos de interacción
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

  // Navegación rápida entre las 5 escenas
  const irAEscena = (index) => {
    cederControlManual();
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const trackHeight = containerRef.current.offsetHeight - windowHeight;
    const targetScroll = window.scrollY + rect.top + (index / 4) * trackHeight;
    window.scrollTo({ top: targetScroll, behavior: 'smooth' });
  };

  // Saltar al catálogo
  const saltarAlCatalogo = () => {
    cederControlManual();
    const cat = document.getElementById('lotes-disponibles');
    if (cat) {
      cat.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Alternar play/pause del recorrido
  const pausarReanudarIntro = () => {
    if (isAutoPlaying) {
      cederControlManual();
    } else {
      setUserInteracted(false);
      setIsAutoPlaying(true);
      startTimeRef.current = null;
      if (window.scrollY > 200) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  // Nombres de las 5 escenas para la brújula lateral
  const sceneNodes = [
    { idx: 0, title: '01 / Quiénes Somos' },
    { idx: 1, title: '02 / Nuestro Propósito' },
    { idx: 2, title: '03 / Qué Hacemos' },
    { idx: 3, title: '04 / Qué Nos Distingue' },
    { idx: 4, title: '05 / Pasaporte Digital' },
  ];

  const currentSceneIdx = Math.min(4, Math.max(0, Math.round(progress * 4)));

  return (
    <div className="bg-[#0B0907] text-[#F5EFE6] font-sans selection:bg-[#E5B85B] selection:text-[#120E0A] relative">
      {/* ========================================================================= */}
      {/* 1. BARRA SUPERIOR FIJA (BRAND HEADER + NAVEGACIÓN COMPLETA)                */}
      {/* ========================================================================= */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0B0907]/90 backdrop-blur-md border-b border-[#D4AF37]/20 px-4 sm:px-8 lg:px-12 py-3 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Izquierda (Identidad TRAZACAO) */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => irAEscena(0)} 
              className="flex items-center gap-2.5 text-left cursor-pointer group"
              title="TrazaCao • Inicio"
            >
              <span className="text-[#E5B85B] font-bold text-lg leading-none group-hover:scale-110 transition-transform">
                ◆
              </span>
              <div>
                <span className="font-serif text-lg sm:text-xl font-bold tracking-wider text-[#F5EFE6] block leading-none">
                  TRAZACAO
                </span>
                <span className="text-[10px] sm:text-[11px] font-mono tracking-widest text-[#E5B85B] uppercase block mt-0.5">
                  TRAZABILIDAD & COMERCIO B2B DE CACAO DE ORIGEN • HUILA
                </span>
              </div>
            </button>
          </div>

          {/* Centro/Derecha: Indicador en vivo + Botones de Vista y Acceso */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Indicador en vivo: Píldora discreta con punto verde pulsante */}
            <div className="hidden lg:inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#132018] border border-[#22C55E]/40 text-[11px] font-mono text-[#22C55E]">
              <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
              <span>MNTC • NTC 1252 • 100% Offline-First</span>
            </div>

            {/* Botón de Recorrido */}
            <button
              onClick={pausarReanudarIntro}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                isAutoPlaying
                  ? 'bg-[#E5B85B] text-[#120E0A] border-[#E5B85B] font-bold shadow-md'
                  : 'bg-[#1A140F] text-[#F5EFE6]/80 hover:text-[#F5EFE6] border-[#D4AF37]/30'
              }`}
              title={isAutoPlaying ? 'Pausar recorrido cinematográfico' : 'Iniciar recorrido guiado'}
            >
              {isAutoPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 text-[#E5B85B]" />}
              <span className="hidden sm:inline">Recorrido</span>
            </button>

            {/* Botón de Catálogo */}
            <button
              onClick={saltarAlCatalogo}
              className="inline-flex items-center gap-1.5 bg-[#1A140F] hover:bg-[#261D16] text-[#F5EFE6] text-xs font-semibold px-3 py-1.5 rounded-xl border border-[#D4AF37]/35 transition-all cursor-pointer"
              title="Ir al catálogo comercial B2B de lotes y residuos"
            >
              <LayoutGrid className="w-3.5 h-3.5 text-[#E5B85B]" />
              <span className="hidden sm:inline">Catálogo</span>
            </button>

            {/* Acceso Rápido al Pasaporte QR */}
            <button
              onClick={() => irAEscena(4)}
              className="inline-flex items-center gap-1.5 bg-[#1A140F] hover:bg-[#261D16] text-[#E5B85B] text-xs font-bold px-3 py-1.5 rounded-xl border border-[#E5B85B]/40 transition-all cursor-pointer shadow-sm"
              title="Consultar Pasaporte Digital en Tiempo Real"
            >
              <QrCode className="w-3.5 h-3.5 text-[#E5B85B]" />
              <span className="hidden md:inline">Consultar QR</span>
            </button>

            {/* Acceso al Panel Operativo / Cooperativa */}
            <button
              onClick={onEntrarGestion}
              className="inline-flex items-center gap-1.5 bg-[#E5B85B] hover:bg-[#d4a853] text-[#120E0A] text-xs font-bold px-3.5 py-1.5 rounded-xl transition-all shadow-md cursor-pointer active:scale-95"
              title="Iniciar sesión en la consola operativa para operadores y administradores"
            >
              <Lock className="w-3.5 h-3.5 text-[#120E0A]" />
              <span className="hidden sm:inline">Panel Operativo</span>
            </button>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. BRÚJULA FLOTANTE LATERAL (HUD COMPASS CON 5 NODOS)                     */}
      {/* ========================================================================= */}
      <aside className="fixed right-4 sm:right-6 top-1/2 -translate-y-1/2 z-40 hidden md:flex flex-col gap-3">
        {sceneNodes.map((node) => (
          <div key={node.idx} className="relative group flex items-center justify-end">
            {/* Tooltip lateral */}
            <span className="absolute right-7 px-3 py-1 rounded-lg bg-[#120E0A]/95 border border-[#D4AF37]/30 text-[11px] font-mono font-semibold text-[#E5B85B] whitespace-nowrap shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              {node.title}
            </span>

            {/* Punto indicador */}
            <button
              onClick={() => irAEscena(node.idx)}
              className={`w-3 h-3 rounded-full border transition-all cursor-pointer ${
                node.idx === currentSceneIdx
                  ? 'bg-[#E5B85B] border-[#E5B85B] scale-125 shadow-lg shadow-[#E5B85B]/50'
                  : 'bg-[#120E0A] border-[#D4AF37]/40 hover:border-[#E5B85B]'
              }`}
              title={node.title}
            />
          </div>
        ))}
      </aside>

      {/* ========================================================================= */}
      {/* CONTENEDOR DE SCROLLYTELLING CINEMATOGRÁFICO (500vh de recorrido)         */}
      {/* ========================================================================= */}
      <div ref={containerRef} className="relative h-[500vh] w-full">
        {/* Viewport Fijo con la Escena Activa */}
        <div className="sticky top-0 h-screen w-full overflow-hidden">
          <ScrollySceneViewer
            progress={progress}
            lotes={lotes}
            onExplorarLotes={saltarAlCatalogo}
            onVerPasaporte={onVerPasaporte}
            onIrAEscena={irAEscena}
          />

          {/* Botón flotante inferior para saltar al Catálogo */}
          <div className="absolute bottom-6 left-6 sm:left-12 z-30">
            <button
              onClick={saltarAlCatalogo}
              className="flex items-center gap-2 bg-[#120E0A]/90 backdrop-blur-md px-4 py-2.5 rounded-full border border-[#D4AF37]/35 shadow-2xl text-xs text-[#E9DCC5] hover:text-[#F5EFE6] transition-colors cursor-pointer active:scale-95"
              title="Ir directamente al catálogo comercial B2B"
            >
              <SkipForward className="w-3.5 h-3.5 text-[#E5B85B]" />
              <span>Ir al Catálogo de Lotes & Mermas</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECCIÓN CATÁLOGO COMERCIAL FUNCIONAL B2B (GRANOS & MERMA CASCARILLA)      */}
      {/* ========================================================================= */}
      <CatalogoLotesPublico
        lotes={lotes}
        onVerPasaporte={onVerPasaporte}
        onSolicitarMuestra={(loteId) => {
          onVerPasaporte && onVerPasaporte(loteId);
        }}
      />

      {/* ========================================================================= */}
      {/* VERIFICADOR RÁPIDO DE TRAZABILIDAD & ACCIONES DE CIERRE                   */}
      {/* ========================================================================= */}
      <VerificadorTrazabilidadRapida
        onConsultarLote={onVerPasaporte}
        onEntrarGestion={onEntrarGestion}
        onExplorarCatalogo={saltarAlCatalogo}
      />

      {/* ========================================================================= */}
      {/* PIE DE PÁGINA EDITORIAL PREMIUM TRAZACAO                                  */}
      {/* ========================================================================= */}
      <footer className="bg-[#0B0907] text-[#F5EFE6]/60 py-16 px-6 sm:px-12 border-t border-[#D4AF37]/20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div className="space-y-2 max-w-md">
            <div className="flex items-center gap-2">
              <span className="text-[#E5B85B] font-bold text-base">◆</span>
              <span className="font-serif text-xl font-bold text-[#F5EFE6]">
                TrazaCao Huila
              </span>
            </div>
            <p className="text-xs text-[#E9DCC5]/70 leading-relaxed font-light">
              Infraestructura Agroindustrial y Comercial B2B de Cacao de Origen Fino de Aroma del Huila.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 text-xs text-[#E9DCC5]/80">
            <div className="space-y-1">
              <span className="font-bold text-[#F5EFE6] block">Municipios Asociados</span>
              <span>Rivera · Campoalegre · Algeciras</span>
            </div>

            <div className="space-y-1">
              <span className="font-bold text-[#F5EFE6] block">Normativa de Trazabilidad</span>
              <span>Mesa Nacional de Cacao (MNTC) · NTC 1252</span>
            </div>

            <div>
              <button
                onClick={onEntrarGestion}
                className="px-4 py-2 bg-[#1A140F] hover:bg-[#261D16] text-[#E5B85B] rounded-xl text-xs font-semibold border border-[#D4AF37]/40 transition-all cursor-pointer shadow-md"
              >
                Panel Operativo
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-12 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-[#E9DCC5]/40 font-mono">
          <span>© 2026 TrazaCao Huila. Plataforma de Trazabilidad y Comercio B2B.</span>
          <span>100% Offline-First • Cero Deforestación</span>
        </div>
      </footer>
    </div>
  );
}
