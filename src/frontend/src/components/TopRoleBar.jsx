import React, { useState, useEffect } from 'react';
import { Shield, User, RefreshCw, Compass, LogOut } from 'lucide-react';
import { api } from '../api/client';
import { TrazaCaoLogo } from './TrazaCaoLogo';

export function TopRoleBar({ auth, onLogout, onRefreshAll, onVolverLanding }) {
  const [backendOnline, setBackendOnline] = useState(null);

  const verificarBackend = async () => {
    const ok = await api.healthCheck();
    setBackendOnline(ok);
  };

  useEffect(() => {
    verificarBackend();
    const interval = setInterval(verificarBackend, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    await verificarBackend();
    if (onRefreshAll) onRefreshAll();
  };

  const esAdmin = auth?.role === 'ADMINISTRADOR';

  return (
    <header className="bg-stone-950 border-b border-stone-800 sticky top-0 z-50 px-4 py-2.5 shadow-md">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Identidad de Marca TrazaCao & Estado */}
        <div className="flex items-center gap-3">
          <TrazaCaoLogo variant="dark" size="md" />
          <div className="border-l border-stone-800 pl-3 hidden sm:block">
            <div className="flex items-center gap-2">
              <span className="text-[11px] bg-amber-950/80 text-amber-300 font-semibold px-2 py-0.5 rounded border border-amber-800/80">
                Huila Agro
              </span>
              {backendOnline === true && (
                <span
                  className="text-[11px] text-emerald-400 flex items-center gap-1.5 bg-emerald-950/60 border border-emerald-800/80 px-2 py-0.5 rounded"
                  title="Base de datos y sistema local en línea (SQLite WAL)"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Operación Local Autónoma · En Línea
                </span>
              )}
              {backendOnline === false && (
                <span
                  onClick={handleRefresh}
                  className="text-[11px] text-rose-300 flex items-center gap-1.5 bg-rose-950 border border-rose-800 px-2 py-0.5 rounded cursor-pointer hover:bg-rose-900 transition-colors"
                  title="Sistema desconectado. Clic para reintentar."
                >
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                  Servidor Desconectado
                </span>
              )}
              {backendOnline === null && (
                <span className="text-[11px] text-stone-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-stone-500"></span>
                  Conectando...
                </span>
              )}
            </div>
            <p className="text-[11px] text-stone-400 leading-none mt-1">
              Plataforma de Trazabilidad Cacaotera y Denominación de Origen · NTC 1252 / EUDR
            </p>
          </div>
        </div>

        {/* Acciones de Navegación, Perfil Autenticado y Salida */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Botón Volver a la Experiencia Cacao */}
          {onVolverLanding && (
            <button
              onClick={onVolverLanding}
              className="flex items-center gap-1.5 text-xs bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-amber-300 border border-stone-700 px-3 py-1.5 rounded-lg transition-all font-medium cursor-pointer shadow-sm active:scale-95"
              title="Volver a la landing pública inmersiva y scrollytelling del Cacao"
            >
              <Compass className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden sm:inline">Experiencia Cacao</span>
            </button>
          )}

          {/* Insignia del Usuario y Rol Autenticado */}
          <div className="flex items-center gap-2 bg-stone-900/90 border border-stone-800 rounded-lg px-3 py-1.5">
            <div className={`p-1 rounded-md ${esAdmin ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/80' : 'bg-amber-950 text-amber-400 border border-amber-800/80'}`}>
              {esAdmin ? <Shield className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-stone-200 leading-tight">
                {auth?.user || auth?.username || 'Usuario'}
              </span>
              <span className={`text-[10px] font-mono leading-none ${esAdmin ? 'text-emerald-400' : 'text-amber-400'}`}>
                {esAdmin ? 'ADMINISTRADOR' : 'OPERADOR'}
              </span>
            </div>
          </div>

          {/* Refrescar Datos */}
          <button
            onClick={handleRefresh}
            className="p-2 text-stone-400 hover:text-stone-200 bg-stone-900 hover:bg-stone-800 border border-stone-700 rounded-lg transition-all cursor-pointer"
            title="Actualizar datos de bodega y verificar conexión"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          {/* Botón Cerrar Sesión */}
          {onLogout && (
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 text-xs bg-stone-900 hover:bg-rose-950/50 text-stone-400 hover:text-rose-300 border border-stone-700 hover:border-rose-800/60 px-3 py-1.5 rounded-lg transition-all font-medium cursor-pointer shadow-sm active:scale-95"
              title="Cerrar la sesión actual"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400" />
              <span>Cerrar Sesión</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
