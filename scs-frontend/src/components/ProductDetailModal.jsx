import { useState, useEffect } from 'react';
import SecureImg from './SecureImg';
import { createMovement } from '../services/api';

const MOV_INIT = { open: false, type: 'in', quantity: 1, reason: '', loading: false, error: '' };

export default function ProductDetailModal({ isOpen, producto, onClose, onEdit, onDelete, onMovimiento }) {
  const [movForm, setMovForm] = useState(MOV_INIT);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen || !producto) return null;

  const abrirForm = (type) => setMovForm({ ...MOV_INIT, open: true, type });
  const cerrarForm = () => setMovForm(MOV_INIT);

  const handleMovimiento = async () => {
    if (movForm.quantity < 1) return;
    setMovForm((f) => ({ ...f, loading: true, error: '' }));
    try {
      await createMovement({
        product_id: producto.id,
        type: movForm.type,
        quantity: Number(movForm.quantity),
        reason: movForm.reason || (movForm.type === 'in' ? 'Entrada' : 'Salida'),
      });
      cerrarForm();
      if (onMovimiento) onMovimiento(producto.id);
    } catch (e) {
      setMovForm((f) => ({ ...f, loading: false, error: e.message }));
    }
  };

  return (
    <div className="relative z-50" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

      <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">

          <div className="relative transform overflow-hidden rounded-3xl bg-white text-left shadow-2xl transition-all sm:my-8 w-full max-w-3xl border border-slate-100 flex flex-col md:flex-row">

            <button onClick={onClose} className="absolute top-4 right-4 z-20 rounded-full bg-white/80 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all backdrop-blur-md">
              <svg className="size-6" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Columna izquierda: imagen y botones */}
            <div className="md:w-2/5 bg-slate-50 p-6 flex flex-col items-center border-b md:border-b-0 md:border-r border-slate-100">
              <div className="relative w-full aspect-square rounded-2xl bg-white shadow-sm ring-1 ring-slate-900/5 flex items-center justify-center p-4 mb-6">
                {producto.emoji ? (
                  <div className="w-full h-full flex items-center justify-center text-9xl select-none">
                    {producto.emoji}
                  </div>
                ) : (
                  <SecureImg src={producto.image_url} alt={producto.model} className="w-full h-full object-contain" />
                )}
              </div>

              <div className="flex w-full gap-3 mt-auto">
                <button
                  onClick={() => onDelete(producto.id)}
                  className="flex-1 rounded-lg border border-red-200 bg-red-50 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-100 transition-colors shadow-sm"
                >
                  Borrar
                </button>
                <button
                  onClick={() => onEdit(producto)}
                  className="flex-1 rounded-lg border border-slate-200 bg-white py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
                >
                  Editar
                </button>
              </div>
            </div>

            {/* Columna derecha: información */}
            <div className="md:w-3/5 p-6 sm:p-8 flex flex-col overflow-y-auto">

              <div className="mb-8 pr-8">
                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-3
                  ${producto.status === 'Óptimo' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                  <span className={`size-1.5 rounded-full ${producto.status === 'Óptimo' ? 'bg-green-500' : 'bg-amber-500'} animate-pulse`}></span>
                  {producto.status}
                </div>
                <h2 className="text-3xl font-black text-slate-900 leading-tight">{producto.model}</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                <div className="flex flex-col border-b sm:border-b-0 border-slate-100 pb-3 sm:pb-0">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nombre / Modelo</span>
                  <span className="text-base font-medium text-slate-800 mt-1">{producto.model}</span>
                </div>

                {producto.serial_number && (
                  <div className="flex flex-col border-b sm:border-b-0 border-slate-100 pb-3 sm:pb-0">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Número de Serie (S/N)</span>
                    <code className="text-base font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md self-start mt-1">
                      {producto.serial_number}
                    </code>
                  </div>
                )}

                {producto.category && (
                  <div className="flex flex-col border-b sm:border-b-0 border-slate-100 pb-3 sm:pb-0">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Categoría</span>
                    <span className="text-base font-medium text-slate-800 mt-1">{producto.category}</span>
                  </div>
                )}

                {/* Stock info para countable */}
                {producto.type === 'countable' && (
                  <div className="flex flex-col border-b sm:border-b-0 border-slate-100 pb-3 sm:pb-0 sm:col-span-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Stock actual</span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-2xl font-black text-slate-900">{producto.current_stock}</span>
                      <span className="text-xs text-slate-400">
                        mín {producto.stock_min} · máx {producto.stock_max} · seg {producto.stock_safety}
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          producto.current_stock <= producto.stock_safety
                            ? 'bg-red-400'
                            : producto.current_stock <= producto.stock_min
                            ? 'bg-amber-400'
                            : 'bg-green-400'
                        }`}
                        style={{
                          width: `${Math.min(100, (producto.current_stock / (producto.stock_max || 1)) * 100)}%`,
                        }}
                      />
                    </div>

                    {/* Botones entrada / salida */}
                    {!movForm.open && (
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => abrirForm('in')}
                          className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-green-50 border border-green-200 py-2 text-sm font-semibold text-green-700 hover:bg-green-100 transition-colors"
                        >
                          <svg className="size-4" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                          </svg>
                          Entrada
                        </button>
                        <button
                          onClick={() => abrirForm('out')}
                          className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-red-50 border border-red-200 py-2 text-sm font-semibold text-red-600 hover:bg-red-100 transition-colors"
                        >
                          <svg className="size-4" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
                          </svg>
                          Salida
                        </button>
                      </div>
                    )}

                    {/* Formulario inline de movimiento */}
                    {movForm.open && (
                      <div className={`mt-3 rounded-xl p-4 space-y-3 ring-1 ${
                        movForm.type === 'in'
                          ? 'bg-green-50 ring-green-100'
                          : 'bg-red-50 ring-red-100'
                      }`}>
                        <p className={`text-xs font-bold uppercase tracking-wider ${
                          movForm.type === 'in' ? 'text-green-700' : 'text-red-600'
                        }`}>
                          {movForm.type === 'in' ? 'Registrar entrada' : 'Registrar salida'}
                        </p>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            min="1"
                            value={movForm.quantity}
                            onChange={(e) => setMovForm((f) => ({ ...f, quantity: e.target.value }))}
                            placeholder="Cantidad"
                            className="w-24 rounded-lg border-0 py-2 px-3 text-sm text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-indigo-600 outline-none"
                          />
                          <input
                            type="text"
                            value={movForm.reason}
                            onChange={(e) => setMovForm((f) => ({ ...f, reason: e.target.value }))}
                            placeholder="Motivo (opcional)"
                            className="flex-1 rounded-lg border-0 py-2 px-3 text-sm text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-indigo-600 outline-none placeholder:text-slate-400"
                          />
                        </div>
                        {movForm.error && (
                          <p className="text-xs text-red-600 font-medium">{movForm.error}</p>
                        )}
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={cerrarForm}
                            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-white/60 transition-colors"
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={handleMovimiento}
                            disabled={movForm.loading || movForm.quantity < 1}
                            className={`rounded-lg px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-60 transition-colors ${
                              movForm.type === 'in'
                                ? 'bg-green-600 hover:bg-green-500'
                                : 'bg-red-500 hover:bg-red-400'
                            }`}
                          >
                            {movForm.loading ? 'Guardando...' : 'Confirmar'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Almacén si viene hydratado con nombre */}
                {producto.warehouse_name && (
                  <div className="flex flex-col border-b sm:border-b-0 border-slate-100 pb-3 sm:pb-0 sm:col-span-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Almacén</span>
                    <span className="text-lg font-bold text-red-500 mt-1">{producto.warehouse_name}</span>
                  </div>
                )}
              </div>

              {/* Atributos */}
              <div className="mt-auto">
                <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <svg className="size-4 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
                  </svg>
                  Atributos
                </h3>

                {producto.attributes && Object.keys(producto.attributes).length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl ring-1 ring-slate-100">
                    {Object.entries(producto.attributes).map(([clave, valor]) => (
                      <div key={clave} className="flex flex-col bg-white p-2.5 rounded-lg shadow-sm border border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{clave}</span>
                        <span className="text-sm font-semibold text-slate-700">{valor}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-slate-500 italic bg-slate-50 p-4 rounded-xl border border-dashed border-slate-200 text-center">
                    No hay atributos adicionales registrados.
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
