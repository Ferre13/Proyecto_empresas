import axios from 'axios';

// Detectamos la IP actual para que funcione tanto en localhost como en red local
const API_URL = `http://${window.location.hostname}:8000`;

const api = axios.create({
  baseURL: API_URL,
});

// TOKEN DE DESARROLLO: Un token especial que el backend reconoce como 'test_user_id'
// Solo funciona si SKIP_BILLING_CHECK es True en el servidor
const DEV_TOKEN = "DEBUG_TOKEN";

// Interceptor para inyectar el token de Supabase en cada petición
api.interceptors.request.use((config) => {
  let token = localStorage.getItem('supabase_token');
  
  // Si no hay token guardado (no hemos hecho login real), usamos el de DEBUG
  if (!token) {
    token = DEV_TOKEN;
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
