export const BASE_URL = 'http://localhost:3001';

/**
 * Manejador común para realizar peticiones fetch y procesar respuestas/errores
 */
async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  
  const response = await fetch(url, { ...options, headers });
  
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Error ${response.status}`);
  }
  
  if (response.status === 204) {
    return true;
  }
  
  return await response.json();
}

/* Funciones para obtener información de Usuarios */
export async function apiFetchUsers() {
  return await request('/users');
}

export async function apiFetchUserByEmail(email) {
  const users = await request(`/users?email=${encodeURIComponent(email)}`);
  return users[0] || null;
}

/* Funciones CRUD para Electrodomésticos (Productos) */
export async function apiFetchProducts() {
  return await request('/products');
}

export async function apiFetchProductById(id) {
  return await request(`/products/${id}`);
}

export async function apiCreateProduct(data) {
  return await request('/products', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function apiUpdateProduct(id, data) {
  return await request(`/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}

export async function apiPatchProduct(id, data) {
  return await request(`/products/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  });
}

export async function apiDeleteProduct(id) {
  return await request(`/products/${id}`, {
    method: 'DELETE'
  });
}
