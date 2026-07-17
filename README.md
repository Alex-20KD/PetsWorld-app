# 🐾 PetsWorld App

App móvil híbrida y responsive para la red comunitaria de mascotas perdidas de PetsWorld. Construida con **React Native + Expo SDK 56**, conectada a una API REST en Laravel 11.

---

## 🌟 Características Destacadas (Nuevas Features)

- **Diseño Responsive & Premium:** Adaptación perfecta a tablets y pantallas en modo *landscape*, usando un sistema de diseño corporativo elegante (colores vivos, tipografía serif, fondos cálidos, linear gradients).
- **Dashboard de Administrador:** Panel de administración dedicado (`/admin`) exclusivo para administradores. Estadísticas globales (usuarios, reportes activos, mascotas rescatadas, baneados), Top Rescatadores con medallas y lista de usuarios registrados.
- **Sistema de Recompensas (Rewards):** Los dueños pueden agregar una recompensa económica al crear un reporte. Las cards de reporte muestran el badge de recompensa.
- **Captura "Pokémon GO":** El usuario puede reportar avistamientos acercándose al área de pérdida, validado por GPS (Fórmula de Haversine). Efectos inmersivos (Pokeball overlay) y notificaciones automáticas por WhatsApp.
- **Ubicaciones Exactas/Aproximadas:** Soporte visual en mapas (callouts) y cards de reportes indicando la precisión de la ubicación.
- **Estadísticas Públicas en Adopciones:** Banner flotante integrado en la pestaña de Adopciones, mostrando en tiempo real los rescates y reportes activos, sin necesidad de token.

---

## 🏗️ Stack Tecnológico

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

Edita `services/api.js` y cambia la IP por la de tu servidor principal:

```js
const api = axios.create({
  baseURL: 'http://TU_IP:8000/api',
});
```

Edita `services/adoptionApi.js` para el backend secundario de adopciones:

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

## 📱 Pantallas de la App

### 🔐 Autenticación
- **Login** — Ingreso con email y contraseña, interfaz adaptativa para tablet (split layout horizontal).
- **Registro** — Crear nueva cuenta.

### 🗺️ Mapa (Tab principal)
- Mapa interactivo premium con colores de naturaleza.
- Marcadores de mascotas perdidas con círculo de radio de búsqueda.
- Callouts nativos con precisión de ubicación (exacta/aprox).
- Menú flotante (Quick Actions, barra de búsqueda custom y panel de filtros).
- Contacto directo por WhatsApp al dueño.
- Funcionalidad **"🎯 ¡Encontré esta mascota!"** con verificación GPS en tiempo real.

### 📋 Reportes
- Diseño en Grid dinámico (2 columnas en landscape/tablets, 1 en móviles).
- Badges de recompensa y precisión de ubicación.
- Crear/Editar reporte completo:
  - Toggle de recompensa (monto y descripción).
  - Selector de ubicación nativo e interactivo.
  - Foto de la mascota.
- Marcar mascota como encontrada.

### 🐾 Adopciones
- Lista de mascotas en adopción.
- **Banner horizontal de estadísticas públicas.**
- Componentes unificados y layout responsive.
- Modal profundo con detalles del animal.

### 👤 Perfil & Admin
- Datos del usuario autenticado (Avatar, Rol, Fecha de registro).
- **Panel de Administración (`/admin`):**
  - Grid de KPI administrativos (usuarios activos, baneados, rescates).
  - Listado "Top Rescatadores".
  - Monitor de usuarios registrados.
- Cerrar sesión.

---

## 🎮 Funcionalidad Pokémon GO

El usuario puede reportar el avistamiento de una mascota perdida en el entorno real:

1. Toca el marcador en el mapa.
2. Selecciona **"🎯 ¡Encontré esta mascota!"**.
3. El GPS verifica que el usuario esté físicamente dentro del radio de búsqueda definido.
4. Confirma el avistamiento.
5. Se muestra la Pokébola animada (`PokeballOverlay`) mientras procesa.
6. El avistamiento se almacena en el backend y notifica vía WhatsApp.

---

## 🏗️ Estructura del Proyecto

```
petsworld-app/
├── app/
│   ├── _layout.jsx          ← Root layout & Theme
│   ├── index.jsx            ← Entry redirect
│   ├── (auth)/              ← Flujos de autenticación
│   └── (tabs)/              ← Tabs principales de la app
│       ├── index.jsx        ← Mapa (PetMap)
│       ├── reports.jsx      ← Módulo de Reportes
│       ├── adoptions.jsx    ← Módulo de Adopciones
│       ├── profile.jsx      ← Perfil del Usuario
│       └── admin.jsx        ← Dashboard Admin
├── components/              ← Componentes UI reutilizables
├── constants/               ← Constantes y estilos globales
├── context/                 ← Estados (AuthContext, ReportsContext)
└── services/                ← Clientes HTTP
```

---

## 📦 Build de Producción

```bash
# Configurar EAS
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
| **API móvil** | `petsworld-api` (Laravel) | Backend principal de la red |
| **Web** | `patsworld-backend` (NestJS) | Sistema secundario de adopciones |

---

## 👨‍💻 Autor

Desarrollado como proyecto universitario para la materia **Aplicaciones Móviles Híbridas**.
Universidad Laica Eloy Alfaro de Manabí — Carrera de Software.
