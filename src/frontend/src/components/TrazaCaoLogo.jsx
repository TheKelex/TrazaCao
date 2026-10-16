import React from 'react';

/**
 * Componente Oficial de Marca TrazaCao Huila
 * Soporta variantes adaptativas para Dark Mode (cabecera), Light Mode (documentos/certificados),
 * y modo Isotipo independiente para vistas compactas y sellos de calidad.
 */
export function TrazaCaoLogo({
  variant = 'dark', // 'dark' | 'light' | 'isotype' | 'badge'
  size = 'md',     // 'sm' | 'md' | 'lg' | 'xl'
  showSubtitle = false,
  subtitleText = 'Huila Agro · Denominación de Origen',
  className = '',
}) {
  // Dimensiones según tamaño
  const scaleMap = {
    sm: { height: 28, text: 'text-base', podH: 26, podW: 13 },
    md: { height: 38, text: 'text-xl', podH: 34, podW: 17 },
    lg: { height: 50, text: 'text-2xl', podH: 44, podW: 22 },
    xl: { height: 68, text: 'text-3xl', podH: 60, podW: 30 },
  };

  const { text: textSize, podH, podW } = scaleMap[size] || scaleMap.md;

  // Paleta de color según variante
  const isDark = variant === 'dark';
  const isLight = variant === 'light';
  const isBadge = variant === 'badge';

  const textColor = isLight 
    ? 'text-[#4A1525]' 
    : isBadge 
    ? 'text-[#4A1525]' 
    : 'text-stone-100';

  const strokePod = isLight || isBadge ? '#4A1525' : '#F59E0B';
  const haloStroke = isLight || isBadge ? '#6E2137' : '#D97706';

  // Solo Isotipo
  if (variant === 'isotype') {
    return (
      <div className={`inline-flex items-center justify-center shrink-0 ${className}`} title="TrazaCao Huila">
        <svg 
          viewBox="0 0 34 72" 
          fill="none" 
          style={{ height: podH, width: podW }} 
          className="shrink-0 transition-transform hover:scale-105"
        >
          {/* Halo / Semilla Superior */}
          <ellipse 
            cx="23" 
            cy="5.5" 
            rx="7" 
            ry="3.8" 
            stroke={haloStroke} 
            strokeWidth="2.4" 
            fill="none" 
            transform="rotate(-8 23 5.5)"
          />
          {/* Silueta Cacao Pod */}
          <path 
            d="M 15 11.5 C 6 16.5, 1 32, 2 45 C 3 57.5, 11 66.5, 15 70.5 C 19 66.5, 27 57.5, 28 45 C 29 32, 24 16.5, 15 11.5 Z" 
            stroke={strokePod} 
            strokeWidth="2.4" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            fill={isLight || isBadge ? '#4A1525' : '#78350F'} 
            fillOpacity={isLight || isBadge ? '0.08' : '0.25'}
          />
          {/* Surcos Internos */}
          <path d="M 15 11.5 C 8 22, 7 48, 15 70.5" stroke={strokePod} strokeWidth="1.8" strokeLinecap="round" />
          <path d="M 15 11.5 C 22 22, 23 48, 15 70.5" stroke={strokePod} strokeWidth="1.8" strokeLinecap="round" />
          <path d="M 15 11.5 V 70.5" stroke={strokePod} strokeWidth="1" strokeDasharray="2 3" opacity="0.6" />
        </svg>
      </div>
    );
  }

  // Imagotipo Completo ("TrazaCa" + Isotipo Mazorca que forma la "o" de TrazaCao)
  const logoContent = (
    <div className="flex items-center gap-0.5 select-none leading-none">
      <span 
        className={`font-serif font-bold tracking-tight ${textSize} ${textColor}`}
        style={{ fontFamily: "'Playfair Display', Georgia, serif", letterSpacing: '-0.02em' }}
      >
        TrazaCa
      </span>
      <div className="relative inline-flex items-center justify-center -ml-0.5" style={{ height: podH, width: podW }}>
        <svg 
          viewBox="0 0 34 72" 
          fill="none" 
          className="w-full h-full"
        >
          {/* Halo / Semilla Superior */}
          <ellipse 
            cx="23" 
            cy="5.5" 
            rx="7" 
            ry="3.8" 
            stroke={haloStroke} 
            strokeWidth="2.4" 
            fill="none" 
            transform="rotate(-8 23 5.5)"
          />
          {/* Silueta Cacao Pod */}
          <path 
            d="M 15 11.5 C 6 16.5, 1 32, 2 45 C 3 57.5, 11 66.5, 15 70.5 C 19 66.5, 27 57.5, 28 45 C 29 32, 24 16.5, 15 11.5 Z" 
            stroke={strokePod} 
            strokeWidth="2.4" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            fill={isLight || isBadge ? '#4A1525' : '#78350F'} 
            fillOpacity={isLight || isBadge ? '0.08' : '0.25'}
          />
          {/* Surcos Internos */}
          <path d="M 15 11.5 C 8 22, 7 48, 15 70.5" stroke={strokePod} strokeWidth="1.8" strokeLinecap="round" />
          <path d="M 15 11.5 C 22 22, 23 48, 15 70.5" stroke={strokePod} strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );

  if (isBadge) {
    return (
      <div className={`inline-flex flex-col items-start bg-amber-50/95 border border-amber-200/80 rounded-xl px-3.5 py-1.5 shadow-sm ${className}`}>
        {logoContent}
        {showSubtitle && (
          <span className="text-[10px] text-[#6E2137] font-semibold tracking-wide mt-0.5">
            {subtitleText}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`inline-flex flex-col items-start ${className}`}>
      {logoContent}
      {showSubtitle && (
        <span className={`text-[10px] font-medium tracking-wide mt-0.5 ${isLight ? 'text-stone-600' : 'text-stone-400'}`}>
          {subtitleText}
        </span>
      )}
    </div>
  );
}

export default TrazaCaoLogo;
