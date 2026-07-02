import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import MapView, { Marker, Callout, Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { useReports } from '../../context/ReportsContext';

// Región por defecto (Quito) — se usa mientras el GPS resuelve
const defaultRegion = {
  latitude: -0.1807,
  longitude: -78.4678,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

export default function MapScreen() {
  const { reports, fetchReports, loading } = useReports();
  const [hasGps, setHasGps] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const mapRef = useRef(null);

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

  // ---------- helpers ----------

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

  // ---------- reportes válidos con coordenadas ----------

  const reportsList = Array.isArray(reports) ? reports : [];
  const markableReports = reportsList.filter(
    (r) => r.latitude != null && r.longitude != null,
  );

  // ---------- render ----------

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
              <Callout tooltip={false}>
                <View style={styles.callout}>
                  <Text style={styles.calloutTitle}>
                    🐾 {r.pet_name || 'Sin nombre'}
                  </Text>
                  <Text style={styles.calloutSpecies}>
                    {r.species || 'Especie desconocida'}
                  </Text>
                  <Text
                    style={[
                      styles.calloutStatus,
                      { color: markerColor(r.status) === 'gray' ? '#888' : markerColor(r.status) },
                    ]}
                  >
                    {statusLabel(r.status)}
                  </Text>
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
    width: 200,
    padding: 8,
  },
  calloutTitle: {
    fontWeight: '700',
    fontSize: 14,
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
