# 🐾 PetsWorld App

App móvil híbrida para la red comunitaria de mascotas perdidas de PetsWorld. Construida con **React Native + Expo SDK 56**, conectada a una API REST en Laravel 11.

---

## 🏗️ Stack tecnológico

| Componente | Tecnología |
|---|---|
| Framework | React Native + Expo SDK 56 |
| Navegación | Expo Router (file-based) |
| Estado global | Context API (AuthContext, ReportsContext) |
| HTTP Client | Axios |
| Mapas | react-native-maps + Google Maps |
| Autenticación | Laravel Sanctum (tokens Bearer) |
| Storage seguro | expo-secure-store |
| GPS | expo-location |
| Cámara | expo-image-picker |

---

## 📋 Requisitos previos

- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- EAS CLI (`npm install -g eas-cli`)
- Cuenta en [expo.dev](https://expo.dev)
- App **PetsWorld** instalada en el celular (APK del dev build)

---

## ⚙️ Instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/tu-usuario/petsworld-app.git
cd petsworld-app

# 2. Instalar dependencias
npm install --legacy-peer-deps
```

---

## 🔧 Configuración

Edita `services/api.js` y cambia la IP por la de tu servidor:

```js
const api = axios.create({
  baseURL: 'http://TU_IP:8000/api',
});
```

Edita `services/adoptionApi.js` para el backend de adopciones:

```js
const adoptionApi = axios.create({
  baseURL: 'http://TU_IP:3000',
});
```

---

## 🚀 Levantar en desarrollo

```bash
# Modo desarrollo (requiere dev build instalado en el celular)
npx expo start --dev-client
```

Escanea el QR con la app **PetsWorld** instalada en tu celular (no con Expo Go).

> ⚠️ El celular y la computadora deben estar en la **misma red WiFi**.

---

## 📱 Pantallas de la app

### 🔐 Autenticación
- **Login** — Ingreso con email y contraseña
- **Registro** — Crear nueva cuenta

### 🗺️ Mapa (Tab principal)
- Mapa interactivo con Google Maps
- Marcadores de mascotas perdidas con círculo de radio de búsqueda
- Callout con info de la mascota al tocar un marcador
- Contacto directo por WhatsApp al dueño
- Funcionalidad **"🎯 ¡Encontré esta mascota!"** (Pokémon GO style)

### 📋 Reportes
- Lista paginada de reportes activos con pull-to-refresh
- Crear reporte con:
  - Selector de ubicación arrastrable en mapa
  - Radio de búsqueda (1-20 km)
  - Foto desde cámara o galería
  - GPS automático
- Editar reporte propio
- Marcar mascota como encontrada

### 🐾 Adopciones
- Lista de mascotas disponibles para adopción
- Consume el backend NestJS del sistema web
- Modal de detalle por mascota

### 👤 Perfil
- Datos del usuario autenticado
- Cerrar sesión

---

## 🎮 Funcionalidad Pokémon GO

El usuario puede reportar el avistamiento de una mascota perdida:

1. Toca el marcador en el mapa
2. Selecciona **"🎯 ¡Encontré esta mascota!"**
3. El GPS verifica que está dentro del radio de búsqueda
4. Confirma el avistamiento
5. La pokébola animada aparece mientras se procesa
6. Se registra el avistamiento en el backend
7. Se abre WhatsApp con un mensaje al dueño automáticamente

---

## 🏗️ Estructura del proyecto

```
petsworld-app/
├── app/
│   ├── _layout.jsx          ← Root layout (providers)
│   ├── index.jsx            ← Redirect según auth
│   ├── (auth)/
│   │   ├── login.jsx
│   │   └── register.jsx
│   └── (tabs)/
│       ├── index.jsx        ← Mapa principal
│       ├── reports.jsx      ← Lista y creación de reportes
│       ├── adoptions.jsx    ← Adopciones (NestJS)
│       └── profile.jsx      ← Perfil de usuario
├── components/
│   └── PokeballOverlay.jsx  ← Animación Pokémon GO
├── context/
│   ├── AuthContext.jsx      ← Estado de autenticación
│   └── ReportsContext.jsx   ← Estado de reportes
└── services/
    ├── api.js               ← Axios → Laravel (mascotas perdidas)
    └── adoptionApi.js       ← Axios → NestJS (adopciones)
```

---

## 📦 Build de producción

```bash
# Configurar EAS (primera vez)
eas build:configure

# Build de desarrollo (APK con Google Maps)
eas build --profile development --platform android

# Build de producción
eas build --profile production --platform android
```

---

## 🔗 Ecosistema PetsWorld

| Sistema | Repositorio | Función |
|---|---|---|
| **App móvil** | `petsworld-app` (este repo) | Red comunitaria de mascotas perdidas |
| **API móvil** | `petsworld-api` (Laravel) | Backend de mascotas perdidas |
| **Web** | `patsworld-backend` (NestJS) | Sistema de adopciones |

---

## 👨‍💻 Autor

Desarrollado como proyecto universitario para la materia **Aplicaciones Móviles Híbridas**.
Universidad Laica Eloy Alfaro de Manabí — Carrera de Software.
