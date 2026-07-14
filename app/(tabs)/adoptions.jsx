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
  IconButton,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
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
  const [activeFilter, setActiveFilter] = useState('Todos');

  const FILTERS = ['Todos', 'Perros', 'Gatos', 'Cachorros', 'Cerca de mí'];

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
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.85}
        onPress={() => openDetail(item)}
      >
        {/* Image */}
        <View style={styles.cardImageContainer}>
          {item.image_url ? (
            <Image source={{ uri: item.image_url }} style={styles.cardImage} />
          ) : (
            <View style={styles.cardImagePlaceholder}>
              <Text style={{ fontSize: 64 }}>🐾</Text>
            </View>
          )}
          <View style={styles.personalityBadge}>
            <Text style={styles.personalityBadgeText}>
              {item.personality || 'CARIÑOSO'}
            </Text>
          </View>
        </View>

        {/* Content */}
        <View style={styles.cardContent}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardName} numberOfLines={1}>
              {item.name || 'Sin nombre'}
            </Text>
            <Text style={styles.cardAgeText}>
              {formatAge(item.age)}
            </Text>
          </View>

          <Text style={styles.cardSpeciesText} numberOfLines={1}>
            {item.species || 'Desconocida'} · {item.size || 'Mediano'}
          </Text>

          <View style={styles.locationRow}>
            <Ionicons name="location" size={14} color="#8BC34A" style={{ marginRight: 4 }} />
            <Text style={styles.cardLocationText}>
              {item.location || 'Refugio central'}
            </Text>
          </View>

          <TouchableOpacity style={styles.adoptBtn} onPress={() => openDetail(item)}>
            <Ionicons name="heart" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.adoptBtnText}>Quiero adoptar</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  }

  // ─── Main render ──────────────────────────────────────────
  if (loading && pets.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerSuperTitle}>PETSWORLD</Text>
            <Text style={styles.headerTitle}>Adopciones</Text>
            <Text style={styles.headerSub}>
              Cargando...
            </Text>
          </View>
          <View style={styles.headerIconCircle}>
            <Ionicons name="heart" size={20} color="#FFFFFF" />
          </View>
        </View>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#3B6B2A" />
          <Text style={styles.loadingText}>Cargando mascotas...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerSuperTitle}>PETSWORLD</Text>
          <Text style={styles.headerTitle}>Adopciones</Text>
          <Text style={styles.headerSub}>
            {pets.length} {pets.length === 1 ? 'mascota esperando familia' : 'mascotas esperando familia'}
          </Text>
        </View>
        <View style={styles.headerIconCircle}>
          <Ionicons name="heart" size={20} color="#FFFFFF" />
        </View>
      </View>

      {/* Filters */}
      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContainer}
        >
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f}
              style={[
                styles.filterPill,
                activeFilter === f ? styles.filterPillActive : styles.filterPillInactive,
              ]}
              onPress={() => setActiveFilter(f)}
            >
              <Text
                style={[
                  styles.filterPillText,
                  activeFilter === f ? styles.filterPillTextActive : styles.filterPillTextInactive,
                ]}
              >
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
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
    backgroundColor: '#F5F0E8',
  },

  // Header
  header: {
    backgroundColor: '#3B6B2A',
    paddingTop: 56,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerSuperTitle: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 2,
    marginBottom: 4,
    fontWeight: '700',
  },
  headerTitle: {
    fontFamily: 'serif',
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSub: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    marginTop: 2,
  },
  headerIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
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

  // Filters
  filtersContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterPill: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
  },
  filterPillActive: {
    backgroundColor: '#3B6B2A',
  },
  filterPillInactive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E0D0',
  },
  filterPillText: {
    fontWeight: '600',
    fontSize: 14,
  },
  filterPillTextActive: {
    color: '#FFFFFF',
  },
  filterPillTextInactive: {
    color: '#6B5A3E',
  },

  // Card
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  cardImageContainer: {
    width: '100%',
    height: 240,
    position: 'relative',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  cardImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FDEEE6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  personalityBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  personalityBadgeText: {
    color: '#3B6B2A',
    fontWeight: 'bold',
    fontSize: 12,
  },
  cardContent: {
    padding: 16,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  cardName: {
    fontFamily: 'serif',
    fontSize: 22,
    fontWeight: 'bold',
    color: '#3B6B2A',
    flex: 1,
    marginRight: 8,
  },
  cardAgeText: {
    fontSize: 14,
    color: '#9B8B6E',
    fontWeight: '600',
  },
  cardSpeciesText: {
    fontSize: 14,
    color: '#6B5A3E',
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardLocationText: {
    color: '#9B8B6E',
    fontSize: 13,
  },
  adoptBtn: {
    backgroundColor: '#3B6B2A',
    borderRadius: 12,
    height: 48,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  adoptBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
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
    color: '#6B5A3E',
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtitle: {
    color: '#9B8B6E',
    textAlign: 'center',
  },

  // ─── Modal ────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#F5F0E8',
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
    color: '#6B5A3E',
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
    color: '#9B8B6E',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 15,
    color: '#6B5A3E',
    fontWeight: '600',
  },

  // Description
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6B5A3E',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: '#9B8B6E',
    lineHeight: 22,
    paddingHorizontal: 20,
    marginBottom: 24,
  },

  // Contact button
  contactBtn: {
    backgroundColor: '#3B6B2A',
    marginHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    elevation: 4,
  },
  contactBtnText: {
    color: '#FDF5E6',
    fontSize: 17,
    fontWeight: '700',
  },
});
