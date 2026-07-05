import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Linking,
  Alert,
  Platform,
} from 'react-native';
import MapView, { Marker, Callout, Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';

import { useReports } from '../../context/ReportsContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import PokeballOverlay from '../../components/PokeballOverlay';

// Región por defecto (Quito) — se usa mientras el GPS resuelve
const defaultRegion = {
  latitude: -0.1807,
  longitude: -78.4678,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

// ─── Haversine: distancia en km entre dos coordenadas ────────
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

export default function MapScreen() {
  const { reports, fetchReports, loading } = useReports();
  const { user } = useAuth();
  const [hasGps, setHasGps] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const mapRef = useRef(null);

  // ─── Estado de captura "Pokémon GO" ────────────────────────
  const [capturing, setCapturing] = useState(false);
  const [captureMessage, setCaptureMessage] = useState('Procesando captura…');

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

      // Animar el mapa a la posición real del usuario
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

  // ─── helpers ───────────────────────────────────────────────

  function openWhatsApp(phone, petName, species) {
    if (!phone) return;
    const cleaned = phone.replace(/\D/g, '');
    const number = `593${cleaned.startsWith('0') ? cleaned.slice(1) : cleaned}`;
    const name = petName || 'tu mascota';
    const message = `¡Hola! Vi en PetsWorld que perdiste a ${name} (${species || 'mascota'}). ¿Puedo ayudarte a encontrarla? 🐾`;
    const url = `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
    Linking.openURL(url);
  }

  function openWhatsAppCapture(phone, petName) {
    if (!phone) return;
    const cleaned = phone.replace(/\D/g, '');
    const number = `593${cleaned.startsWith('0') ? cleaned.slice(1) : cleaned}`;
    const name = petName || 'tu mascota';
    const message = `¡Hola! Encontré a ${name} cerca de tu zona de búsqueda. Te envío evidencia 🐾`;
    const url = `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
    Linking.openURL(url);
  }

  function markerColor(status) {
    switch (status) {
      case 'perdido':
      case 'active':
        return 'red';
      case 'encontrado':
      case 'found':
        return 'green';
      case 'en_busqueda':
        return 'orange';
      case 'cancelled':
        return 'gray';
      default:
        return 'violet';
    }
  }

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

  // ─── Callout handler (Android-safe) ────────────────────────
  // En Android, los Callouts no soportan bien botones anidados.
  // Usamos un Alert para elegir la acción al tocar el Callout.
  function handleCalloutPress(report) {
    const isActive = report.status === 'active' || report.status === 'perdido' || report.status === 'en_busqueda';
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

  // ─── Captura "Pokémon GO" ──────────────────────────────────
  async function handleCapture(report) {
    try {
      // 1. Obtener ubicación actual del usuario
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

      // 2. Verificar distancia con Haversine
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

      // 3. Pedir confirmación al usuario
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

  // ─── Procesar captura tras confirmación ────────────────────
  async function processCapture(report, userLat, userLon) {
    try {
      // 4. Mostrar PokeballOverlay mientras se procesa
      setCaptureMessage('🎯 ¡Registrando avistamiento!');
      setCapturing(true);

      // 5. POST /api/reports/{id}/capture con coordenadas
      try {
        await api.post(`/reports/${report.id}/capture`, {
          latitude: userLat,
          longitude: userLon,
        });
      } catch (apiError) {
        console.warn('Error en POST /capture:', apiError?.response?.data || apiError.message);
        // Continuamos con WhatsApp incluso si falla el backend
      }

      setCapturing(false);

      // 6. Abrir WhatsApp con mensaje
      if (report.contact_phone) {
        const message = `¡Hola! Vi a ${report.pet_name || 'tu mascota'} cerca de tu zona de búsqueda. Comunícate conmigo para más información 🐾`;
        const number = `593${report.contact_phone.replace(/\D/g, '').replace(/^0/, '')}`;
        Linking.openURL(`https://wa.me/${number}?text=${encodeURIComponent(message)}`);
      }

      // 7. Alert de éxito
      Alert.alert(
        '🎉 ¡Avistamiento registrado!',
        'El dueño fue notificado. ¡Gracias por ayudar a encontrar a esta mascota!',
      );

      // Refrescar reportes
      fetchReports();
    } catch (error) {
      console.error('Error en processCapture:', error);
      setCapturing(false);
      Alert.alert('Error', 'Ocurrió un error al procesar la captura. Intenta de nuevo.');
    }
  }

  // ─── reportes válidos con coordenadas ──────────────────────

  const reportsList = Array.isArray(reports) ? reports : [];
  const markableReports = reportsList.filter(
    (r) => r.latitude != null && r.longitude != null,
  );

  // ─── render ────────────────────────────────────────────────

  if (permissionDenied) {
    return (
      <View style={styles.center}>
        <Text style={styles.gpsIcon}>📍</Text>
        <Text style={styles.gpsMessage}>Activa el GPS para ver el mapa</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={defaultRegion}
        showsUserLocation={hasGps}
        showsMyLocationButton={hasGps}
      >
        {markableReports.map((r) => (
          <React.Fragment key={r.id}>
            <Marker
              coordinate={{
                latitude: parseFloat(r.latitude),
                longitude: parseFloat(r.longitude),
              }}
              pinColor={markerColor(r.status)}
            >
              <Callout onPress={() => handleCalloutPress(r)} tooltip={false}>
                <View style={styles.callout}>
                  <Text style={styles.calloutTitle}>
                    {r.pet_name || 'Sin nombre'}
                  </Text>
                  <Text style={styles.calloutSpecies}>
                    🐾 {r.species || 'Especie desconocida'}
                  </Text>
                  <Text style={styles.calloutLocation}>
                    📍 {r.location_description || 'Sin ubicación'}
                  </Text>
                  <Text
                    style={[
                      styles.calloutStatus,
                      { color: markerColor(r.status) === 'gray' ? '#888' : markerColor(r.status) },
                    ]}
                  >
                    {statusLabel(r.status)}
                  </Text>

                  {/* Separador visual */}
                  <View style={styles.calloutDivider} />

                  {/* Botón de captura — siempre visible para reportes activos */}
                  {(r.status === 'active' || r.status === 'perdido' || r.status === 'en_busqueda') && (
                    <Text style={styles.calloutCapture}>
                      🎯 ¡Encontré esta mascota!
                    </Text>
                  )}

                  {/* Botón de WhatsApp */}
                  {r.contact_phone ? (
                    <Text style={styles.calloutWhatsApp}>
                      💬 Contactar por WhatsApp
                    </Text>
                  ) : (
                    <Text style={styles.calloutNoContact}>Sin contacto</Text>
                  )}

                  {/* Hint */}
                  <Text style={styles.calloutHint}>Toca para ver opciones</Text>
                </View>
              </Callout>
            </Marker>
            <Circle
              center={{
                latitude: parseFloat(r.latitude),
                longitude: parseFloat(r.longitude),
              }}
              radius={(r.radius_km || 5) * 1000}
              fillColor="rgba(255, 107, 53, 0.15)"
              strokeColor="rgba(255, 107, 53, 0.5)"
              strokeWidth={2}
            />
          </React.Fragment>
        ))}
      </MapView>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color="#6C63FF" />
          <Text style={styles.overlayText}>Cargando reportes…</Text>
        </View>
      )}

      {/* PokeballOverlay — se muestra durante el proceso de captura */}
      <PokeballOverlay visible={capturing} message={captureMessage} />
    </View>
  );
}

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
    backgroundColor: '#F5F5FA',
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
  // Callout
  callout: {
    width: 220,
    padding: 10,
  },
  calloutTitle: {
    fontWeight: '700',
    fontSize: 15,
    color: '#1A1A2E',
    marginBottom: 2,
  },
  calloutSpecies: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
  calloutStatus: {
    fontSize: 12,
    fontWeight: '700',
  },
  calloutLocation: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
  calloutDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 8,
  },
  calloutCapture: {
    color: '#FF6B35',
    fontWeight: 'bold',
    fontSize: 13,
    marginBottom: 4,
  },
  calloutWhatsApp: {
    color: '#25D366',
    fontWeight: 'bold',
    fontSize: 13,
  },
  calloutNoContact: {
    color: '#999',
    fontSize: 12,
  },
  calloutHint: {
    color: '#9CA3AF',
    fontSize: 10,
    marginTop: 6,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  // Loading overlay while fetching reports
  loadingOverlay: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  overlayText: {
    marginLeft: 8,
    color: '#6B7280',
    fontSize: 13,
  },
});
