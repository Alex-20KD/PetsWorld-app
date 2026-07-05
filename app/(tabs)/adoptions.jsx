import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  FlatList,
  Image,
  Modal,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StyleSheet,
} from 'react-native';
import {
  Text,
  ActivityIndicator,
  Divider,
} from 'react-native-paper';
import adoptionApi from '../../services/adoptionApi';

const { width: SCREEN_W } = Dimensions.get('window');

// ─── Helpers ──────────────────────────────────────────────────
function formatAge(ageInMonths) {
  if (ageInMonths == null) return 'Edad desconocida';
  const months = Number(ageInMonths);
  if (isNaN(months) || months < 0) return 'Edad desconocida';
  const years = Math.floor(months / 12);
  const remaining = months % 12;
  if (years === 0) return `${remaining} ${remaining === 1 ? 'mes' : 'meses'}`;
  if (remaining === 0) return `${years} ${years === 1 ? 'año' : 'años'}`;
  return `${years} ${years === 1 ? 'año' : 'años'} y ${remaining} ${remaining === 1 ? 'mes' : 'meses'}`;
}

function statusConfig(status) {
  switch (status) {
    case 'available':
      return { label: 'Disponible', color: '#22C55E', bg: '#22C55E18' };
    case 'adopted':
      return { label: 'Adoptado', color: '#9E9E9E', bg: '#9E9E9E18' };
    case 'pending':
      return { label: 'Pendiente', color: '#F59E0B', bg: '#F59E0B18' };
    default:
      return { label: status || 'Desconocido', color: '#FF6B35', bg: '#FF6B3518' };
  }
}

