import React, { useState, useEffect } from 'react';
import { PackagePlus, Flame, ShieldAlert, QrCode, History, CheckCircle2, ChevronRight, Cpu, GitBranch, Compass } from 'lucide-react';
import { api } from './api/client';
import { TopRoleBar } from './components/TopRoleBar';
import { RecepcionView } from './components/RecepcionView';
import { TransformacionView } from './components/TransformacionView';
import { TrazabilidadView } from './components/TrazabilidadView';
import { AdminDashboard } from './components/AdminDashboard';
import { PasaportePublico } from './components/PasaportePublico';
import { AuditLogView } from './components/AuditLogView';
import { TrazaCaoLogo } from './components/TrazaCaoLogo';
import { CacaoExperienceLanding } from './components/landing/CacaoExperienceLanding';

export function App() {
  const [auth, setAuth] = useState({
    role: 'OPERADOR',
    user: 'Operador Rivera',
  });

  const [modoVista, setModoVista] = useState('landing'); // 'landing' | 'gestion'
  const [activeTab, setActiveTab] = useState('recepcion');
  const [lotes, setLotes] = useState([]);
  const [loadingLotes, setLoadingLotes] = useState(false);
  const [lotePasaporteId, setLotePasaporteId] = useState('CAC001');

  // Carga inicial y reactiva de lotes
  const fetchLotes = async () => {
    setLoadingLotes(true);
    try {
      const data = await api.getLotes({}, auth);
      setLotes(data);
    } catch (err) {
      console.error('Error al cargar lotes:', err);
    } finally {
      setLoadingLotes(false);
    }
  };

  useEffect(() => {
    fetchLotes();
  }, [auth.role]);

  // Autocompletar Demo Happy Path (< 120s para el jurado)
  const handleAutocompletarDemo = () => {
    // Si estamos en recepcion, cambia a transformacion con CAC001 listo para ejecutar
    setActiveTab('transformacion');
    setLotePasaporteId('CAC001');
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

  const pestañas = [
    { id: 'recepcion', label: '1. Recepción y Compra', icon: PackagePlus },
    { id: 'transformacion', label: '2. Transformación y Beneficio', icon: Flame },
    { id: 'trazabilidad', label: '3. Cadena de Custodia', icon: GitBranch },
    { id: 'admin', label: '4. Calidad y Administración', icon: ShieldAlert },
    { id: 'pasaporte', label: '5. Pasaporte Digital QR', icon: QrCode },
    { id: 'auditoria', label: '6. Bitácora de Operaciones', icon: History },
  ];

  if (modoVista === 'landing') {
    return (
      <CacaoExperienceLanding
        lotes={lotes}
        onEntrarGestion={() => setModoVista('gestion')}
        onVerPasaporte={(id) => {
          setLotePasaporteId(id);
          setActiveTab('pasaporte');
          setModoVista('gestion');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans selection:bg-amber-500 selection:text-stone-950">
      {/* Barra Superior con Selector de Rol y Conexión */}
      <TopRoleBar
        auth={auth}
        setAuth={setAuth}
        onAutocompletarDemo={handleAutocompletarDemo}
        onRefreshAll={fetchLotes}
        onVolverLanding={() => setModoVista('landing')}
      />

      {/* Navegación por Pestañas Comerciales */}
      <nav className="bg-stone-900 border-b border-stone-800 px-2 sm:px-4 py-2 sticky top-[57px] z-40 backdrop-blur-md bg-stone-900/95">
        <div className="max-w-7xl mx-auto flex items-center gap-1.5 overflow-x-auto py-1">
          {pestañas.map((p) => {
            const Icon = p.icon;
            const esActiva = activeTab === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setActiveTab(p.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
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
      </nav>

      {/* Contenedor Principal de Vista */}
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

        {activeTab === 'admin' && (
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

        {activeTab === 'auditoria' && (
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
            <span className="text-emerald-400/90 font-medium">✓ Cumplimiento Normativo EUDR & NTC 1252</span>
            <span className="text-stone-600">·</span>
            <span>Departamento del Huila, Colombia</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
