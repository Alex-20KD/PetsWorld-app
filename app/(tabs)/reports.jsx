import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  FlatList,
  Image,
  Modal,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ActionSheetIOS,
} from 'react-native';
import {
  Text,
  Card,
  FAB,
  TextInput,
  ActivityIndicator,
  Chip,
  IconButton,
  Divider,
  Button,
} from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useReports } from '../../context/ReportsContext';
import { useAuth } from '../../context/AuthContext';
import { StyleSheet } from 'react-native';

const SPECIES_OPTIONS = ['Perro', 'Gato', 'Ave', 'Conejo', 'Otro'];

export default function ReportsScreen() {
  const { reports, loading, pagination, fetchReports, createReport } = useReports();
  const { user } = useAuth();
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Campos del formulario de creación
  const [petName, setPetName] = useState('');
  const [species, setSpecies] = useState('');
  const [description, setDescription] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [photo, setPhoto] = useState(null);
  const [gpsCoords, setGpsCoords] = useState(null);
  const [gpsError, setGpsError] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchReports();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchReports();
    setRefreshing(false);
  }, []);

  function loadMore() {
    if (!loading && pagination.currentPage < pagination.lastPage) {
      fetchReports({}, pagination.currentPage + 1);
    }
  }

  // ─── Modal open/close ───────────────────────────────────
  async function openModal() {
    setModalVisible(true);
    setFormError('');
    setSuccessMsg('');
    setGpsLoading(true);
    setGpsError(false);

    // Obtener GPS automáticamente al abrir el modal
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setGpsCoords({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
        setGpsError(false);
      } else {
        setGpsError(true);
      }
    } catch (e) {
      console.warn('No se pudo obtener GPS:', e);
      setGpsError(true);
    } finally {
      setGpsLoading(false);
    }
  }

  function closeModal() {
    setModalVisible(false);
    setPetName('');
    setSpecies('');
    setDescription('');
    setContactPhone('');
    setPhoto(null);
    setGpsCoords(null);
    setGpsError(false);
    setFormError('');
  }

  // ─── Cámara / Galería ──────────────────────────────────
  function showPhotoOptions() {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancelar', 'Tomar foto', 'Elegir de galería'],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) takePhoto();
          if (buttonIndex === 2) pickImage();
        }
      );
    } else {
      // Android: usar Alert como ActionSheet
      Alert.alert('Agregar foto', 'Elige una opción', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Tomar foto', onPress: takePhoto },
        { text: 'Elegir de galería', onPress: pickImage },
      ]);
    }
  }

  async function takePhoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso denegado', 'Necesitamos acceso a la cámara.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setPhoto(result.assets[0]);
    }
  }

  async function pickImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso denegado', 'Necesitamos acceso a tu galería.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setPhoto(result.assets[0]);
    }
  }

  // ─── Submit ─────────────────────────────────────────────
  async function handleCreate() {
    setFormError('');

    // Validaciones requeridas: description y GPS
    if (!description.trim()) {
      setFormError('La descripción es obligatoria.');
      return;
    }
    if (!gpsCoords) {
      setFormError('Se requieren coordenadas GPS. Activa tu ubicación.');
      return;
    }

    setCreating(true);

    const formData = new FormData();
    if (petName.trim()) formData.append('pet_name', petName.trim());
    formData.append('description', description.trim());
    formData.append('species', species || 'Otro');
    formData.append('latitude', gpsCoords.latitude.toString());
    formData.append('longitude', gpsCoords.longitude.toString());
    if (contactPhone.trim()) formData.append('contact_phone', contactPhone.trim());

    if (photo) {
      formData.append('photo', {
        uri: photo.uri,
        type: 'image/jpeg',
        name: 'photo.jpg',
      });
    }

    const result = await createReport(formData);
    setCreating(false);

    if (result.success) {
      closeModal();
      setSuccessMsg('¡Reporte creado exitosamente!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } else {
      setFormError(result.error);
    }
  }

  // ─── Helpers ────────────────────────────────────────────
  function statusColor(s) {
    if (s === 'active' || s === 'perdido' || s === 'en_busqueda') return '#FF9800';
    if (s === 'found' || s === 'encontrado') return '#4CAF50';
    if (s === 'cancelled' || s === 'cancelado') return '#9E9E9E';
    return '#FF6B35';
  }

  function statusLabel(s) {
    if (s === 'active' || s === 'perdido') return 'Perdido';
    if (s === 'en_busqueda') return 'En búsqueda';
    if (s === 'found' || s === 'encontrado') return 'Encontrado';
    if (s === 'cancelled' || s === 'cancelado') return 'Cancelado';
    return s || 'Activo';
  }

  // ─── Render card ────────────────────────────────────────
  function renderItem({ item }) {
    const color = statusColor(item.status);
    return (
      <Card style={styles.card} mode="elevated">
        {item.photo_url ? (
          <Card.Cover source={{ uri: item.photo_url }} style={styles.cardImage} />
        ) : (
          <View style={[styles.placeholderImage, { backgroundColor: color + '18' }]}>
            <Text style={{ fontSize: 48 }}>🐾</Text>
          </View>
        )}
        <Card.Content style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Text variant="titleMedium" style={styles.cardTitle} numberOfLines={1}>
              {item.pet_name || 'Sin nombre'}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: color + '20' }]}>
              <Text style={[styles.statusBadgeText, { color }]}>
                {statusLabel(item.status)}
              </Text>
            </View>
          </View>

          <Text variant="bodyMedium" style={styles.cardSpecies}>
            🐾 {item.species || 'Especie desconocida'}
          </Text>

          {item.description ? (
            <Text variant="bodySmall" style={styles.cardDesc} numberOfLines={2}>
              {item.description}
            </Text>
          ) : null}

          {item.location_description ? (
            <Text variant="bodySmall" style={styles.cardLocation}>
              📍 {item.location_description}
            </Text>
          ) : item.latitude && item.longitude ? (
            <Text variant="bodySmall" style={styles.cardLocation}>
              📍 {parseFloat(item.latitude).toFixed(4)}, {parseFloat(item.longitude).toFixed(4)}
            </Text>
          ) : null}

          {(item.reporter_name || item.user?.full_name) ? (
            <Text variant="bodySmall" style={styles.cardReporter}>
              👤 {item.reporter_name || item.user?.full_name}
            </Text>
          ) : null}
        </Card.Content>
      </Card>
    );
  }

  // ─── Main render ────────────────────────────────────────
  const reportsList = Array.isArray(reports) ? reports : [];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text variant="headlineSmall" style={styles.headerTitle}>
          📋 Reportes
        </Text>
        <Text variant="bodyMedium" style={styles.headerSub}>
          {pagination.total} mascotas reportadas
        </Text>
      </View>

      {/* Mensaje de éxito temporal */}
      {successMsg ? (
        <View style={styles.successBanner}>
          <Text style={styles.successBannerText}>✅ {successMsg}</Text>
        </View>
      ) : null}

      {/* Lista o loading */}
      {loading && reportsList.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text style={{ color: '#6B7280', marginTop: 12 }}>Cargando reportes...</Text>
        </View>
      ) : (
        <FlatList
          data={reportsList}
          renderItem={renderItem}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          onRefresh={onRefresh}
          refreshing={refreshing}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text variant="titleMedium" style={styles.emptyTitle}>
                No hay reportes activos en tu área
              </Text>
              <Text variant="bodyMedium" style={styles.emptySubtitle}>
                Crea el primero con el botón +
              </Text>
            </View>
          }
          ListFooterComponent={
            loading && reportsList.length > 0 ? (
              <ActivityIndicator style={{ padding: 16 }} color="#FF6B35" />
            ) : null
          }
        />
      )}

      {/* FAB */}
      <FAB icon="plus" style={styles.fab} color="#FFFFFF" onPress={openModal} />

      {/* ─── Modal de creación ───────────────────────────── */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <KeyboardAvoidingView
              style={{ flex: 1 }}
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
              <ScrollView
                contentContainerStyle={styles.modalScroll}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                {/* Modal header */}
                <View style={styles.modalHandle} />
                <View style={styles.modalHeader}>
                  <Text variant="headlineSmall" style={styles.modalTitle}>
                    Nuevo Reporte
                  </Text>
                  <IconButton icon="close" onPress={closeModal} disabled={creating} />
                </View>
                <Divider style={{ marginBottom: 20 }} />

                {/* pet_name */}
                <TextInput
                  label="Nombre de la mascota (opcional)"
                  value={petName}
                  onChangeText={setPetName}
                  mode="outlined"
                  left={<TextInput.Icon icon="paw" />}
                  style={styles.modalInput}
                  outlineStyle={styles.inputOutline}
                  outlineColor="#D1CFE2"
                  activeOutlineColor="#FF6B35"
                  disabled={creating}
                />

                {/* species — chip selector */}
                <Text variant="labelLarge" style={styles.fieldLabel}>
                  Especie
                </Text>
                <View style={styles.speciesRow}>
                  {SPECIES_OPTIONS.map((opt) => (
                    <TouchableOpacity
                      key={opt}
                      style={[
                        styles.speciesChip,
                        species === opt && styles.speciesChipActive,
                      ]}
                      onPress={() => setSpecies(opt)}
                      disabled={creating}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.speciesChipText,
                          species === opt && styles.speciesChipTextActive,
                        ]}
                      >
                        {opt}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* description */}
                <TextInput
                  label="Descripción detallada *"
                  value={description}
                  onChangeText={setDescription}
                  mode="outlined"
                  multiline
                  numberOfLines={4}
                  left={<TextInput.Icon icon="text" />}
                  style={[styles.modalInput, { minHeight: 100 }]}
                  outlineStyle={styles.inputOutline}
                  outlineColor="#D1CFE2"
                  activeOutlineColor="#FF6B35"
                  disabled={creating}
                />

                {/* contact_phone */}
                <TextInput
                  label="Teléfono de contacto"
                  value={contactPhone}
                  onChangeText={setContactPhone}
                  mode="outlined"
                  keyboardType="phone-pad"
                  left={<TextInput.Icon icon="phone" />}
                  style={styles.modalInput}
                  outlineStyle={styles.inputOutline}
                  outlineColor="#D1CFE2"
                  activeOutlineColor="#FF6B35"
                  disabled={creating}
                />

                {/* GPS status */}
                <Text variant="labelLarge" style={styles.fieldLabel}>
                  Ubicación GPS
                </Text>
                {gpsLoading ? (
                  <View style={styles.gpsRow}>
                    <ActivityIndicator size="small" color="#FF6B35" />
                    <Text style={styles.gpsLoadingText}>Obteniendo ubicación...</Text>
                  </View>
                ) : gpsCoords ? (
                  <View style={styles.gpsSuccess}>
                    <Text style={styles.gpsSuccessText}>
                      📍 Ubicación obtenida: {gpsCoords.latitude.toFixed(5)},{' '}
                      {gpsCoords.longitude.toFixed(5)}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.gpsErrorBox}>
                    <Text style={styles.gpsErrorText}>
                      ⚠️ Activa el GPS para continuar
                    </Text>
                  </View>
                )}

                {/* Foto */}
                <Text variant="labelLarge" style={[styles.fieldLabel, { marginTop: 16 }]}>
                  Foto de la mascota
                </Text>
                <TouchableOpacity
                  style={styles.photoButton}
                  onPress={showPhotoOptions}
                  disabled={creating}
                  activeOpacity={0.7}
                >
                  <Text style={styles.photoButtonText}>📷 Agregar foto</Text>
                </TouchableOpacity>

                {photo && (
                  <View style={styles.photoPreview}>
                    <Image
                      source={{ uri: photo.uri }}
                      style={styles.previewImage}
                    />
                    <TouchableOpacity
                      style={styles.removePhotoBtn}
                      onPress={() => setPhoto(null)}
                    >
                      <Text style={styles.removePhotoText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Error del formulario */}
                {formError ? (
                  <View style={styles.formErrorBox}>
                    <Text style={styles.formErrorText}>❌ {formError}</Text>
                  </View>
                ) : null}

                {/* Submit */}
                <TouchableOpacity
                  style={[styles.submitBtn, creating && styles.submitBtnDisabled]}
                  onPress={handleCreate}
                  disabled={creating}
                  activeOpacity={0.8}
                >
                  {creating ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.submitBtnText}>Crear Reporte</Text>
                  )}
                </TouchableOpacity>
              </ScrollView>
            </KeyboardAvoidingView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  // ─── Container & Header ─────────────────────────────────
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 4,
  },
  headerTitle: {
    fontWeight: '800',
    color: '#1A1A2E',
  },
  headerSub: {
    color: '#6B7280',
    marginTop: 4,
  },
  successBanner: {
    backgroundColor: '#E8F5E9',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#C8E6C9',
  },
  successBannerText: {
    color: '#2E7D32',
    fontWeight: '600',
    textAlign: 'center',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
  },

  // ─── List ───────────────────────────────────────────────
  list: {
    padding: 16,
    paddingBottom: 100,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyIcon: {
    fontSize: 64,
  },
  emptyTitle: {
    color: '#6B7280',
    marginTop: 12,
    textAlign: 'center',
  },
  emptySubtitle: {
    color: '#9E9E9E',
    marginTop: 4,
  },

  // ─── Card ──────────────────────────────────────────────
  card: {
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  cardImage: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    height: 180,
  },
  placeholderImage: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  cardContent: {
    paddingTop: 12,
    paddingBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardTitle: {
    fontWeight: '700',
    color: '#1A1A2E',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  cardSpecies: {
    color: '#6B7280',
    marginBottom: 4,
  },
  cardDesc: {
    color: '#9E9E9E',
    marginBottom: 4,
  },
  cardLocation: {
    color: '#FF6B35',
    fontSize: 12,
    marginBottom: 2,
  },
  cardReporter: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 4,
  },

  // ─── FAB ───────────────────────────────────────────────
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    backgroundColor: '#FF6B35',
    borderRadius: 28,
    elevation: 8,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },

  // ─── Modal ─────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    height: '92%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  modalScroll: {
    flexGrow: 1,
    padding: 24,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#D1CFE2',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontWeight: '700',
    color: '#1A1A2E',
  },
  modalInput: {
    marginBottom: 16,
    backgroundColor: '#FAFAFA',
  },
  inputOutline: {
    borderRadius: 12,
  },
  fieldLabel: {
    color: '#1A1A2E',
    fontWeight: '700',
    marginBottom: 10,
  },

  // ─── Species chips ─────────────────────────────────────
  speciesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  speciesChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
  },
  speciesChipActive: {
    backgroundColor: '#FF6B35' + '18',
    borderColor: '#FF6B35',
  },
  speciesChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  speciesChipTextActive: {
    color: '#FF6B35',
  },

  // ─── GPS ───────────────────────────────────────────────
  gpsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  gpsLoadingText: {
    color: '#6B7280',
  },
  gpsSuccess: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  gpsSuccessText: {
    color: '#2E7D32',
    fontWeight: '600',
    fontSize: 13,
  },
  gpsErrorBox: {
    backgroundColor: '#FFEBEE',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  gpsErrorText: {
    color: '#C62828',
    fontWeight: '600',
    fontSize: 13,
  },

  // ─── Photo ─────────────────────────────────────────────
  photoButton: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    marginBottom: 12,
  },
  photoButtonText: {
    color: '#6B7280',
    fontWeight: '600',
    fontSize: 15,
  },
  photoPreview: {
    position: 'relative',
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },
  removePhotoBtn: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removePhotoText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },

  // ─── Form error ────────────────────────────────────────
  formErrorBox: {
    backgroundColor: '#FFEBEE',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  formErrorText: {
    color: '#C62828',
    fontWeight: '600',
    fontSize: 13,
  },

  // ─── Submit button ─────────────────────────────────────
  submitBtn: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 24,
    elevation: 4,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
