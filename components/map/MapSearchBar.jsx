import React from 'react';
import { View, TextInput, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * MapSearchBar — Pill-shaped search input overlaid on the map.
 *
 * Props:
 *   value       – current search query
 *   onChange    – callback with new text
 *   topOffset   – distance from top (to sit below header)
 *   isLandscape – responsive adjustments
 */
export default function MapSearchBar({ value, onChange, topOffset = 100, isLandscape }) {
  return (
    <View
      style={[
        styles.container,
        { top: topOffset },
        isLandscape && styles.containerLandscape,
      ]}
    >
      <Ionicons name="search" size={18} color="#9CA3AF" style={styles.icon} />
      <TextInput
        style={styles.input}
        placeholder="Buscar mascota..."
        placeholderTextColor="#9CA3AF"
        value={value}
        onChangeText={onChange}
        returnKeyType="search"
        autoCorrect={false}
      />
      {value.length > 0 && (
        <Ionicons
          name="close-circle"
          size={18}
          color="#9CA3AF"
          onPress={() => onChange('')}
          style={styles.clearIcon}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 16,
    height: 44,
    zIndex: 90,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
      },
      android: { elevation: 4 },
    }),
  },
  containerLandscape: {
    left: 24,
    right: '40%',
  },
  icon: {
    marginRight: 8,
  },
  clearIcon: {
    marginLeft: 4,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#1A1A2E',
    paddingVertical: 0,
  },
});
