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

Crea un archivo `.env` en la raíz del proyecto. Las URLs están centralizadas en `services/serviceConfig.js`; no es necesario editar código ni cambiar la IP de la red local.

```env
EXPO_PUBLIC_CORE_API_URL=https://petsworld-api.onrender.com/api
EXPO_PUBLIC_ADOPTIONS_API_URL=https://patsworld-backend.onrender.com
```

Las variables `EXPO_PUBLIC_*` se integran al bundle de Expo. Si se modifican, reinicia Metro con `npx expo start -c`; para una APK de producción es necesario generar una nueva build.

---

## ☁️ Servicios desplegados y presentación

| Servicio | Tecnología | URL pública | Uso |
|---|---|---|---|
| API principal | Laravel + Sanctum | `https://petsworld-api.onrender.com/api` | Autenticación, reportes, mapa, estadísticas y perfil |
| API de adopciones | NestJS | `https://patsworld-backend.onrender.com` | Listado de mascotas y contacto de adopción |
| Base de datos y fotos | Supabase | Configurada solo en los backends | PostgreSQL y Storage |

Los dos backends son públicos, por lo que durante una presentación en la universidad no se debe sustituir ninguna URL por una IP local.

### Laravel en Render

Laravel se despliega mediante Docker con PHP 8.4, PDO PostgreSQL y GD. GD permite validar, recomprimir y eliminar metadatos de las fotografías antes de enviarlas a Supabase Storage.

Variables mínimas del servicio Laravel en Render:

```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://petsworld-api.onrender.com
CACHE_STORE=file
SESSION_DRIVER=file
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_KEY=solo_en_render
SUPABASE_BUCKET=lost-pets
```

`SUPABASE_SERVICE_KEY` es un secreto del servidor: nunca debe agregarse a este repositorio ni a la app móvil.

Antes del primer uso de la base de datos de producción, ejecuta en el Shell de Render:

```bash
php artisan migrate --force
```

### Verificaciones rápidas

```bash
curl https://petsworld-api.onrender.com/up
curl https://petsworld-api.onrender.com/api/stats
curl https://patsworld-backend.onrender.com/pets
```

Las fotografías aceptadas son JPG, JPEG, PNG o WebP, con un tamaño máximo de 5 MB y dimensiones de hasta 6000 × 6000 píxeles.

---

## 🚀 Levantar en desarrollo

```bash
# Limpia la caché de Metro y levanta la app
npx expo start -c
```

Escanea el QR con el cliente Expo o el development build configurado para el proyecto.

> Los backends están desplegados en Render; el celular no necesita estar en la misma red WiFi que la computadora para acceder a las APIs.

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

## 📦 Build de Producción y Simulación de Tiendas

Para simular el flujo real de despliegue en tiendas de aplicaciones (App Store / Google Play), el proyecto utiliza **EAS (Expo Application Services)**. A través de este servicio en la nube, empaquetamos el código y generamos los instalables nativos sin necesidad de subir la app a producción. 

Se utiliza un *Development Build* (Expo Client Dev) que nos permite testear el instalable nativo (APK) directamente en el celular, validando el funcionamiento de hardware (GPS, cámara) exactamente como lo haría el usuario final.

# Configurar la conexión con la nube de Expo
eas build:configure

# Simulación de despliegue: Build de desarrollo (APK con Google Maps nativo)
eas build --profile development --platform android

# Empaquetado final de producción (listo para la Play Store)
eas build --profile production --platform android
---

## 🔗 Ecosistema PetsWorld

| Sistema | Repositorio | Función |
|---|---|---|
| **App móvil** | `petsworld-app` (este repo) | Aplicación React Native / Expo |
| **API principal** | `petsworld-api` (Laravel) | Autenticación, reportes, mapa, estadísticas y fotos |
| **API de adopciones** | `patsworld-backend` (NestJS) | Mascotas en adopción y contacto por WhatsApp |
| **Frontend web** | `patsworld-frontend` (Angular) | Interfaz web del proyecto |

---

## 👨‍💻 Autor

Desarrollado como proyecto universitario para la materia **Aplicaciones Móviles Híbridas**.
Universidad Laica Eloy Alfaro de Manabí — Carrera de Software.
