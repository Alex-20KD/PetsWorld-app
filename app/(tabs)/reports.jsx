import React, { useEffect, useState, useCallback } from 'react';
import { View, FlatList, Image, Modal, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, Card, Button, FAB, TextInput, ActivityIndicator, Chip, IconButton, Divider } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useReports } from '../../context/ReportsContext';
import { StyleSheet } from 'react-native';

export default function ReportsScreen() {
  const { reports, loading, pagination, fetchReports, createReport } = useReports();
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Campos del formulario de creación
  const [petName, setPetName] = useState('');
  const [species, setSpecies] = useState('');
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState(null);
  const [gpsCoords, setGpsCoords] = useState(null);
  const [creating, setCreating] = useState(false);

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

  async function openModal() {
    setModalVisible(true);
    // Obtener GPS automáticamente
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setGpsCoords({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      }
    } catch (e) {
      console.warn('No se pudo obtener GPS:', e);
    }
  }

  function closeModal() {
    setModalVisible(false);
    setPetName('');
    setSpecies('');
    setDescription('');
    setPhoto(null);
    setGpsCoords(null);
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
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setPhoto(result.assets[0]);
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
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setPhoto(result.assets[0]);
    }
  }

  async function handleCreate() {
    if (!petName.trim() || !species.trim()) {
      Alert.alert('Campos requeridos', 'Nombre y especie son obligatorios.');
      return;
    }
    setCreating(true);
    const formData = new FormData();
    formData.append('pet_name', petName.trim());
    formData.append('species', species.trim());
    formData.append('description', description.trim());
    if (gpsCoords) {
      formData.append('latitude', gpsCoords.latitude.toString());
      formData.append('longitude', gpsCoords.longitude.toString());
    }
    if (photo) {
      const uri = photo.uri;
      const name = uri.split('/').pop();
      const ext = name.split('.').pop();
      formData.append('photo', { uri, name, type: `image/${ext}` });
    }
    const result = await createReport(formData);
    setCreating(false);
    if (result.success) {
      closeModal();
      Alert.alert('¡Listo!', 'Reporte creado exitosamente.');
    } else {
      Alert.alert('Error', result.error);
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

  function renderItem({ item }) {
    return (
      <Card style={styles.card} mode="elevated">
        {item.photo_url ? (
          <Card.Cover source={{ uri: item.photo_url }} style={styles.cardImage} />
        ) : (
          <View style={styles.placeholderImage}>
            <Text style={{ fontSize: 48 }}>🐾</Text>
          </View>
        )}
        <Card.Content style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Text variant="titleMedium" style={styles.cardTitle}>{item.pet_name || 'Sin nombre'}</Text>
            <Chip style={[styles.statusChip, { backgroundColor: statusColor(item.status) + '20' }]} textStyle={{ color: statusColor(item.status), fontSize: 11, fontWeight: '700' }}>
              {statusLabel(item.status)}
            </Chip>
          </View>
          <Text variant="bodyMedium" style={styles.cardSpecies}>🐾 {item.species || 'Especie desconocida'}</Text>
          {item.description ? <Text variant="bodySmall" style={styles.cardDesc} numberOfLines={2}>{item.description}</Text> : null}
          {item.latitude && item.longitude ? (
            <Text variant="bodySmall" style={styles.cardLocation}>📍 {parseFloat(item.latitude).toFixed(4)}, {parseFloat(item.longitude).toFixed(4)}</Text>
          ) : null}
        </Card.Content>
      </Card>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text variant="headlineSmall" style={styles.headerTitle}>📋 Reportes</Text>
        <Text variant="bodyMedium" style={styles.headerSub}>{pagination.total} mascotas reportadas</Text>
      </View>

      {loading && reports.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#6C63FF" />
          <Text style={{ color: '#6B7280', marginTop: 12 }}>Cargando reportes...</Text>
        </View>
      ) : (
        <FlatList
          data={reports}
          renderItem={renderItem}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          onRefresh={onRefresh}
          refreshing={refreshing}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={{ fontSize: 64 }}>🔍</Text>
              <Text variant="titleMedium" style={{ color: '#6B7280', marginTop: 12 }}>No hay reportes aún</Text>
              <Text variant="bodyMedium" style={{ color: '#9E9E9E', marginTop: 4 }}>Crea el primero con el botón +</Text>
            </View>
          }
          ListFooterComponent={loading && reports.length > 0 ? <ActivityIndicator style={{ padding: 16 }} color="#6C63FF" /> : null}
        />
      )}

      {/* FAB */}
      <FAB icon="plus" style={styles.fab} color="#FFFFFF" onPress={openModal} />

      {/* Modal de creación */}
      <Modal visible={modalVisible} animationType="slide" transparent={false} onRequestClose={closeModal}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
            <View style={styles.modalHeader}>
              <Text variant="headlineSmall" style={{ fontWeight: '700', color: '#1A1A2E' }}>Nuevo Reporte</Text>
              <IconButton icon="close" onPress={closeModal} />
            </View>
            <Divider style={{ marginBottom: 16 }} />

            <TextInput label="Nombre de la mascota *" value={petName} onChangeText={setPetName} mode="outlined" left={<TextInput.Icon icon="paw" />} style={styles.modalInput} outlineStyle={{ borderRadius: 12 }} disabled={creating} />
            <TextInput label="Especie *" value={species} onChangeText={setSpecies} mode="outlined" placeholder="Ej: Perro, Gato, Ave..." left={<TextInput.Icon icon="cat" />} style={styles.modalInput} outlineStyle={{ borderRadius: 12 }} disabled={creating} />
            <TextInput label="Descripción" value={description} onChangeText={setDescription} mode="outlined" multiline numberOfLines={3} left={<TextInput.Icon icon="text" />} style={styles.modalInput} outlineStyle={{ borderRadius: 12 }} disabled={creating} />

            {/* Foto */}
            <Text variant="labelLarge" style={{ color: '#1A1A2E', marginBottom: 8 }}>Foto de la mascota</Text>
            <View style={styles.photoButtons}>
              <Button mode="outlined" icon="camera" onPress={takePhoto} style={styles.photoBtn} disabled={creating}>Cámara</Button>
              <Button mode="outlined" icon="image" onPress={pickImage} style={styles.photoBtn} disabled={creating}>Galería</Button>
            </View>
            {photo && (
              <View style={styles.photoPreview}>
                <Image source={{ uri: photo.uri }} style={styles.previewImage} />
                <IconButton icon="close-circle" size={24} onPress={() => setPhoto(null)} style={styles.removePhoto} />
              </View>
            )}

            {/* GPS */}
            {gpsCoords && (
              <Chip icon="map-marker" style={styles.gpsChip}>
                📍 {gpsCoords.latitude.toFixed(4)}, {gpsCoords.longitude.toFixed(4)}
              </Chip>
            )}

            <Button mode="contained" onPress={handleCreate} disabled={creating} style={styles.createBtn} contentStyle={{ height: 52 }} labelStyle={{ fontSize: 16, fontWeight: '700' }}>
              {creating ? <ActivityIndicator size="small" color="#FFF" /> : 'Crear Reporte'}
            </Button>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5FA' },
  header: { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16, backgroundColor: '#FFF' },
  headerTitle: { fontWeight: '800', color: '#1A1A2E' },
  headerSub: { color: '#6B7280', marginTop: 4 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 },
  list: { padding: 16, paddingBottom: 100 },
  card: { marginBottom: 16, borderRadius: 16, backgroundColor: '#FFF', elevation: 3 },
  cardImage: { borderTopLeftRadius: 16, borderTopRightRadius: 16, height: 180 },
  placeholderImage: { height: 120, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F0EFF5', borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  cardContent: { paddingTop: 12, paddingBottom: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  cardTitle: { fontWeight: '700', color: '#1A1A2E', flex: 1 },
  statusChip: { height: 28 },
  cardSpecies: { color: '#6B7280', marginBottom: 4 },
  cardDesc: { color: '#9E9E9E', marginBottom: 4 },
  cardLocation: { color: '#6C63FF', fontSize: 12 },
  fab: { position: 'absolute', right: 20, bottom: 24, backgroundColor: '#6C63FF', borderRadius: 28, elevation: 6 },
  modalContent: { flexGrow: 1, padding: 24, paddingTop: 56, backgroundColor: '#FFF' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalInput: { marginBottom: 16, backgroundColor: '#FAFAFA' },
  photoButtons: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  photoBtn: { flex: 1, borderRadius: 12, borderColor: '#D1CFE2' },
  photoPreview: { position: 'relative', marginBottom: 16 },
  previewImage: { width: '100%', height: 200, borderRadius: 12 },
  removePhoto: { position: 'absolute', top: -8, right: -8 },
  gpsChip: { marginBottom: 16, backgroundColor: '#E8E6FF' },
  createBtn: { marginTop: 8, borderRadius: 12, backgroundColor: '#6C63FF', elevation: 4 },
});
