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
  Switch,
  Animated,
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
import MapView, { Marker, Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import { LinearGradient } from 'expo-linear-gradient';
import AnimatedPressable from '../../components/AnimatedPressable';

import { useReports } from '../../context/ReportsContext';
import { useAuth } from '../../context/AuthContext';
import { StyleSheet, useWindowDimensions } from 'react-native';
import { fetchStats } from '../../services/api';

// ─── Animated wrapper for list items (hooks can't be used in renderItem) ──
function AnimatedEntrance({ children, delay = 0, style }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 350, delay, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, delay, useNativeDriver: true }),
    ]).start();
  }, []);
  return (
    <Animated.View style={[{ opacity, transform: [{ translateY }] }, style]}>
      {children}
    </Animated.View>
  );
}

function AnimatedScaleIn({ children, delay = 0, style }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 300, delay, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, delay, useNativeDriver: true }),
    ]).start();
  }, []);
  return (
    <Animated.View style={[{ opacity, transform: [{ scale }] }, style]}>
      {children}
    </Animated.View>
  );
}

const SPECIES_OPTIONS = ['Perro', 'Gato', 'Ave', 'Conejo', 'Otro'];
export default function ReportsScreen() {
  const { reports, loading, pagination, fetchReports, createReport, updateReport } = useReports();
  const { user } = useAuth();
  
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const isTablet = width >= 768;
  const isSmall = width < 375;
  const contentMaxWidth = isTablet ? 600 : width;
  const horizontalPadding = isTablet ? 32 : isSmall ? 12 : 16;
  
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({ rescued_pets: 0, total_reports: 0, active_reports: 0, total_users: 0 });

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
  const [hasReward, setHasReward] = useState(false);
  const [rewardAmount, setRewardAmount] = useState('');
  const [rewardDescription, setRewardDescription] = useState('');

  // ─── Estado del modal de edición ──────────────────────────
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingReport, setEditingReport] = useState(null);
  const [editPetName, setEditPetName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editContactPhone, setEditContactPhone] = useState('');
  const [editContactEmail, setEditContactEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState('');
  const [editHasReward, setEditHasReward] = useState(false);
  const [editRewardAmount, setEditRewardAmount] = useState('');
  const [editRewardDescription, setEditRewardDescription] = useState('');

  useEffect(() => {
    fetchReports();
    fetchStats().then(data => { if (data) setStats(data); });
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
    setHasReward(false);
    setRewardAmount('');
    setRewardDescription('');
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
    formData.append('has_reward', hasReward ? '1' : '0');
    if (hasReward && rewardAmount) formData.append('reward_amount', rewardAmount);
    if (hasReward && rewardDescription) formData.append('reward_description', rewardDescription);

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
    setEditHasReward(!!item.has_reward);
    setEditRewardAmount(item.reward_amount ? String(item.reward_amount) : '');
    setEditRewardDescription(item.reward_description || '');
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
    const editData = {
      pet_name: editPetName.trim(),
      description: editDescription.trim(),
      contact_phone: editContactPhone.trim(),
      contact_email: editContactEmail.trim(),
      has_reward: editHasReward,
    };
    if (editHasReward && editRewardAmount) editData.reward_amount = editRewardAmount;
    if (editHasReward && editRewardDescription) editData.reward_description = editRewardDescription;
    if (!editHasReward) {
      editData.reward_amount = null;
      editData.reward_description = null;
    }
    const result = await updateReport(editingReport.id, editData);
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
  function renderItem({ item, index }) {
    const color = statusColor(item.status);
    const bgColor = statusBgColor(item.status);
    return (
      <AnimatedEntrance delay={(index || 0) * 80}>
      <LinearGradient
        colors={['#FFFFFF', '#F5F0E8']}
        style={[styles.card, { padding: 0, overflow: 'hidden', width: isLandscape || isTablet ? (contentMaxWidth - horizontalPadding * 3) / 2 : '100%' }]}
      >
        <View style={styles.cardImageContainer}>
          {item.photo_url ? (
            <Image source={{ uri: item.photo_url }} style={styles.cardImage} />
          ) : (
            <LinearGradient
              colors={['#E8F5D6', '#F5EED8']}
              style={styles.placeholderGradient}
            >
              <View style={styles.placeholderCircle}>
                <Text style={{ fontSize: 32 }}>🐾</Text>
              </View>
            </LinearGradient>
          )}
          
          <View style={[styles.statusBadge, { backgroundColor: bgColor }]}>
            <Text style={[styles.statusBadgeText, { color }]}>
              {statusLabel(item.status)}
            </Text>
          </View>
        </View>

        <View style={styles.cardContent}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {item.pet_name || 'Sin nombre'}
            </Text>
            <View style={styles.speciesPill}>
              <Text style={styles.speciesPillText}>🐾 {item.species || 'Otro'}</Text>
            </View>
          </View>

          {item.description ? (
            <Text style={styles.cardDesc} numberOfLines={2}>
              {item.description}
            </Text>
          ) : null}

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
            <Text style={{ fontSize: 12 }}>📍</Text>
            <Text style={{ fontSize: 12, color: '#E8834A' }}>
              {item.location_description || 'Ubicación no especificada'}
            </Text>
            {!item.is_exact_location && (
              <Text style={{ fontSize: 10, color: '#9B8B6E', fontStyle: 'italic' }}>
                (aprox.)
              </Text>
            )}
          </View>

          {(item.reporter_name || item.user?.full_name) ? (
            <View style={styles.reporterRow}>
              <Text style={styles.reporterIcon}>👤</Text>
              <Text style={styles.cardReporter}>
                {item.reporter_name || item.user?.full_name}
              </Text>
            </View>
          ) : null}

          {item.has_reward && (
            <View style={{
              flexDirection: 'row', alignItems: 'center', gap: 4,
              backgroundColor: '#FFF8E1', borderRadius: 20,
              paddingHorizontal: 10, paddingVertical: 4,
              alignSelf: 'flex-start', marginTop: 6,
              borderWidth: 0.5, borderColor: '#F9A825',
            }}>
              <Text style={{ fontSize: 12 }}>💰</Text>
              <Text style={{ fontSize: 12, color: '#E65100', fontWeight: '600' }}>
                {item.reward_amount ? `Recompensa: $${item.reward_amount}` : 'Ofrece recompensa'}
              </Text>
            </View>
          )}

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
        </View>
      </LinearGradient>
      </AnimatedEntrance>
    );
  }

  // ─── Main render ────────────────────────────────────────
  const reportsList = Array.isArray(reports) ? reports : [];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, isLandscape && { paddingTop: 8, paddingBottom: 8 }]}>
        <View style={{ flex: 1 }}>
          {!isLandscape && (
            <Text style={styles.headerSuperTitle}>PETSWORLD</Text>
          )}
          <Text style={[styles.headerTitle, isLandscape && { fontSize: 22 }]}>Reportes</Text>
          {!isLandscape && (
            <Text style={styles.headerSub}>
              {pagination.total} mascotas reportadas
            </Text>
          )}
        </View>
        <View style={styles.headerIconCircle}>
          <IconButton icon="filter-variant" iconColor="#FFFFFF" size={20} style={{ margin: 0 }} />
        </View>
      </View>

      {/* Mensaje de éxito temporal */}
      {successMsg ? (
        <View style={styles.successBanner}>
          <Text style={styles.successBannerText}>✅ {successMsg}</Text>
        </View>
      ) : null}

      {/* Stats banner */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10, gap: 8 }}>
        {[
          { icon: '🐾', value: stats.rescued_pets, label: 'Rescatadas', color: '#3B6B2A' },
          { icon: '📋', value: stats.total_reports, label: 'Reportes', color: '#E8834A' },
          { icon: '🔍', value: stats.active_reports, label: 'En búsqueda', color: '#5A8A3C' },
          { icon: '👥', value: stats.total_users, label: 'Ayudando', color: '#6B5A3E' },
        ].map((item, i) => (
          <View key={i} style={{
            backgroundColor: '#FDF5E6', borderRadius: 12, padding: 12,
            alignItems: 'center', minWidth: 85,
            borderWidth: 0.5, borderColor: 'rgba(107,90,62,0.15)',
            elevation: 2,
          }}>
            <Text style={{ fontSize: 20 }}>{item.icon}</Text>
            <Text style={{ fontSize: 22, fontWeight: 'bold', color: item.color, fontFamily: 'serif' }}>
              {item.value}
            </Text>
            <Text style={{ fontSize: 10, color: '#9B8B6E', textAlign: 'center', marginTop: 2 }}>
              {item.label}
            </Text>
          </View>
        ))}
      </ScrollView>

      {/* Lista o loading */}
      {loading && reportsList.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text style={{ color: '#6B7280', marginTop: 12 }}>Cargando reportes...</Text>
        </View>
      ) : (
        <FlatList
          key={isLandscape || isTablet ? 'multi' : 'single'}
          numColumns={isLandscape || isTablet ? 2 : 1}
          columnWrapperStyle={isLandscape || isTablet ? { gap: horizontalPadding } : undefined}
          data={reportsList}
          renderItem={renderItem}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ paddingHorizontal: horizontalPadding, maxWidth: contentMaxWidth, alignSelf: 'center', width: '100%', paddingBottom: 100 }}
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
      <AnimatedScaleIn delay={300} style={styles.fabContainer}>
        <AnimatedPressable onPress={openModal}>
          <View pointerEvents="none">
            <FAB
              icon="plus"
              label="Reportar"
              style={styles.fab}
              color="#FFFFFF"
              uppercase={false}
              labelStyle={{ fontWeight: 'bold' }}
            />
          </View>
        </AnimatedPressable>
      </AnimatedScaleIn>

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

                {/* Toggle de recompensa */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <Text style={{ fontSize: 15, color: '#6B5A3E', fontWeight: '500' }}>💰 ¿Ofreces recompensa?</Text>
                  <Switch
                    value={hasReward}
                    onValueChange={setHasReward}
                    trackColor={{ false: '#E8E0D0', true: '#8BC34A' }}
                    thumbColor={hasReward ? '#3B6B2A' : '#9B8B6E'}
                    disabled={creating}
                  />
                </View>

                {/* Campos que aparecen solo si hasReward === true */}
                {hasReward && (
                  <>
                    <TextInput
                      label="Monto de la recompensa (ej: 50.00)"
                      value={rewardAmount}
                      onChangeText={setRewardAmount}
                      mode="outlined"
                      keyboardType="decimal-pad"
                      left={<TextInput.Icon icon="cash" />}
                      style={styles.modalInput}
                      outlineStyle={styles.inputOutline}
                      outlineColor="#D1CFE2"
                      activeOutlineColor="#FF6B35"
                      disabled={creating}
                    />
                    <TextInput
                      label="Descripción (ej: $50 en efectivo al entregar)"
                      value={rewardDescription}
                      onChangeText={setRewardDescription}
                      mode="outlined"
                      left={<TextInput.Icon icon="text-box-outline" />}
                      style={styles.modalInput}
                      outlineStyle={styles.inputOutline}
                      outlineColor="#D1CFE2"
                      activeOutlineColor="#FF6B35"
                      disabled={creating}
                    />
                  </>
                )}

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
                    <Text style={[styles.submitBtnText, { fontSize: isSmall ? 14 : isTablet ? 18 : 16 }]}>Crear Reporte</Text>
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
                style={{ width: width, height: height * 0.6 }}
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
                <Circle
                  center={markerCoordinate}
                  radius={tempRadius * 1000}
                  fillColor="rgba(59, 107, 42, 0.2)"
                  strokeColor="rgba(59, 107, 42, 0.6)"
                  strokeWidth={2}
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
                      onPress={() => {
                        setTempRadius(km);
                        const delta = (km * 2.5) / 111;
                        locationMapRef.current?.animateToRegion({
                          latitude: markerCoordinate.latitude,
                          longitude: markerCoordinate.longitude,
                          latitudeDelta: delta,
                          longitudeDelta: delta,
                        }, 500);
                      }}
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

                {/* Toggle de recompensa */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <Text style={{ fontSize: 15, color: '#6B5A3E', fontWeight: '500' }}>💰 ¿Ofreces recompensa?</Text>
                  <Switch
                    value={editHasReward}
                    onValueChange={setEditHasReward}
                    trackColor={{ false: '#E8E0D0', true: '#8BC34A' }}
                    thumbColor={editHasReward ? '#3B6B2A' : '#9B8B6E'}
                    disabled={saving}
                  />
                </View>

                {editHasReward && (
                  <>
                    <TextInput
                      label="Monto de la recompensa (ej: 50.00)"
                      value={editRewardAmount}
                      onChangeText={setEditRewardAmount}
                      mode="outlined"
                      keyboardType="decimal-pad"
                      left={<TextInput.Icon icon="cash" />}
                      style={styles.modalInput}
                      outlineStyle={styles.inputOutline}
                      outlineColor="#D1CFE2"
                      activeOutlineColor="#FF6B35"
                      disabled={saving}
                    />
                    <TextInput
                      label="Descripción (ej: $50 en efectivo al entregar)"
                      value={editRewardDescription}
                      onChangeText={setEditRewardDescription}
                      mode="outlined"
                      left={<TextInput.Icon icon="text-box-outline" />}
                      style={styles.modalInput}
                      outlineStyle={styles.inputOutline}
                      outlineColor="#D1CFE2"
                      activeOutlineColor="#FF6B35"
                      disabled={saving}
                    />
                  </>
                )}

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
    backgroundColor: '#E8834A',
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
    alignSelf: 'center',
    width: '100%',
    maxWidth: 600,
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
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#FDF5E6',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cardImageContainer: {
    height: 180,
    width: '100%',
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
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
  cardTitle: {
    fontFamily: 'serif',
    fontSize: 22,
    fontWeight: 'bold',
    color: '#3B6B2A',
    flex: 1,
    marginRight: 8,
  },
  speciesPill: {
    backgroundColor: 'rgba(255,255,255,0.5)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  speciesPillText: {
    fontSize: 12,
    color: '#6B5A3E',
    fontWeight: '600',
  },
  cardDesc: {
    color: '#9B8B6E',
    fontSize: 13,
    marginBottom: 12,
    lineHeight: 18,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  locationIcon: {
    color: '#E8834A',
    marginRight: 6,
    fontSize: 14,
  },
  cardLocation: {
    color: '#E8834A',
    fontSize: 13,
    flex: 1,
  },
  reporterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  reporterIcon: {
    color: '#9B8B6E',
    marginRight: 6,
    fontSize: 14,
  },
  cardReporter: {
    color: '#9B8B6E',
    fontSize: 13,
    flex: 1,
  },

  // ─── FAB ───────────────────────────────────────────────
  fabContainer: {
    position: 'absolute',
    right: 16,
    bottom: 20,
    zIndex: 10,
  },
  fab: {
    backgroundColor: '#E8834A',
    borderRadius: 28,
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#E8834A',
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
