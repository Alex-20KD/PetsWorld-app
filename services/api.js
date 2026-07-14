import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'petsworld_token';

const api = axios.create({
  baseURL: 'http://192.168.1.9:8000/api', // <-- IP actualizada
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

export default api;
export { TOKEN_KEY };
