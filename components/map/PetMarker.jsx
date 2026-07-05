import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Marker } from 'react-native-maps';

// ─── Color mappings ──────────────────────────────────────────
const STATUS_COLORS = {
  active: '#EF4444',
  perdido: '#EF4444',
  en_busqueda: '#F59E0B',
  found: '#22C55E',
  encontrado: '#22C55E',
  cancelled: '#9CA3AF',
};

const SPECIES_ACCENT = {
  Perro: '#3B82F6',
  Gato: '#8B5CF6',
  Ave: '#F59E0B',
  Conejo: '#EC4899',
  Otro: '#6B7280',
};

function getBorderColor(report) {
  // Status takes priority for urgency signaling
  return STATUS_COLORS[report.status] || SPECIES_ACCENT[report.species] || '#6B7280';
}

/**
 * PetMarker — Custom circular marker with pet photo and name label.
 *
 * Props:
 *   report      – report object with lat/lng, pet_name, photo_url, status, species
 *   onPress     – callback when marker is tapped
 *   isSelected  – highlights the marker when selected
 */
export default function PetMarker({ report, onPress, isSelected }) {
  const borderColor = getBorderColor(report);
  const coord = {
    latitude: parseFloat(report.latitude),
    longitude: parseFloat(report.longitude),
  };

  return (
    <Marker
      coordinate={coord}
      onPress={() => onPress?.(report)}
      tracksViewChanges={false}
      anchor={{ x: 0.5, y: 1 }}
    >
      <View style={styles.wrapper}>
        {/* Avatar circle */}
        <View
          style={[
            styles.avatarRing,
            { borderColor },
            isSelected && styles.avatarRingSelected,
          ]}
        >
          {report.photo_url ? (
            <Image
              source={{ uri: report.photo_url }}
              style={styles.avatarImage}
            />
          ) : (
            <View style={[styles.avatarFallback, { backgroundColor: borderColor + '20' }]}>
              <Text style={styles.pawEmoji}>🐾</Text>
            </View>
          )}
        </View>

        {/* Name label pill */}
        <View style={[styles.labelPill, { backgroundColor: borderColor }]}>
          <Text style={styles.labelText} numberOfLines={1}>
            {report.pet_name || 'Sin nombre'}
          </Text>
        </View>

        {/* Triangle pointer */}
        <View style={[styles.pointer, { borderTopColor: borderColor }]} />
      </View>
    </Marker>
  );
}

const AVATAR_SIZE = 44;

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    width: 80,
  },
  avatarRing: {
    width: AVATAR_SIZE + 6,
    height: AVATAR_SIZE + 6,
    borderRadius: (AVATAR_SIZE + 6) / 2,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  avatarRingSelected: {
    borderWidth: 4,
    transform: [{ scale: 1.15 }],
  },
  avatarImage: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
  },
  avatarFallback: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pawEmoji: {
    fontSize: 20,
  },
  labelPill: {
    marginTop: 3,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    maxWidth: 78,
  },
  labelText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },
  pointer: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -1,
  },
});
