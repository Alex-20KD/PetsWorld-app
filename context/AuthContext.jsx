import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import api, { TOKEN_KEY } from '../services/api';

const AuthContext = createContext(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!token;

  // Al montar: verificar si hay un token guardado y validarlo
  useEffect(() => {
    loadStoredAuth();
  }, []);

  async function loadStoredAuth() {
    try {
      const storedToken = await SecureStore.getItemAsync(TOKEN_KEY);
      if (storedToken) {
        setToken(storedToken);
        // Validar el token contra la API
        const response = await api.get('/auth/me');
        setUser(response.data.data?.user || response.data.data || response.data);
      }
    } catch (error) {
      console.warn('Token inválido o expirado, limpiando sesión:', error);
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }

  async function login(email, password) {
    try {
      console.log('AUTH: login iniciado');
      const response = await api.post('/auth/login', { email, password });
      console.log('AUTH: respuesta recibida:', JSON.stringify(response.data));
      const { token: newToken, user: userData } = response.data.data;
      console.log('AUTH: token:', newToken, 'user:', JSON.stringify(userData));

      await SecureStore.setItemAsync(TOKEN_KEY, newToken);
      setToken(newToken);
      setUser(userData);

      console.log('AUTH: estado actualizado, retornando success');
      return { success: true };
    } catch (error) {
      console.log('AUTH: ERROR en login:', error.message);
      console.log('AUTH: error.response?.data:', JSON.stringify(error.response?.data));
      const message =
        error.response?.data?.message || 'Error al iniciar sesión. Intenta de nuevo.';
      return { success: false, error: message };
    }
  }

  async function register(email, password, full_name) {
    try {
      const response = await api.post('/auth/register', {
        email,
        password,
        full_name,
      });

      // No guardamos token ni actualizamos estado.
      // El usuario debe iniciar sesión manualmente después del registro.
      const message = response.data?.message || 'Cuenta creada exitosamente.';
      return { success: true, message };
    } catch (error) {
      const message =
        error.response?.data?.message || 'Error al registrarse. Intenta de nuevo.';
      return { success: false, error: message };
    }
  }

  async function logout() {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.warn('Error al cerrar sesión en servidor:', error);
    } finally {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      setToken(null);
      setUser(null);
    }
  }

  const value = {
    user,
    token,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;
