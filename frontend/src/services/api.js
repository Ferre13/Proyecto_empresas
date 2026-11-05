import axios from 'axios';

// Detectamos la URL de la API mediante variable de entorno o fallback dinámico
const API_URL = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:8000`;

const api = axios.create({
  baseURL: API_URL,
});

// Interceptor para inyectar el token real de Supabase en cada petición
api.interceptors.request.use((config) => {
  let token = null;
  try {
    token = localStorage.getItem('supabase_token');
  } catch (e) {
    console.warn("Storage access restricted:", e);
  }
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const createCheckoutSession = async () => {
  const response = await api.post('/billing/create-checkout-session');
  return response.data;
};

export const createPortalSession = async () => {
  const response = await api.post('/billing/create-portal-session');
  return response.data;
};

export default api;
