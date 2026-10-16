import React, { useState, useEffect, useMemo } from 'react';
import { 
  Building, ShoppingBag, DollarSign, Scale, Calendar, 
  MapPin, CheckCircle2, Search, RefreshCw, UserCheck, 
  Truck, ArrowUpRight, FileSpreadsheet, ShieldCheck
} from 'lucide-react';
import { api } from '../api/client';

export function VentasCompradoresAdminView({ auth }) {
  const [subTab, setSubTab] = useState('ordenes'); // 'ordenes' | 'compradores'
  const [ordenes, setOrdenes] = useState([]);
  const [compradores, setCompradores] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const [busqueda, setBusqueda] = useState('');

  const cargarDatos = async () => {
    setCargando(true);
    setError(null);
    try {
      const [dataOrdenes, dataCompradores] = await Promise.all([
        api.getVentasAdmin(auth),
        api.getCompradoresAdmin(auth),
      ]);
      setOrdenes(dataOrdenes);
      setCompradores(dataCompradores);
    } catch (err) {
      setError(err.message || 'Error al cargar registros comerciales');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // Métricas Consolidadas
  const metricas = useMemo(() => {
    const totalVendidoCop = ordenes.reduce((acc, o) => acc + (parseFloat(o.total_cop) || 0), 0);
    const totalKgDescontados = ordenes.reduce((acc, o) => acc + (parseFloat(o.kg_comprados) || 0), 0);
    return {
      totalVendidoCop,
      totalKgDescontados,
      totalOrdenes: ordenes.length,
      totalClientes: compradores.length,
    };
  }, [ordenes, compradores]);

  const ordenesFiltradas = ordenes.filter((o) => {
    if (!busqueda.trim()) return true;
    const q = busqueda.toLowerCase();
    return (
      o.codigo_orden?.toLowerCase().includes(q) ||
      o.comprador_nombre?.toLowerCase().includes(q) ||
      o.lote_id?.toLowerCase().includes(q)
    );
  });

  const compradoresFiltrados = compradores.filter((c) => {
    if (!busqueda.trim()) return true;
    const q = busqueda.toLowerCase();
    return (
      c.nombre_empresa?.toLowerCase().includes(q) ||
      c.contacto_nombre?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.nit_rut?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* KPIs de Ventas y Clientes */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 shadow-md">
          <span className="text-xs text-stone-400 block font-medium">Facturación Directa</span>
          <span className="text-xl sm:text-2xl font-mono font-bold text-amber-400 mt-1 block">
            ${metricas.totalVendidoCop.toLocaleString('es-CO')}
          </span>
          <span className="text-[11px] text-stone-500 mt-0.5 block">Ventas efectivas liquidadas</span>
        </div>

        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 shadow-md">
          <span className="text-xs text-stone-400 block font-medium">Volumen Total Vendido</span>
          <span className="text-xl sm:text-2xl font-mono font-bold text-emerald-400 mt-1 block">
            {metricas.totalKgDescontados.toFixed(1)} kg
          </span>
          <span className="text-[11px] text-emerald-500/80 mt-0.5 block">Descontados del stock</span>
        </div>

        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 shadow-md">
          <span className="text-xs text-stone-400 block font-medium">Órdenes Realizadas</span>
          <span className="text-xl sm:text-2xl font-mono font-bold text-stone-100 mt-1 block">
            {metricas.totalOrdenes}
          </span>
          <span className="text-[11px] text-stone-500 mt-0.5 block">Transacciones atómicas</span>
        </div>

        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 shadow-md">
          <span className="text-xs text-stone-400 block font-medium">Clientes Compradores</span>
          <span className="text-xl sm:text-2xl font-mono font-bold text-amber-300 mt-1 block">
            {metricas.totalClientes}
          </span>
          <span className="text-[11px] text-amber-400/80 mt-0.5 block">Empresas registradas en B2B</span>
        </div>
      </div>

      {/* Selector de Sub-pestañas y Buscador */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center bg-stone-950 p-1 rounded-xl border border-stone-800">
          <button
            onClick={() => setSubTab('ordenes')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              subTab === 'ordenes'
                ? 'bg-amber-600 text-stone-950 font-bold shadow'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Órdenes de Venta ({ordenes.length})</span>
          </button>

          <button
            onClick={() => setSubTab('compradores')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              subTab === 'compradores'
                ? 'bg-amber-600 text-stone-950 font-bold shadow'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>Directorio de Clientes ({compradores.length})</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 text-stone-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder={subTab === 'ordenes' ? 'Buscar orden o comprador...' : 'Buscar empresa o NIT...'}
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full bg-stone-950 border border-stone-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-stone-200 focus:outline-none focus:border-amber-500"
            />
          </div>

          <button
            onClick={cargarDatos}
            disabled={cargando}
            className="p-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl border border-stone-700 transition-all cursor-pointer"
            title="Refrescar datos"
          >
            <RefreshCw className={`w-4 h-4 ${cargando ? 'animate-spin text-amber-500' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-950/80 border border-rose-500 rounded-xl text-rose-200 text-xs">
          {error}
        </div>
      )}

      {/* Sub-Pestaña 1: Órdenes de Venta */}
      {subTab === 'ordenes' && (
        <div className="bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-300">
              <thead className="bg-stone-950 text-stone-400 font-semibold border-b border-stone-800">
                <tr>
                  <th className="py-3 px-4">Código Orden</th>
                  <th className="py-3 px-4">Comprador / Empresa</th>
                  <th className="py-3 px-4">Producto / Lote</th>
                  <th className="py-3 px-4">Cantidad (Kg)</th>
                  <th className="py-3 px-4">Total Liquidado</th>
                  <th className="py-3 px-4">Dirección Entrega</th>
                  <th className="py-3 px-4">Fecha y Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800">
                {cargando ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-stone-500">
                      Cargando órdenes de venta...
                    </td>
                  </tr>
                ) : ordenesFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-stone-500">
                      No se registran órdenes de compra directa con los filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  ordenesFiltradas.map((ord) => (
                    <tr key={ord.id} className="hover:bg-stone-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-amber-400">
                        {ord.codigo_orden}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-stone-100">{ord.comprador_nombre || 'Cliente B2B'}</div>
                        <div className="text-[11px] text-stone-500">ID: {ord.comprador_id}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-stone-200 font-bold bg-stone-950 px-2 py-0.5 rounded border border-stone-800">
                          {ord.lote_id || ord.subproducto_id}
                        </span>
                        <span className="block text-[10px] text-stone-400 mt-0.5">
                          {ord.tipo_producto === 'LOTE_CACAO' ? 'Cacao Fino de Aroma' : 'Merma Cascarilla'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                        {parseFloat(ord.kg_comprados).toFixed(1)} kg
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-amber-300">
                        ${parseFloat(ord.total_cop).toLocaleString('es-CO')} COP
                      </td>
                      <td className="py-3 px-4 text-stone-300 max-w-[200px] truncate" title={ord.direccion_entrega}>
                        {ord.direccion_entrega || 'Entrega en Bodega'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-mono text-[11px] text-stone-400">
                          {new Date(ord.fecha_orden).toLocaleDateString('es-CO')}
                        </div>
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-semibold mt-0.5">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>{ord.estado_orden}</span>
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sub-Pestaña 2: Directorio de Clientes Compradores */}
      {subTab === 'compradores' && (
        <div className="bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-300">
              <thead className="bg-stone-950 text-stone-400 font-semibold border-b border-stone-800">
                <tr>
                  <th className="py-3 px-4">Empresa / Razón Social</th>
                  <th className="py-3 px-4">NIT o RUT</th>
                  <th className="py-3 px-4">Contacto Autorizado</th>
                  <th className="py-3 px-4">Correo Corporativo</th>
                  <th className="py-3 px-4">Teléfono</th>
                  <th className="py-3 px-4">Compras Hechas</th>
                  <th className="py-3 px-4">Fecha Registro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800">
                {cargando ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-stone-500">
                      Cargando directorio de clientes...
                    </td>
                  </tr>
                ) : compradoresFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-stone-500">
                      No se encontraron compradores registrados en la base de datos.
                    </td>
                  </tr>
                ) : (
                  compradoresFiltrados.map((comp) => (
                    <tr key={comp.id} className="hover:bg-stone-800/40 transition-colors">
                      <td className="py-3 px-4 font-bold text-stone-100 flex items-center gap-2">
                        <Building className="w-4 h-4 text-[#D4AF37]" />
                        <span>{comp.nombre_empresa}</span>
                      </td>
                      <td className="py-3 px-4 font-mono text-stone-400">
                        {comp.nit_rut || 'Sin NIT'}
                      </td>
                      <td className="py-3 px-4 text-stone-200">
                        {comp.contacto_nombre}
                      </td>
                      <td className="py-3 px-4 text-stone-300">
                        {comp.email}
                      </td>
                      <td className="py-3 px-4 font-mono text-stone-400">
                        {comp.telefono || '—'}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                        {comp.total_compras || 0} órdenes
                      </td>
                      <td className="py-3 px-4 font-mono text-stone-500 text-[11px]">
                        {new Date(comp.fecha_registro).toLocaleDateString('es-CO')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
