import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const FILTER_DEFS = [
  { key: 'dogs', label: 'Perros', icon: 'paw', color: '#3B82F6' },
  { key: 'cats', label: 'Gatos', icon: 'paw', color: '#8B5CF6' },
  { key: 'lostOnly', label: 'Solo perdidos', icon: 'alert-circle', color: '#EF4444' },
  { key: 'foundOnly', label: 'Solo encontrados', icon: 'checkmark-circle', color: '#22C55E' },
];

/**
 * MapFilterPanel — Collapsible floating panel with filter checkboxes.
 *
 * Props:
 *   filters        – { dogs, cats, lostOnly, foundOnly }
 *   onFilterChange – callback with updated filters
 *   isLandscape    – responsive adjustments
 */
export default function MapFilterPanel({ filters, onFilterChange, isLandscape }) {
  const [expanded, setExpanded] = useState(false);
  const heightAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(heightAnim, {
      toValue: expanded ? 1 : 0,
      friction: 8,
      tension: 60,
      useNativeDriver: false,
    }).start();
  }, [expanded]);

  const panelHeight = heightAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, FILTER_DEFS.length * 42 + 16],
  });

  function toggleFilter(key) {
    const updated = { ...filters, [key]: !filters[key] };
    // lostOnly and foundOnly are mutually exclusive
    if (key === 'lostOnly' && updated.lostOnly) updated.foundOnly = false;
    if (key === 'foundOnly' && updated.foundOnly) updated.lostOnly = false;
    onFilterChange(updated);
  }

  return (
    <View style={[styles.wrapper, isLandscape && styles.wrapperLandscape]}>
      {/* Toggle button */}
      <TouchableOpacity
        style={styles.toggleBtn}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <Ionicons name="options-outline" size={16} color="#2D5F3E" />
        <Text style={styles.toggleText}>
          {isLandscape ? 'Filtros' : 'Filtros de Mapa'}
        </Text>
        <Ionicons
          name={expanded ? 'chevron-down' : 'chevron-up'}
          size={16}
          color="#6B7280"
        />
      </TouchableOpacity>

      {/* Expandable panel */}
      <Animated.View style={[styles.panel, { height: panelHeight }]}>
        <View style={styles.panelInner}>
          {FILTER_DEFS.map((f) => (
            <TouchableOpacity
              key={f.key}
              style={styles.filterRow}
              onPress={() => toggleFilter(f.key)}
              activeOpacity={0.6}
            >
              <View style={styles.filterLeft}>
                <View style={[styles.swatch, { backgroundColor: f.color }]} />
                <Text style={styles.filterLabel}>{f.label}</Text>
              </View>
              <Ionicons
                name={filters[f.key] ? 'checkbox' : 'square-outline'}
                size={20}
                color={filters[f.key] ? '#2D5F3E' : '#9CA3AF'}
              />
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 100,
    left: 12,
    zIndex: 80,
    maxWidth: 200,
  },
  wrapperLandscape: {
    bottom: 70,
    left: 12,
    maxWidth: 170,
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(250, 243, 224, 0.95)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: { elevation: 3 },
    }),
  },
  toggleText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: '#2D5F3E',
  },
  panel: {
    overflow: 'hidden',
    marginTop: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
      },
      android: { elevation: 4 },
    }),
  },
  panelInner: {
    padding: 8,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  filterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  swatch: {
    width: 12,
    height: 12,
    borderRadius: 3,
  },
  filterLabel: {
    fontSize: 13,
    color: '#1A1A2E',
    fontWeight: '500',
  },
});
