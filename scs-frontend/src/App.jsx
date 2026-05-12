import { useState, useEffect } from 'react';
import AddProductModal from './components/AddProductModal';
import ProductDetailModal from './components/ProductDetailModal';
import SecureImg from './components/SecureImg';
import StatsPage from './pages/StatsPage';
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getWarehouses,
  isAuthenticated,
  logout,
} from './services/api';

function App() {
  const [pagina, setPagina] = useState('inventario'); // 'inventario' | 'estadisticas'

  const [isModalOpen, setIsModalOpen]           = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [productoAEditar, setProductoAEditar]   = useState(null);

  const [productos, setProductos]   = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);

  const [textoBusqueda, setTextoBusqueda]     = useState('');
  const [criterioBusqueda, setCriterioBusqueda] = useState('serial_number');

  useEffect(() => {
    if (!isAuthenticated()) {
      window.location.href = '/login';
      return;
    }

    const cargarDatos = async () => {
      try {
        setLoading(true);
        const [prods, whs] = await Promise.all([getProducts(), getWarehouses()]);
        const whMap = Object.fromEntries(whs.map((w) => [w.id, w]));
        const prodsHydratados = prods.map((p) => ({
          ...p,
          warehouse_name: whMap[p.warehouse_id]
            ? `${whMap[p.warehouse_id].name} — ${whMap[p.warehouse_id].location}`
            : p.warehouse_id,
        }));
        setProductos(prodsHydratados);
        setWarehouses(whs);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, []);

  const productosFiltrados = productos.filter((producto) => {
    const texto = textoBusqueda.toLowerCase();
    if (!texto) return true;
    switch (criterioBusqueda) {
      case 'serial_number': return (producto.serial_number || '').toLowerCase().includes(texto);
      case 'model':         return (producto.model || '').toLowerCase().includes(texto);
      case 'warehouse':     return (producto.warehouse_name || '').toLowerCase().includes(texto);
      case 'category':      return (producto.category || '').toLowerCase().includes(texto);
      default:              return true;
    }
  });

  const guardarProducto = async (productoGuardado) => {
    try {
      if (productoGuardado.id) {
        const actualizado = await updateProduct(productoGuardado.id, productoGuardado);
        const wh = warehouses.find((w) => w.id === actualizado.warehouse_id);
        const hydratado = { ...actualizado, warehouse_name: wh ? `${wh.name} — ${wh.location}` : actualizado.warehouse_id };
        setProductos(productos.map((p) => (p.id === hydratado.id ? hydratado : p)));
      } else {
        const nuevo = await createProduct(productoGuardado);
        const wh = warehouses.find((w) => w.id === nuevo.warehouse_id);
        const hydratado = { ...nuevo, warehouse_name: wh ? `${wh.name} — ${wh.location}` : nuevo.warehouse_id };
        setProductos([...productos, hydratado]);
      }
      setIsModalOpen(false);
      setProductoAEditar(null);
    } catch (e) {
      alert(`Error al guardar: ${e.message}`);
    }
  };

  const borrarProducto = async (id) => {
    if (!window.confirm('¿Seguro que quieres eliminar este producto? Esta acción no se puede deshacer.')) return;
    try {
      await deleteProduct(id);
      setProductos(productos.filter((p) => p.id !== id));
      setProductoSeleccionado(null);
    } catch (e) {
      alert(`Error al borrar: ${e.message}`);
    }
  };

  const abrirEdicion = (producto) => {
    setProductoSeleccionado(null);
    setProductoAEditar(producto);
    setIsModalOpen(true);
  };

  const abrirCreacion = () => {
    setProductoAEditar(null);
    setIsModalOpen(true);
  };

  // Cuando se crea un almacén desde el modal, añadirlo al estado global
  const handleWarehouseCreado = (nuevoWarehouse) => {
    setWarehouses((prev) => [...prev, nuevoWarehouse]);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <svg className="size-8 animate-spin text-indigo-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-sm text-slate-500">Cargando inventario...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 font-semibold mb-2">Error al conectar con el servidor</p>
          <p className="text-sm text-slate-500 mb-4">{error}</p>
          <button onClick={() => window.location.reload()} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full">
      {/* Navbar */}
      <nav className="bg-gray-800/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex shrink-0 items-center">
              <img
                src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=500"
                alt="Logo"
                className="size-8"
              />
            </div>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setPagina('inventario')}
                className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  pagina === 'inventario'
                    ? 'bg-gray-950/50 text-white'
                    : 'text-gray-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                Inventario
              </button>
              <button
                onClick={() => setPagina('estadisticas')}
                className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  pagina === 'estadisticas'
                    ? 'bg-gray-950/50 text-white'
                    : 'text-gray-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                Estadísticas
              </button>
              <button
                onClick={() => { logout(); window.location.href = '/login'; }}
                className="rounded-md px-3 py-2 text-sm font-medium text-gray-300 hover:bg-white/5 hover:text-white"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Header / Buscador — solo en inventario */}
      {pagina === 'inventario' && (
        <header className="relative bg-gray-800 after:pointer-events-none after:absolute after:inset-x-0 after:inset-y-0 after:border-y after:border-white/10">
          <div className="mx-auto flex max-w-7xl items-center gap-3 sm:gap-6 px-4 py-4 sm:py-6 sm:px-6 lg:px-8">
            <div className="shrink-0 hidden sm:block">
              <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-white truncate">Inventario</h1>
            </div>

            <div className="flex-1 flex justify-center sm:justify-start lg:justify-center min-w-0">
              <div className="w-full max-w-2xl flex gap-1.5 sm:gap-2">
                <select
                  value={criterioBusqueda}
                  onChange={(e) => setCriterioBusqueda(e.target.value)}
                  className="block w-24 sm:w-36 shrink-0 rounded-full border-0 bg-gray-900/30 py-1.5 pl-3 sm:pl-4 pr-8 text-xs sm:text-sm font-medium text-gray-300 ring-1 ring-inset ring-white/10 focus:bg-gray-900/60 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer transition-all appearance-none"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                    backgroundPosition: 'right 0.5rem center',
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: '1.5em 1.5em',
                  }}
                >
                  <option value="serial_number" className="bg-gray-800">S/N</option>
                  <option value="model"         className="bg-gray-800">Modelo</option>
                  <option value="warehouse"     className="bg-gray-800">Almacén</option>
                  <option value="category"      className="bg-gray-800">Categoría</option>
                </select>

                <div className="relative flex-1 min-w-0">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <svg className="size-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                    </svg>
                  </div>
                  <input
                    type="search"
                    value={textoBusqueda}
                    onChange={(e) => setTextoBusqueda(e.target.value)}
                    placeholder={`Buscar por ${criterioBusqueda === 'serial_number' ? 'S/N' : criterioBusqueda === 'model' ? 'Modelo' : criterioBusqueda === 'warehouse' ? 'Almacén' : 'Categoría'}...`}
                    className="block w-full rounded-full border-0 bg-gray-900/30 py-1.5 pl-9 sm:pl-10 pr-3 text-sm text-gray-300 placeholder:text-gray-500 ring-1 ring-inset ring-white/10 focus:bg-gray-900/60 focus:ring-2 focus:ring-indigo-500 transition-all outline-none truncate"
                  />
                </div>
              </div>
            </div>

            <div className="shrink-0 flex justify-end">
              <button
                onClick={abrirCreacion}
                type="button"
                className="inline-flex items-center justify-center rounded-full sm:rounded-md bg-indigo-500 size-10 sm:size-auto sm:px-4 sm:py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400 transition-all shrink-0"
              >
                <svg className="size-5 sm:size-4 sm:-ml-0.5 sm:mr-1.5" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                <span className="hidden sm:inline">Añadir Producto</span>
              </button>
            </div>
          </div>
        </header>
      )}

      {/* Header estadísticas */}
      {pagina === 'estadisticas' && (
        <header className="relative bg-gray-800 after:pointer-events-none after:absolute after:inset-x-0 after:inset-y-0 after:border-y after:border-white/10">
          <div className="mx-auto flex max-w-7xl items-center px-4 py-4 sm:py-6 sm:px-6 lg:px-8">
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-white">Estadísticas</h1>
          </div>
        </header>
      )}

      {/* Contenido */}
      {pagina === 'estadisticas' ? (
        <StatsPage />
      ) : (
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

            {productosFiltrados.map((producto) => (
              <div
                key={producto.id}
                onClick={() => setProductoSeleccionado(producto)}
                className="group relative flex flex-col bg-white rounded-3xl p-3 sm:p-4 shadow-sm ring-1 ring-slate-200/60 hover:shadow-xl hover:ring-slate-300 transition-all duration-300 cursor-pointer overflow-hidden"
              >
                <div className="relative aspect-[4/3] w-full bg-slate-50 rounded-2xl overflow-hidden mb-4 p-4">
                  <div className={`absolute top-3 left-3 flex items-center gap-1.5 bg-white/80 backdrop-blur-sm border text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm z-10 ${
                    producto.status === 'Óptimo' ? 'border-green-200 text-green-700' : 'border-amber-200 text-amber-700'
                  }`}>
                    {producto.status}
                  </div>

                  {producto.emoji ? (
                    <div className="w-full h-full flex items-center justify-center text-6xl select-none">{producto.emoji}</div>
                  ) : (
                    <SecureImg src={producto.image_url} alt={producto.model} className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110" />
                  )}
                </div>

                <div className="flex flex-col flex-1 px-2 pb-1">
                  <h3 className="text-lg font-bold text-slate-900 mb-2 leading-tight group-hover:text-indigo-600 transition-colors">
                    {producto.model}
                  </h3>

                  {producto.attributes && Object.keys(producto.attributes).length > 0 && (
                    <div className="mb-4 space-y-1.5">
                      {Object.entries(producto.attributes).map(([clave, valor]) => (
                        <div key={clave} className="flex justify-between items-center text-xs">
                          <span className="text-slate-500 font-medium">{clave}</span>
                          <span className="text-slate-700 font-semibold truncate ml-2 bg-slate-100 px-2 py-0.5 rounded-md">{valor}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-auto flex items-center justify-between pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-1.5 rounded-md">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        {producto.type === 'countable' ? 'LOTE:' : 'S/N:'}
                      </span>
                      <code className="text-xs font-bold text-slate-700">
                        {producto.type === 'countable' ? producto.current_stock : (producto.serial_number || '-')}
                      </code>
                    </div>
                    <div className="flex gap-3 items-center">
                      {producto.type === 'countable' && (
                        <span className="text-xs font-bold bg-indigo-50 text-indigo-700 px-2 rounded">x{producto.current_stock}</span>
                      )}
                      {producto.category && <span className="text-xs font-bold text-slate-400">{producto.category}</span>}
                      {producto.warehouse_name && <span className="text-xs font-bold text-red-500 truncate max-w-[80px]">{producto.warehouse_name}</span>}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {productos.length === 0 && (
              <div className="col-span-full py-16 flex flex-col items-center justify-center text-center">
                <div className="bg-slate-100 p-4 rounded-full mb-4">
                  <svg className="size-8 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">Tu inventario está vacío</h3>
                <p className="text-sm text-slate-500 max-w-sm">Aún no hay productos registrados. Haz clic en el botón para empezar a gestionar tu equipo.</p>
              </div>
            )}

            {productos.length > 0 && productosFiltrados.length === 0 && (
              <div className="col-span-full py-16 flex flex-col items-center justify-center text-center">
                <svg className="size-12 text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
                <p className="text-slate-500 text-lg">
                  No se encontraron resultados para "<span className="font-semibold text-slate-800">{textoBusqueda}</span>".
                </p>
              </div>
            )}

          </div>
        </main>
      )}

      <AddProductModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setProductoAEditar(null); }}
        onProductoGuardado={guardarProducto}
        productoAEditar={productoAEditar}
        warehouses={warehouses}
        onWarehouseCreado={handleWarehouseCreado}
      />
      <ProductDetailModal
        isOpen={productoSeleccionado !== null}
        producto={productoSeleccionado}
        onClose={() => setProductoSeleccionado(null)}
        onEdit={abrirEdicion}
        onDelete={borrarProducto}
      />
    </div>
  );
}

export default App;
