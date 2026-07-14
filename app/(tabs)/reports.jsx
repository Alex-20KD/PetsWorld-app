import React, { useEffect, useState, useCallback, useRef } from 'react';
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
  Dimensions,
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
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

import { useReports } from '../../context/ReportsContext';
import { useAuth } from '../../context/AuthContext';
import { StyleSheet } from 'react-native';

const SPECIES_OPTIONS = ['Perro', 'Gato', 'Ave', 'Conejo', 'Otro'];
const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

export default function ReportsScreen() {
  const { reports, loading, pagination, fetchReports, createReport, updateReport } = useReports();
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
  const [radiusKm, setRadiusKm] = useState(5);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState('');
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [markerCoordinate, setMarkerCoordinate] = useState({
    latitude: -0.1807,
    longitude: -78.4678,
  });
  const [tempRadius, setTempRadius] = useState(5);
  const [mapGpsLoading, setMapGpsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const locationMapRef = useRef(null);
  const [successMsg, setSuccessMsg] = useState('');

  // ─── Estado del modal de edición ──────────────────────────
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingReport, setEditingReport] = useState(null);
  const [editPetName, setEditPetName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editContactPhone, setEditContactPhone] = useState('');
  const [editContactEmail, setEditContactEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState('');

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
  function openModal() {
    setModalVisible(true);
    setFormError('');
    setSuccessMsg('');
  }

  function closeModal() {
    setModalVisible(false);
    setPetName('');
    setSpecies('');
    setDescription('');
    setContactPhone('');
    setPhoto(null);
    setGpsCoords(null);
    setRadiusKm(5);
    setFormError('');
  }

  // ─── Location picker ───────────────────────────────────
  async function openLocationPicker() {
    setMapGpsLoading(true);
    setLocationModalVisible(true);
    setTempRadius(radiusKm);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setMarkerCoordinate({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
      }
      // Si no hay permiso, markerCoordinate mantiene su valor default/anterior
    } catch (e) {
      console.warn('GPS error en picker:', e);
    } finally {
      setMapGpsLoading(false);
    }
  }

  function confirmLocation() {
    setGpsCoords({
      latitude: markerCoordinate.latitude,
      longitude: markerCoordinate.longitude,
    });
    setRadiusKm(tempRadius);
    setLocationModalVisible(false);
  }

  function cancelLocationPicker() {
    setLocationModalVisible(false);
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
    formData.append('radius_km', radiusKm.toString());
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

  // ─── Marcar como encontrado ─────────────────────────────
  function handleMarkAsFound(item) {
    Alert.alert(
      '¿Encontraste a tu mascota?',
      'Esto marcará el reporte como resuelto y ya no aparecerá como perdido.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sí, la encontré',
          style: 'default',
          onPress: async () => {
            const result = await updateReport(item.id, {
              status: 'found',
              is_found: true,
              found_at: new Date().toISOString(),
            });
            if (result.success) {
              setSuccessMsg('🎉 ¡Mascota marcada como encontrada!');
              setTimeout(() => setSuccessMsg(''), 4000);
              fetchReports();
            } else {
              Alert.alert('Error', result.error || 'No se pudo actualizar el reporte.');
            }
          },
        },
      ],
    );
  }

  // ─── Abrir modal de edición ─────────────────────────────
  function openEditModal(item) {
    setEditingReport(item);
    setEditPetName(item.pet_name || '');
    setEditDescription(item.description || '');
    setEditContactPhone(item.contact_phone || '');
    setEditContactEmail(item.contact_email || '');
    setEditError('');
    setEditModalVisible(true);
  }

  function closeEditModal() {
    setEditModalVisible(false);
    setEditingReport(null);
    setEditError('');
  }

  async function handleSaveEdit() {
    if (!editDescription.trim()) {
      setEditError('La descripción es obligatoria.');
      return;
    }
    setSaving(true);
    setEditError('');
    const result = await updateReport(editingReport.id, {
      pet_name: editPetName.trim(),
      description: editDescription.trim(),
      contact_phone: editContactPhone.trim(),
      contact_email: editContactEmail.trim(),
    });
    setSaving(false);
    if (result.success) {
      closeEditModal();
      setSuccessMsg('✏️ Reporte actualizado correctamente.');
      setTimeout(() => setSuccessMsg(''), 4000);
      fetchReports();
    } else {
      setEditError(result.error || 'No se pudo guardar.');
    }
  }

  // ─── Helpers ────────────────────────────────────────────
  function statusColor(s) {
    if (s === 'active' || s === 'perdido' || s === 'en_busqueda') return '#C4521A';
    if (s === 'found' || s === 'encontrado') return '#3B6B2A';
    if (s === 'cancelled' || s === 'cancelado') return '#6B6B6B';
    return '#C4521A';
  }
  
  function statusBgColor(s) {
    if (s === 'active' || s === 'perdido' || s === 'en_busqueda') return '#FEE9DA';
    if (s === 'found' || s === 'encontrado') return '#E4F2D6';
    if (s === 'cancelled' || s === 'cancelado') return '#EBEBEB';
    return '#FEE9DA';
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
    const bgColor = statusBgColor(item.status);
    return (
      <Card style={styles.card} mode="elevated">
        {item.photo_url ? (
          <Card.Cover source={{ uri: item.photo_url }} style={styles.cardImage} />
        ) : (
          <View style={[styles.placeholderImage, { backgroundColor: bgColor }]}>
            <Text style={{ fontSize: 48 }}>🐾</Text>
          </View>
        )}
        <Card.Content style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Text variant="titleMedium" style={styles.cardTitle} numberOfLines={1}>
              {item.pet_name || 'Sin nombre'}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: bgColor }]}>
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

          <Text variant="bodySmall" style={styles.cardLocation}>
            📍 {item.location_description || 'Ubicación no especificada'}
          </Text>

          {(item.reporter_name || item.user?.full_name) ? (
            <Text variant="bodySmall" style={styles.cardReporter}>
              👤 {item.reporter_name || item.user?.full_name}
            </Text>
          ) : null}

          {/* Botones del propietario */}
          {user && item.user_id === user.id && item.status === 'active' && (
            <View style={styles.ownerActions}>
              <TouchableOpacity
                style={styles.editBtn}
                onPress={() => openEditModal(item)}
                activeOpacity={0.7}
              >
                <Text style={styles.editBtnText}>✏️ Editar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.foundBtn}
                onPress={() => handleMarkAsFound(item)}
                activeOpacity={0.7}
              >
                <Text style={styles.foundBtnText}>✅ Marcar como encontrado</Text>
              </TouchableOpacity>
            </View>
          )}
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

                {/* Ubicación — map picker */}
                <Text variant="labelLarge" style={styles.fieldLabel}>
                  Ubicación
                </Text>
                {gpsCoords ? (
                  <View style={{ marginBottom: 16 }}>
                    <View style={styles.gpsSuccess}>
                      <Text style={styles.gpsSuccessText}>
                        📍 Ubicación seleccionada ✓
                      </Text>
                      <Text style={[styles.gpsSuccessText, { fontWeight: '400', marginTop: 2 }]}>
                        Radio de búsqueda: {radiusKm} km
                      </Text>
                    </View>
                    <View style={styles.miniMapContainer}>
                      <MapView
                        style={styles.miniMap}
                        provider={PROVIDER_GOOGLE}
                        region={{
                          latitude: gpsCoords.latitude,
                          longitude: gpsCoords.longitude,
                          latitudeDelta: 0.01,
                          longitudeDelta: 0.01,
                        }}
                        scrollEnabled={false}
                        zoomEnabled={false}
                        rotateEnabled={false}
                        pitchEnabled={false}
                      >
                        <Marker coordinate={gpsCoords} pinColor="red" />
                      </MapView>
                    </View>
                    <TouchableOpacity
                      style={styles.changeLocationBtn}
                      onPress={openLocationPicker}
                      disabled={creating}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.changeLocationText}>Cambiar ubicación</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.locationPickerBtn}
                    onPress={openLocationPicker}
                    disabled={creating}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.locationPickerBtnText}>📍 Elegir ubicación en el mapa</Text>
                  </TouchableOpacity>
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

      {/* ─── Modal de selección de ubicación ──────────────── */}
      <Modal
        visible={locationModalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={cancelLocationPicker}
      >
        <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
          {mapGpsLoading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color="#FF6B35" />
              <Text style={{ color: '#6B7280', marginTop: 12 }}>Obteniendo ubicación…</Text>
            </View>
          ) : (
            <>
              {/* Instrucción flotante */}
              <View style={styles.mapInstruction}>
                <Text style={styles.mapInstructionText}>
                  Arrastra el marcador al lugar donde se perdió tu mascota
                </Text>
              </View>

              <MapView
                ref={locationMapRef}
                style={{ width: SCREEN_W, height: SCREEN_H * 0.6 }}
                provider={PROVIDER_GOOGLE}
                initialRegion={{
                  latitude: markerCoordinate.latitude,
                  longitude: markerCoordinate.longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
                showsUserLocation
                scrollEnabled={!isDragging}
                pitchEnabled={false}
                rotateEnabled={false}
              >
                <Marker
                  coordinate={markerCoordinate}
                  draggable={true}
                  tracksViewChanges={false}
                  onDragStart={() => setIsDragging(true)}
                  onDragEnd={(e) => {
                    setIsDragging(false);
                    setMarkerCoordinate(e.nativeEvent.coordinate);
                  }}
                  pinColor="red"
                />
              </MapView>

              {/* Panel inferior: radio chips + botones */}
              <View style={styles.mapBottomPanel}>
                <Text style={styles.radiusLabel}>
                  Radio de búsqueda: {tempRadius} km
                </Text>
                <View style={styles.radiusChipsRow}>
                  {[1, 3, 5, 10, 20].map((km) => (
                    <TouchableOpacity
                      key={km}
                      style={[
                        styles.radiusChip,
                        tempRadius === km && styles.radiusChipActive,
                      ]}
                      onPress={() => setTempRadius(km)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.radiusChipText,
                          tempRadius === km && styles.radiusChipTextActive,
                        ]}
                      >
                        {km} km
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={styles.mapButtonsRow}>
                  <TouchableOpacity
                    style={styles.mapCancelBtn}
                    onPress={cancelLocationPicker}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.mapCancelText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.mapConfirmBtn}
                    onPress={confirmLocation}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.mapConfirmText}>Confirmar ubicación</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}
        </View>
      </Modal>

      {/* ─── Modal de edición ──────────────────────────────── */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeEditModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { height: '70%' }]}>
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
                    Editar Reporte
                  </Text>
                  <IconButton icon="close" onPress={closeEditModal} disabled={saving} />
                </View>
                <Divider style={{ marginBottom: 20 }} />

                {/* pet_name */}
                <TextInput
                  label="Nombre de la mascota"
                  value={editPetName}
                  onChangeText={setEditPetName}
                  mode="outlined"
                  left={<TextInput.Icon icon="paw" />}
                  style={styles.modalInput}
                  outlineStyle={styles.inputOutline}
                  outlineColor="#D1CFE2"
                  activeOutlineColor="#FF6B35"
                  disabled={saving}
                />

                {/* description */}
                <TextInput
                  label="Descripción *"
                  value={editDescription}
                  onChangeText={setEditDescription}
                  mode="outlined"
                  multiline
                  numberOfLines={3}
                  left={<TextInput.Icon icon="text" />}
                  style={[styles.modalInput, { minHeight: 80 }]}
                  outlineStyle={styles.inputOutline}
                  outlineColor="#D1CFE2"
                  activeOutlineColor="#FF6B35"
                  disabled={saving}
                />

                {/* contact_phone */}
                <TextInput
                  label="Teléfono de contacto"
                  value={editContactPhone}
                  onChangeText={setEditContactPhone}
                  mode="outlined"
                  keyboardType="phone-pad"
                  left={<TextInput.Icon icon="phone" />}
                  style={styles.modalInput}
                  outlineStyle={styles.inputOutline}
                  outlineColor="#D1CFE2"
                  activeOutlineColor="#FF6B35"
                  disabled={saving}
                />

                {/* contact_email */}
                <TextInput
                  label="Email de contacto"
                  value={editContactEmail}
                  onChangeText={setEditContactEmail}
                  mode="outlined"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  left={<TextInput.Icon icon="email" />}
                  style={styles.modalInput}
                  outlineStyle={styles.inputOutline}
                  outlineColor="#D1CFE2"
                  activeOutlineColor="#FF6B35"
                  disabled={saving}
                />

                {/* Error */}
                {editError ? (
                  <View style={styles.formErrorBox}>
                    <Text style={styles.formErrorText}>❌ {editError}</Text>
                  </View>
                ) : null}

                {/* Botones */}
                <View style={styles.editModalButtons}>
                  <TouchableOpacity
                    style={styles.editCancelBtn}
                    onPress={closeEditModal}
                    disabled={saving}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.editCancelText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.editSaveBtn, saving && styles.submitBtnDisabled]}
                    onPress={handleSaveEdit}
                    disabled={saving}
                    activeOpacity={0.8}
                  >
                    {saving ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.editSaveText}>Guardar cambios</Text>
                    )}
                  </TouchableOpacity>
                </View>
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
    backgroundColor: '#F5F0E8',
  },
  header: {
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#3B6B2A',
  },
  headerTitle: {
    fontWeight: '800',
    color: '#FDF5E6',
  },
  headerSub: {
    color: '#FDF5E6',
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
    color: '#6B5A3E',
    marginTop: 12,
    textAlign: 'center',
  },
  emptySubtitle: {
    color: '#9B8B6E',
    marginTop: 4,
  },

  // ─── Card ──────────────────────────────────────────────
  card: {
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: '#FDF5E6',
    borderWidth: 0.5,
    borderColor: 'rgba(107,90,62,0.15)',
    elevation: 0,
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
    color: '#6B5A3E',
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
    color: '#9B8B6E',
    marginBottom: 4,
  },
  cardDesc: {
    color: '#9B8B6E',
    marginBottom: 4,
  },
  cardLocation: {
    color: '#5A8A3C',
    fontSize: 12,
    marginBottom: 2,
  },
  cardReporter: {
    color: '#9B8B6E',
    fontSize: 12,
    marginTop: 4,
  },

  // ─── FAB ───────────────────────────────────────────────
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    backgroundColor: '#E8834A',
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
    backgroundColor: '#F5F0E8',
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
    color: '#6B5A3E',
  },
  modalInput: {
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  inputOutline: {
    borderRadius: 12,
    borderColor: 'rgba(107,90,62,0.2)',
  },
  fieldLabel: {
    color: '#6B5A3E',
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

  // ─── GPS / Location picker ─────────────────────────────
  gpsSuccess: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  gpsSuccessText: {
    color: '#2E7D32',
    fontWeight: '600',
    fontSize: 13,
  },
  miniMapContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 8,
  },
  miniMap: {
    width: '100%',
    height: 150,
  },
  changeLocationBtn: {
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  changeLocationText: {
    color: '#FF6B35',
    fontWeight: '600',
    fontSize: 13,
  },
  locationPickerBtn: {
    backgroundColor: '#FFF3ED',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FF6B35',
    borderStyle: 'dashed',
    marginBottom: 16,
  },
  locationPickerBtnText: {
    color: '#FF6B35',
    fontWeight: '700',
    fontSize: 15,
  },
  // ─── Location modal ───────────────────────────────────
  locationModalContainer: {
    flex: 1,
  },
  mapInstruction: {
    position: 'absolute',
    top: 50,
    alignSelf: 'center',
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  mapInstructionText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  mapBottomPanel: {
    padding: 20,
    paddingBottom: 36,
    backgroundColor: '#FFFFFF',
  },
  radiusLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A2E',
    textAlign: 'center',
    marginBottom: 4,
  },
  radiusChipsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  radiusChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
  },
  radiusChipActive: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  radiusChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  radiusChipTextActive: {
    color: '#FFFFFF',
  },
  mapButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  mapCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
  },
  mapCancelText: {
    color: '#6B7280',
    fontWeight: '600',
    fontSize: 15,
  },
  mapConfirmBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#FF6B35',
    elevation: 4,
  },
  mapConfirmText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
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
    backgroundColor: '#3B6B2A',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 24,
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

  // ─── Owner action buttons ──────────────────────────────
  ownerActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  editBtn: {
    flex: 1,
    backgroundColor: '#E3F2FD',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#90CAF9',
  },
  editBtnText: {
    color: '#1565C0',
    fontWeight: '700',
    fontSize: 13,
  },
  foundBtn: {
    flex: 2,
    backgroundColor: '#E8F5E9',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#A5D6A7',
  },
  foundBtnText: {
    color: '#2E7D32',
    fontWeight: '700',
    fontSize: 13,
  },

  // ─── Edit modal buttons ────────────────────────────────
  editModalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    marginBottom: 24,
  },
  editCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
  },
  editCancelText: {
    color: '#6B7280',
    fontWeight: '600',
    fontSize: 15,
  },
  editSaveBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#3B6B2A',
  },
  editSaveText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
});
