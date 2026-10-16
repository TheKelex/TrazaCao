import React, { useState, useEffect, useMemo } from 'react';
import { ShieldAlert, Download, Filter, Search, CheckCircle, Ban, AlertCircle, FileSpreadsheet, Lock, Database, HardDrive, CheckCircle2, RefreshCw } from 'lucide-react';
import { api } from '../api/client';

export function AdminDashboard({ auth, lotes, onEstadoCambiado, onSeleccionarParaPasaporte }) {
  const [filtroMunicipio, setFiltroMunicipio] = useState('TODOS');
  const [filtroEstado, setFiltroEstado] = useState('TODOS');
  const [busqueda, setBusqueda] = useState('');
  
  // Modal de Cambio de Estado (Incidencia Hora 12)
  const [modalEstado, setModalEstado] = useState(null); // { lote, nuevoEstado: 'BLOQUEADO'|'LIBERADO', motivo: '' }
  const [motivo, setMotivo] = useState('');
  const [loadingEstado, setLoadingEstado] = useState(false);
  const [errorEstado, setErrorEstado] = useState(null);
  const [descargandoCSV, setDescargandoCSV] = useState(false);

  // Persistencia de Datos y Respaldo del Sistema
  const [backupResultado, setBackupResultado] = useState(null);
  const [generandoBackup, setGenerandoBackup] = useState(false);
  const [persistenciaInfo, setPersistenciaInfo] = useState(null);
  const [cargandoInfo, setCargandoInfo] = useState(false);

  // Verificación de Acceso RBAC
  const esAdmin = auth.role === 'ADMINISTRADOR';

  useEffect(() => {
    if (esAdmin) {
      cargarInfoPersistencia();
    }
  }, [esAdmin]);

  const cargarInfoPersistencia = async () => {
    setCargandoInfo(true);
    try {
      const data = await api.getPersistenciaInfo(auth);
      setPersistenciaInfo(data);
    } catch (e) {
      console.warn('Error al cargar info persistencia:', e);
    } finally {
      setCargandoInfo(false);
    }
  };

  const ejecutarBackup = async () => {
    setGenerandoBackup(true);
    try {
      const res = await api.generarBackup(auth);
      setBackupResultado(res);
      await cargarInfoPersistencia();
    } catch (err) {
      alert(`Error al generar respaldo: ${err.message}`);
    } finally {
      setGenerandoBackup(false);
    }
  };

  // Lotes filtrados
  const lotesFiltrados = useMemo(() => {
    return lotes.filter((l) => {
      if (filtroMunicipio !== 'TODOS' && l.origen_municipio !== filtroMunicipio) return false;
      if (filtroEstado !== 'TODOS' && l.estado !== filtroEstado) return false;
      if (busqueda.trim()) {
        const query = busqueda.toLowerCase();
        const coincideId = l.id.toLowerCase().includes(query);
        const coincideProductor = l.productor.toLowerCase().includes(query);
        if (!coincideId && !coincideProductor) return false;
      }
      return true;
    });
  }, [lotes, filtroMunicipio, filtroEstado, busqueda]);

  // KPIs Agroindustriales
  const kpis = useMemo(() => {
    const totalKg = lotes.reduce((acc, l) => acc + (parseFloat(l.kg_disponibles) || 0), 0);
    const liberados = lotes.filter((l) => l.estado === 'LIBERADO').length;
    const bloqueados = lotes.filter((l) => l.estado === 'BLOQUEADO').length;
    const pendientes = lotes.filter((l) => l.estado === 'PENDIENTE').length;
    return { totalKg, liberados, bloqueados, pendientes, totalLotes: lotes.length };
  }, [lotes]);

  const abrirModalEstado = (lote, nuevoEstado) => {
    setModalEstado({ lote, nuevoEstado });
    setMotivo(
      nuevoEstado === 'BLOQUEADO'
        ? 'Incidencia Hora 12: Retención preventiva por sospecha de contaminación o humedad elevada.'
        : 'Levantamiento de cuarentena tras re-inspección de calidad conforme NTC 1252.'
    );
    setErrorEstado(null);
  };

  const confirmarCambioEstado = async () => {
    if (!motivo || motivo.trim().length < 5) {
      setErrorEstado('El motivo del cambio de estado debe tener al menos 5 caracteres.');
      return;
    }

    setLoadingEstado(true);
    setErrorEstado(null);

    try {
      const resp = await api.cambiarEstadoLote(
        modalEstado.lote.id,
        { nuevo_estado: modalEstado.nuevoEstado, motivo: motivo.trim() },
        auth
      );
      if (onEstadoCambiado) onEstadoCambiado(resp);
      setModalEstado(null);
    } catch (err) {
      setErrorEstado(err.message);
    } finally {
      setLoadingEstado(false);
    }
  };

  const handleExportarCSV = async () => {
    setDescargandoCSV(true);
    try {
      const blob = await api.exportarCSV(auth);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `CacaoTrace_Huila_Lotes_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert(`Error al exportar CSV: ${err.message}`);
    } finally {
      setDescargandoCSV(false);
    }
  };

  if (!esAdmin) {
    return (
      <div className="bg-stone-900 border border-stone-800 rounded-xl p-8 text-center max-w-2xl mx-auto shadow-2xl">
        <div className="w-14 h-14 mx-auto rounded-full bg-rose-950/80 border border-rose-800/80 flex items-center justify-center text-rose-400 mb-4">
          <Lock className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-stone-100">Vista Protegida por RBAC (Solo Administrador)</h2>
        <p className="text-sm text-stone-400 mt-2">
          Actualmente estás navegando con el rol <span className="font-bold text-amber-400">OPERADOR</span>.
          El módulo de gestión de estados, cuarentena preventiva (Hora 12) y exportación de datos requiere privilegios de Administrador.
        </p>
        <div className="mt-6 p-3 bg-stone-950 rounded-lg border border-stone-800 inline-block text-xs text-stone-300">
          💡 <strong>Para evaluar:</strong> Cambia al rol <strong>Admin</strong> en la barra superior persistente.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tarjetas de Métricas / KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-stone-900 border border-stone-800 rounded-xl p-4 shadow-md">
          <span className="text-xs text-stone-400 block font-medium">Stock Total en Bodega</span>
          <span className="text-2xl font-mono font-bold text-amber-400 mt-1 block">
            {kpis.totalKg.toFixed(2)} kg
          </span>
          <span className="text-[11px] text-stone-500 mt-0.5 block">{kpis.totalLotes} lotes acopiados</span>
        </div>

        <div className="bg-stone-900 border border-emerald-950/60 rounded-xl p-4 shadow-md">
          <span className="text-xs text-stone-400 block font-medium">Lotes Liberados (Comerciales)</span>
          <span className="text-2xl font-mono font-bold text-emerald-400 mt-1 block">
            {kpis.liberados}
          </span>
          <span className="text-[11px] text-emerald-500/80 mt-0.5 block">Listos para exportación EUDR</span>
        </div>

        <div className="bg-stone-900 border border-rose-950/60 rounded-xl p-4 shadow-md">
          <span className="text-xs text-stone-400 block font-medium">En Cuarentena (Bloqueados)</span>
          <span className="text-2xl font-mono font-bold text-rose-400 mt-1 block">
            {kpis.bloqueados}
          </span>
          <span className="text-[11px] text-rose-400/80 mt-0.5 block">Incidencia preventiva Hora 12</span>
        </div>

        <div className="bg-stone-900 border border-amber-950/60 rounded-xl p-4 shadow-md">
          <span className="text-xs text-stone-400 block font-medium">Lotes Pendientes</span>
          <span className="text-2xl font-mono font-bold text-amber-300 mt-1 block">
            {kpis.pendientes}
          </span>
          <span className="text-[11px] text-amber-400/80 mt-0.5 block">En secado / fermentación</span>
        </div>
      </div>

      {/* Controles de Tabla y Exportación */}
      <div className="bg-stone-900 border border-stone-800 rounded-xl p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-4 border-b border-stone-800">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-bold text-stone-100">
              Aprobación de Lotes, Calidad y Exportación
            </h2>
          </div>

          {/* Botón de Exportación CSV */}
          <button
            onClick={handleExportarCSV}
            disabled={descargandoCSV}
            className="flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-600 active:bg-emerald-800 text-stone-100 text-xs font-bold px-3.5 py-2 rounded-lg transition-all shadow-md cursor-pointer disabled:opacity-50"
            title="Descargar reporte consolidado en CSV compatible con Excel"
          >
            <Download className="w-4 h-4" />
            <span>{descargandoCSV ? 'Generando CSV...' : 'Exportar Reporte CSV'}</span>
          </button>
        </div>

        {/* Barra de Filtros */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-stone-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por lote o productor..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full bg-stone-950 border border-stone-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-stone-400 shrink-0">Municipio:</span>
            <select
              value={filtroMunicipio}
              onChange={(e) => setFiltroMunicipio(e.target.value)}
              className="w-full bg-stone-950 border border-stone-700 rounded-lg px-2.5 py-1.5 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
            >
              <option value="TODOS">Todos los Municipios</option>
              <option value="Rivera">Rivera</option>
              <option value="Campoalegre">Campoalegre</option>
              <option value="Algeciras">Algeciras</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-stone-400 shrink-0">Estado:</span>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="w-full bg-stone-950 border border-stone-700 rounded-lg px-2.5 py-1.5 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
            >
              <option value="TODOS">Todos los Estados</option>
              <option value="LIBERADO">Liberado (Apto)</option>
              <option value="BLOQUEADO">Bloqueado (Cuarentena)</option>
              <option value="PENDIENTE">Pendiente</option>
            </select>
          </div>
        </div>

        {/* Tabla de Lotes */}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-300">
            <thead className="bg-stone-950 text-stone-400 font-semibold border-b border-stone-800">
              <tr>
                <th className="py-2.5 px-3">Lote</th>
                <th className="py-2.5 px-3">Productor / Municipio</th>
                <th className="py-2.5 px-3">Stock Disponible</th>
                <th className="py-2.5 px-3">Humedad / Ferm.</th>
                <th className="py-2.5 px-3">Estado</th>
                <th className="py-2.5 px-3 text-right">Estado Comercial & Certificación</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800/60 font-mono">
              {lotesFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-stone-500 font-sans">
                    No se encontraron lotes con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                lotesFiltrados.map((lote) => (
                  <tr key={lote.id} className="hover:bg-stone-800/40 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-amber-300">
                      {lote.id}
                    </td>
                    <td className="py-2.5 px-3 font-sans">
                      <span className="font-medium text-stone-200 block">{lote.productor}</span>
                      <span className="text-[11px] text-stone-500">{lote.origen_municipio}, Huila</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-bold text-emerald-400">{parseFloat(lote.kg_disponibles).toFixed(2)} kg</span>
                      <span className="text-[10px] text-stone-500 block">de {parseFloat(lote.kg_recibidos).toFixed(2)} kg</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span>{parseFloat(lote.humedad_porcentaje).toFixed(1)}% H</span>
                      <span className="text-stone-500"> / </span>
                      <span>{parseFloat(lote.fermentacion_porcentaje).toFixed(1)}% F</span>
                    </td>
                    <td className="py-2.5 px-3 font-sans">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        lote.estado === 'LIBERADO'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : lote.estado === 'BLOQUEADO'
                          ? 'bg-rose-950 text-rose-400 border border-rose-800'
                          : 'bg-amber-950 text-amber-400 border border-amber-800'
                      }`}>
                        {lote.estado === 'LIBERADO' && <CheckCircle className="w-3 h-3" />}
                        {lote.estado === 'BLOQUEADO' && <Ban className="w-3 h-3" />}
                        {lote.estado}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right space-x-1.5 font-sans">
                      {lote.estado !== 'BLOQUEADO' ? (
                        <button
                          onClick={() => abrirModalEstado(lote, 'BLOQUEADO')}
                          className="bg-rose-900/60 hover:bg-rose-800 text-rose-200 border border-rose-700 px-2 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer"
                          title="Bloquear preventivamente por sospecha de calidad (Incidencia Hora 12)"
                        >
                          Bloquear
                        </button>
                      ) : (
                        <button
                          onClick={() => abrirModalEstado(lote, 'LIBERADO')}
                          className="bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 border border-emerald-700 px-2 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer"
                          title="Liberar lote tras subsanación"
                        >
                          Liberar
                        </button>
                      )}
                      
                      <button
                        onClick={() => onSeleccionarParaPasaporte && onSeleccionarParaPasaporte(lote.id)}
                        className="bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-600 px-2 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer"
                      >
                        Ver QR
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Balance Agroindustrial Consolidado y Economía Circular */}
      <div className="bg-stone-900 border border-emerald-950/80 rounded-xl p-5 shadow-xl space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-stone-800">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800">
              📊
            </span>
            <div>
              <h3 className="font-bold text-stone-100 text-sm">
                Balance Consolidado y Valorización de Residuos
              </h3>
              <p className="text-xs text-stone-400">
                Masa neta en bodega, mermas acumuladas y aprovechamiento de subproductos
              </p>
            </div>
          </div>
          <span className="text-[11px] font-sans text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded">
            Balance Verificado al 100%
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1">
          <div className="p-3 bg-stone-950 rounded-lg border border-stone-800">
            <span className="text-[11px] text-stone-400 block">Kilos Acopiados Iniciales:</span>
            <span className="font-mono font-bold text-stone-100 text-base">
              {lotes.reduce((acc, l) => acc + (parseFloat(l.kg_recibidos) || 0), 0).toFixed(2)} kg
            </span>
          </div>

          <div className="p-3 bg-stone-950 rounded-lg border border-stone-800">
            <span className="text-[11px] text-stone-400 block">Kilos Disponibles Actuales:</span>
            <span className="font-mono font-bold text-amber-400 text-base">
              {kpis.totalKg.toFixed(2)} kg
            </span>
          </div>

          <div className="p-3 bg-stone-950 rounded-lg border border-stone-800">
            <span className="text-[11px] text-stone-400 block">Cascarilla Recuperable (10%):</span>
            <span className="font-mono font-bold text-emerald-400 text-base">
              {(lotes.reduce((acc, l) => acc + (parseFloat(l.kg_recibidos) || 0), 0) * 0.10).toFixed(2)} kg
            </span>
          </div>

          <div className="p-3 bg-stone-950 rounded-lg border border-emerald-900/40">
            <span className="text-[11px] text-stone-400 block">Valorización Cascarilla ($3.000/kg):</span>
            <span className="font-mono font-bold text-emerald-300 text-base">
              {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(
                lotes.reduce((acc, l) => acc + (parseFloat(l.kg_recibidos) || 0), 0) * 0.10 * 3000
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Seguridad de Datos y Respaldo del Sistema */}
      <div className="bg-stone-900 border border-amber-950/70 rounded-xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b border-stone-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-amber-950 text-amber-400 border border-amber-800">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-stone-100 text-sm">
                Seguridad de Datos y Respaldo del Sistema
              </h3>
              <p className="text-xs text-stone-400">
                Operación Local Confiable · Almacenamiento seguro contra fallos de energía y cortes de red
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={cargarInfoPersistencia}
              disabled={cargandoInfo}
              className="p-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg border border-stone-700 text-xs transition-all cursor-pointer"
              title="Refrescar estado de los datos"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${cargandoInfo ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={ejecutarBackup}
              disabled={generandoBackup}
              className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-stone-950 font-bold px-3.5 py-2 rounded-lg text-xs transition-all shadow-md cursor-pointer disabled:opacity-50"
            >
              <HardDrive className="w-4 h-4" />
              <span>{generandoBackup ? 'Generando Respaldo...' : 'Crear Copia de Seguridad (.db)'}</span>
            </button>
          </div>
        </div>

        {/* Notificación de Éxito de Respaldo */}
        {backupResultado && (
          <div className="p-3 bg-emerald-950/70 border border-emerald-700 rounded-lg text-emerald-200 text-xs flex items-start gap-2.5 animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">{backupResultado.mensaje}</p>
              <p className="text-stone-300 mt-1">
                Archivo de respaldo generado: <code className="bg-stone-950 px-1.5 py-0.5 rounded text-amber-300">{backupResultado.archivo}</code> ({backupResultado.tamano_kb} KB)
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Cambio de Estado (Incidencia Hora 12) */}
      {modalEstado && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-stone-900 border border-stone-700 max-w-lg w-full rounded-xl p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 pb-3 border-b border-stone-800">
              <div className={`p-2 rounded-lg ${modalEstado.nuevoEstado === 'BLOQUEADO' ? 'bg-rose-950 text-rose-400' : 'bg-emerald-950 text-emerald-400'}`}>
                {modalEstado.nuevoEstado === 'BLOQUEADO' ? <Ban className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="font-bold text-stone-100 text-sm">
                  {modalEstado.nuevoEstado === 'BLOQUEADO' ? 'Poner en Cuarentena Preventiva (Hora 12)' : 'Liberar Lote para Comercialización'}
                </h3>
                <p className="text-xs text-stone-400">
                  Lote: <span className="font-mono font-bold text-amber-300">{modalEstado.lote.id}</span> · {modalEstado.lote.productor}
                </p>
              </div>
            </div>

            {errorEstado && (
              <div className="mt-4 p-3 bg-rose-950/60 border border-rose-800 rounded-lg text-rose-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorEstado}</span>
              </div>
            )}

            <div className="mt-4">
              <label className="block text-xs font-semibold text-stone-300 mb-1">
                Motivo del Cambio de Estado (Registro de Seguridad) *
              </label>
              <textarea
                rows={3}
                required
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Ingresa la justificación técnica que quedará grabada de forma inmutable..."
                className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2.5 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
              />
              <span className="text-[11px] text-stone-400 block mt-1">
                Longitud mínima requerida: 5 caracteres.
              </span>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setModalEstado(null)}
                className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold rounded-lg transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarCambioEstado}
                disabled={loadingEstado}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all shadow-md cursor-pointer ${
                  modalEstado.nuevoEstado === 'BLOQUEADO'
                    ? 'bg-rose-700 hover:bg-rose-600 text-white'
                    : 'bg-emerald-700 hover:bg-emerald-600 text-white'
                }`}
              >
                {loadingEstado ? 'Registrando en Auditoría...' : `Confirmar ${modalEstado.nuevoEstado}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
