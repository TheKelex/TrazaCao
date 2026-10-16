import React, { useState, useEffect } from 'react';
import { Shield, UserCheck, AlertTriangle, RefreshCw, Zap, CheckCircle2, Lock, Radio, Compass } from 'lucide-react';
import { api } from '../api/client';

import { TrazaCaoLogo } from './TrazaCaoLogo';

export function TopRoleBar({ auth, setAuth, onAutocompletarDemo, onRefreshAll, onVolverLanding }) {
  const [test403Modal, setTest403Modal] = useState(null);
  const [testing403, setTesting403] = useState(false);
  const [backendOnline, setBackendOnline] = useState(null);

  const verificarBackend = async () => {
    const ok = await api.healthCheck();
    setBackendOnline(ok);
  };

  useEffect(() => {
    verificarBackend();
    const interval = setInterval(verificarBackend, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    await verificarBackend();
    if (onRefreshAll) onRefreshAll();
  };

  const alternarRol = (nuevoRol) => {
    if (nuevoRol === 'OPERADOR') {
      setAuth({ role: 'OPERADOR', user: 'Operador Rivera' });
    } else {
      setAuth({ role: 'ADMINISTRADOR', user: 'Dirección Técnica (Asociación Huila)' });
    }
  };

  const ejecutarTest403 = async () => {
    setTesting403(true);
    try {
      await api.test403Trigger(auth);
      setTest403Modal({
        tipo: 'exito_inesperado',
        titulo: 'Acción Permitida',
        mensaje: 'La acción fue permitida porque actualmente tienes rol ADMINISTRADOR.',
      });
    } catch (err) {
      setTest403Modal({
        tipo: '403_interceptado',
        titulo: `Acceso Restringido - Control de Roles de Seguridad`,
        mensaje: err.message,
        codigo: err.status || 403,
      });
    } finally {
      setTesting403(false);
    }
  };

  return (
    <header className="bg-stone-950 border-b border-amber-950/60 sticky top-0 z-50 px-4 py-2.5 shadow-md">
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
                <span className="text-[11px] text-emerald-400 flex items-center gap-1.5 bg-emerald-950/60 border border-emerald-800/80 px-2 py-0.5 rounded" title="Base de datos y sistema local en línea">
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

        {/* Barra de Acciones y Control de Perfil */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Botón Volver a la Experiencia Cacao */}
          {onVolverLanding && (
            <button
              onClick={onVolverLanding}
              className="flex items-center gap-1.5 text-xs bg-[#FAF7F0]/10 hover:bg-[#FAF7F0]/20 text-[#FAF7F0] border border-[#D4AF37]/50 px-3 py-1.5 rounded-full transition-all font-medium cursor-pointer shadow-sm active:scale-95"
              title="Volver a la landing pública inmersiva y scrollytelling del Cacao"
            >
              <Compass className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Experiencia Cacao</span>
            </button>
          )}

          {/* Botón Cargar Caso de Demostración */}
          <button
            onClick={onAutocompletarDemo}
            className="flex items-center gap-1.5 text-xs bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-600/50 px-2.5 py-1.5 rounded-md transition-all font-medium cursor-pointer shadow-sm active:scale-95"
            title="Pre-cargar caso comercial de demostración (Lote CAC001 Rivera 100 kg)"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Cargar Caso Demo</span>
          </button>

          {/* Selector de Rol Comercial */}
          <div className="flex items-center bg-stone-900 border border-stone-700 rounded-lg p-0.5">
            <button
              onClick={() => alternarRol('OPERADOR')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                auth.role === 'OPERADOR'
                  ? 'bg-amber-800 text-amber-100 shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              Operador
            </button>
            <button
              onClick={() => alternarRol('ADMINISTRADOR')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                auth.role === 'ADMINISTRADOR'
                  ? 'bg-emerald-800 text-emerald-100 shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              Admin
            </button>
          </div>

          {/* Refrescar Datos */}
          <button
            onClick={handleRefresh}
            className="p-1.5 text-stone-400 hover:text-stone-200 bg-stone-900 hover:bg-stone-800 border border-stone-700 rounded-md transition-all cursor-pointer"
            title="Actualizar datos de bodega y verificar conexión"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Modal Interceptor de Test 403 */}
      {test403Modal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-stone-900 border border-stone-700 max-w-md w-full rounded-xl p-5 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${test403Modal.codigo === 403 ? 'bg-rose-900/50 text-rose-400 border border-rose-700' : 'bg-emerald-900/50 text-emerald-400 border border-emerald-700'}`}>
                {test403Modal.codigo === 403 ? <AlertTriangle className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-stone-100 text-base">{test403Modal.titulo}</h3>
                <p className="text-sm text-stone-300 mt-1.5">{test403Modal.mensaje}</p>
                <div className="mt-3 p-2.5 bg-stone-950 rounded border border-stone-800 font-mono text-xs text-stone-400">
                  <p><span className="text-stone-500">Rol activo:</span> {auth.role}</p>
                  <p><span className="text-stone-500">Respuesta Backend:</span> {test403Modal.codigo || 200}</p>
                  <p><span className="text-stone-500">Traza Auditada:</span> Registrado en audit_logs inmutable</p>
                </div>
              </div>
            </div>
            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setTest403Modal(null)}
                className="bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold px-4 py-2 rounded-lg transition-all cursor-pointer"
              >
                Entendido / Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
