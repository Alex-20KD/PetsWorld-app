import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * MapHeader — Floating overlay header for the map screen.
 *
 * Props:
 *   onSettingsPress – callback for the gear button
 *   isLandscape     – adjusts sizing in landscape
 */
export default function MapHeader({ onSettingsPress, isLandscape }) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + (isLandscape ? 4 : 8) },
        isLandscape && styles.containerLandscape,
      ]}
    >
      {/* Left — Logo + Title */}
      <View style={styles.left}>
        <Text style={[styles.pawIcon, isLandscape && { fontSize: 20 }]}>🐾</Text>
        <View>
          <Text style={[styles.title, isLandscape && styles.titleLandscape]}>
            PetMap
          </Text>
          <Text style={[styles.subtitle, isLandscape && { fontSize: 10 }]}>
            Encuentra tu Amigo
          </Text>
        </View>
      </View>

      {/* Right — Settings button */}
      <TouchableOpacity
        style={[styles.settingsBtn, isLandscape && styles.settingsBtnLandscape]}
        onPress={onSettingsPress}
        activeOpacity={0.7}
      >
        <Ionicons name="settings-outline" size={isLandscape ? 18 : 22} color="#2D5F3E" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: 'rgba(250, 243, 224, 0.92)',
    zIndex: 100,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: { elevation: 6 },
    }),
  },
  containerLandscape: {
    paddingHorizontal: 24,
    paddingBottom: 6,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pawIcon: {
    fontSize: 28,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2D5F3E',
    letterSpacing: 0.5,
  },
  titleLandscape: {
    fontSize: 15,
  },
  subtitle: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    marginTop: -1,
  },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
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
  settingsBtnLandscape: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
});
