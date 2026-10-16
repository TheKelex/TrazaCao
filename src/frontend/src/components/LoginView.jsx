import React, { useState } from 'react';
import { User, Lock, Eye, EyeOff, Loader2, AlertCircle, Compass, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { TrazaCaoLogo } from './TrazaCaoLogo';
import { api } from '../api/client';

export function LoginView({ onLoginSuccess, onVolverLanding }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Por favor ingrese su usuario y contraseña');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.login(username.trim().toLowerCase(), password);
      if (response && response.user) {
        onLoginSuccess(response.user);
      } else {
        throw new Error('Respuesta inválida del servidor');
      }
    } catch (err) {
      console.error('Error de login:', err);
      setError(err.message || 'Usuario o contraseña incorrectos. Verifique sus credenciales.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrellenar = (rolUsuario, passUsuario) => {
    setUsername(rolUsuario);
    setPassword(passUsuario);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col justify-between relative overflow-hidden font-sans selection:bg-amber-500 selection:text-stone-950">
      {/* Fondo con brillo ambiental cálido cacao */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-900/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-emerald-950/20 rounded-full blur-3xl pointer-events-none" />

      {/* Barra superior minimalista */}
      <header className="w-full px-6 py-4 flex items-center justify-between border-b border-stone-800/60 z-10 bg-stone-950/70 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <TrazaCaoLogo variant="dark" size="sm" />
        </div>
        {onVolverLanding && (
          <button
            onClick={onVolverLanding}
            className="flex items-center gap-1.5 text-xs text-stone-300 hover:text-amber-400 bg-stone-900 hover:bg-stone-800 border border-stone-800 px-3 py-1.5 rounded-full transition-all cursor-pointer"
          >
            <Compass className="w-3.5 h-3.5 text-amber-500" />
            <span>Volver a la Experiencia Cacao</span>
          </button>
        )}
      </header>

      {/* Contenedor Central del Formulario */}
      <main className="flex-1 flex items-center justify-center p-4 z-10">
        <div className="w-full max-w-md bg-stone-900/90 border border-stone-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-md relative">
          {/* Encabezado del Formulario */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="mb-3">
              <TrazaCaoLogo variant="dark" size="lg" />
            </div>
            <h1 className="text-xl font-bold text-stone-100 tracking-tight">
              Ingreso a la Consola Operativa
            </h1>
            <p className="text-xs text-stone-400 mt-1">
              Plataforma Integral de Trazabilidad Cacaotera y Denominación de Origen
            </p>
          </div>

          {/* Alerta de Error */}
          {error && (
            <div className="mb-5 p-3 rounded-lg bg-rose-950/80 border border-rose-800/80 text-rose-200 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-semibold block">Acceso Denegado</span>
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Campo Usuario */}
            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                Usuario del Sistema
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="ej: operador o admin"
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck="false"
                  disabled={loading}
                  className="w-full pl-9 pr-3 py-2.5 bg-stone-950 border border-stone-700 rounded-lg text-sm text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all disabled:opacity-50"
                />
              </div>
              <p className="text-[11px] text-stone-400 mt-1">
                Ingrese su nombre de usuario asignado (no correo electrónico).
              </p>
            </div>

            {/* Campo Contraseña */}
            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                  disabled={loading}
                  className="w-full pl-9 pr-10 py-2.5 bg-stone-950 border border-stone-700 rounded-lg text-sm text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-500 hover:text-stone-300 cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Botón de Enviar */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 disabled:bg-amber-900/60 text-stone-950 font-bold text-sm rounded-lg shadow-lg shadow-amber-950/40 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-stone-950" />
                  <span>Verificando Credenciales...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-stone-950" />
                  <span>Iniciar Sesión</span>
                </>
              )}
            </button>
          </form>

          {/* Ayuda Rápida de Credenciales Oficiales para Evaluación */}
          <div className="mt-6 pt-5 border-t border-stone-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
                Credenciales Disponibles por Rol
              </span>
              <span className="text-[10px] bg-stone-800 text-stone-400 px-1.5 py-0.5 rounded">
                Click para autocompletar
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              {/* Opción Operador */}
              <button
                type="button"
                onClick={() => handlePrellenar('operador', 'OperadorCacao2026!')}
                className="p-2.5 rounded-lg bg-stone-950/70 border border-stone-800 hover:border-amber-600/60 text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-400 group-hover:text-amber-300">
                    Operador
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                </div>
                <p className="text-[11px] text-stone-400 font-mono mt-0.5">usuario: operador</p>
                <p className="text-[10px] text-stone-400 mt-1 leading-tight">
                  Acopio, transformación y pasaporte QR.
                </p>
              </button>

              {/* Opción Admin */}
              <button
                type="button"
                onClick={() => handlePrellenar('admin', 'AdminTrazaCao2026!')}
                className="p-2.5 rounded-lg bg-stone-950/70 border border-stone-800 hover:border-emerald-600/60 text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-400 group-hover:text-emerald-300">
                    Administrador
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                </div>
                <p className="text-[11px] text-stone-400 font-mono mt-0.5">usuario: admin</p>
                <p className="text-[10px] text-stone-400 mt-1 leading-tight">
                  Calidad, administración y bitácora de auditoría.
                </p>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Pie de Página */}
      <footer className="w-full py-3 px-4 border-t border-stone-800/60 text-center text-[11px] text-stone-400 bg-stone-950/70">
        <div className="flex items-center justify-center gap-3">
          <span>🔒 Cifrado PBKDF2-HMAC-SHA256</span>
          <span>·</span>
          <span>Control de Acceso RBAC Estricto</span>
          <span>·</span>
          <span>Neiva, Huila (Colombia)</span>
        </div>
      </footer>
    </div>
  );
}
