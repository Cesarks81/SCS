const BASE_URL = '/api';

// ─── Auth ──────────────────────────────────────────────────────────────────

export const login = async (email, password) => {
  const body = new URLSearchParams({ username: email, password });
  const res = await fetch(`${BASE_URL}/auth/login`, { method: 'POST', body });
  if (!res.ok) throw new Error('Credenciales incorrectas');
  const data = await res.json();
  localStorage.setItem('token', data.access_token);
  return data;
};

export const register = async ({ name, email, password, role = 'user' }) => {
  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password, role }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Error al registrar');
  }
  return res.json();
};

export const logout = () => localStorage.removeItem('token');

export const isAuthenticated = () => !!localStorage.getItem('token');

// ─── Helper interno ────────────────────────────────────────────────────────

const authFetch = async (path, options = {}) => {
  const token = localStorage.getItem('token');
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (res.status === 401) {
    logout();
    window.location.reload();
    return;
  }

  if (!res.ok && res.status !== 204) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Error ${res.status}`);
  }

  if (res.status === 204) return null;
  return res.json();
};

// ─── Warehouses ────────────────────────────────────────────────────────────

export const getWarehouses = () => authFetch('/warehouses');

export const createWarehouse = (data) =>
  authFetch('/warehouses', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const deleteWarehouse = (id) =>
  authFetch(`/warehouses/${id}`, { method: 'DELETE' });

// ─── Products ──────────────────────────────────────────────────────────────

export const getProducts = (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.category)    params.set('category', filters.category);
  if (filters.warehouse_id) params.set('warehouse_id', filters.warehouse_id);
  const qs = params.toString();
  return authFetch(`/products${qs ? `?${qs}` : ''}`);
};

export const getProduct = (id) => authFetch(`/products/${id}`);

export const createProduct = (data) =>
  authFetch('/products', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const updateProduct = (id, data) =>
  authFetch(`/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

export const deleteProduct = (id) =>
  authFetch(`/products/${id}`, { method: 'DELETE' });

// ─── Movements ─────────────────────────────────────────────────────────────

export const getMovements = (productId) =>
  authFetch(`/movements/${productId}`);

// type: 'in' | 'out'
// reason: string
// quantity: number (> 0)
// device_item_ids: string[] (opcional, para productos individuales)
export const createMovement = (data) =>
  authFetch('/movements', {
    method: 'POST',
    body: JSON.stringify(data),
  });