// ─── Component ────────────────────────────────────────────────
export default function AdoptionsScreen() {
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Modal state
  const [selectedPet, setSelectedPet] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  // ─── Fetch ────────────────────────────────────────────────
  const fetchPets = useCallback(async () => {
    try {
      setError(null);
      const response = await adoptionApi.get('/pets');
      const data = Array.isArray(response.data)
        ? response.data
        : response.data?.data ?? [];
      setPets(data);
    } catch (err) {
      console.error('Error fetching adoption pets:', err);
      setError('No se pudieron cargar las mascotas. Verifica tu conexión.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPets();
  }, [fetchPets]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPets();
  }, [fetchPets]);

  // ─── Modal handlers ───────────────────────────────────────
  function openDetail(pet) {
    setSelectedPet(pet);
    setModalVisible(true);
  }

  function closeDetail() {
    setModalVisible(false);
    setSelectedPet(null);
  }

  // ─── Render card ──────────────────────────────────────────
  function renderPetCard({ item }) {
    const st = statusConfig(item.status);

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.85}
        onPress={() => openDetail(item)}
      >
        {/* Image */}
        {item.image_url ? (
          <Image source={{ uri: item.image_url }} style={styles.cardImage} />
        ) : (
          <View style={styles.cardImagePlaceholder}>
            <Text style={{ fontSize: 48 }}>🐾</Text>
          </View>
        )}

        {/* Content */}
        <View style={styles.cardContent}>
          {/* Header row */}
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardName} numberOfLines={1}>
              {item.name || 'Sin nombre'}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: st.bg }]}>
              <View style={[styles.statusDot, { backgroundColor: st.color }]} />
              <Text style={[styles.statusText, { color: st.color }]}>{st.label}</Text>
            </View>
          </View>

          {/* Species & breed */}
          <Text style={styles.cardMeta} numberOfLines={1}>
            🐾 {item.species || 'Especie desconocida'}
            {item.breed ? ` · ${item.breed}` : ''}
          </Text>

          {/* Age */}
          <Text style={styles.cardMeta}>
            🎂 {formatAge(item.age)}
          </Text>

          {/* Description */}
          {item.description ? (
            <Text style={styles.cardDesc} numberOfLines={2}>
              {item.description}
            </Text>
          ) : null}
        </View>
      </TouchableOpacity>
    );
  }

  // ─── Main render ──────────────────────────────────────────
  if (loading && pets.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text variant="headlineSmall" style={styles.headerTitle}>
            🧡 Adopciones
          </Text>
          <Text variant="bodyMedium" style={styles.headerSub}>
            Encuentra tu compañero ideal
          </Text>
        </View>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text style={styles.loadingText}>Cargando mascotas...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text variant="headlineSmall" style={styles.headerTitle}>
          🧡 Adopciones
        </Text>
        <Text variant="bodyMedium" style={styles.headerSub}>
          {pets.length} {pets.length === 1 ? 'mascota disponible' : 'mascotas disponibles'}
        </Text>
      </View>

      {/* Error banner */}
      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
        </View>
      ) : null}

      {/* List */}
      <FlatList
        data={pets}
        renderItem={renderPetCard}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        onRefresh={onRefresh}
        refreshing={refreshing}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🏠</Text>
            <Text variant="titleMedium" style={styles.emptyTitle}>
              No hay mascotas disponibles para adopción
            </Text>
            <Text variant="bodyMedium" style={styles.emptySubtitle}>
              Vuelve más tarde para ver nuevas mascotas
            </Text>
          </View>
        }
      />

      {/* ─── Detail Modal ──────────────────────────────────── */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeDetail}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <ScrollView
              contentContainerStyle={styles.modalScroll}
              showsVerticalScrollIndicator={false}
            >
              {/* Handle */}
              <View style={styles.modalHandle} />

              {/* Close button */}
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={closeDetail}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCloseBtnText}>✕</Text>
              </TouchableOpacity>

              {selectedPet && (
                <>
                  {/* Image */}
                  {selectedPet.image_url ? (
                    <Image
                      source={{ uri: selectedPet.image_url }}
                      style={styles.modalImage}
                    />
                  ) : (
                    <View style={styles.modalImagePlaceholder}>
                      <Text style={{ fontSize: 72 }}>🐾</Text>
                    </View>
                  )}

                  {/* Name & status */}
                  <View style={styles.modalHeaderRow}>
                    <Text style={styles.modalPetName}>
                      {selectedPet.name || 'Sin nombre'}
                    </Text>
                    {(() => {
                      const st = statusConfig(selectedPet.status);
                      return (
                        <View style={[styles.statusBadge, { backgroundColor: st.bg }]}>
                          <View style={[styles.statusDot, { backgroundColor: st.color }]} />
                          <Text style={[styles.statusText, { color: st.color }]}>
                            {st.label}
                          </Text>
                        </View>
                      );
                    })()}
                  </View>

                  <Divider style={styles.modalDivider} />

                  {/* Details grid */}
                  <View style={styles.detailGrid}>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Especie</Text>
                      <Text style={styles.detailValue}>
                        {selectedPet.species || 'Desconocida'}
                      </Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Raza</Text>
                      <Text style={styles.detailValue}>
                        {selectedPet.breed || 'Desconocida'}
                      </Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Edad</Text>
                      <Text style={styles.detailValue}>
                        {formatAge(selectedPet.age)}
                      </Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Estado</Text>
                      <Text style={styles.detailValue}>
                        {statusConfig(selectedPet.status).label}
                      </Text>
                    </View>
                  </View>

                  <Divider style={styles.modalDivider} />

                  {/* Description */}
                  <Text style={styles.sectionTitle}>Descripción</Text>
                  <Text style={styles.descriptionText}>
                    {selectedPet.description || 'Sin descripción disponible.'}
                  </Text>

                  {/* Contact button */}
                  <TouchableOpacity
                    style={styles.contactBtn}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.contactBtnText}>📞 Contactar</Text>
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F7FC',
  },

  // Header
  header: {
    backgroundColor: '#FF6B35',
    paddingTop: 56,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 6,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 24,
  },
  headerSub: {
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
    fontSize: 14,
  },

  // Center / Loading
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#6B7280',
    marginTop: 12,
    fontSize: 14,
  },

  // Error
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 8,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
  },

  // List
  list: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },

  // Card
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  cardImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  cardImagePlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: '#FFF7ED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    padding: 16,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
    marginRight: 8,
  },
  cardMeta: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 6,
    lineHeight: 18,
  },

  // Status badge
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 5,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    color: '#1F2937',
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtitle: {
    color: '#9CA3AF',
    textAlign: 'center',
  },

  // ─── Modal ────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
    minHeight: '60%',
  },
  modalScroll: {
    paddingBottom: 40,
  },
  modalHandle: {
    width: 40,
    height: 5,
    backgroundColor: '#D1D5DB',
    borderRadius: 3,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  modalCloseBtn: {
    position: 'absolute',
    right: 16,
    top: 12,
    zIndex: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseBtnText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '700',
  },
  modalImage: {
    width: '100%',
    height: 280,
    resizeMode: 'cover',
  },
  modalImagePlaceholder: {
    width: '100%',
    height: 220,
    backgroundColor: '#FFF7ED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  modalPetName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1F2937',
    flex: 1,
    marginRight: 12,
  },
  modalDivider: {
    marginHorizontal: 20,
    marginVertical: 12,
  },

  // Detail grid
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
  },
  detailItem: {
    width: '50%',
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 15,
    color: '#1F2937',
    fontWeight: '600',
  },

  // Description
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 22,
    paddingHorizontal: 20,
    marginBottom: 24,
  },

  // Contact button
  contactBtn: {
    backgroundColor: '#FF6B35',
    marginHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  contactBtnText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
});
