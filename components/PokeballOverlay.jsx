import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Text } from 'react-native';

/**
 * PokeballOverlay — Overlay a pantalla completa con una pokébola animada.
 * Se muestra mientras se procesa la captura de un avistamiento.
 *
 * Props:
 *   visible: boolean — controla si se muestra
 *   message: string  — texto debajo de la pokébola (default: "Procesando captura…")
 */
export default function PokeballOverlay({ visible, message = 'Procesando captura…' }) {
  const spinAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Entrada
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 5,
          tension: 80,
          useNativeDriver: true,
        }),
      ]).start();

      // Rotación continua
      const loop = Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      );
      loop.start();

      return () => loop.stop();
    } else {
      // Salida
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
      spinAnim.setValue(0);
      scaleAnim.setValue(0.3);
    }
  }, [visible]);

  if (!visible) return null;

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View style={[styles.overlay, { opacity: opacityAnim }]}>
      <Animated.View
        style={[
          styles.pokeballContainer,
          {
            transform: [{ rotate: spin }, { scale: scaleAnim }],
          },
        ]}
      >
        {/* Pokébola construida con Views */}
        <View style={styles.pokeball}>
          {/* Mitad superior — roja */}
          <View style={styles.topHalf} />
          {/* Mitad inferior — blanca */}
          <View style={styles.bottomHalf} />
          {/* Línea central negra */}
          <View style={styles.centerLine} />
          {/* Círculo central exterior */}
          <View style={styles.centerCircleOuter}>
            {/* Círculo central interior (botón) */}
            <View style={styles.centerCircleInner} />
          </View>
        </View>
      </Animated.View>

      {/* Mensaje */}
      <Text style={styles.message}>{message}</Text>

      {/* Partículas decorativas */}
      <View style={styles.sparkle1} />
      <View style={styles.sparkle2} />
      <View style={styles.sparkle3} />
    </Animated.View>
  );
}

const BALL_SIZE = 120;

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  pokeballContainer: {
    width: BALL_SIZE,
    height: BALL_SIZE,
  },
  pokeball: {
    width: BALL_SIZE,
    height: BALL_SIZE,
    borderRadius: BALL_SIZE / 2,
    overflow: 'hidden',
    borderWidth: 4,
    borderColor: '#1A1A2E',
    position: 'relative',
  },
  topHalf: {
    width: '100%',
    height: '50%',
    backgroundColor: '#EF4444',
  },
  bottomHalf: {
    width: '100%',
    height: '50%',
    backgroundColor: '#FAFAFA',
  },
  centerLine: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: 6,
    backgroundColor: '#1A1A2E',
    marginTop: -3,
  },
  centerCircleOuter: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1A1A2E',
    marginLeft: -16,
    marginTop: -16,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  centerCircleInner: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FAFAFA',
    borderWidth: 3,
    borderColor: '#6B7280',
  },
  message: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 28,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  // Partículas decorativas (estáticas, dan brillo al overlay)
  sparkle1: {
    position: 'absolute',
    top: '25%',
    left: '20%',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 107, 53, 0.6)',
  },
  sparkle2: {
    position: 'absolute',
    top: '30%',
    right: '18%',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 200, 50, 0.5)',
  },
  sparkle3: {
    position: 'absolute',
    bottom: '28%',
    left: '30%',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
});
