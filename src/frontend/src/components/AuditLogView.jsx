import React, { useState, useEffect } from 'react';
import { History, ShieldCheck, Filter, RefreshCw, Lock, AlertCircle } from 'lucide-react';
import { api } from '../api/client';

export function AuditLogView({ auth }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filtroLote, setFiltroLote] = useState('');
  const [filtroAccion, setFiltroAccion] = useState('');

  const esAdmin = auth.role === 'ADMINISTRADOR';

  useEffect(() => {
    if (esAdmin) {
      cargarAuditoria();
    }
  }, [auth.role]);

  const cargarAuditoria = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getAuditoria({
        lote_id: filtroLote.trim() || undefined,
        accion: filtroAccion.trim() || undefined,
      }, auth);
      setLogs(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!esAdmin) {
    return (
      <div className="bg-stone-900 border border-stone-800 rounded-xl p-8 text-center max-w-2xl mx-auto shadow-2xl">
        <div className="w-14 h-14 mx-auto rounded-full bg-rose-950/80 border border-rose-800/80 flex items-center justify-center text-rose-400 mb-4">
          <Lock className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-stone-100">Bitácora Exclusiva para Rol Administrador (RF10)</h2>
        <p className="text-sm text-stone-400 mt-2">
          La consulta del registro inmutable de trazabilidad y auditoría está restringida por políticas RBAC.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-stone-900 border border-stone-800 rounded-xl p-6 shadow-xl space-y-4">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-4 border-b border-stone-800">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-stone-100">Bitácora de Auditoría Inmutable (RF10)</h2>
            <p className="text-xs text-stone-400">Protección estricta con Triggers nativos SQLite (UPDATE y DELETE bloqueados)</p>
          </div>
        </div>

        <button
          onClick={cargarAuditoria}
          className="flex items-center justify-center gap-1.5 text-xs bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-600 px-3 py-1.5 rounded-lg transition-all cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refrescar Bitácora</span>
        </button>
      </div>

      {/* Banner de Garantía de Inmutabilidad */}
      <div className="p-3 bg-emerald-950/30 border border-emerald-800/50 rounded-lg text-xs text-emerald-300 flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
        <span>
          <strong>Garantía Criptográfica & DDL:</strong> Cualquier intento de ejecutar <code>UPDATE</code> o <code>DELETE</code> sobre la tabla <code>audit_logs</code> es abortado por el motor SQLite con <code>RAISE(ABORT)</code>.
        </span>
      </div>

      {error && (
        <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-lg text-rose-200 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Filtros */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        <input
          type="text"
          placeholder="Filtrar por ID de Lote (ej. CAC001)..."
          value={filtroLote}
          onChange={(e) => setFiltroLote(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && cargarAuditoria()}
          className="bg-stone-950 border border-stone-700 rounded-lg px-3 py-1.5 text-xs text-stone-100 font-mono focus:outline-none focus:border-amber-500"
        />

        <input
          type="text"
          placeholder="Filtrar por Acción (ej. CAMBIO_ESTADO, ACCESO_DENEGADO)..."
          value={filtroAccion}
          onChange={(e) => setFiltroAccion(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && cargarAuditoria()}
          className="bg-stone-950 border border-stone-700 rounded-lg px-3 py-1.5 text-xs text-stone-100 font-mono focus:outline-none focus:border-amber-500"
        />
      </div>

      {/* Tabla de Logs */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-stone-300">
          <thead className="bg-stone-950 text-stone-400 font-semibold border-b border-stone-800">
            <tr>
              <th className="py-2.5 px-3">ID</th>
              <th className="py-2.5 px-3">Fecha y Hora</th>
              <th className="py-2.5 px-3">Usuario</th>
              <th className="py-2.5 px-3">Acción</th>
              <th className="py-2.5 px-3">Lote</th>
              <th className="py-2.5 px-3">Valores (Previo / Nuevo)</th>
              <th className="py-2.5 px-3">Motivo / Justificación</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-800/60 font-mono">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-stone-500 font-sans">
                  {loading ? 'Consultando registros de auditoría...' : 'No hay registros que coincidan con la búsqueda.'}
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-stone-800/40 transition-colors">
                  <td className="py-2 px-3 text-stone-500">#{log.id}</td>
                  <td className="py-2 px-3 text-stone-400 font-sans text-[11px] whitespace-nowrap">
                    {new Intl.DateTimeFormat('es-CO', {
                      timeZone: 'America/Bogota',
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    }).format(new Date(log.timestamp.endsWith('Z') ? log.timestamp : log.timestamp + 'Z'))} (COT)
                  </td>
                  <td className="py-2 px-3 font-sans font-medium text-stone-200">
                    {log.usuario}
                  </td>
                  <td className="py-2 px-3">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      log.accion.includes('BLOQUEO') || log.accion.includes('DENEGADO')
                        ? 'bg-rose-950 text-rose-300 border border-rose-800'
                        : log.accion.includes('LIBERADO')
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : 'bg-stone-800 text-stone-300'
                    }`}>
                      {log.accion}
                    </span>
                  </td>
                  <td className="py-2 px-3 font-bold text-amber-300">
                    {log.lote_id}
                  </td>
                  <td className="py-2 px-3 text-[11px]">
                    <span className="text-stone-400">{log.valor_anterior || 'null'}</span>
                    <span className="text-stone-600"> → </span>
                    <span className="text-stone-100 font-bold">{log.valor_nuevo || 'null'}</span>
                  </td>
                  <td className="py-2 px-3 font-sans text-stone-300 text-[11px] max-w-xs truncate" title={log.motivo}>
                    {log.motivo || '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
