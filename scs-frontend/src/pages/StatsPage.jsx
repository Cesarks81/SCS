import { useState, useEffect } from 'react';
import { getProducts, getWarehouses, getMovements, updateProduct, createWarehouse, deleteWarehouse } from '../services/api';
import { exportToExcel, exportToPDF } from '../utils/exportReport';

// ── Colores para gráficas ──────────────────────────────────────────────────
const PALETTE = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981',
  '#3b82f6', '#ef4444', '#14b8a6', '#f97316', '#84cc16',
];

// ── Componente barra horizontal ────────────────────────────────────────────
function BarraHorizontal({ label, value, max, color, sublabel }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-slate-700 truncate max-w-[60%]">{label}</span>
        <span className="font-bold text-slate-900 tabular-nums">{value}</span>
      </div>
      {sublabel && <p className="text-xs text-slate-400">{sublabel}</p>}
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

// ── Componente tarjeta KPI ─────────────────────────────────────────────────
function KpiCard({ titulo, valor, subtitulo, icon, color }) {
  return (
    <div className="bg-white rounded-2xl p-5 ring-1 ring-slate-200/60 shadow-sm flex items-start gap-4">
      <div className="shrink-0 size-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}20` }}>
        <span style={{ color }}>{icon}</span>
      </div>
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">{titulo}</p>
        <p className="text-2xl font-black text-slate-900 leading-none">{valor}</p>
        {subtitulo && <p className="text-xs text-slate-500 mt-1">{subtitulo}</p>}
      </div>
    </div>
  );
}

// ── Gráfica de barras verticales (movimientos) ─────────────────────────────
function GraficaMovimientos({ datos }) {
  if (!datos.length) return <p className="text-sm text-slate-400 text-center py-8">Sin movimientos registrados.</p>;

  const maxVal = Math.max(...datos.map((d) => Math.max(d.entradas, d.salidas)), 1);

  return (
    <div className="overflow-x-auto">
      <div className="flex items-end gap-2 min-w-max px-2 pb-2" style={{ height: 160 }}>
        {datos.map((d, i) => (
          <div key={i} className="flex flex-col items-center gap-1" style={{ width: 40 }}>
            <div className="flex items-end gap-0.5" style={{ height: 120 }}>
              <div
                title={`Entradas: ${d.entradas}`}
                className="w-4 rounded-t-md bg-indigo-500 transition-all duration-700"
                style={{ height: `${(d.entradas / maxVal) * 120}px` }}
              />
              <div
                title={`Salidas: ${d.salidas}`}
                className="w-4 rounded-t-md bg-red-400 transition-all duration-700"
                style={{ height: `${(d.salidas / maxVal) * 120}px` }}
              />
            </div>
            <span className="text-[9px] text-slate-400 font-medium text-center leading-tight">{d.label}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-4 mt-2 px-2">
        <div className="flex items-center gap-1.5">
          <div className="size-2.5 rounded-sm bg-indigo-500" />
          <span className="text-xs text-slate-500">Entradas</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="size-2.5 rounded-sm bg-red-400" />
          <span className="text-xs text-slate-500">Salidas</span>
        </div>
      </div>
    </div>
  );
}

// ── Gráfica de dona SVG ────────────────────────────────────────────────────
function GraficaDona({ segmentos, size = 140 }) {
  const r = 50;
  const cx = 70;
  const cy = 70;
  const circunferencia = 2 * Math.PI * r;
  const total = segmentos.reduce((acc, s) => acc + s.valor, 0);

  if (total === 0) return <p className="text-sm text-slate-400 text-center py-8">Sin datos.</p>;

  let offset = 0;
  const arcos = segmentos.map((seg) => {
    const fraccion = seg.valor / total;
    const dash = fraccion * circunferencia;
    const gap = circunferencia - dash;
    const arco = { ...seg, dash, gap, offset, fraccion };
    offset += dash;
    return arco;
  });

  return (
    <svg width={size} height={size} viewBox="0 0 140 140">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth="22" />
      {arcos.map((a, i) => (
        <circle
          key={i}
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={a.color}
          strokeWidth="22"
          strokeDasharray={`${a.dash} ${a.gap}`}
          strokeDashoffset={-a.offset}
          strokeLinecap="butt"
          style={{ transform: 'rotate(-90deg)', transformOrigin: '70px 70px', transition: 'stroke-dasharray 0.7s' }}
        />
      ))}
      <text x={cx} y={cy - 6} textAnchor="middle" className="text-xs" fill="#0f172a" fontSize="18" fontWeight="900">{total}</text>
      <text x={cx} y={cy + 12} textAnchor="middle" fill="#94a3b8" fontSize="9" fontWeight="600">TOTAL</text>
    </svg>
  );
}

// ── Modal de niveles de stock ──────────────────────────────────────────────
function StockLevelModal({ isOpen, productos, onGuardar, onClose }) {
  const productosCuantificables = productos.filter((p) => p.type === 'countable');

  const configInicial = () =>
    Object.fromEntries(
      productosCuantificables.map((p) => [
        p.id,
        { stock_min: p.stock_min ?? 0, stock_max: p.stock_max ?? 0, stock_safety: p.stock_safety ?? 0 },
      ])
    );

  const [config, setConfig] = useState(configInicial);
  const [busqueda, setBusqueda] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);

  useEffect(() => { setConfig(configInicial()); }, [productos]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  const handleChange = (id, campo, valor) => {
    setConfig((prev) => ({ ...prev, [id]: { ...(prev[id] || {}), [campo]: Number(valor) } }));
    setGuardado(false);
  };

  const errores = {};
  productosCuantificables.forEach((p) => {
    const cfg = config[p.id] || {};
    const msgs = [];
    if (cfg.stock_max < p.current_stock)       msgs.push(`Máximo (${cfg.stock_max}) < stock actual (${p.current_stock})`);
    if (cfg.stock_min > cfg.stock_max)          msgs.push('Mínimo no puede superar al máximo.');
    if (cfg.stock_safety > cfg.stock_min)       msgs.push('Seguridad no puede superar al mínimo.');
    if (msgs.length) errores[p.id] = msgs;
  });
  const hayErrores = Object.keys(errores).length > 0;

  const handleGuardar = async () => {
    if (hayErrores || guardando) return;
    setGuardando(true);
    try {
      await onGuardar(config);
      setGuardado(true);
      setTimeout(() => setGuardado(false), 2000);
    } catch (e) {
      alert(`Error al guardar: ${e.message}`);
    } finally {
      setGuardando(false);
    }
  };

  const filtrados = productosCuantificables.filter((p) =>
    p.model.toLowerCase().includes(busqueda.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="relative z-50" role="dialog" aria-modal="true">
      <div className="fixed inset-0 bg-gray-900/70 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-10 overflow-y-auto flex items-center justify-center p-4">
        <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">

          {/* Cabecera */}
          <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100 shrink-0">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Niveles de stock</h2>
              <p className="text-xs text-slate-400 mt-0.5">Seguridad · Mínimo · Máximo por producto</p>
            </div>
            <button onClick={onClose} className="rounded-full p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
              <svg className="size-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Buscador */}
          <div className="px-6 py-3 border-b border-slate-100 shrink-0">
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <svg className="size-4 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                </svg>
              </div>
              <input
                type="search"
                placeholder="Buscar producto..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full rounded-xl border-0 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-900 ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Lista de productos */}
          <div className="overflow-y-auto flex-1 px-6 py-4 space-y-3">
            {filtrados.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-8">
                {productosCuantificables.length === 0
                  ? 'No hay productos de tipo lote/grupo.'
                  : 'Sin resultados para esa búsqueda.'}
              </p>
            )}
            {filtrados.map((p) => {
              const cfg = config[p.id] || { stock_min: 0, stock_max: 0, stock_safety: 0 };
              return (
                <div key={p.id} className={`rounded-xl ring-1 p-4 space-y-3 ${errores[p.id] ? 'bg-red-50 ring-red-200' : 'bg-slate-50 ring-slate-100'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {p.emoji && <span className="text-xl">{p.emoji}</span>}
                      <div>
                        <p className="font-semibold text-slate-800 text-sm leading-tight">{p.model}</p>
                        <p className="text-xs text-slate-400">Stock actual: <span className="font-bold text-slate-600">{p.current_stock}</span></p>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { campo: 'stock_safety', label: 'Seguridad', color: 'text-red-500' },
                      { campo: 'stock_min',    label: 'Mínimo',    color: 'text-amber-500' },
                      { campo: 'stock_max',    label: 'Máximo',    color: 'text-green-600' },
                    ].map(({ campo, label, color }) => (
                      <div key={campo}>
                        <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${color}`}>{label}</label>
                        <input
                          type="number"
                          min="0"
                          value={cfg[campo] ?? 0}
                          onChange={(e) => handleChange(p.id, campo, e.target.value)}
                          className={`w-full rounded-lg border-0 py-1.5 px-2 text-sm text-slate-900 shadow-sm ring-1 ring-inset outline-none focus:ring-2 focus:ring-indigo-600 ${
                            errores[p.id] ? 'ring-red-300 bg-white' : 'ring-slate-300'
                          }`}
                        />
                      </div>
                    ))}
                  </div>
                  {errores[p.id] && (
                    <ul className="space-y-0.5">
                      {errores[p.id].map((msg, i) => (
                        <li key={i} className="text-xs text-red-600 font-medium flex items-center gap-1">
                          <span>✕</span> {msg}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-100 shrink-0">
            <button
              onClick={handleGuardar}
              disabled={hayErrores || guardando}
              className={`w-full rounded-xl py-2.5 text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                guardado ? 'bg-green-500 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-500'
              }`}
            >
              {guardando ? 'Guardando...' : guardado ? '✓ Guardado' : hayErrores ? 'Corrige los errores para guardar' : 'Guardar cambios'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

// ── Panel de configuración de niveles de stock ─────────────────────────────
function PanelNivelesStock({ productos, onGuardar }) {
  const productosCuantificables = productos.filter((p) => p.type === 'countable');

  const configInicial = () =>
    Object.fromEntries(
      productosCuantificables.map((p) => [
        p.id,
        { stock_min: p.stock_min, stock_max: p.stock_max, stock_safety: p.stock_safety },
      ])
    );

  const [config, setConfig] = useState(configInicial);
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);

  useEffect(() => {
    setConfig(configInicial());
  }, [productos]);

  const handleChange = (id, campo, valor) => {
    setConfig((prev) => ({
      ...prev,
      [id]: { ...(prev[id] || {}), [campo]: Number(valor) },
    }));
    setGuardado(false);
  };

  // Validaciones por producto
  const errores = {};
  productosCuantificables.forEach((p) => {
    const cfg = config[p.id] || {};
    const msgs = [];
    if (cfg.stock_max < p.current_stock) {
      msgs.push(`El máximo (${cfg.stock_max}) no puede ser inferior al stock actual (${p.current_stock} uds.)`);
    }
    if (cfg.stock_min > cfg.stock_max) {
      msgs.push('El mínimo no puede superar al máximo.');
    }
    if (cfg.stock_safety > cfg.stock_min) {
      msgs.push('El stock de seguridad no puede superar al mínimo.');
    }
    if (msgs.length) errores[p.id] = msgs;
  });
  const hayErrores = Object.keys(errores).length > 0;

  const handleGuardar = async () => {
    if (hayErrores || guardando) return;
    setGuardando(true);
    try {
      await onGuardar(config);
      setGuardado(true);
      setTimeout(() => setGuardado(false), 2000);
    } catch (e) {
      alert(`Error al guardar: ${e.message}`);
    } finally {
      setGuardando(false);
    }
  };

  if (productosCuantificables.length === 0) {
    return <p className="text-sm text-slate-400 text-center py-8">No hay productos de tipo lote/grupo.</p>;
  }

  return (
    <div className="space-y-4">
      {productosCuantificables.map((p) => {
        const cfg = config[p.id] || { stock_min: p.stock_min, stock_max: p.stock_max, stock_safety: p.stock_safety };
        const pct = cfg.stock_max > 0 ? Math.min(100, (p.current_stock / cfg.stock_max) * 100) : 0;
        const sobreMaximo = p.current_stock > cfg.stock_max && cfg.stock_max > 0;
        const nivel = p.current_stock <= cfg.stock_safety
          ? 'crítico'
          : p.current_stock <= cfg.stock_min
          ? 'bajo'
          : sobreMaximo
          ? 'exceso'
          : 'ok';

        return (
          <div key={p.id} className={`rounded-xl ring-1 p-4 space-y-3 ${errores[p.id] ? 'bg-red-50 ring-red-200' : 'bg-slate-50 ring-slate-100'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {p.emoji && <span className="text-xl">{p.emoji}</span>}
                <span className="font-semibold text-slate-800 text-sm">{p.model}</span>
              </div>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                nivel === 'crítico' ? 'bg-red-100 text-red-600'
                : nivel === 'bajo'  ? 'bg-amber-100 text-amber-600'
                : nivel === 'exceso' ? 'bg-indigo-100 text-indigo-600'
                : 'bg-green-100 text-green-600'
              }`}>
                {nivel === 'crítico' ? '⚠ Crítico'
                 : nivel === 'bajo'  ? '▼ Bajo'
                 : nivel === 'exceso' ? '▲ Sobre máximo'
                 : '✓ OK'} · {p.current_stock} uds.
              </span>
            </div>

            {/* Barra de stock */}
            <div className="relative h-3 bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  nivel === 'crítico' ? 'bg-red-400'
                  : nivel === 'bajo'  ? 'bg-amber-400'
                  : nivel === 'exceso' ? 'bg-indigo-400'
                  : 'bg-green-400'
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>

            {/* Inputs niveles */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { campo: 'stock_safety', label: 'Seguridad', color: 'text-red-500' },
                { campo: 'stock_min',    label: 'Mínimo',    color: 'text-amber-500' },
                { campo: 'stock_max',    label: 'Máximo',    color: 'text-green-600' },
              ].map(({ campo, label, color }) => (
                <div key={campo}>
                  <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${color}`}>{label}</label>
                  <input
                    type="number"
                    min="0"
                    value={cfg[campo] ?? 0}
                    onChange={(e) => handleChange(p.id, campo, e.target.value)}
                    className={`w-full rounded-lg border-0 py-1.5 px-2 text-sm text-slate-900 shadow-sm ring-1 ring-inset outline-none focus:ring-2 focus:ring-indigo-600 ${
                      errores[p.id] ? 'ring-red-300 bg-white' : 'ring-slate-300'
                    }`}
                  />
                </div>
              ))}
            </div>

            {/* Mensajes de error */}
            {errores[p.id] && (
              <ul className="space-y-0.5">
                {errores[p.id].map((msg, i) => (
                  <li key={i} className="text-xs text-red-600 font-medium flex items-center gap-1">
                    <span>✕</span> {msg}
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}

      <button
        onClick={handleGuardar}
        disabled={hayErrores || guardando}
        className={`w-full rounded-xl py-2.5 text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
          guardado
            ? 'bg-green-500 text-white'
            : 'bg-indigo-600 text-white hover:bg-indigo-500'
        }`}
      >
        {guardando ? 'Guardando...' : guardado ? '✓ Configuración guardada' : hayErrores ? 'Corrige los errores para guardar' : 'Guardar configuración'}
      </button>
    </div>
  );
}

// ── Página principal de Estadísticas ──────────────────────────────────────
export default function StatsPage({ onWarehouseCreado }) {
  const [seccion, setSeccion] = useState('resumen'); // 'resumen' | 'ajustes'
  const [modalStockOpen, setModalStockOpen] = useState(false);
  const [exportando, setExportando] = useState(null); // 'excel' | 'pdf' | null

  // Crear almacén
  const [nuevoAlmacen, setNuevoAlmacen] = useState({ name: '', location: '' });
  const [creandoAlmacen, setCreandoAlmacen] = useState(false);
  const [errorAlmacen, setErrorAlmacen] = useState('');
  const [mostrarFormAlmacen, setMostrarFormAlmacen] = useState(false);
  const [productos, setProductos] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [movimientosPorProducto, setMovimientosPorProducto] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargar = async () => {
      try {
        const [prods, whs] = await Promise.all([getProducts(), getWarehouses()]);
        setProductos(prods);
        setWarehouses(whs);

        const movs = {};
        await Promise.all(
          prods.map(async (p) => {
            try {
              const m = await getMovements(p.id);
              movs[p.id] = m;
            } catch {
              movs[p.id] = [];
            }
          })
        );
        setMovimientosPorProducto(movs);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, []);

  const guardarStockConfig = async (cfg) => {
    await Promise.all(
      Object.entries(cfg).map(([id, valores]) =>
        updateProduct(id, {
          stock_min: valores.stock_min,
          stock_max: valores.stock_max,
          stock_safety: valores.stock_safety,
        })
      )
    );
    const prods = await getProducts();
    setProductos(prods);
  };

  const handleCrearAlmacen = async () => {
    if (!nuevoAlmacen.name.trim() || !nuevoAlmacen.location.trim()) {
      setErrorAlmacen('Nombre y ubicación son obligatorios.');
      return;
    }
    setCreandoAlmacen(true);
    setErrorAlmacen('');
    try {
      const creado = await createWarehouse(nuevoAlmacen);
      setWarehouses((prev) => [...prev, creado]);
      setNuevoAlmacen({ name: '', location: '' });
      setMostrarFormAlmacen(false);
      if (onWarehouseCreado) onWarehouseCreado(creado);
    } catch (e) {
      setErrorAlmacen(e.message || 'Error al crear el almacén.');
    } finally {
      setCreandoAlmacen(false);
    }
  };

  const handleBorrarAlmacen = async (warehouse) => {
    const usados = productos.filter((p) => p.warehouse_id === warehouse.id).length;
    if (usados > 0) {
      alert(`No se puede borrar "${warehouse.name}": tiene ${usados} producto(s) asignado(s).`);
      return;
    }
    if (!window.confirm(`¿Borrar el almacén "${warehouse.name}"? Esta acción no se puede deshacer.`)) return;
    try {
      await deleteWarehouse(warehouse.id);
      setWarehouses((prev) => prev.filter((w) => w.id !== warehouse.id));
    } catch (e) {
      alert(e.message || 'Error al borrar el almacén.');
    }
  };

  // ── Cálculos derivados ─────────────────────────────────────────────────
  const totalProductos = productos.length;
  const totalIndividuales = productos.filter((p) => p.type === 'individual').length;
  const totalLotes = productos.filter((p) => p.type === 'countable').length;
  const totalUnidades = productos
    .filter((p) => p.type === 'countable')
    .reduce((acc, p) => acc + (p.current_stock || 0), 0);

  const todosMovimientos = Object.values(movimientosPorProducto).flat();
  const totalEntradas = todosMovimientos.filter((m) => m.type === 'in').length;
  const totalSalidas = todosMovimientos.filter((m) => m.type === 'out').length;

  const productosPorAlmacen = warehouses.map((w, i) => ({
    label: w.name,
    sublabel: w.location,
    valor: productos.filter((p) => p.warehouse_id === w.id).length,
    color: PALETTE[i % PALETTE.length],
  }));
  const maxPorAlmacen = Math.max(...productosPorAlmacen.map((x) => x.valor), 1);

  const categorias = [...new Set(productos.map((p) => p.category).filter(Boolean))];
  const segmentosCat = categorias.map((cat, i) => ({
    label: cat,
    valor: productos.filter((p) => p.category === cat).length,
    color: PALETTE[i % PALETTE.length],
  }));

  const movimientosOrdenados = [...todosMovimientos].sort(
    (a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0)
  );
  const semanas = {};
  movimientosOrdenados.forEach((m) => {
    const fecha = new Date(m.created_at || Date.now());
    const inicioSemana = new Date(fecha);
    inicioSemana.setDate(fecha.getDate() - fecha.getDay());
    const key = inicioSemana.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
    if (!semanas[key]) semanas[key] = { label: key, entradas: 0, salidas: 0 };
    if (m.type === 'in') semanas[key].entradas++;
    else semanas[key].salidas++;
  });
  const datosMovimientos = Object.values(semanas).slice(-8);

  const alertas = productos
    .filter((p) => p.type === 'countable')
    .map((p) => {
      if (p.current_stock <= (p.stock_safety ?? 0)) return { producto: p, nivel: 'crítico' };
      if (p.current_stock <= (p.stock_min ?? 0)) return { producto: p, nivel: 'bajo' };
      return null;
    })
    .filter(Boolean);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <svg className="size-8 animate-spin text-indigo-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-sm text-slate-500">Cargando estadísticas...</p>
        </div>
      </div>
    );
  }

  const tabClass = (tab) =>
    `px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
      seccion === tab
        ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/60'
        : 'text-slate-500 hover:text-slate-700'
    }`;

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        <button className={tabClass('resumen')} onClick={() => setSeccion('resumen')}>Resumen</button>
        <button className={tabClass('ajustes')} onClick={() => setSeccion('ajustes')}>
          <span className="flex items-center gap-1.5">
            <svg className="size-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
            Ajustes
          </span>
        </button>
      </div>

      {/* ── Sección Resumen ───────────────────────────────────────────────── */}
      {seccion === 'resumen' && (
        <div className="space-y-8">

          {/* KPIs */}
          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-4">Resumen general</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard titulo="Productos" valor={totalProductos} subtitulo={`${totalIndividuales} individuales · ${totalLotes} lotes`} color="#6366f1"
                icon={<svg className="size-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>}
              />
              <KpiCard titulo="Unidades en stock" valor={totalUnidades} subtitulo="Solo lotes/grupos" color="#10b981"
                icon={<svg className="size-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" /></svg>}
              />
              <KpiCard titulo="Entradas" valor={totalEntradas} subtitulo="Movimientos de entrada" color="#6366f1"
                icon={<svg className="size-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>}
              />
              <KpiCard titulo="Salidas" valor={totalSalidas} subtitulo="Movimientos de salida" color="#f59e0b"
                icon={<svg className="size-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>}
              />
            </div>
          </section>

          {/* Alertas */}
          {alertas.length > 0 && (
            <section className="rounded-2xl bg-amber-50 ring-1 ring-amber-100 p-5">
              <h2 className="text-sm font-bold text-amber-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                <svg className="size-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
                Alertas de stock ({alertas.length})
              </h2>
              <div className="space-y-2">
                {alertas.map(({ producto, nivel }) => (
                  <div key={producto.id} className="flex items-center justify-between bg-white rounded-xl px-4 py-2.5 ring-1 ring-amber-100">
                    <div className="flex items-center gap-2">
                      {producto.emoji && <span>{producto.emoji}</span>}
                      <span className="text-sm font-semibold text-slate-800">{producto.model}</span>
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      nivel === 'crítico' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
                    }`}>
                      {nivel === 'crítico' ? '⚠ Crítico' : '▼ Bajo'} · {producto.current_stock} uds.
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Gráficas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            <div className="bg-white rounded-2xl p-6 ring-1 ring-slate-200/60 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-4">Movimientos por semana</h3>
              <GraficaMovimientos datos={datosMovimientos} />
            </div>

            <div className="bg-white rounded-2xl p-6 ring-1 ring-slate-200/60 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-4">Productos por almacén</h3>
              {productosPorAlmacen.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">No hay almacenes.</p>
              ) : (
                <div className="space-y-4">
                  {productosPorAlmacen.map((item, i) => (
                    <BarraHorizontal key={i} label={item.label} sublabel={item.sublabel} value={item.valor} max={maxPorAlmacen} color={item.color} />
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl p-6 ring-1 ring-slate-200/60 shadow-sm lg:col-span-2">
              <h3 className="text-sm font-bold text-slate-900 mb-4">Distribución por categoría</h3>
              <div className="flex items-center gap-6">
                <GraficaDona segmentos={segmentosCat} />
                <div className="flex-1 space-y-2">
                  {segmentosCat.map((s, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                        <span className="text-slate-600 truncate">{s.label}</span>
                      </div>
                      <span className="font-bold text-slate-900 tabular-nums">{s.valor}</span>
                    </div>
                  ))}
                  {segmentosCat.length === 0 && <p className="text-sm text-slate-400">Sin categorías.</p>}
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ── Sección Ajustes ───────────────────────────────────────────────── */}
      {seccion === 'ajustes' && (
        <div className="space-y-4 max-w-2xl">

          {/* Exportar datos */}
          <div className="bg-white rounded-2xl p-6 ring-1 ring-slate-200/60 shadow-sm">
            <div className="flex items-start gap-4 mb-5">
              <div className="size-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                <svg className="size-5 text-indigo-600" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Exportar informe</h3>
                <p className="text-xs text-slate-400 mt-0.5">Descarga el inventario completo para el responsable de almacén o el departamento de compras.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={async () => {
                  setExportando('excel');
                  try { exportToExcel(productos, warehouses); }
                  finally { setExportando(null); }
                }}
                disabled={exportando !== null}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors disabled:opacity-60"
              >
                {exportando === 'excel' ? (
                  <svg className="size-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                ) : (
                  <svg className="size-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                )}
                Exportar Excel
              </button>
              <button
                onClick={async () => {
                  setExportando('pdf');
                  try { exportToPDF(productos, warehouses); }
                  finally { setExportando(null); }
                }}
                disabled={exportando !== null}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 py-3 text-sm font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors disabled:opacity-60"
              >
                {exportando === 'pdf' ? (
                  <svg className="size-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                ) : (
                  <svg className="size-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                )}
                Exportar PDF
              </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-3 text-center">
              El archivo se descargará con la fecha de hoy como nombre.
            </p>
          </div>

          {/* Ajustes de nivel de stock */}
          <div className="bg-white rounded-2xl p-6 ring-1 ring-slate-200/60 shadow-sm">
            <div className="flex items-start gap-4 mb-5">
              <div className="size-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                <svg className="size-5 text-indigo-600" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Ajustes de nivel de stock</h3>
                <p className="text-xs text-slate-400 mt-0.5">Configura los umbrales de seguridad, mínimo y máximo para cada lote o grupo.</p>
              </div>
            </div>
            <button
              onClick={() => setModalStockOpen(true)}
              className="w-full flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <span className="flex items-center gap-2">
                <svg className="size-4 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
                </svg>
                Abrir configuración
              </span>
              <svg className="size-4 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>

          {/* Gestión de almacenes */}
          <div className="bg-white rounded-2xl p-6 ring-1 ring-slate-200/60 shadow-sm">
            <div className="flex items-start gap-4 mb-5">
              <div className="size-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                <svg className="size-5 text-indigo-600" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205 3 1m1.5.5-1.5-.5M6.75 7.364V3h-3v18m3-13.636 10.5-3.819" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Gestión de almacenes</h3>
                <p className="text-xs text-slate-400 mt-0.5">Consulta y añade los almacenes o ubicaciones del inventario.</p>
              </div>
            </div>

            {/* Lista de almacenes existentes */}
            {warehouses.length > 0 ? (
              <div className="space-y-2 mb-4">
                {warehouses.map((w) => {
                  const count = productos.filter((p) => p.warehouse_id === w.id).length;
                  return (
                    <div key={w.id} className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-2.5 ring-1 ring-slate-100">
                      <div className="size-2 rounded-full bg-indigo-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{w.name}</p>
                        <p className="text-xs text-slate-400 truncate">{w.location}</p>
                      </div>
                      <span className="text-xs font-bold text-slate-400 shrink-0">{count} prod.</span>
                      <button
                        onClick={() => handleBorrarAlmacen(w)}
                        disabled={count > 0}
                        title={count > 0 ? `${count} producto(s) asignado(s)` : 'Borrar almacén'}
                        className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-slate-400 disabled:hover:bg-transparent"
                      >
                        <svg className="size-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                        </svg>
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-slate-400 text-center py-4 mb-4">No hay almacenes registrados.</p>
            )}

            {/* Formulario nuevo almacén */}
            {mostrarFormAlmacen ? (
              <div className="rounded-xl bg-indigo-50 ring-1 ring-indigo-100 p-4 space-y-3">
                <p className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Nuevo almacén</p>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Nombre (Ej: Almacén A)"
                    value={nuevoAlmacen.name}
                    onChange={(e) => setNuevoAlmacen({ ...nuevoAlmacen, name: e.target.value })}
                    className="rounded-lg border-0 py-2 px-3 text-sm text-slate-900 shadow-sm ring-1 ring-inset ring-indigo-200 focus:ring-2 focus:ring-indigo-600 outline-none placeholder:text-slate-400"
                  />
                  <input
                    type="text"
                    placeholder="Ubicación (Ej: Planta 2)"
                    value={nuevoAlmacen.location}
                    onChange={(e) => setNuevoAlmacen({ ...nuevoAlmacen, location: e.target.value })}
                    className="rounded-lg border-0 py-2 px-3 text-sm text-slate-900 shadow-sm ring-1 ring-inset ring-indigo-200 focus:ring-2 focus:ring-indigo-600 outline-none placeholder:text-slate-400"
                  />
                </div>
                {errorAlmacen && <p className="text-xs text-red-600">{errorAlmacen}</p>}
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => { setMostrarFormAlmacen(false); setErrorAlmacen(''); setNuevoAlmacen({ name: '', location: '' }); }}
                    className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-indigo-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleCrearAlmacen}
                    disabled={creandoAlmacen}
                    className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-60 transition-colors"
                  >
                    {creandoAlmacen ? 'Creando...' : 'Crear almacén'}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setMostrarFormAlmacen(true)}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 py-2.5 text-sm font-semibold text-slate-500 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
              >
                <svg className="size-4" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Añadir almacén
              </button>
            )}
          </div>

        </div>
      )}

      {/* Modal niveles de stock */}
      <StockLevelModal
        isOpen={modalStockOpen}
        productos={productos}
        onGuardar={guardarStockConfig}
        onClose={() => setModalStockOpen(false)}
      />

    </main>
  );
}
