import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { CORE_API_URL } from './serviceConfig';

const TOKEN_KEY = 'petsworld_token';

const api = axios.create({
  baseURL: CORE_API_URL,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
});

// Interceptor de request: agrega el token Bearer si existe
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.warn('Error leyendo token de SecureStore:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de response: si 401 limpia el token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      try {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
      } catch (e) {
        console.warn('Error eliminando token en 401:', e);
      }
    }
    return Promise.reject(error);
  }
);

export async function fetchStats() {
  try {
    const response = await api.get('/stats');
    return response.data.data;
  } catch (error) {
    return {
      total_reports: 0,
      active_reports: 0,
      rescued_pets: 0,
      total_users: 0,
    };
  }
}

export async function fetchAdminStats() {
  const response = await api.get('/admin/stats');
  return response.data.data;
}

export async function fetchAdminUsers() {
  const response = await api.get('/admin/users');
  return response.data.data;
}

export default api;
export { TOKEN_KEY };
