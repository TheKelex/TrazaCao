import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, ShoppingCart, ShieldCheck, Award, MapPin, 
  Droplets, Flame, CheckCircle2, AlertOctagon, Sparkles, 
  QrCode, FileText, Check, ChevronRight, User, Building, 
  Phone, Mail, Truck, Hash, Calendar, DollarSign, ExternalLink,
  Info, Leaf, Lock
} from 'lucide-react';
import { api } from '../api/client';

export function ProductoDetalleEcommerce({ 
  producto, 
  tipo = 'lote', // 'lote' | 'subproducto'
  compradorAuth, 
  onCompradorLogin, 
  onVolver, 
  onVerPasaporte,
  onActualizarStock
}) {
  if (!producto) return null;

  const esLote = tipo === 'lote' || !!producto.productor;
  const precioUnitario = esLote 
    ? 25000 
    : parseFloat(producto.precio_b2b_kg_cop || 15000);

  const stockDisponibleInicial = parseFloat(producto.kg_disponibles || producto.kg_recibidos || 0);
  const [stockDisponible, setStockDisponible] = useState(stockDisponibleInicial);
  const esBloqueado = esLote && producto.estado === 'BLOQUEADO';

  // Galería de fotos dinámica según el producto
  const imagenesGaleria = useMemo(() => {
    if (esLote) {
      return [
        producto.imagen || '/images/producto.jpg',
        '/images/cacao-granos-tostados.jpg',
        '/images/cacao-fermentacion-cajones.jpg',
        '/images/recoleccion.jpg',
        '/images/cultivo.jpg',
      ];
    } else {
      return [
        '/images/cacao-granos-tostados.jpg',
        '/images/producto.jpg',
        '/images/secado.jpg',
        '/images/cacao-chocolate-artesanal.jpg',
      ];
    }
  }, [esLote, producto]);

  const [imagenActiva, setImagenActiva] = useState(imagenesGaleria[0]);
  const [cantidadKg, setCantidadKg] = useState(() => {
    if (stockDisponible <= 0) return 0;
    return Math.min(10, stockDisponible);
  });

  // Modales de Checkout y Auth
  const [modalCheckout, setModalCheckout] = useState(false);
  const [tabAuthModal, setTabAuthModal] = useState('login'); // 'login' | 'registro'
  const [comprando, setComprando] = useState(false);
  const [ordenExitosa, setOrdenExitosa] = useState(null);
  const [errorCompra, setErrorCompra] = useState(null);

  // Formulario de Checkout
  const [direccionEntrega, setDireccionEntrega] = useState('Calle Principal Bodega Comercial, Huila');
  const [notasEntrega, setNotasEntrega] = useState('Embalaje en sacos con precinto de seguridad');

  // Formulario rápido de autenticación de comprador
  const [formLogin, setFormLogin] = useState({ email: '', password: '' });
  const [formRegistro, setFormRegistro] = useState({
    nombre_empresa: '',
    contacto_nombre: '',
    email: '',
    telefono: '',
    nit_rut: '',
    password: '',
  });
  const [loadingAuth, setLoadingAuth] = useState(false);
  const [errorAuth, setErrorAuth] = useState(null);

  // Cálculo de subtotales
  const totalPagar = useMemo(() => {
    return Math.round(cantidadKg * precioUnitario);
  }, [cantidadKg, precioUnitario]);

  const handleIncrementar = (delta) => {
    setCantidadKg((prev) => {
      const nuevo = Math.max(1, Math.min(stockDisponible, Math.round((prev + delta) * 10) / 10));
      return nuevo;
    });
  };

  const handleSetStockCompleto = () => {
    setCantidadKg(stockDisponible);
  };

  // Manejo de Login de Comprador
  const handleEjecutarLogin = async (e) => {
    e.preventDefault();
    setLoadingAuth(true);
    setErrorAuth(null);
    try {
      const res = await api.loginComprador(formLogin);
      if (onCompradorLogin) {
        onCompradorLogin(res.comprador);
      }
    } catch (err) {
      setErrorAuth(err.message || 'Error al iniciar sesión de comprador');
    } finally {
      setLoadingAuth(false);
    }
  };

  // Manejo de Registro de Comprador
  const handleEjecutarRegistro = async (e) => {
    e.preventDefault();
    setLoadingAuth(true);
    setErrorAuth(null);
    try {
      const res = await api.registroComprador(formRegistro);
      if (onCompradorLogin) {
        onCompradorLogin(res.comprador);
      }
    } catch (err) {
      setErrorAuth(err.message || 'Error al registrarse como comprador');
    } finally {
      setLoadingAuth(false);
    }
  };

  // Ejecución de la Compra Directa Atómica
  const handleConfirmarCompra = async () => {
    if (!compradorAuth?.id) {
      setErrorCompra('Debes iniciar sesión o registrarte como comprador antes de finalizar.');
      return;
    }

    if (cantidadKg <= 0 || cantidadKg > stockDisponible) {
      setErrorCompra(`La cantidad debe estar entre 1 y ${stockDisponible} kg.`);
      return;
    }

    setComprando(true);
    setErrorCompra(null);

    try {
      const payload = {
        comprador_id: compradorAuth.id,
        tipo_producto: esLote ? 'LOTE_CACAO' : 'MERMA_SUBPRODUCTO',
        lote_id: esLote ? producto.id : (producto.lote_origen_id || 'CAC001'),
        subproducto_id: esLote ? null : producto.id,
        kg_comprados: cantidadKg,
        direccion_entrega: direccionEntrega,
        notas: notasEntrega,
      };

      const resultado = await api.comprarDirecto(payload);
      setOrdenExitosa(resultado.orden);
      
      // Actualizar el stock disponible localmente
      const nuevoStock = resultado.stock_restante_kg;
      setStockDisponible(nuevoStock);
      setCantidadKg(Math.min(10, nuevoStock));

      if (onActualizarStock) {
        onActualizarStock(producto.id, nuevoStock);
      }
    } catch (err) {
      setErrorCompra(err.message || 'Ocurrió un error al procesar la compra.');
    } finally {
      setComprando(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#120F0D] text-[#FAF7F0] font-sans pb-20 selection:bg-[#D4AF37] selection:text-[#16120E]">
      {/* Barra de Navegación Superior */}
      <div className="bg-[#1C1712]/90 border-b border-[#3C2418] px-4 py-3 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <button
            onClick={onVolver}
            className="flex items-center gap-2 text-xs font-semibold text-[#E9DCC5]/80 hover:text-[#D4AF37] transition-all cursor-pointer bg-[#FAF7F0]/5 px-3 py-1.5 rounded-lg border border-[#FAF7F0]/10 hover:border-[#D4AF37]/50"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver al Catálogo</span>
          </button>

          <div className="flex items-center gap-3">
            {compradorAuth ? (
              <div className="flex items-center gap-2 bg-[#234737]/60 border border-[#D4AF37]/40 px-3 py-1 rounded-full text-xs">
                <Building className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span className="font-semibold text-[#FAF7F0]">{compradorAuth.nombre_empresa}</span>
                <span className="text-[10px] text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-600/40">
                  Comprador Activo
                </span>
              </div>
            ) : (
              <button
                onClick={() => { setTabAuthModal('login'); setModalCheckout(true); }}
                className="flex items-center gap-1.5 text-xs font-bold bg-[#D4AF37] hover:bg-[#c29d2b] text-[#16120E] px-3.5 py-1.5 rounded-lg transition-all cursor-pointer shadow-md"
              >
                <User className="w-3.5 h-3.5" />
                <span>Ingreso Comprador B2B</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Banner de Retención Si el lote está bloqueado */}
        {esBloqueado && (
          <div className="mb-6 bg-rose-950/80 border-2 border-rose-500 rounded-2xl p-4 flex items-center gap-3 text-rose-200 text-xs">
            <AlertOctagon className="w-6 h-6 text-rose-400 shrink-0" />
            <div>
              <strong className="block text-sm text-rose-100 font-bold">Lote en Cuarentena Preventiva (Incidencia Técnica Hora 12)</strong>
              <span>Este lote se encuentra retenido para re-inspección fisicoquímica y microbiológica. La compra directa está deshabilitada temporalmente para proteger los estándares de exportación.</span>
            </div>
          </div>
        )}

        {/* Panel Superior: Layout E-Commerce 2 Columnas (Galería + Checkout) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Columna Izquierda: Galería Multimodal */}
          <div className="lg:col-span-7 space-y-4">
            <div className="relative aspect-4/3 rounded-3xl overflow-hidden bg-[#1C1712] border-2 border-[#D4AF37]/30 shadow-2xl group">
              <img
                src={imagenActiva}
                alt={producto.nombre || producto.id}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />

              {/* Badges superpuestos */}
              <div className="absolute top-4 left-4 flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-bold bg-[#16120E]/90 text-[#D4AF37] px-3 py-1.5 rounded-full border border-[#D4AF37]/40 shadow-lg backdrop-blur-md">
                  {producto.id}
                </span>
                <span className="text-xs font-medium bg-[#234737]/90 text-[#FAF7F0] px-3 py-1.5 rounded-full border border-white/20 flex items-center gap-1.5 shadow-lg backdrop-blur-md">
                  <MapPin className="w-3.5 h-3.5 text-[#D4AF37]" />
                  {producto.origen_municipio || producto.municipio_origen || 'Rivera'}, Huila
                </span>
              </div>

              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-950/90 text-emerald-300 border border-emerald-500/50 flex items-center gap-1.5 shadow">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>{esLote ? 'Denominación de Origen Huila' : 'Merma 100% Pura Sin Tratar'}</span>
                  </span>
                </div>
                <span className="font-mono text-xs bg-[#16120E]/90 text-[#E9DCC5] px-3 py-1 rounded-full border border-stone-700">
                  Stock: <strong className="text-emerald-400 font-bold">{stockDisponible.toFixed(1)} kg</strong>
                </span>
              </div>
            </div>

            {/* Miniaturas de la Galería */}
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {imagenesGaleria.map((img, idx) => {
                const esSeleccionada = imagenActiva === img;
                return (
                  <button
                    key={idx}
                    onClick={() => setImagenActiva(img)}
                    className={`relative w-20 h-20 rounded-2xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                      esSeleccionada
                        ? 'border-[#D4AF37] ring-2 ring-[#D4AF37]/50 scale-105'
                        : 'border-[#3C2418] opacity-60 hover:opacity-100 hover:border-[#D4AF37]/60'
                    }`}
                  >
                    <img src={img} alt={`Vista ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                );
              })}
            </div>

            {/* Ficha Técnica Rápida en Bloque */}
            <div className="bg-[#1C1712] border border-[#3C2418] rounded-2xl p-5 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="p-3 bg-[#FAF7F0]/5 rounded-xl border border-white/5">
                <span className="text-stone-400 block text-[10px] uppercase font-bold">Variedad Botánica</span>
                <span className="font-bold text-[#FAF7F0] mt-0.5 block truncate">
                  {producto.variedad || 'Trinitario Huilense'}
                </span>
              </div>
              <div className="p-3 bg-[#FAF7F0]/5 rounded-xl border border-white/5">
                <span className="text-stone-400 block text-[10px] uppercase font-bold">Humedad Medida</span>
                <span className="font-mono font-bold text-amber-300 mt-0.5 block">
                  {parseFloat(producto.humedad_porcentaje || 6.8).toFixed(1)}% (NTC 1252)
                </span>
              </div>
              <div className="p-3 bg-[#FAF7F0]/5 rounded-xl border border-white/5">
                <span className="text-stone-400 block text-[10px] uppercase font-bold">Fermentación</span>
                <span className="font-mono font-bold text-emerald-400 mt-0.5 block">
                  {parseFloat(producto.fermentacion_porcentaje || 82.5).toFixed(1)}%
                </span>
              </div>
              <div className="p-3 bg-[#FAF7F0]/5 rounded-xl border border-white/5">
                <span className="text-stone-400 block text-[10px] uppercase font-bold">Disponibilidad</span>
                <span className="font-mono font-bold text-emerald-300 mt-0.5 block">
                  {stockDisponible > 0 ? `${stockDisponible.toFixed(1)} kg` : 'Agotado'}
                </span>
              </div>
            </div>
          </div>

          {/* Columna Derecha: Panel de Compra Directa Inmediata */}
          <div className="lg:col-span-5 bg-[#1C1712] border-2 border-[#D4AF37]/40 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-6">
            
            {/* Cabecera del Producto */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40 uppercase tracking-wider">
                  {esLote ? 'Cacao Fino de Aroma' : 'Subproducto Valorizado B2B'}
                </span>
                <span className="text-[11px] text-stone-400 font-mono">
                  Lote: {producto.id}
                </span>
              </div>

              <h1 className="font-serif-editorial text-2xl sm:text-3xl font-bold text-[#FAF7F0] leading-tight">
                {producto.nombre || (esLote ? `${producto.productor || 'Cacaocultor Asociado'} - ${producto.finca || 'Finca Villa Esperanza'}` : 'Cascarilla Tostada de Cacao')}
              </h1>

              <p className="text-xs text-[#E9DCC5]/70 mt-2 font-light leading-relaxed">
                {producto.notas || 'Granos seleccionados a mano con notas a panela, frutos rojos y acidez noble de la cordillera del Huila.'}
              </p>
            </div>

            {/* Caja de Precio Fijo Oficial */}
            <div className="bg-[#120F0D] border border-[#3C2418] rounded-2xl p-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase text-stone-400 block">
                  Precio Oficial por Kilo (COP)
                </span>
                <span className="font-mono text-2xl font-bold text-[#D4AF37]">
                  ${precioUnitario.toLocaleString('es-CO')}
                </span>
                <span className="text-[11px] text-stone-500 block">Pesos Colombianos / kg neto</span>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-mono uppercase text-stone-400 block">
                  Stock Atómico
                </span>
                <span className={`font-mono text-lg font-bold ${stockDisponible > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {stockDisponible.toFixed(1)} kg
                </span>
                <span className="text-[10px] text-stone-500 block">Descuento en tiempo real</span>
              </div>
            </div>

            {/* Selector de Cantidad en Kg */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[#E9DCC5] flex items-center gap-1.5">
                  <ShoppingCart className="w-4 h-4 text-[#D4AF37]" />
                  <span>Cantidad a Comprar (Kilogramos):</span>
                </label>
                <span className="text-[11px] text-stone-400 font-mono">
                  Máximo: {stockDisponible.toFixed(1)} kg
                </span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleIncrementar(-5)}
                  disabled={cantidadKg <= 1 || stockDisponible <= 0 || esBloqueado}
                  className="w-10 h-10 rounded-xl bg-stone-800 hover:bg-stone-700 active:bg-stone-900 text-stone-200 font-bold text-base transition-all disabled:opacity-40 cursor-pointer"
                >
                  -
                </button>

                <div className="relative flex-1">
                  <input
                    type="number"
                    min="1"
                    max={stockDisponible}
                    step="0.5"
                    value={cantidadKg}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setCantidadKg(Math.max(0, Math.min(stockDisponible, val)));
                    }}
                    disabled={stockDisponible <= 0 || esBloqueado}
                    className="w-full bg-[#120F0D] border-2 border-[#3C2418] focus:border-[#D4AF37] rounded-xl py-2 px-3 text-center font-mono text-lg font-bold text-[#FAF7F0] focus:outline-none"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-stone-400 font-mono font-bold">
                    kg
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleIncrementar(5)}
                  disabled={cantidadKg >= stockDisponible || stockDisponible <= 0 || esBloqueado}
                  className="w-10 h-10 rounded-xl bg-stone-800 hover:bg-stone-700 active:bg-stone-900 text-stone-200 font-bold text-base transition-all disabled:opacity-40 cursor-pointer"
                >
                  +
                </button>
              </div>

              {/* Atajos Rápidos de Selección */}
              <div className="flex items-center gap-2 pt-1">
                {[5, 10, 25, 50].map((kg) => (
                  <button
                    key={kg}
                    type="button"
                    onClick={() => setCantidadKg(Math.min(stockDisponible, kg))}
                    disabled={stockDisponible < kg || esBloqueado}
                    className="flex-1 py-1 px-2 rounded-lg text-[11px] font-mono font-semibold bg-[#FAF7F0]/5 hover:bg-[#FAF7F0]/10 text-[#E9DCC5] border border-white/10 transition-all disabled:opacity-30 cursor-pointer"
                  >
                    +{kg} kg
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleSetStockCompleto}
                  disabled={stockDisponible <= 0 || esBloqueado}
                  className="py-1 px-2.5 rounded-lg text-[11px] font-mono font-bold bg-[#D4AF37]/20 hover:bg-[#D4AF37]/30 text-[#D4AF37] border border-[#D4AF37]/50 transition-all disabled:opacity-30 cursor-pointer whitespace-nowrap"
                >
                  Todo ({stockDisponible.toFixed(0)} kg)
                </button>
              </div>
            </div>

            {/* Resumen Financiero de la Orden Directa */}
            <div className="bg-[#120F0D] rounded-2xl p-4 border border-[#3C2418] space-y-2 text-xs">
              <div className="flex justify-between text-stone-400">
                <span>Subtotal ({cantidadKg} kg x ${precioUnitario.toLocaleString('es-CO')}):</span>
                <span className="font-mono text-[#FAF7F0]">${totalPagar.toLocaleString('es-CO')} COP</span>
              </div>
              <div className="flex justify-between text-stone-400">
                <span>Certificado de Origen & Trazabilidad NTC:</span>
                <span className="text-emerald-400 font-semibold">Incluido ($0)</span>
              </div>
              <div className="pt-2 border-t border-stone-800 flex justify-between items-baseline">
                <span className="text-sm font-bold text-[#FAF7F0]">Total Inmediato:</span>
                <span className="font-mono text-2xl font-extrabold text-[#D4AF37]">
                  ${totalPagar.toLocaleString('es-CO')} <span className="text-xs font-normal text-stone-400">COP</span>
                </span>
              </div>
            </div>

            {/* Botón Principal: Compra Directa Inmediata */}
            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setErrorCompra(null);
                  setModalCheckout(true);
                }}
                disabled={stockDisponible <= 0 || cantidadKg <= 0 || esBloqueado}
                className="w-full py-4 px-6 rounded-2xl bg-[#D4AF37] hover:bg-[#c29d2b] active:bg-[#a6841e] text-[#16120E] font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 transition-all shadow-xl cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed group"
              >
                <ShoppingCart className="w-5 h-5 text-[#16120E]" />
                <span>Comprar de Una (${totalPagar.toLocaleString('es-CO')} COP)</span>
                <ChevronRight className="w-4 h-4 ml-auto group-hover:translate-x-1 transition-transform" />
              </button>

              <div className="flex items-center justify-center gap-2 text-[11px] text-stone-400">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Descuento de inventario atómico con bloqueo de concurrencia</span>
              </div>
            </div>

            {/* Enlace alternativo a pasaporte digital */}
            {esLote && (
              <div className="pt-2 border-t border-[#3C2418]/60">
                <button
                  type="button"
                  onClick={() => onVerPasaporte && onVerPasaporte(producto.id)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-700 text-xs font-semibold transition-all cursor-pointer"
                >
                  <QrCode className="w-4 h-4 text-[#D4AF37]" />
                  <span>Ver Ficha Técnica Oficial y Pasaporte Digital QR</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECCIÓN "SU TRAZA": LÍNEA DE TIEMPO INTERACTIVA DEL CACAO                  */}
        {/* ========================================================================= */}
        <div className="mt-16 bg-[#1C1712] border border-[#3C2418] rounded-3xl p-6 sm:p-10 shadow-2xl space-y-8">
          <div className="max-w-3xl space-y-2">
            <span className="font-mono text-xs uppercase tracking-widest text-[#D4AF37] block">
              Transparencia Absoluta de la Cadena de Valor
            </span>
            <h2 className="font-serif-editorial text-3xl sm:text-4xl font-bold text-[#FAF7F0]">
              Su Traza: De la Mazorca a la Entrega Comercial
            </h2>
            <p className="text-sm text-[#E9DCC5]/80 font-light">
              Cada kilogramo de este producto cuenta con un historial digital verificable y registros fisicoquímicos inmutables que respaldan su pureza y denominación de origen en el Huila.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-4">
            
            {/* Etapa 1: Origen en Finca */}
            <div className="bg-[#120F0D] border border-[#3C2418] rounded-2xl p-5 relative overflow-hidden group hover:border-[#D4AF37]/50 transition-all">
              <div className="w-8 h-8 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] font-mono font-bold text-xs flex items-center justify-center mb-3">
                1
              </div>
              <h3 className="font-bold text-sm text-[#FAF7F0] flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#D4AF37]" />
                <span>Cosecha en Finca</span>
              </h3>
              <p className="text-xs text-stone-400 mt-2 leading-relaxed">
                {producto.productor || 'Cacaocultor regional'} en {producto.finca || 'Finca Villa Esperanza'}, {producto.origen_municipio || 'Rivera'}, Huila. Cosecha selectiva de mazorcas maduras.
              </p>
              <div className="mt-3 pt-3 border-t border-stone-800 text-[11px] font-mono text-stone-500">
                Altitud: 720 - 950 msnm
              </div>
            </div>

            {/* Etapa 2: Acopio y Calidad NTC 1252 */}
            <div className="bg-[#120F0D] border border-[#3C2418] rounded-2xl p-5 relative overflow-hidden group hover:border-[#D4AF37]/50 transition-all">
              <div className="w-8 h-8 rounded-full bg-[#234737] text-emerald-400 font-mono font-bold text-xs flex items-center justify-center mb-3">
                2
              </div>
              <h3 className="font-bold text-sm text-[#FAF7F0] flex items-center gap-1.5">
                <Droplets className="w-4 h-4 text-emerald-400" />
                <span>Control de Entrada</span>
              </h3>
              <p className="text-xs text-stone-400 mt-2 leading-relaxed">
                Prueba de corte y guillotina conforme Norma Técnica Colombiana NTC 1252. Humedad verificada: {producto.humedad_porcentaje || '6.8'}%.
              </p>
              <div className="mt-3 pt-3 border-t border-stone-800 text-[11px] font-mono text-emerald-400">
                Criterio NTC 1252: Aprobado
              </div>
            </div>

            {/* Etapa 3: Beneficio y Fermentación */}
            <div className="bg-[#120F0D] border border-[#3C2418] rounded-2xl p-5 relative overflow-hidden group hover:border-[#D4AF37]/50 transition-all">
              <div className="w-8 h-8 rounded-full bg-amber-950 text-amber-400 font-mono font-bold text-xs flex items-center justify-center mb-3">
                3
              </div>
              <h3 className="font-bold text-sm text-[#FAF7F0] flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-amber-400" />
                <span>Fermentación Noble</span>
              </h3>
              <p className="text-xs text-stone-400 mt-2 leading-relaxed">
                Fermentación escalonada en cajones de madera regional durante 6-7 días. Tasa alcanzada: {producto.fermentacion_porcentaje || '82.5'}%.
              </p>
              <div className="mt-3 pt-3 border-t border-stone-800 text-[11px] font-mono text-amber-300">
                Secado solar en paseras
              </div>
            </div>

            {/* Etapa 4: Custodia & Venta Directa */}
            <div className="bg-[#120F0D] border border-[#3C2418] rounded-2xl p-5 relative overflow-hidden group hover:border-[#D4AF37]/50 transition-all">
              <div className="w-8 h-8 rounded-full bg-stone-800 text-stone-200 font-mono font-bold text-xs flex items-center justify-center mb-3">
                4
              </div>
              <h3 className="font-bold text-sm text-[#FAF7F0] flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-[#D4AF37]" />
                <span>Bodega & Despacho</span>
              </h3>
              <p className="text-xs text-stone-400 mt-2 leading-relaxed">
                Almacenamiento en sacos de fique transpirables bajo humedad y temperatura controladas en la sede de la cooperativa.
              </p>
              <div className="mt-3 pt-3 border-t border-stone-800 text-[11px] font-mono text-stone-400">
                Trazabilidad 100% Inmutable
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL DE CHECKOUT Y AUTENTICACIÓN RÁPIDA DE COMPRADOR                      */}
      {/* ========================================================================= */}
      {modalCheckout && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#1C1712] border-2 border-[#D4AF37]/60 rounded-3xl max-w-xl w-full p-6 sm:p-8 text-[#FAF7F0] shadow-2xl relative my-8 animate-in fade-in zoom-in-95 duration-200">
            
            {/* Si ya se completó la orden con éxito */}
            {ordenExitosa ? (
              <div className="text-center py-4 space-y-5">
                <div className="w-16 h-16 bg-emerald-950 border-2 border-emerald-500 rounded-full flex items-center justify-center mx-auto text-emerald-400 shadow-xl">
                  <Check className="w-8 h-8" />
                </div>

                <div className="space-y-1">
                  <span className="font-mono text-xs uppercase tracking-widest text-[#D4AF37] block">
                    ¡Venta Efectiva Registrada!
                  </span>
                  <h3 className="font-serif-editorial text-2xl sm:text-3xl font-bold text-[#FAF7F0]">
                    Orden de Compra Confirmada
                  </h3>
                  <p className="text-xs text-[#E9DCC5]/80">
                    El inventario fue descontado atómicamente de forma exitosa en el sistema de acopio.
                  </p>
                </div>

                {/* Recibo Oficial de la Compra */}
                <div className="bg-[#120F0D] border border-[#3C2418] rounded-2xl p-5 text-left text-xs font-mono space-y-2.5">
                  <div className="flex justify-between border-b border-stone-800 pb-2">
                    <span className="text-stone-400">Número de Orden:</span>
                    <span className="font-bold text-[#D4AF37]">{ordenExitosa.codigo_orden}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-400">Comprador:</span>
                    <span className="text-stone-200">{compradorAuth?.nombre_empresa || 'Empresa Compradora'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-400">Producto / Lote:</span>
                    <span className="text-stone-200">{producto.id} ({esLote ? 'Grano Fino' : 'Merma Cascarilla'})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-400">Volumen Descontado:</span>
                    <span className="font-bold text-emerald-400">{ordenExitosa.kg_comprados} kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-400">Total Liquidado:</span>
                    <span className="font-bold text-[#D4AF37]">${parseFloat(ordenExitosa.total_cop).toLocaleString('es-CO')} COP</span>
                  </div>
                  <div className="flex justify-between border-t border-stone-800 pt-2">
                    <span className="text-stone-400">Dirección Despacho:</span>
                    <span className="text-stone-300 text-right truncate max-w-[220px]">{ordenExitosa.direccion_entrega}</span>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-center gap-3">
                  <button
                    onClick={() => {
                      setModalCheckout(false);
                      setOrdenExitosa(null);
                    }}
                    className="w-full py-3 px-6 rounded-xl bg-[#D4AF37] hover:bg-[#c29d2b] text-[#16120E] font-bold text-xs transition-all cursor-pointer shadow-md"
                  >
                    Cerrar y Continuar en el Catálogo
                  </button>
                </div>
              </div>
            ) : !compradorAuth ? (
              /* Si el comprador aún no ha iniciado sesión */
              <div className="space-y-6">
                <div>
                  <h3 className="font-serif-editorial text-2xl font-bold text-[#FAF7F0]">
                    Identifícate como Comprador
                  </h3>
                  <p className="text-xs text-[#E9DCC5]/70 mt-1">
                    Para registrar la venta formal y reservar el stock atómicamente a nombre de tu empresa, ingresa o regístrate en 1 paso.
                  </p>
                </div>

                {/* Tabs Login vs Registro */}
                <div className="flex items-center bg-[#120F0D] p-1 rounded-xl border border-stone-800">
                  <button
                    type="button"
                    onClick={() => { setTabAuthModal('login'); setErrorAuth(null); }}
                    className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                      tabAuthModal === 'login'
                        ? 'bg-[#D4AF37] text-[#16120E] font-bold shadow'
                        : 'text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    Ya Tengo Cuenta Comprador
                  </button>
                  <button
                    type="button"
                    onClick={() => { setTabAuthModal('registro'); setErrorAuth(null); }}
                    className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                      tabAuthModal === 'registro'
                        ? 'bg-[#D4AF37] text-[#16120E] font-bold shadow'
                        : 'text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    Nuevo Comprador (Registro)
                  </button>
                </div>

                {errorAuth && (
                  <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-600 text-rose-200 text-xs">
                    {errorAuth}
                  </div>
                )}

                {/* Formulario Login */}
                {tabAuthModal === 'login' ? (
                  <form onSubmit={handleEjecutarLogin} className="space-y-4">
                    <div>
                      <label className="text-xs text-stone-300 block mb-1 font-medium">Correo Electrónico Corporativo</label>
                      <input
                        type="email"
                        required
                        placeholder="comprador@chocolateshuila.com"
                        value={formLogin.email}
                        onChange={(e) => setFormLogin({ ...formLogin, email: e.target.value })}
                        className="w-full bg-[#120F0D] border border-stone-700 rounded-xl px-3.5 py-2 text-xs text-[#FAF7F0] focus:outline-none focus:border-[#D4AF37]"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-stone-300 block mb-1 font-medium">Contraseña</label>
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={formLogin.password}
                        onChange={(e) => setFormLogin({ ...formLogin, password: e.target.value })}
                        className="w-full bg-[#120F0D] border border-stone-700 rounded-xl px-3.5 py-2 text-xs text-[#FAF7F0] focus:outline-none focus:border-[#D4AF37]"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loadingAuth}
                      className="w-full py-3 rounded-xl bg-[#D4AF37] hover:bg-[#c29d2b] text-[#16120E] font-bold text-xs transition-all cursor-pointer disabled:opacity-50 shadow-md"
                    >
                      {loadingAuth ? 'Iniciando Sesión...' : 'Entrar y Continuar Compra'}
                    </button>
                  </form>
                ) : (
                  /* Formulario Registro */
                  <form onSubmit={handleEjecutarRegistro} className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] text-stone-300 block mb-0.5">Nombre de la Empresa</label>
                        <input
                          type="text"
                          required
                          placeholder="Chocolates Andinos S.A.S."
                          value={formRegistro.nombre_empresa}
                          onChange={(e) => setFormRegistro({ ...formRegistro, nombre_empresa: e.target.value })}
                          className="w-full bg-[#120F0D] border border-stone-700 rounded-xl px-3 py-1.5 text-xs text-[#FAF7F0] focus:outline-none focus:border-[#D4AF37]"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-stone-300 block mb-0.5">NIT o RUT</label>
                        <input
                          type="text"
                          placeholder="901234567-1"
                          value={formRegistro.nit_rut}
                          onChange={(e) => setFormRegistro({ ...formRegistro, nit_rut: e.target.value })}
                          className="w-full bg-[#120F0D] border border-stone-700 rounded-xl px-3 py-1.5 text-xs text-[#FAF7F0] focus:outline-none focus:border-[#D4AF37]"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] text-stone-300 block mb-0.5">Nombre del Contacto</label>
                        <input
                          type="text"
                          required
                          placeholder="Claudia Morales"
                          value={formRegistro.contacto_nombre}
                          onChange={(e) => setFormRegistro({ ...formRegistro, contacto_nombre: e.target.value })}
                          className="w-full bg-[#120F0D] border border-stone-700 rounded-xl px-3 py-1.5 text-xs text-[#FAF7F0] focus:outline-none focus:border-[#D4AF37]"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-stone-300 block mb-0.5">Teléfono / WhatsApp</label>
                        <input
                          type="text"
                          required
                          placeholder="+57 315 888 9900"
                          value={formRegistro.telefono}
                          onChange={(e) => setFormRegistro({ ...formRegistro, telefono: e.target.value })}
                          className="w-full bg-[#120F0D] border border-stone-700 rounded-xl px-3 py-1.5 text-xs text-[#FAF7F0] focus:outline-none focus:border-[#D4AF37]"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] text-stone-300 block mb-0.5">Correo Corporativo</label>
                        <input
                          type="email"
                          required
                          placeholder="compras@empresa.com"
                          value={formRegistro.email}
                          onChange={(e) => setFormRegistro({ ...formRegistro, email: e.target.value })}
                          className="w-full bg-[#120F0D] border border-stone-700 rounded-xl px-3 py-1.5 text-xs text-[#FAF7F0] focus:outline-none focus:border-[#D4AF37]"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-stone-300 block mb-0.5">Contraseña</label>
                        <input
                          type="password"
                          required
                          placeholder="Mínimo 6 caracteres"
                          value={formRegistro.password}
                          onChange={(e) => setFormRegistro({ ...formRegistro, password: e.target.value })}
                          className="w-full bg-[#120F0D] border border-stone-700 rounded-xl px-3 py-1.5 text-xs text-[#FAF7F0] focus:outline-none focus:border-[#D4AF37]"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={loadingAuth}
                      className="w-full py-3 mt-2 rounded-xl bg-[#D4AF37] hover:bg-[#c29d2b] text-[#16120E] font-bold text-xs transition-all cursor-pointer disabled:opacity-50 shadow-md"
                    >
                      {loadingAuth ? 'Creando Perfil...' : 'Registrar Empresa y Continuar'}
                    </button>
                  </form>
                )}

                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => setModalCheckout(false)}
                    className="text-xs text-stone-400 hover:text-stone-200 underline cursor-pointer"
                  >
                    Cancelar y Volver
                  </button>
                </div>
              </div>
            ) : (
              /* Comprador autenticado: Confirmar datos de entrega y compra */
              <div className="space-y-6">
                <div>
                  <h3 className="font-serif-editorial text-2xl font-bold text-[#FAF7F0]">
                    Confirmar Compra Directa Inmediata
                  </h3>
                  <p className="text-xs text-[#E9DCC5]/70 mt-1">
                    Verifica la dirección de entrega y confirma la orden para descontar de inmediato el stock.
                  </p>
                </div>

                {/* Datos del Comprador */}
                <div className="bg-[#120F0D] border border-[#3C2418] rounded-2xl p-4 text-xs space-y-2">
                  <div className="flex items-center justify-between text-stone-400">
                    <span>Empresa Compradora:</span>
                    <strong className="text-[#FAF7F0]">{compradorAuth.nombre_empresa}</strong>
                  </div>
                  <div className="flex items-center justify-between text-stone-400">
                    <span>Contacto Autorizado:</span>
                    <span className="text-stone-300">{compradorAuth.contacto_nombre} ({compradorAuth.telefono})</span>
                  </div>
                  <div className="flex items-center justify-between text-stone-400">
                    <span>Correo de Facturación:</span>
                    <span className="text-stone-300">{compradorAuth.email}</span>
                  </div>
                </div>

                {/* Formulario de Dirección y Notas */}
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-stone-300 block mb-1 font-medium flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-[#D4AF37]" />
                      <span>Dirección de Despacho / Entrega:</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Calle o Carrera, Parque Industrial, Ciudad, Departamento"
                      value={direccionEntrega}
                      onChange={(e) => setDireccionEntrega(e.target.value)}
                      className="w-full bg-[#120F0D] border border-stone-700 rounded-xl px-3.5 py-2 text-xs text-[#FAF7F0] focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-stone-300 block mb-1 font-medium">
                      Instrucciones de Transporte o Embalaje:
                    </label>
                    <textarea
                      rows={2}
                      value={notasEntrega}
                      onChange={(e) => setNotasEntrega(e.target.value)}
                      placeholder="Requisitos de descarga, horario de recepción en bodega..."
                      className="w-full bg-[#120F0D] border border-stone-700 rounded-xl px-3.5 py-2 text-xs text-[#FAF7F0] focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                </div>

                {/* Resumen Total */}
                <div className="p-4 rounded-2xl bg-amber-950/40 border border-[#D4AF37]/40 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-[#D4AF37] font-semibold block">Total Liquidado a Pagar</span>
                    <span className="text-xs text-stone-400 font-mono">{cantidadKg} kg de {producto.id}</span>
                  </div>
                  <span className="font-mono text-2xl font-black text-[#D4AF37]">
                    ${totalPagar.toLocaleString('es-CO')} <span className="text-xs font-normal text-stone-300">COP</span>
                  </span>
                </div>

                {errorCompra && (
                  <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-600 text-rose-200 text-xs">
                    {errorCompra}
                  </div>
                )}

                {/* Botones de Acción */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setModalCheckout(false)}
                    className="flex-1 py-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-bold transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmarCompra}
                    disabled={comprando}
                    className="flex-2 py-3 rounded-xl bg-[#D4AF37] hover:bg-[#c29d2b] text-[#16120E] text-xs font-extrabold transition-all cursor-pointer disabled:opacity-50 shadow-xl flex items-center justify-center gap-2"
                  >
                    {comprando ? (
                      <span>Descontando Inventario...</span>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Confirmar Venta y Reservar Stock</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
