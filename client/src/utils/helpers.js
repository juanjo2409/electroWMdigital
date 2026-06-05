/**
 * Helpers para almacenamiento genérico y de sesión
 */

export const getStorageItem = (key, fallback = null) => {
  const item = localStorage.getItem(key) || sessionStorage.getItem(key);
  if (!item) return fallback;
  try {
    return JSON.parse(item);
  } catch (e) {
    return item;
  }
};

export const setStorageItem = (key, value, persist = true) => {
  const stringified = typeof value === 'object' ? JSON.stringify(value) : value;
  if (persist) {
    localStorage.setItem(key, stringified);
  } else {
    sessionStorage.setItem(key, stringified);
  }
};

export const removeStorageItem = (key) => {
  localStorage.removeItem(key);
  sessionStorage.removeItem(key);
};

/**
 * Formatea un valor numérico a divisa USD
 */
export const formatCurrency = (value) => {
  if (value === undefined || value === null) return '';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(value);
};

/**
 * Formatea una fecha ISO en una representación local en español
 */
export const formatDate = (isoString) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};
