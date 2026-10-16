import React, { useState, useEffect } from 'react';
import { 
  Users, UserPlus, Edit3, Ban, CheckCircle, ShieldAlert, 
  Trash2, AlertTriangle, Key, Mail, Phone, FileText, 
  RefreshCw, CheckCircle2, Lock, UserCheck, Search
} from 'lucide-react';
import { api } from '../api/client';

export function OperariosAdminView({ auth }) {
  const [operarios, setOperarios] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const [mensajeExito, setMensajeExito] = useState(null);
  const [busqueda, setBusqueda] = useState('');

  // Modales
  const [modalCrear, setModalCrear] = useState(false);
  const [modalEditar, setModalEditar] = useState(null); // operario a editar
  const [modalVetar, setModalVetar] = useState(null); // operario a vetar/activar
  const [modalProhibicionEliminar, setModalProhibicionEliminar] = useState(null);

  // Formulario Crear
  const [formCrear, setFormCrear] = useState({
    username: '',
    password: '',
    nombre_completo: '',
    cedula: '',
    email: '',
    telefono: '',
    rol: 'OPERADOR',
  });

  // Formulario Editar
  const [formEditar, setFormEditar] = useState({
    nombre_completo: '',
    cedula: '',
    email: '',
    telefono: '',
    password: '',
  });

  // Motivo de veto
  const [motivoVeto, setMotivoVeto] = useState('');
  const [enviando, setEnviando] = useState(false);

  const cargarOperarios = async () => {
    setCargando(true);
    setError(null);
    try {
      const data = await api.getOperarios(auth);
      setOperarios(data);
    } catch (err) {
      setError(err.message || 'Error al cargar lista de operarios');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarOperarios();
  }, []);

  const operariosFiltrados = operarios.filter((op) => {
    if (!busqueda.trim()) return true;
    const q = busqueda.toLowerCase();
    return (
      op.nombre_completo?.toLowerCase().includes(q) ||
      op.username?.toLowerCase().includes(q) ||
      op.cedula?.toLowerCase().includes(q) ||
      op.email?.toLowerCase().includes(q)
    );
  });

  // Crear Operario
  const handleCrearOperario = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      await api.crearOperario(formCrear, auth);
      setMensajeExito(`Operario "${formCrear.nombre_completo}" registrado correctamente.`);
      setModalCrear(false);
      setFormCrear({
        username: '',
        password: '',
        nombre_completo: '',
        cedula: '',
        email: '',
        telefono: '',
        rol: 'OPERADOR',
      });
      await cargarOperarios();
    } catch (err) {
      setError(err.message || 'Error al registrar operario');
    } finally {
      setEnviando(false);
    }
  };

  // Abrir Modal Editar
  const abrirEditar = (op) => {
    setModalEditar(op);
    setFormEditar({
      nombre_completo: op.nombre_completo || '',
      cedula: op.cedula || '',
      email: op.email || '',
      telefono: op.telefono || '',
      password: '',
    });
    setError(null);
  };

  // Guardar Edición
  const handleGuardarEdicion = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      const payload = { ...formEditar };
      if (!payload.password) delete payload.password;

      await api.actualizarOperario(modalEditar.id, payload, auth);
      setMensajeExito(`Datos del operario "${formEditar.nombre_completo}" actualizados correctamente.`);
      setModalEditar(null);
      await cargarOperarios();
    } catch (err) {
      setError(err.message || 'Error al actualizar operario');
    } finally {
      setEnviando(false);
    }
  };

  // Abrir Modal Vetar / Suspender
  const abrirVetar = (op) => {
    setModalVetar(op);
    setMotivoVeto(
      op.activo
        ? 'Suspensión preventiva: Incumplimiento de protocolo técnico de secado o fermentación.'
        : 'Levantamiento de veto: Reincorporación tras capacitación en buenas prácticas de manufactura.'
    );
    setError(null);
  };

  // Ejecutar Veto / Reactivación
  const handleConfirmarVeto = async () => {
    if (!modalVetar) return;
    if (modalVetar.activo && (!motivoVeto || motivoVeto.trim().length < 5)) {
      setError('El motivo del veto o suspensión debe tener al menos 5 caracteres.');
      return;
    }

    setEnviando(true);
    setError(null);
    try {
      const nuevoActivo = !modalVetar.activo;
      await api.cambiarEstadoOperario(
        modalVetar.id,
        { activo: nuevoActivo, motivo: motivoVeto.trim() },
        auth
      );
      setMensajeExito(
        nuevoActivo
          ? `Operario "${modalVetar.nombre_completo}" reactivado exitosamente.`
          : `Operario "${modalVetar.nombre_completo}" vetado/suspendido. No podrá ingresar al sistema.`
      );
      setModalVetar(null);
      await cargarOperarios();
    } catch (err) {
      setError(err.message || 'Error al cambiar estado del operario');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Alerta Fundamental de Inmutabilidad de Trazabilidad */}
      <div className="bg-amber-950/40 border-2 border-amber-600/70 rounded-2xl p-5 flex items-start gap-4 text-xs text-amber-200 shadow-xl">
        <ShieldAlert className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <strong className="text-sm font-bold text-amber-100 block">
            Regla de Inmutabilidad de Trazabilidad (Prohibición Estricta de Eliminación Física)
          </strong>
          <p className="leading-relaxed">
            Como Administrador puedes <strong>registrar nuevos operarios</strong>, <strong>actualizar sus datos</strong> y <strong>vetar/suspender su acceso</strong> si incurren en malas prácticas. Sin embargo, <strong>la eliminación física de operarios está terminantemente bloqueada en la base de datos</strong>: cada lote acopiado, pesaje y transformación histórica conserva la firma inmutable del operario que la ejecutó para garantizar la cadena legal de custodia.
          </p>
        </div>
      </div>

      {/* Mensajes de Estado */}
      {mensajeExito && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-500 rounded-xl text-emerald-200 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{mensajeExito}</span>
          </div>
          <button onClick={() => setMensajeExito(null)} className="text-emerald-400 hover:text-emerald-200 text-xs font-bold">
            ✕
          </button>
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-950/80 border border-rose-500 rounded-xl text-rose-200 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-200 text-xs font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Barra de Herramientas y Acciones */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-stone-950 border border-stone-800 text-amber-500">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-stone-100">
              Personal Operario de Planta y Acopio
            </h2>
            <p className="text-xs text-stone-400">
              Control de acceso RBAC, actualización de perfiles y veto preventivo
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative min-w-[200px]">
            <Search className="w-4 h-4 text-stone-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar operario..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full bg-stone-950 border border-stone-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-stone-200 focus:outline-none focus:border-amber-500"
            />
          </div>

          <button
            onClick={() => setModalCrear(true)}
            className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-stone-950 font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-md cursor-pointer whitespace-nowrap"
          >
            <UserPlus className="w-4 h-4" />
            <span>Nuevo Operario</span>
          </button>

          <button
            onClick={cargarOperarios}
            disabled={cargando}
            className="p-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl border border-stone-700 transition-all cursor-pointer"
            title="Refrescar lista"
          >
            <RefreshCw className={`w-4 h-4 ${cargando ? 'animate-spin text-amber-500' : ''}`} />
          </button>
        </div>
      </div>

      {/* Tabla de Operarios */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-300">
            <thead className="bg-stone-950 text-stone-400 font-semibold border-b border-stone-800">
              <tr>
                <th className="py-3 px-4">Operario / Cédula</th>
                <th className="py-3 px-4">Usuario & Rol</th>
                <th className="py-3 px-4">Contacto (Email / Tel)</th>
                <th className="py-3 px-4">Estado de Acceso</th>
                <th className="py-3 px-4">Fecha Alta</th>
                <th className="py-3 px-4 text-right">Acciones de Gestión</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800">
              {cargando ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-stone-500">
                    Cargando listado de operarios...
                  </td>
                </tr>
              ) : operariosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-stone-500">
                    No se encontraron operarios registrados con los criterios especificados.
                  </td>
                </tr>
              ) : (
                operariosFiltrados.map((op) => (
                  <tr key={op.id} className="hover:bg-stone-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-stone-100">{op.nombre_completo}</div>
                      <div className="text-[11px] font-mono text-stone-500">
                        C.C. {op.cedula || 'Sin cédula'}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-mono text-stone-300">@{op.username}</div>
                      <span className="inline-block mt-0.5 text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-800/60">
                        {op.rol}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="text-stone-300 truncate max-w-[180px]">{op.email || '—'}</div>
                      <div className="text-[11px] font-mono text-stone-500">{op.telefono || '—'}</div>
                    </td>

                    <td className="py-3 px-4">
                      {op.activo ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-700/60">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Activo en Planta</span>
                        </span>
                      ) : (
                        <div>
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-950/90 text-rose-300 border border-rose-700/80">
                            <Ban className="w-3.5 h-3.5 text-rose-400" />
                            <span>Vetado / Suspendido</span>
                          </span>
                          {op.motivo_inactivacion && (
                            <span className="block text-[10px] text-rose-400/80 mt-1 italic truncate max-w-[200px]" title={op.motivo_inactivacion}>
                              "{op.motivo_inactivacion}"
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4 font-mono text-stone-500 text-[11px]">
                      {op.fecha_creacion ? new Date(op.fecha_creacion).toLocaleDateString('es-CO') : 'Histórico'}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Botón Editar */}
                        <button
                          onClick={() => abrirEditar(op)}
                          className="p-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg border border-stone-700 transition-all cursor-pointer"
                          title="Editar información del operario"
                        >
                          <Edit3 className="w-4 h-4 text-amber-400" />
                        </button>

                        {/* Botón Vetar / Activar */}
                        <button
                          onClick={() => abrirVetar(op)}
                          className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                            op.activo
                              ? 'bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border-rose-800/80'
                              : 'bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border-emerald-800/80'
                          }`}
                          title={op.activo ? 'Vetar / Suspender operario' : 'Reactivar operario'}
                        >
                          {op.activo ? <Ban className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                        </button>

                        {/* Botón Eliminar (Dispara modal de prohibición y preservación) */}
                        <button
                          onClick={() => setModalProhibicionEliminar(op)}
                          className="p-1.5 bg-stone-950 text-stone-600 hover:text-stone-400 rounded-lg border border-stone-800 transition-all cursor-pointer"
                          title="Eliminar operario (Bloqueado por trazabilidad)"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: REGISTRAR NUEVO OPERARIO                                         */}
      {/* ========================================================================= */}
      {modalCrear && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border-2 border-amber-600/60 rounded-3xl max-w-lg w-full p-6 text-stone-100 shadow-2xl relative animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-bold text-stone-100 flex items-center gap-2 mb-1">
              <UserPlus className="w-5 h-5 text-amber-500" />
              <span>Registrar Nuevo Operario de Planta</span>
            </h3>
            <p className="text-xs text-stone-400 mb-4">
              Crea las credenciales de acceso para personal de recepción, pesaje y beneficio de cacao.
            </p>

            <form onSubmit={handleCrearOperario} className="space-y-3">
              <div>
                <label className="text-xs text-stone-300 block mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Jorge Ramírez Silva"
                  value={formCrear.nombre_completo}
                  onChange={(e) => setFormCrear({ ...formCrear, nombre_completo: e.target.value })}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-stone-300 block mb-1">Cédula de Ciudadanía *</label>
                  <input
                    type="text"
                    required
                    placeholder="1075234890"
                    value={formCrear.cedula}
                    onChange={(e) => setFormCrear({ ...formCrear, cedula: e.target.value })}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-stone-300 block mb-1">Teléfono / Celular</label>
                  <input
                    type="text"
                    placeholder="312 456 7890"
                    value={formCrear.telefono}
                    onChange={(e) => setFormCrear({ ...formCrear, telefono: e.target.value })}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-stone-300 block mb-1">Nombre de Usuario (@username) *</label>
                  <input
                    type="text"
                    required
                    placeholder="jorge.ramirez"
                    value={formCrear.username}
                    onChange={(e) => setFormCrear({ ...formCrear, username: e.target.value.toLowerCase().trim() })}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-100 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs text-stone-300 block mb-1">Contraseña Inicial *</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={formCrear.password}
                    onChange={(e) => setFormCrear({ ...formCrear, password: e.target.value })}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-stone-300 block mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  placeholder="operario@trazacao.coop"
                  value={formCrear.email}
                  onChange={(e) => setFormCrear({ ...formCrear, email: e.target.value })}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setModalCrear(false)}
                  className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={enviando}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-stone-950 text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  {enviando ? 'Guardando...' : 'Crear Operario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: EDITAR OPERARIO                                                  */}
      {/* ========================================================================= */}
      {modalEditar && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border-2 border-stone-700 rounded-3xl max-w-lg w-full p-6 text-stone-100 shadow-2xl relative animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-bold text-stone-100 flex items-center gap-2 mb-1">
              <Edit3 className="w-5 h-5 text-amber-500" />
              <span>Editar Datos del Operario (@{modalEditar.username})</span>
            </h3>
            <p className="text-xs text-stone-400 mb-4">
              Actualiza la información de contacto o restablece la contraseña.
            </p>

            <form onSubmit={handleGuardarEdicion} className="space-y-3">
              <div>
                <label className="text-xs text-stone-300 block mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  value={formEditar.nombre_completo}
                  onChange={(e) => setFormEditar({ ...formEditar, nombre_completo: e.target.value })}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-stone-300 block mb-1">Cédula</label>
                  <input
                    type="text"
                    value={formEditar.cedula}
                    onChange={(e) => setFormEditar({ ...formEditar, cedula: e.target.value })}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-stone-300 block mb-1">Teléfono</label>
                  <input
                    type="text"
                    value={formEditar.telefono}
                    onChange={(e) => setFormEditar({ ...formEditar, telefono: e.target.value })}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-stone-300 block mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  value={formEditar.email}
                  onChange={(e) => setFormEditar({ ...formEditar, email: e.target.value })}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs text-stone-300 block mb-1">
                  Nueva Contraseña (Opcional - dejar vacío para mantener la actual)
                </label>
                <input
                  type="password"
                  placeholder="Dejar en blanco para no modificar"
                  value={formEditar.password}
                  onChange={(e) => setFormEditar({ ...formEditar, password: e.target.value })}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setModalEditar(null)}
                  className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={enviando}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-stone-950 text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  {enviando ? 'Actualizando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: VETAR / ACTIVAR OPERARIO CON JUSTIFICACIÓN AUDITABLE              */}
      {/* ========================================================================= */}
      {modalVetar && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border-2 border-rose-600/70 rounded-3xl max-w-md w-full p-6 text-stone-100 shadow-2xl relative animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 mb-2">
              <div className={`p-2 rounded-full ${modalVetar.activo ? 'bg-rose-950 text-rose-400' : 'bg-emerald-950 text-emerald-400'}`}>
                {modalVetar.activo ? <Ban className="w-6 h-6" /> : <UserCheck className="w-6 h-6" />}
              </div>
              <div>
                <h3 className="text-base font-bold text-stone-100">
                  {modalVetar.activo ? 'Vetar / Suspender Operario' : 'Reactivar Operario'}
                </h3>
                <span className="text-xs text-stone-400">{modalVetar.nombre_completo} (@{modalVetar.username})</span>
              </div>
            </div>

            <p className="text-xs text-stone-400 my-3 leading-relaxed">
              {modalVetar.activo ? (
                <>
                  Al vetar a este operario, se <strong>bloqueará inmediatamente su inicio de sesión</strong> en el portal de acopio. Sus registros históricos permanecerán intactos e inmutables para fines de auditoría.
                </>
              ) : (
                <>
                  Al reactivar al operario, se restablecerán sus permisos para ingresar a recepción y transformaciones.
                </>
              )}
            </p>

            <div className="space-y-2">
              <label className="text-xs text-stone-300 block font-medium">
                Motivo de la decisión (Auditoría Administrativa):
              </label>
              <textarea
                rows={3}
                required
                value={motivoVeto}
                onChange={(e) => setMotivoVeto(e.target.value)}
                placeholder="Escribe la justificación técnica o administrativa..."
                className="w-full bg-stone-950 border border-stone-700 rounded-xl p-3 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-800 mt-4">
              <button
                type="button"
                onClick={() => setModalVetar(null)}
                className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarVeto}
                disabled={enviando}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50 ${
                  modalVetar.activo
                    ? 'bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white'
                }`}
              >
                {enviando ? 'Procesando...' : (modalVetar.activo ? 'Confirmar Veto' : 'Confirmar Reactivación')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: PROHIBICIÓN DE ELIMINACIÓN FÍSICA (GARANTÍA DE TRAZABILIDAD)      */}
      {/* ========================================================================= */}
      {modalProhibicionEliminar && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border-2 border-amber-500/70 rounded-3xl max-w-md w-full p-6 text-stone-100 shadow-2xl relative animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 bg-amber-950 border border-amber-500/60 rounded-full flex items-center justify-center mx-auto text-amber-400 mb-3">
              <Lock className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-center text-stone-100">
              Acción Prohibida: Preservación de Trazabilidad
            </h3>

            <div className="text-xs text-stone-300 my-4 space-y-2 bg-stone-950 p-4 rounded-xl border border-stone-800 leading-relaxed">
              <p>
                El operario <strong>"{modalProhibicionEliminar.nombre_completo}"</strong> no puede ser eliminado físicamente de la base de datos.
              </p>
              <p className="text-amber-300/90 font-medium">
                ⚖️ <strong>Fundamento Normativo:</strong> Los registros de pesaje de lotes, recepción de cacao y transformaciones en bodega están indexados inmutablemente con el ID de este usuario. Eliminarlo provocaría orfandad en la cadena de custodia y nulidad de la trazabilidad.
              </p>
              <p className="text-stone-400">
                👉 Si este trabajador ya no pertenece a la cooperativa, utiliza la opción <strong>"Vetar / Suspender"</strong> para inhabilitar su acceso.
              </p>
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => setModalProhibicionEliminar(null)}
                className="w-1/2 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold cursor-pointer"
              >
                Entendido, Cerrar
              </button>
              <button
                type="button"
                onClick={() => {
                  const op = modalProhibicionEliminar;
                  setModalProhibicionEliminar(null);
                  abrirVetar(op);
                }}
                className="w-1/2 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all cursor-pointer shadow-md flex items-center justify-center gap-1.5"
              >
                <Ban className="w-4 h-4" />
                <span>Vetar en su Lugar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
