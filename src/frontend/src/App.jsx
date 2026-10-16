import React, { useState, useEffect } from 'react';
import { PackagePlus, Flame, ShieldAlert, QrCode, History, CheckCircle2, ChevronRight, Cpu, GitBranch } from 'lucide-react';
import { api } from './api/client';
import { TopRoleBar } from './components/TopRoleBar';
import { RecepcionView } from './components/RecepcionView';
import { TransformacionView } from './components/TransformacionView';
import { TrazabilidadView } from './components/TrazabilidadView';
import { AdminDashboard } from './components/AdminDashboard';
import { PasaportePublico } from './components/PasaportePublico';
import { AuditLogView } from './components/AuditLogView';

export function App() {
  const [auth, setAuth] = useState({
    role: 'OPERADOR',
    user: 'Operador Rivera',
  });

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
    { id: 'recepcion', label: '1. Recepción & Acopio', icon: PackagePlus, tag: 'RF01' },
    { id: 'transformacion', label: '2. Transformación & Merma', icon: Flame, tag: 'RF02, RF04' },
    { id: 'trazabilidad', label: '3. Trazabilidad Integral', icon: GitBranch, tag: 'RF03' },
    { id: 'admin', label: '4. Admin & Control Calidad', icon: ShieldAlert, tag: 'RF07, RF09, RF11, RF12' },
    { id: 'pasaporte', label: '5. Pasaporte Digital QR', icon: QrCode, tag: 'RF06' },
    { id: 'auditoria', label: '6. Auditoría Inmutable', icon: History, tag: 'RF10' },
  ];

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans selection:bg-amber-500 selection:text-stone-950">
      {/* Barra Superior con Selector de Rol y Prueba 403 */}
      <TopRoleBar
        auth={auth}
        setAuth={setAuth}
        onAutocompletarDemo={handleAutocompletarDemo}
        onRefreshAll={fetchLotes}
      />

      {/* Navegación por Pestañas */}
      <nav className="bg-stone-900 border-b border-stone-800 px-2 sm:px-4 py-2 sticky top-[57px] z-40 backdrop-blur-md bg-stone-900/95">
        <div className="max-w-7xl mx-auto flex items-center gap-1.5 overflow-x-auto py-1">
          {pestañas.map((p) => {
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
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                  esActiva ? 'bg-stone-950/20 text-stone-950' : 'bg-stone-950 text-stone-400'
                }`}>
                  {p.tag}
                </span>
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

      {/* Pie de Página Institucional */}
      <footer className="bg-stone-950 border-t border-stone-800 py-3.5 px-4 text-xs text-stone-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-stone-300">TrazaCao Huila</span>
            <span>· II Hackathon DEVURITY - USCO</span>
            <span className="text-stone-600">|</span>
            <span className="text-emerald-400 font-mono text-[11px]">Onion Architecture + SQLite WAL</span>
          </div>
          <div className="text-[11px] text-stone-400">
            Mesa Nacional de Trazabilidad · Fórmulas exactas en Decimal Python · Respaldo caliente &lt; 20ms
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
