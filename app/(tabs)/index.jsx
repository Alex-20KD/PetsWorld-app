import React, { useEffect, useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Linking,
  Alert,
  Platform,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import MapView, { Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';

import { useReports } from '../../context/ReportsContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

// ─── Overlay components ──────────────────────────────────────
import PokeballOverlay from '../../components/PokeballOverlay';
import PetMarker from '../../components/map/PetMarker';
import MapHeader from '../../components/map/MapHeader';
import MapSearchBar from '../../components/map/MapSearchBar';
import MapFilterPanel from '../../components/map/MapFilterPanel';
import MapActionButtons from '../../components/map/MapActionButtons';

// ─── Custom map style ───────────────────────────────────────
import mapStyleLight from '../../constants/mapStyle';

// ─── Constants ───────────────────────────────────────────────
const defaultRegion = {
  latitude: -0.1807,
  longitude: -78.4678,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

// ─── Haversine: distance in km between two coordinates ──────
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Species mapping for filters ────────────────────────────
function speciesMatchesDog(species) {
  return !species || species.toLowerCase() === 'perro';
}
function speciesMatchesCat(species) {
  return species && species.toLowerCase() === 'gato';
}

export default function MapScreen() {
  const { reports, fetchReports, loading } = useReports();
  const { user } = useAuth();
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  const [hasGps, setHasGps] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [userCoords, setUserCoords] = useState(null);
  const mapRef = useRef(null);

  // ─── Capture state ────────────────────────────────────────
  const [capturing, setCapturing] = useState(false);
  const [captureMessage, setCaptureMessage] = useState('Procesando captura…');

  // ─── Filter & search state ────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    dogs: true,
    cats: true,
    lostOnly: false,
    foundOnly: false,
  });

  // ─── Selected marker state ────────────────────────────────
  const [selectedReport, setSelectedReport] = useState(null);



  // ─── Init ─────────────────────────────────────────────────
  useEffect(() => {
    initLocation();
    fetchReports();
  }, []);

  async function initLocation() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setPermissionDenied(true);
        return;
      }

      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setHasGps(true);
      setUserCoords({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      });

      mapRef.current?.animateToRegion(
        {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        },
        1000,
      );
    } catch (e) {
      console.warn('Error obteniendo ubicación:', e);
    }
  }

  // ─── Helpers ──────────────────────────────────────────────

  function statusLabel(s) {
    switch (s) {
      case 'perdido':
      case 'active':
        return 'Perdido';
      case 'encontrado':
      case 'found':
        return 'Encontrado';
      case 'en_busqueda':
        return 'En búsqueda';
      case 'cancelled':
        return 'Cancelado';
      default:
        return s || 'Desconocido';
    }
  }

  // ─── Filtered reports ─────────────────────────────────────

  const reportsList = Array.isArray(reports) ? reports : [];

  const filteredReports = useMemo(() => {
    let list = reportsList.filter(
      (r) => r.latitude != null && r.longitude != null,
    );

    // Species filter
    list = list.filter((r) => {
      const isDog = speciesMatchesDog(r.species);
      const isCat = speciesMatchesCat(r.species);
      if (isDog && !filters.dogs) return false;
      if (isCat && !filters.cats) return false;
      // Other species always pass if not dog/cat
      return true;
    });

    // Status filters (mutually exclusive)
    if (filters.lostOnly) {
      list = list.filter(
        (r) => r.status === 'active' || r.status === 'perdido' || r.status === 'en_busqueda',
      );
    }
    if (filters.foundOnly) {
      list = list.filter(
        (r) => r.status === 'found' || r.status === 'encontrado',
      );
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (r) =>
          (r.pet_name && r.pet_name.toLowerCase().includes(q)) ||
          (r.species && r.species.toLowerCase().includes(q)) ||
          (r.description && r.description.toLowerCase().includes(q)),
      );
    }

    return list;
  }, [reportsList, filters, searchQuery]);

  // ─── Marker tap handler ───────────────────────────────────

  function handleMarkerPress(report) {
    setSelectedReport(report);

    const isActive =
      report.status === 'active' ||
      report.status === 'perdido' ||
      report.status === 'en_busqueda';
    const hasPhone = !!report.contact_phone;

    const buttons = [];

    if (isActive) {
      buttons.push({
        text: '🎯 ¡Encontré esta mascota!',
        onPress: () => handleCapture(report),
      });
    }

    if (hasPhone) {
      buttons.push({
        text: '💬 Contactar por WhatsApp',
        onPress: () => openWhatsApp(report.contact_phone, report.pet_name, report.species),
      });
    }

    buttons.push({ text: 'Cerrar', style: 'cancel' });

    Alert.alert(
      report.pet_name || 'Mascota perdida',
      `${report.species || 'Especie desconocida'}\n${statusLabel(report.status)}`,
      buttons,
    );
  }

  // ─── WhatsApp ─────────────────────────────────────────────

  function openWhatsApp(phone, petName, species) {
    if (!phone) return;
    const cleaned = phone.replace(/\D/g, '');
    const number = `593${cleaned.startsWith('0') ? cleaned.slice(1) : cleaned}`;
    const name = petName || 'tu mascota';
    const message = `¡Hola! Vi en PetsWorld que perdiste a ${name} (${species || 'mascota'}). ¿Puedo ayudarte a encontrarla? 🐾`;
    const url = `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
    Linking.openURL(url);
  }

  // ─── Capture "Pokémon GO" ─────────────────────────────────

  async function handleCapture(report) {
    try {
      setCaptureMessage('Obteniendo tu ubicación…');
      setCapturing(true);

      const { status: locStatus } = await Location.requestForegroundPermissionsAsync();
      if (locStatus !== 'granted') {
        setCapturing(false);
        Alert.alert('Permiso denegado', 'Necesitamos acceso a tu ubicación para verificar cercanía.');
        return;
      }

      const userPos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const userLat = userPos.coords.latitude;
      const userLon = userPos.coords.longitude;

      const reportLat = parseFloat(report.latitude);
      const reportLon = parseFloat(report.longitude);
      const radiusKm = report.radius_km || 5;

      const distance = haversineDistance(userLat, userLon, reportLat, reportLon);

      if (distance > radiusKm) {
        setCapturing(false);
        Alert.alert(
          '📍 Fuera del rango',
          `Debes acercarte más a la zona de búsqueda.\n\nEstás a ${distance.toFixed(1)} km. El radio de búsqueda es de ${radiusKm} km.`,
        );
        return;
      }

      setCapturing(false);

      Alert.alert(
        '🎯 Confirmar avistamiento',
        '¿Confirmas que viste a esta mascota en esta zona?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Confirmar',
            onPress: () => processCapture(report, userLat, userLon),
          },
        ],
      );
    } catch (error) {
      console.error('Error en handleCapture:', error);
      setCapturing(false);
      Alert.alert('Error', 'Ocurrió un error al verificar tu ubicación. Intenta de nuevo.');
    }
  }

  async function processCapture(report, userLat, userLon) {
    try {
      setCaptureMessage('🎯 ¡Registrando avistamiento!');
      setCapturing(true);

      try {
        await api.post(`/reports/${report.id}/capture`, {
          latitude: userLat,
          longitude: userLon,
        });
      } catch (apiError) {
        console.warn('Error en POST /capture:', apiError?.response?.data || apiError.message);
      }

      setCapturing(false);

      if (report.contact_phone) {
        const message = `¡Hola! Vi a ${report.pet_name || 'tu mascota'} cerca de tu zona de búsqueda. Comunícate conmigo para más información 🐾`;
        const number = `593${report.contact_phone.replace(/\D/g, '').replace(/^0/, '')}`;
        Linking.openURL(`https://wa.me/${number}?text=${encodeURIComponent(message)}`);
      }

      Alert.alert(
        '🎉 ¡Avistamiento registrado!',
        'El dueño fue notificado. ¡Gracias por ayudar a encontrar a esta mascota!',
      );

      fetchReports();
    } catch (error) {
      console.error('Error en processCapture:', error);
      setCapturing(false);
      Alert.alert('Error', 'Ocurrió un error al procesar la captura. Intenta de nuevo.');
    }
  }

  // ─── Action handlers ──────────────────────────────────────

  function handleCenterOnUser() {
    if (!userCoords) {
      Alert.alert('GPS', 'Esperando ubicación GPS…');
      initLocation();
      return;
    }
    mapRef.current?.animateToRegion(
      {
        latitude: userCoords.latitude,
        longitude: userCoords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      },
      800,
    );
  }

  function handleNavigateToSelected() {
    if (!selectedReport) return;
    const lat = parseFloat(selectedReport.latitude);
    const lng = parseFloat(selectedReport.longitude);
    const label = encodeURIComponent(selectedReport.pet_name || 'Mascota');
    const url = Platform.select({
      ios: `maps://app?daddr=${lat},${lng}&q=${label}`,
      android: `google.navigation:q=${lat},${lng}`,
    });
    Linking.openURL(url).catch(() => {
      Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`);
    });
  }



  // ─── Compute header height for search bar positioning ─────
  const headerHeight = isLandscape ? 60 : 90;
  const searchTop = headerHeight + 6;

  // ─── Render ───────────────────────────────────────────────

  if (permissionDenied) {
    return (
      <View style={styles.center}>
        <Text style={styles.gpsIcon}>📍</Text>
        <Text style={styles.gpsMessage}>Activa el GPS para ver el mapa</Text>
      </View>
    );
  }

  // DEBUG: verify custom map style import (remove after confirming)
  console.log('[PetMap] customMapStyle entries:', Array.isArray(mapStyleLight) ? mapStyleLight.length : 'NOT AN ARRAY', typeof mapStyleLight);

  return (
    <View style={styles.container}>
      {/* Full-screen map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        mapType="standard"
        initialRegion={defaultRegion}
        showsUserLocation={hasGps}
        showsMyLocationButton={false}
        customMapStyle={mapStyleLight}
      >
        {filteredReports.map((r) => (
          <React.Fragment key={r.id}>
            <PetMarker
              report={r}
              onPress={handleMarkerPress}
              isSelected={selectedReport?.id === r.id}
            />
            <Circle
              center={{
                latitude: parseFloat(r.latitude),
                longitude: parseFloat(r.longitude),
              }}
              radius={(r.radius_km || 5) * 1000}
              fillColor="rgba(45, 95, 62, 0.08)"
              strokeColor="rgba(45, 95, 62, 0.3)"
              strokeWidth={1.5}
            />
          </React.Fragment>
        ))}
      </MapView>

      {/* Loading indicator */}
      {loading && (
        <View style={[styles.loadingOverlay, { top: searchTop + 52 }]}>
          <ActivityIndicator size="small" color="#2D5F3E" />
          <Text style={styles.overlayText}>Cargando reportes…</Text>
        </View>
      )}

      {/* ─── Floating overlays ─────────────────────────────── */}

      <MapHeader
        isLandscape={isLandscape}
        onSettingsPress={() => router.push('/(tabs)/profile')}
      />

      <MapSearchBar
        value={searchQuery}
        onChange={setSearchQuery}
        topOffset={searchTop}
        isLandscape={isLandscape}
      />

      {/* Quick action pills */}
      <View
        style={[
          styles.quickActions,
          { top: searchTop + 50 },
          isLandscape && styles.quickActionsLandscape,
        ]}
      >
        <View style={styles.quickPill}>
          <Text style={styles.quickPillIcon}>🗺️</Text>
          <Text style={styles.quickPillText}>Vista de Zona</Text>
        </View>
        <View style={styles.quickPill}>
          <Text style={styles.quickPillIcon}>📍</Text>
          <Text style={styles.quickPillText}>Ruta Rápida</Text>
        </View>
        <TouchableOpacity
          style={[
            styles.quickPill,
            filters.foundOnly && styles.quickPillActive,
          ]}
          onPress={() =>
            setFilters((f) => ({
              ...f,
              foundOnly: !f.foundOnly,
              lostOnly: f.foundOnly ? f.lostOnly : false,
            }))
          }
          activeOpacity={0.7}
        >
          <Text style={styles.quickPillIcon}>👁️</Text>
          <Text
            style={[
              styles.quickPillText,
              filters.foundOnly && styles.quickPillTextActive,
            ]}
          >
            Vistos
          </Text>
        </TouchableOpacity>
      </View>

      <MapFilterPanel
        filters={filters}
        onFilterChange={setFilters}
        isLandscape={isLandscape}
      />

      <MapActionButtons
        onMyLocation={handleCenterOnUser}
        onNewReport={() => router.push('/(tabs)/reports')}
        onNavigate={handleNavigateToSelected}
        hasSelectedReport={!!selectedReport}
        isLandscape={isLandscape}
      />



      {/* PokeballOverlay — shown during capture processing */}
      <PokeballOverlay visible={capturing} message={captureMessage} />
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAF3E0',
  },
  gpsIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  gpsMessage: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  // Quick action pills
  quickActions: {
    position: 'absolute',
    left: 16,
    flexDirection: 'row',
    gap: 8,
    zIndex: 85,
  },
  quickActionsLandscape: {
    left: 24,
  },
  quickPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(250, 243, 224, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 18,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
      },
      android: { elevation: 2 },
    }),
  },
  quickPillActive: {
    backgroundColor: 'rgba(45, 95, 62, 0.9)',
  },
  quickPillIcon: {
    fontSize: 14,
  },
  quickPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2D5F3E',
  },
  quickPillTextActive: {
    color: '#FFFFFF',
  },
  // Loading overlay
  loadingOverlay: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 70,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: { elevation: 4 },
    }),
  },
  overlayText: {
    marginLeft: 8,
    color: '#6B7280',
    fontSize: 13,
  },
});
