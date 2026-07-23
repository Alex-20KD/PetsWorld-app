import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { ActivityIndicator, Button, Text } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import AnimatedPressable from '../components/AnimatedPressable';
import { useAuth } from '../context/AuthContext';

export default function Index() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslateY = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      Animated.parallel([
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 450,
          useNativeDriver: true,
        }),
        Animated.spring(contentTranslateY, {
          toValue: 0,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [contentOpacity, contentTranslateY, isAuthenticated, isLoading]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B6B2A" />
      </View>
    );
  }

  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#E8F5D6', '#F5F0E8', '#FCE7D6']}
        locations={[0, 0.55, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <Animated.View
        style={[
          styles.content,
          {
            opacity: contentOpacity,
            transform: [{ translateY: contentTranslateY }],
          },
        ]}
      >
        <View style={styles.pawCircle}>
          <Text style={styles.paw}>🐾</Text>
        </View>

        <Text style={styles.brand}>PetsWorld</Text>
        <Text style={styles.title}>Juntos los traemos a casa</Text>
        <Text style={styles.description}>
          Reporta mascotas perdidas, ayuda a encontrarlas y conoce compañeros que esperan una familia.
        </Text>

        <AnimatedPressable
          style={styles.buttonWrapper}
          onPress={() => router.push('/(auth)/login')}
        >
          <View pointerEvents="none">
            <Button
              mode="contained"
              style={styles.loginButton}
              contentStyle={styles.loginButtonContent}
              labelStyle={styles.loginButtonLabel}
            >
              Iniciar sesión
            </Button>
          </View>
        </AnimatedPressable>

        <AnimatedPressable onPress={() => router.push('/(auth)/register')}>
          <Text style={styles.registerText}>¿Aún no tienes cuenta? Regístrate</Text>
        </AnimatedPressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F0E8',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  pawCircle: {
    width: 116,
    height: 116,
    borderRadius: 58,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderWidth: 1,
    borderColor: 'rgba(59,107,42,0.16)',
    elevation: 3,
    marginBottom: 24,
  },
  paw: {
    fontSize: 56,
  },
  brand: {
    color: '#3B6B2A',
    fontFamily: 'serif',
    fontSize: 42,
    fontWeight: 'bold',
  },
  title: {
    color: '#6B5A3E',
    fontFamily: 'serif',
    fontSize: 26,
    fontWeight: 'bold',
    marginTop: 10,
    textAlign: 'center',
  },
  description: {
    color: '#7C6B50',
    fontSize: 16,
    lineHeight: 24,
    marginTop: 16,
    maxWidth: 360,
    textAlign: 'center',
  },
  buttonWrapper: {
    alignSelf: 'stretch',
    marginTop: 36,
    maxWidth: 360,
  },
  loginButton: {
    backgroundColor: '#3B6B2A',
    borderRadius: 14,
  },
  loginButtonContent: {
    minHeight: 54,
  },
  loginButtonLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  registerText: {
    color: '#3B6B2A',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 20,
    textAlign: 'center',
  },
});
