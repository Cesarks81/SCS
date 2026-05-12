import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, register } from '../services/api';

export default function LoginPage() {
  const navigate = useNavigate();
  const [modo, setModo] = useState('login');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);
    setError('');
    try {
      if (modo === 'login') {
        await login(formData.email, formData.password);
      } else {
        await register(formData);
        await login(formData.email, formData.password);
      }
      navigate('/');
    } catch (err) {
      setError(err.message);
      // Borrar la contraseña al producirse un error
      setFormData((prev) => ({ ...prev, password: '' }));
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        <div className="flex justify-center mb-8">
          <img
            src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=500"
            alt="Logo"
            className="size-12"
          />
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-8">

          <h2 className="text-2xl font-black text-slate-900 mb-1">
            {modo === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
          </h2>
          <p className="text-sm text-slate-500 mb-6">
            {modo === 'login' ? 'Accede al sistema de inventario.' : 'Rellena los datos para registrarte.'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">

            {modo === 'register' && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Nombre</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Tu nombre"
                  className="w-full rounded-xl border-0 py-2.5 px-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm outline-none placeholder:text-slate-400 transition-all"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="correo@ejemplo.com"
                className="w-full rounded-xl border-0 py-2.5 px-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm outline-none placeholder:text-slate-400 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Contraseña</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="••••••••"
                className={`w-full rounded-xl border-0 py-2.5 px-3 text-slate-900 shadow-sm ring-1 ring-inset focus:ring-2 focus:ring-indigo-600 sm:text-sm outline-none placeholder:text-slate-400 transition-all ${
                  error ? 'ring-red-300 bg-red-50' : 'ring-slate-300'
                }`}
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
            )}

            <button
              type="submit"
              disabled={cargando}
              className="w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
            >
              {cargando
                ? 'Cargando...'
                : modo === 'login' ? 'Entrar' : 'Registrarse'}
            </button>

          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            {modo === 'login' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}{' '}
            <button
              type="button"
              onClick={() => { setModo(modo === 'login' ? 'register' : 'login'); setError(''); }}
              className="font-semibold text-indigo-600 hover:text-indigo-500 transition-colors"
            >
              {modo === 'login' ? 'Regístrate' : 'Inicia sesión'}
            </button>
          </p>

        </div>
      </div>
    </div>
  );
}
