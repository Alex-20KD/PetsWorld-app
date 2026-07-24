function normalizeBaseUrl(value) {
  return value.replace(/\/+$/, '');
}

// Solo URLs públicas: Expo incorpora las variables EXPO_PUBLIC_* en la app.
export const CORE_API_URL = normalizeBaseUrl(
  process.env.EXPO_PUBLIC_CORE_API_URL || 'http://192.168.1.9:8000/api',
);

export const ADOPTIONS_API_URL = normalizeBaseUrl(
  process.env.EXPO_PUBLIC_ADOPTIONS_API_URL || 'https://patsworld-backend.onrender.com',
);
