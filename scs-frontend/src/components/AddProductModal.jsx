import { useState, useEffect } from 'react';

const EMOJIS_TECH = ['💻', '🖥️', '📱', '⌨️', '🖱️', '🖨️', '🎧', '📦', '🗄️', '🛠️', '🔌', '🔋'];

export default function AddProductModal({
  isOpen,
  onClose,
  onProductoGuardado,
  productoAEditar,
  warehouses: warehousesProp = [],
  onWarehouseCreado,
}) {
  const initialState = {
    type: 'individual',
    model: '',
    serial_number: '',
    category: '',
    warehouse_id: '',
    status: 'Óptimo',
    current_stock: 0,
    stock_min: 0,
    stock_max: 0,
    stock_safety: 0,
    image_url: '',
    emoji: '',
    attributes: {},
  };

  const [formData, setFormData] = useState(initialState);
  const [nuevaCarac, setNuevaCarac] = useState({ clave: '', valor: '' });
  const [mostrarEmojis, setMostrarEmojis] = useState(false);
  const [warehouses, setWarehouses] = useState(warehousesProp);

  useEffect(() => {
    setWarehouses(warehousesProp);
  }, [warehousesProp]);

  useEffect(() => {
    if (productoAEditar) {
      setFormData({ ...initialState, ...productoAEditar });
    } else {
      setFormData(initialState);
    }
    setMostrarEmojis(false);
  }, [productoAEditar, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      const MAX = 800;
      const scale = Math.min(1, MAX / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(objectUrl);
      const base64 = canvas.toDataURL('image/jpeg', 0.75);
      setFormData((prev) => ({ ...prev, image_url: base64, emoji: '' }));
    };
    img.src = objectUrl;
  };

  const handleEmojiSelect = (emojiSeleccionado) => {
    setFormData({ ...formData, emoji: emojiSeleccionado, image_url: '' });
    setMostrarEmojis(false);
  };

  const handleAñadirEspecificacion = () => {
    if (!nuevaCarac.clave.trim() || !nuevaCarac.valor.trim()) return;
    setFormData({
      ...formData,
      attributes: { ...formData.attributes, [nuevaCarac.clave]: nuevaCarac.valor },
    });
    setNuevaCarac({ clave: '', valor: '' });
  };

  const handleBorrarEspecificacion = (claveAborrar) => {
    const nuevas = { ...formData.attributes };
    delete nuevas[claveAborrar];
    setFormData({ ...formData, attributes: nuevas });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onProductoGuardado(formData);
    setNuevaCarac({ clave: '', valor: '' });
  };

  return (
    <div className="relative z-50" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm transition-opacity"></div>
      <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
          <div className="relative transform flex flex-col max-h-[90vh] overflow-hidden rounded-3xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-lg border border-slate-100">

            {/* Header */}
            <div className="shrink-0 bg-slate-50 px-4 py-4 sm:px-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold leading-6 text-slate-900">
                {productoAEditar ? 'Editar Producto' : 'Registrar Nuevo Producto'}
              </h3>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-500 transition-colors">
                <svg className="size-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto px-4 py-5 sm:p-6 space-y-6">

                {/* Tipo */}
                <div className="flex p-1 space-x-1 bg-slate-100/80 rounded-xl">
                  {['individual', 'countable'].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setFormData({ ...formData, type: t })}
                      className={`w-full rounded-lg py-2 text-sm font-semibold transition-all ${
                        formData.type === t
                          ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      {t === 'individual' ? 'Producto Individual' : 'Lote / Grupo'}
                    </button>
                  ))}
                </div>

                {/* Modelo + Imagen */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700">Nombre / Modelo</label>
                    <input
                      type="text"
                      name="model"
                      value={formData.model}
                      onChange={handleChange}
                      required
                      className="mt-1 w-full rounded-lg border-0 py-2 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm outline-none placeholder:text-slate-400 transition-all"
                      placeholder={formData.type === 'countable' ? 'Ej: Ratones Inalámbricos Logitech' : 'Ej: HP 840 G3'}
                    />
                  </div>

                  {/* Imagen / Emoji */}
                  <div className="relative">
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Imagen o Icono (Opcional)</label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        name="image_url"
                        value={formData.image_url}
                        onChange={handleChange}
                        disabled={!!formData.emoji}
                        className="flex-1 rounded-lg border-0 py-2 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm outline-none disabled:bg-slate-50 disabled:text-slate-400 placeholder:text-slate-400 transition-all"
                        placeholder={formData.emoji ? 'Icono seleccionado' : 'https://ejemplo.com/foto.jpg'}
                      />
                      <label className="flex shrink-0 cursor-pointer items-center justify-center rounded-lg bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 transition-colors" title="Subir foto desde PC">
                        <svg className="size-5 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                        </svg>
                        <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                      </label>
                      <button
                        type="button"
                        onClick={() => setMostrarEmojis(!mostrarEmojis)}
                        className="flex shrink-0 items-center justify-center rounded-lg bg-white px-3 py-2 text-sm font-semibold shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 transition-colors"
                      >
                        {formData.emoji || '😀'}
                      </button>
                    </div>

                    {mostrarEmojis && (
                      <div className="absolute right-0 top-full mt-2 p-2 bg-white rounded-xl shadow-xl ring-1 ring-slate-900/5 z-20 w-48 grid grid-cols-4 gap-1">
                        {EMOJIS_TECH.map((em) => (
                          <button key={em} type="button" onClick={() => handleEmojiSelect(em)} className="text-xl hover:bg-slate-100 rounded-lg p-1.5 transition-colors">
                            {em}
                          </button>
                        ))}
                        <button type="button" onClick={() => handleEmojiSelect('')} className="col-span-4 text-xs font-bold text-slate-400 hover:text-slate-600 mt-1">
                          Quitar Icono
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <hr className="border-slate-100" />

                {/* Campos principales */}
                <div className="grid grid-cols-2 gap-4">

                  {formData.type === 'individual' && (
                    <div className="col-span-2">
                      <label className="block text-sm font-semibold text-slate-700">Número de Serie (S/N)</label>
                      <input
                        type="text"
                        name="serial_number"
                        value={formData.serial_number}
                        onChange={handleChange}
                        required={formData.type === 'individual'}
                        className="mt-1 w-full rounded-lg border-0 py-2 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm outline-none placeholder:text-slate-400 transition-all"
                        placeholder="Ej: 98H9H034H"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-semibold text-slate-700">Categoría</label>
                    <input
                      type="text"
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      required
                      className="mt-1 w-full rounded-lg border-0 py-2 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm outline-none placeholder:text-slate-400 transition-all"
                      placeholder="Ej: Portátiles"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700">Estado</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="mt-1 w-full rounded-lg border-0 py-2 pl-3 pr-10 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm outline-none"
                    >
                      <option value="Óptimo">Óptimo</option>
                      <option value="En reparación">En reparación</option>
                      <option value="Asignado">Asignado</option>
                      <option value="De baja">De baja</option>
                    </select>
                  </div>

                  {/* ── Almacén ── */}
                  <div className="col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Almacén / Ubicación</label>
                    <select
                      name="warehouse_id"
                      value={formData.warehouse_id}
                      onChange={handleChange}
                      required
                      className="w-full rounded-lg border-0 py-2 pl-3 pr-10 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm outline-none"
                    >
                      <option value="">Seleccionar almacén...</option>
                      {warehouses.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name} — {w.location}
                        </option>
                      ))}
                    </select>
                    {warehouses.length === 0 && (
                      <p className="mt-1 text-xs text-amber-600">No hay almacenes. Créalos desde Estadísticas → Ajustes.</p>
                    )}
                  </div>

                  {/* Cantidad inicial (solo al crear, no al editar) */}
                  {formData.type === 'countable' && !productoAEditar && (
                    <div className="col-span-2">
                      <label className="block text-sm font-semibold text-slate-700">Cantidad inicial</label>
                      <input
                        type="number"
                        name="current_stock"
                        min="0"
                        value={formData.current_stock}
                        onChange={handleChange}
                        required
                        className="mt-1 w-full rounded-lg border-0 py-2 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm outline-none"
                        placeholder="Ej: 34"
                      />
                      <p className="mt-1 text-xs text-slate-400">Número de unidades disponibles al registrar el lote</p>
                    </div>
                  )}

                  {/* Stock (solo para countable) */}
                  {formData.type === 'countable' && (
                    <>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700">Stock mínimo</label>
                        <input type="number" name="stock_min" min="0" value={formData.stock_min} onChange={handleChange} required
                          className="mt-1 w-full rounded-lg border-0 py-2 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm outline-none" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700">Stock máximo</label>
                        <input type="number" name="stock_max" min="0" value={formData.stock_max} onChange={handleChange} required
                          className="mt-1 w-full rounded-lg border-0 py-2 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm outline-none" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700">Stock de seguridad</label>
                        <input type="number" name="stock_safety" min="0" value={formData.stock_safety} onChange={handleChange} required
                          className="mt-1 w-full rounded-lg border-0 py-2 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm outline-none" />
                      </div>
                    </>
                  )}
                </div>

                <hr className="border-slate-100" />

                {/* Atributos */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Atributos Extra (Opcional)</label>
                  {Object.keys(formData.attributes).length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {Object.entries(formData.attributes).map(([clave, valor]) => (
                        <span key={clave} className="inline-flex items-center gap-1.5 rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-700/10">
                          <span className="font-bold">{clave}:</span> {valor}
                          <button type="button" onClick={() => handleBorrarEspecificacion(clave)} className="hover:text-indigo-900 ml-1">
                            <svg className="size-3" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <input type="text" placeholder="Atributo (Ej: Color)" value={nuevaCarac.clave}
                        onChange={(e) => setNuevaCarac({ ...nuevaCarac, clave: e.target.value })}
                        className="hidden min-[456px]:block w-full rounded-lg border-0 py-2 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm outline-none placeholder:text-slate-400 transition-all" />
                      <input type="text" placeholder="Clave" value={nuevaCarac.clave}
                        onChange={(e) => setNuevaCarac({ ...nuevaCarac, clave: e.target.value })}
                        className="block min-[456px]:hidden w-full rounded-lg border-0 py-2 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm outline-none placeholder:text-slate-400 transition-all" />
                    </div>
                    <div className="flex-1">
                      <input type="text" placeholder="Valor (Ej: Negro)" value={nuevaCarac.valor}
                        onChange={(e) => setNuevaCarac({ ...nuevaCarac, valor: e.target.value })}
                        className="hidden min-[456px]:block w-full rounded-lg border-0 py-2 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm outline-none placeholder:text-slate-400 transition-all" />
                      <input type="text" placeholder="Valor" value={nuevaCarac.valor}
                        onChange={(e) => setNuevaCarac({ ...nuevaCarac, valor: e.target.value })}
                        className="block min-[456px]:hidden w-full rounded-lg border-0 py-2 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm outline-none placeholder:text-slate-400 transition-all" />
                    </div>
                    <button type="button" onClick={handleAñadirEspecificacion}
                      className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-200 transition-colors">
                      Añadir
                    </button>
                  </div>
                </div>

              </div>

              {/* Footer */}
              <div className="shrink-0 bg-slate-50 px-4 py-4 sm:flex sm:flex-row-reverse sm:px-6 border-t border-slate-100">
                <button type="submit"
                  className="inline-flex w-full justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 sm:ml-3 sm:w-auto transition-all">
                  Guardar Producto
                </button>
                <button onClick={onClose} type="button"
                  className="mt-3 inline-flex w-full justify-center rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 sm:mt-0 sm:w-auto transition-all">
                  Cancelar
                </button>
              </div>
            </form>

          </div>
        </div>
      </div>
    </div>
  );
}
