import React, { useEffect, useState } from 'react';
import { View, Alert, ScrollView, FlatList } from 'react-native';
import { Text, ActivityIndicator, Chip, Card, Divider } from 'react-native-paper';
import * as Location from 'expo-location';
import { useReports } from '../../context/ReportsContext';
import { StyleSheet } from 'react-native';

export default function MapScreen() {
  const { reports, fetchReports, loading } = useReports();
  const [location, setLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(true);

  useEffect(() => {
    getLocation();
    fetchReports();
  }, []);

  async function getLocation() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Necesitamos tu ubicación para mostrar mascotas cercanas.');
        setLocationLoading(false);
        return;
      }
      const cur = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setLocation({
        latitude: cur.coords.latitude,
        longitude: cur.coords.longitude,
      });
    } catch (e) {
      console.warn('Error ubicación:', e);
    } finally {
      setLocationLoading(false);
    }
  }

  function statusColor(s) {
    if (s === 'perdido') return '#FF6B6B';
    if (s === 'encontrado') return '#4CAF50';
    if (s === 'en_busqueda') return '#FF9800';
    return '#6C63FF';
  }

  function statusLabel(s) {
    if (s === 'perdido') return 'Perdido';
    if (s === 'encontrado') return 'Encontrado';
    if (s === 'en_busqueda') return 'En búsqueda';
    return s || 'Desconocido';
  }

  if (locationLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6C63FF" />
        <Text style={{ color: '#6B7280', marginTop: 12 }}>Obteniendo ubicación...</Text>
      </View>
    );
  }

  const reportsList = Array.isArray(reports) ? reports : [];

  function renderReport({ item: r }) {
    return (
      <Card style={styles.reportCard} mode="elevated">
        <Card.Content>
          <View style={styles.reportHeader}>
            <Text variant="titleMedium" style={styles.reportName}>
              🐾 {r.pet_name || 'Sin nombre'}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: statusColor(r.status) + '20' }]}>  
              <Text style={[styles.statusText, { color: statusColor(r.status) }]}>
                {statusLabel(r.status)}
              </Text>
            </View>
          </View>
          <Text variant="bodyMedium" style={styles.reportSpecies}>
            {r.species || 'Especie desconocida'}
          </Text>
          {(r.latitude && r.longitude) ? (
            <Text variant="bodySmall" style={styles.reportCoords}>
              📍 {parseFloat(r.latitude).toFixed(5)}, {parseFloat(r.longitude).toFixed(5)}
            </Text>
          ) : (
            <Text variant="bodySmall" style={styles.reportCoords}>
              📍 Sin coordenadas
            </Text>
          )}
        </Card.Content>
      </Card>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text variant="titleLarge" style={styles.headerTitle}>🗺️ Mapa</Text>
        <Chip icon="refresh" onPress={() => fetchReports()} style={styles.refreshChip}>
          {loading ? 'Cargando...' : `${reportsList.length} reportes`}
        </Chip>
      </View>

      <ScrollView style={styles.scrollBody} contentContainerStyle={styles.scrollContent}>
        {/* Ubicación GPS */}
        <Card style={styles.locationCard} mode="elevated">
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>📡 Tu ubicación actual</Text>
            {location ? (
              <View style={styles.coordsContainer}>
                <View style={styles.coordRow}>
                  <Text variant="bodyMedium" style={styles.coordLabel}>Latitud</Text>
                  <Text variant="bodyMedium" style={styles.coordValue}>
                    {location.latitude.toFixed(6)}
                  </Text>
                </View>
                <Divider style={styles.coordDivider} />
                <View style={styles.coordRow}>
                  <Text variant="bodyMedium" style={styles.coordLabel}>Longitud</Text>
                  <Text variant="bodyMedium" style={styles.coordValue}>
                    {location.longitude.toFixed(6)}
                  </Text>
                </View>
              </View>
            ) : (
              <Text variant="bodyMedium" style={styles.noLocation}>
                No se pudo obtener la ubicación
              </Text>
            )}
          </Card.Content>
        </Card>

        {/* Aviso temporal */}
        <View style={styles.comingSoonBanner}>
          <Text style={styles.comingSoonIcon}>🚧</Text>
          <Text variant="bodyMedium" style={styles.comingSoonText}>
            Mapa interactivo disponible próximamente
          </Text>
          <Text variant="bodySmall" style={styles.comingSoonSubtext}>
            Se requiere configurar una API Key de Google Maps para Android
          </Text>
        </View>

        {/* Lista de reportes */}
        <Text variant="titleMedium" style={styles.listTitle}>
          Reportes activos
        </Text>

        {reportsList.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text variant="bodyLarge" style={styles.emptyText}>
              No hay reportes aún
            </Text>
          </View>
        ) : (
          reportsList.map((r) => (
            <React.Fragment key={r.id}>
              {renderReport({ item: r })}
            </React.Fragment>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5FA',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 4,
  },
  headerTitle: {
    fontWeight: '700',
    color: '#1A1A2E',
  },
  refreshChip: {
    backgroundColor: '#E8E6FF',
  },
  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  // GPS location card
  locationCard: {
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
    elevation: 2,
  },
  sectionTitle: {
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 12,
  },
  coordsContainer: {
    backgroundColor: '#F8F7FF',
    borderRadius: 12,
    padding: 12,
  },
  coordRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  coordLabel: {
    color: '#6B7280',
  },
  coordValue: {
    color: '#1A1A2E',
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  coordDivider: {
    backgroundColor: '#E8E6FF',
  },
  noLocation: {
    color: '#9E9E9E',
    fontStyle: 'italic',
  },
  // Coming soon banner
  comingSoonBanner: {
    backgroundColor: '#FFF8E1',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#FFE082',
  },
  comingSoonIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  comingSoonText: {
    fontWeight: '700',
    color: '#F57F17',
    textAlign: 'center',
  },
  comingSoonSubtext: {
    color: '#F9A825',
    textAlign: 'center',
    marginTop: 4,
  },
  // Reports list
  listTitle: {
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 12,
  },
  reportCard: {
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
    elevation: 2,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  reportName: {
    fontWeight: '700',
    color: '#1A1A2E',
    flexShrink: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  reportSpecies: {
    color: '#6B7280',
    marginBottom: 4,
  },
  reportCoords: {
    color: '#9E9E9E',
    fontFamily: 'monospace',
    fontSize: 12,
  },
  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    color: '#9E9E9E',
  },
});
