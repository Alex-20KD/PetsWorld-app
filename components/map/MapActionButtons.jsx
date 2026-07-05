import React from 'react';
import { View, TouchableOpacity, StyleSheet, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * MapActionButtons — Vertical column of floating action buttons on the right edge.
 *
 * Props:
 *   onMyLocation      – callback to center map on GPS
 *   onNewReport       – callback to open create report flow
 *   onNavigate        – callback to open external navigation (Google Maps)
 *   hasSelectedReport – whether a report is currently selected (enables navigation btn)
 *   isLandscape       – responsive adjustments
 */
export default function MapActionButtons({
  onMyLocation,
  onNewReport,
  onNavigate,
  hasSelectedReport,
  isLandscape,
}) {
  const btns = [
    {
      icon: 'locate',
      onPress: onMyLocation,
      label: 'Mi ubicación',
    },
    {
      icon: 'add-circle-outline',
      onPress: onNewReport,
      label: 'Nuevo reporte',
    },
    {
      icon: 'navigate-outline',
      onPress: hasSelectedReport
        ? onNavigate
        : () => Alert.alert('Selecciona un pin', 'Toca un marcador en el mapa primero para navegar hacia él.'),
      label: 'Navegar',
      disabled: false,
    },
  ];

  return (
    <View style={[styles.container, isLandscape && styles.containerLandscape]}>
      {btns.map((btn, i) => (
        <TouchableOpacity
          key={btn.icon}
          style={[
            styles.fab,
            i > 0 && { marginTop: 10 },
            isLandscape && styles.fabLandscape,
          ]}
          onPress={btn.onPress}
          activeOpacity={0.7}
        >
          <Ionicons
            name={btn.icon}
            size={isLandscape ? 20 : 22}
            color="#2D5F3E"
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 12,
    top: '42%',
    zIndex: 80,
    alignItems: 'center',
  },
  containerLandscape: {
    top: '30%',
    right: 10,
  },
  fab: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 4,
      },
      android: { elevation: 4 },
    }),
  },
  fabLandscape: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
});
