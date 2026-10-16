import React, { useState, useEffect } from 'react';
import { PackagePlus, Flame, ShieldAlert, QrCode, History, GitBranch, Compass } from 'lucide-react';
import { api } from './api/client';
import { TopRoleBar } from './components/TopRoleBar';
import { LoginView } from './components/LoginView';
import { RecepcionView } from './components/RecepcionView';
import { TransformacionView } from './components/TransformacionView';
import { TrazabilidadView } from './components/TrazabilidadView';
import { AdminDashboard } from './components/AdminDashboard';
import { PasaportePublico } from './components/PasaportePublico';
import { AuditLogView } from './components/AuditLogView';
import { TrazaCaoLogo } from './components/TrazaCaoLogo';
import { CacaoExperienceLanding } from './components/landing/CacaoExperienceLanding';

export function App() {
  const [auth, setAuth] = useState(() => {
    try {
      const stored = localStorage.getItem('trazacao_auth');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [modoVista, setModoVista] = useState(() => {
    try {
      if (typeof window !== 'undefined') {
        if (window.location.pathname.startsWith('/pasaporte')) {
          return 'comprador';
        }
        if (window.location.pathname.startsWith('/gestion')) {
          return 'gestion';
        }
      }
      const params = new URLSearchParams(window.location.search);
      const modo = params.get('modo');
      if (modo === 'comprador' || modo === 'pasaporte' || params.get('tab') === 'pasaporte') {
        return 'comprador';
      }
      if (modo === 'gestion') {
        return 'gestion';
      }
    } catch {}
    return 'landing'; // 'landing' | 'comprador' | 'gestion'
  });

  const [activeTab, setActiveTab] = useState('recepcion');
  const [lotes, setLotes] = useState([]);
  const [loadingLotes, setLoadingLotes] = useState(false);
  const [lotePasaporteId, setLotePasaporteId] = useState(() => {
    try {
      if (typeof window !== 'undefined') {
        const parts = window.location.pathname.split('/').filter(Boolean);
        if (parts[0] === 'pasaporte' && parts[1]) {
          return parts[1].toUpperCase();
        }
      }
      const params = new URLSearchParams(window.location.search);
      return params.get('lote') || 'CAC001';
    } catch {
      return 'CAC001';
    }
  });

  // Carga inicial y reactiva de lotes
  const fetchLotes = async () => {
    setLoadingLotes(true);
    try {
      const data = await api.getLotes({}, auth || { role: 'OPERADOR', user: 'Invitado' });
      setLotes(data);
    } catch (err) {
      console.error('Error al cargar lotes:', err);
    } finally {
      setLoadingLotes(false);
    }
  };

  useEffect(() => {
    fetchLotes();
  }, [auth?.role]);

  // Aislamiento estricto de rutas: redirigir a recepcion si el operador intenta ver pantallas admin
  useEffect(() => {
    if (auth?.role === 'OPERADOR' && (activeTab === 'admin' || activeTab === 'auditoria')) {
      setActiveTab('recepcion');
    }
  }, [auth?.role, activeTab]);

  // Desplazamiento automático al catálogo si se solicita por parámetro o hash
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('modo') === 'catalogo' || window.location.hash === '#lotes-disponibles') {
        setTimeout(() => {
          const el = document.getElementById('lotes-disponibles');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 350);
      }
    } catch {}
  }, []);

  const handleLoginSuccess = (usuario) => {
    const sesion = {
      role: usuario.rol,
      user: usuario.nombre_completo,
      username: usuario.username,
      id: usuario.id,
    };
    setAuth(sesion);
    try {
      localStorage.setItem('trazacao_auth', JSON.stringify(sesion));
    } catch (e) {
      console.warn('No se pudo guardar la sesión en localStorage:', e);
    }
    setModoVista('gestion');
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem('trazacao_auth');
    } catch (e) {
      console.warn('No se pudo limpiar localStorage:', e);
    }
    setAuth(null);
    setActiveTab('recepcion');
  };

  const handleLoteCreado = async (nuevoLote) => {
    await fetchLotes();
    setLotePasaporteId(nuevoLote.id);
  };

  const handleTransformacionExitosa = async () => {
    await fetchLotes();
  };

  const handleEstadoCambiado = async () => {
    await fetchLotes();
  };

  const handleSeleccionarParaPasaporte = (id) => {
    setLotePasaporteId(id);
    setActiveTab('pasaporte');
  };

  // Definición de pestañas con control estricto de roles permitidos
  const catalogoPestañas = [
    { id: 'recepcion', label: '1. Recepción y Compra', icon: PackagePlus, roles: ['OPERADOR', 'ADMINISTRADOR'] },
    { id: 'transformacion', label: '2. Transformación y Beneficio', icon: Flame, roles: ['OPERADOR', 'ADMINISTRADOR'] },
    { id: 'trazabilidad', label: '3. Cadena de Custodia', icon: GitBranch, roles: ['OPERADOR', 'ADMINISTRADOR'] },
    { id: 'admin', label: '4. Calidad y Administración', icon: ShieldAlert, roles: ['ADMINISTRADOR'] },
    { id: 'pasaporte', label: '5. Pasaporte Digital QR', icon: QrCode, roles: ['OPERADOR', 'ADMINISTRADOR'] },
    { id: 'auditoria', label: '6. Bitácora de Operaciones', icon: History, roles: ['ADMINISTRADOR'] },
  ];

  // Pestañas visibles según el rol autenticado
  const pestañasVisibles = catalogoPestañas.filter(
    (p) => auth && p.roles.includes(auth.role)
  );

  // 1. Si está en modo landing pública
  if (modoVista === 'landing') {
    return (
      <CacaoExperienceLanding
        lotes={lotes}
        onEntrarGestion={() => setModoVista('gestion')}
        onVerPasaporte={(id) => {
          setLotePasaporteId(id);
          setModoVista('comprador');
        }}
      />
    );
  }

  // 2. Si está en modo comprador público (Ficha Comercial & Pasaporte Digital QR sin requerir login)
  if (modoVista === 'comprador') {
    return (
      <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans selection:bg-amber-500 selection:text-stone-950">
        {/* Cabecera del Portal del Comprador */}
        <header className="bg-stone-900 border-b border-stone-800 px-4 py-3 sticky top-0 z-50 shadow-md">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <TrazaCaoLogo variant="dark" size="md" />
              <div className="border-l border-stone-800 pl-3">
                <span className="text-[11px] bg-amber-950 text-amber-300 font-semibold px-2.5 py-1 rounded border border-amber-800">
                  Portal de Compradores B2B
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <a
                href="/landing/"
                className="flex items-center gap-1.5 text-xs bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 px-3 py-1.5 rounded-lg transition-all cursor-pointer shadow-sm"
                title="Conoce nuestra historia y origen"
              >
                <Compass className="w-3.5 h-3.5 text-amber-500" />
                <span className="hidden sm:inline">Sobre nosotros</span>
                <span className="sm:hidden">Nosotros</span>
              </a>

              <button
                onClick={() => setModoVista('landing')}
                className="flex items-center gap-1.5 text-xs bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 px-3 py-1.5 rounded-lg transition-all cursor-pointer shadow-sm"
              >
                <span>Catálogo</span>
              </button>

              <button
                onClick={() => setModoVista('gestion')}
                className="flex items-center gap-1.5 text-xs bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer shadow-sm"
              >
                <span>Acceso Cooperativa</span>
              </button>
            </div>
          </div>
        </header>

        {/* Barra de Selección Rápida de Lotes para el Comprador */}
        <div className="bg-stone-900/80 border-b border-stone-800/80 px-4 py-2 sticky top-[57px] z-40 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 overflow-x-auto text-xs py-0.5">
            <div className="flex items-center gap-2">
              <span className="text-stone-400 font-medium whitespace-nowrap">Lotes Registrados:</span>
              {(lotes && lotes.length > 0 ? lotes : [{ id: 'CAC001' }, { id: 'CAC002' }, { id: 'CAC003' }]).map((l) => {
                const id = typeof l === 'string' ? l : l.id;
                const isSelected = lotePasaporteId === id;
                return (
                  <button
                    key={id}
                    onClick={() => setLotePasaporteId(id)}
                    className={`px-3 py-1 rounded-md font-mono text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      isSelected
                        ? 'bg-amber-600 text-stone-950 shadow-sm ring-1 ring-amber-400'
                        : 'bg-stone-800 text-stone-300 hover:bg-stone-700 border border-stone-700'
                    }`}
                  >
                    {id}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Ficha Pública del Pasaporte */}
        <main className="max-w-7xl mx-auto w-full px-4 py-6 flex-1">
          <PasaportePublico
            loteIdSeleccionado={lotePasaporteId}
            lotes={lotes}
            onSelectLote={(id) => setLotePasaporteId(id)}
          />
        </main>

        <footer className="bg-stone-950 border-t border-stone-800 py-4 px-4 text-xs text-stone-400">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <TrazaCaoLogo variant="isotype" size="sm" />
              <span className="font-bold text-stone-200">TrazaCao Huila</span>
              <span className="text-stone-600">|</span>
              <span className="text-stone-400 text-[11px]">Plataforma de Trazabilidad y Exportación de Cacao Fino de Aroma</span>
            </div>
            <div className="text-[11px] text-stone-400">
              Municipios de Rivera, Campoalegre y Algeciras · Huila, Colombia
            </div>
          </div>
        </footer>
      </div>
    );
  }

  // 3. Si está en modo gestión pero aún no se ha autenticado
  if (!auth) {
    return (
      <LoginView
        onLoginSuccess={handleLoginSuccess}
        onVolverLanding={() => setModoVista('landing')}
      />
    );
  }

  // 3. Consola Operativa para usuarios autenticados
  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans selection:bg-amber-500 selection:text-stone-950">
      {/* Barra Superior con Identidad y Cierre de Sesión */}
      <TopRoleBar
        auth={auth}
        onLogout={handleLogout}
        onRefreshAll={fetchLotes}
        onVolverLanding={() => setModoVista('landing')}
      />

      {/* Navegación por Pestañas Exclusivas para el Rol */}
      <nav className="bg-stone-900 border-b border-stone-800 px-2 sm:px-4 py-2 sticky top-[57px] z-40 backdrop-blur-md bg-stone-900/95">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto py-1">
            {pestañasVisibles.map((p) => {
              const Icon = p.icon;
              const esActiva = activeTab === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setActiveTab(p.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    esActiva
                      ? 'bg-amber-600 text-stone-950 shadow-md font-bold'
                      : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${esActiva ? 'text-stone-950' : 'text-amber-500/80'}`} />
                  <span>{p.label}</span>
                </button>
              );
            })}
          </div>

          <div className="hidden lg:flex items-center gap-2 text-[11px] text-stone-500 font-mono">
            <span>Acceso:</span>
            <span className={auth.role === 'ADMINISTRADOR' ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}>
              {auth.role === 'ADMINISTRADOR' ? 'Control Total (6 Módulos)' : 'Planta y Acopio (4 Módulos)'}
            </span>
          </div>
        </div>
      </nav>

      {/* Contenedor Principal de Vista Aislada */}
      <main className="max-w-7xl mx-auto w-full px-4 py-6 flex-1">
        {activeTab === 'recepcion' && (
          <RecepcionView
            auth={auth}
            lotes={lotes}
            onLoteCreado={handleLoteCreado}
          />
        )}

        {activeTab === 'transformacion' && (
          <TransformacionView
            auth={auth}
            lotes={lotes}
            onTransformacionExitosa={handleTransformacionExitosa}
            defaultLoteId={lotePasaporteId}
          />
        )}

        {activeTab === 'trazabilidad' && (
          <TrazabilidadView
            lotes={lotes}
            defaultLoteId={lotePasaporteId}
            onVerPasaporte={handleSeleccionarParaPasaporte}
          />
        )}

        {/* Pantalla Exclusiva: Calidad y Administración (Solo Administrador) */}
        {activeTab === 'admin' && auth.role === 'ADMINISTRADOR' && (
          <AdminDashboard
            auth={auth}
            lotes={lotes}
            onEstadoCambiado={handleEstadoCambiado}
            onSeleccionarParaPasaporte={handleSeleccionarParaPasaporte}
          />
        )}

        {activeTab === 'pasaporte' && (
          <PasaportePublico
            loteIdSeleccionado={lotePasaporteId}
            lotes={lotes}
          />
        )}

        {/* Pantalla Exclusiva: Bitácora de Operaciones (Solo Administrador) */}
        {activeTab === 'auditoria' && auth.role === 'ADMINISTRADOR' && (
          <AuditLogView auth={auth} />
        )}
      </main>

      {/* Pie de Página Institucional y Comercial */}
      <footer className="bg-stone-950 border-t border-stone-800 py-4 px-4 text-xs text-stone-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <TrazaCaoLogo variant="isotype" size="sm" />
            <span className="font-bold text-stone-200">TrazaCao Huila</span>
            <span className="text-stone-600">|</span>
            <span className="text-stone-400 text-[11px]">Plataforma Integral de Trazabilidad Cacaotera y Denominación de Origen</span>
          </div>
          <div className="text-[11px] text-stone-400 flex items-center gap-3">
            <span>Departamento del Huila, Colombia</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
