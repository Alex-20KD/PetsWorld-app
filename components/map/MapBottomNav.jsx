import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const NAV_ITEMS = [
  { key: 'home', icon: 'map', iconOutline: 'map-outline', label: 'Inicio' },
  { key: 'report', icon: 'add-circle', iconOutline: 'add-circle-outline', label: 'Reportar' },
  { key: 'lost', icon: 'paw', iconOutline: 'paw-outline', label: 'Perdidos' },
  { key: 'sighted', icon: 'eye', iconOutline: 'eye-outline', label: 'Vistos' },
  { key: 'profile', icon: 'person', iconOutline: 'person-outline', label: 'Mi Perfil' },
];

/**
 * MapBottomNav — Floating pill nav bar at the bottom of the map.
 *
 * Props:
 *   activeKey   – which nav item is currently active
 *   onPress     – callback(key) when a nav item is tapped
 *   isLandscape – responsive adjustments (hides labels, shrinks)
 */
export default function MapBottomNav({ activeKey = 'home', onPress, isLandscape }) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        { paddingBottom: Math.max(insets.bottom, 8) },
        isLandscape && styles.containerLandscape,
      ]}
    >
      <View style={[styles.pill, isLandscape && styles.pillLandscape]}>
        {NAV_ITEMS.map((item) => {
          const isActive = activeKey === item.key;
          return (
            <TouchableOpacity
              key={item.key}
              style={[
                styles.navItem,
                isActive && styles.navItemActive,
                isLandscape && styles.navItemLandscape,
              ]}
              onPress={() => onPress?.(item.key)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isActive ? item.icon : item.iconOutline}
                size={isLandscape ? 20 : 22}
                color={isActive ? '#FFFFFF' : 'rgba(255,255,255,0.6)'}
              />
              {!isLandscape && (
                <Text
                  style={[
                    styles.navLabel,
                    isActive && styles.navLabelActive,
                  ]}
                >
                  {item.label}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 90,
    paddingHorizontal: 16,
  },
  containerLandscape: {
    paddingHorizontal: 40,
  },
  pill: {
    flexDirection: 'row',
    backgroundColor: 'rgba(30, 60, 40, 0.92)',
    borderRadius: 28,
    paddingVertical: 6,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    maxWidth: 420,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: { elevation: 8 },
    }),
  },
  pillLandscape: {
    paddingVertical: 4,
    maxWidth: 360,
    borderRadius: 22,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 18,
    minWidth: 54,
  },
  navItemActive: {
    backgroundColor: 'rgba(90, 158, 111, 0.5)',
  },
  navItemLandscape: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    minWidth: 44,
  },
  navLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '600',
    marginTop: 2,
  },
  navLabelActive: {
    color: '#FFFFFF',
  },
});
