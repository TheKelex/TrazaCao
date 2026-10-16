import React, { useState } from 'react';
import { Shield, UserCheck, AlertTriangle, RefreshCw, Zap, CheckCircle2, Lock } from 'lucide-react';
import { api } from '../api/client';

export function TopRoleBar({ auth, setAuth, onAutocompletarDemo, onRefreshAll }) {
  const [test403Modal, setTest403Modal] = useState(null);
  const [testing403, setTesting403] = useState(false);

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
        titulo: `HTTP 403 Forbidden - Acceso Denegado por RBAC`,
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
        {/* Brand & Context */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-900/40 border border-amber-700/60 flex items-center justify-center p-1.5 shadow-inner">
            <svg viewBox="0 0 64 64" fill="none" className="w-full h-full">
              <path d="M32 6C18 14 10 30 16 48C20 60 30 62 32 62C34 62 44 60 48 48C54 30 46 14 32 6Z" fill="#78350F" stroke="#D97706" strokeWidth="2.5"/>
              <path d="M32 6V62" stroke="#B45309" strokeWidth="2" strokeDasharray="3 3"/>
              <circle cx="32" cy="6" r="3" fill="#15803D"/>
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-amber-400 text-lg tracking-tight">TrazaCao</span>
              <span className="text-xs bg-amber-950 text-amber-300 font-medium px-2 py-0.5 rounded border border-amber-800/80">Huila Agro</span>
              <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                100% Offline (SQLite WAL)
              </span>
            </div>
            <p className="text-[11px] text-stone-400 leading-none">Mesa Nacional de Trazabilidad · NTC 1252 / EUDR</p>
          </div>
        </div>

        {/* Demo Controls & Juror Action Bar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Autocomplete Demo Button */}
          <button
            onClick={onAutocompletarDemo}
            className="flex items-center gap-1.5 text-xs bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-600/50 px-2.5 py-1.5 rounded-md transition-all font-medium cursor-pointer shadow-sm active:scale-95"
            title="Pre-cargar datos oficiales del caso CAC001 (Rivera 100 kg)"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Autocompletar Lote Demo</span>
          </button>

          {/* RBAC Role Selector */}
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

          {/* Test 403 Button (Juror Proof) */}
          <button
            onClick={ejecutarTest403}
            disabled={testing403}
            className="flex items-center gap-1.5 text-xs bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border border-rose-800/60 px-2.5 py-1.5 rounded-md transition-all font-medium cursor-pointer disabled:opacity-50"
            title="Prueba en vivo ante el jurado de rechazo HTTP 403 Forbidden cuando el rol no es Admin"
          >
            <Lock className="w-3.5 h-3.5 text-rose-400" />
            <span>Probar Acceso Denegado (Test 403)</span>
          </button>

          {/* Refresh Data */}
          <button
            onClick={onRefreshAll}
            className="p-1.5 text-stone-400 hover:text-stone-200 bg-stone-900 hover:bg-stone-800 border border-stone-700 rounded-md transition-all cursor-pointer"
            title="Refrescar catálogo y saldos"
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
