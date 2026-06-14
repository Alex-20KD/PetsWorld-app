import React, { useState } from 'react';
import { View, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { TextInput, Button, Text, HelperText, ActivityIndicator } from 'react-native-paper';
import { Link, useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { StyleSheet } from 'react-native';

export default function LoginScreen() {
  const { login } = useAuth();
  const router = useRouter();
  const { success: successMessage } = useLocalSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    console.log('1. handleLogin llamado');
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Por favor, completa todos los campos.');
      return;
    }

    setLoading(true);
    const result = await login(email.trim(), password);
    setLoading(false);

    console.log('2. resultado del login:', JSON.stringify(result));

    if (!result.success) {
      setError(result.error);
    } else {
      console.log('3. intentando navegar a tabs');
      // Login exitoso → navegar a las tabs principales
      router.replace('/(tabs)');
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header decorativo */}
        <View style={styles.headerContainer}>
          <View style={styles.iconCircle}>
            <Text style={styles.iconEmoji}>🐾</Text>
          </View>
          <Text variant="headlineLarge" style={styles.title}>
            PetsWorld
          </Text>
          <Text variant="bodyLarge" style={styles.subtitle}>
            Encuentra a tu mascota perdida
          </Text>
        </View>

        {/* Formulario */}
        <View style={styles.formContainer}>
          <TextInput
            label="Correo electrónico"
            value={email}
            onChangeText={setEmail}
            mode="outlined"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            left={<TextInput.Icon icon="email" />}
            style={styles.input}
            outlineStyle={styles.inputOutline}
            disabled={loading}
          />

          <TextInput
            label="Contraseña"
            value={password}
            onChangeText={setPassword}
            mode="outlined"
            secureTextEntry={!showPassword}
            left={<TextInput.Icon icon="lock" />}
            right={
              <TextInput.Icon
                icon={showPassword ? 'eye-off' : 'eye'}
                onPress={() => setShowPassword(!showPassword)}
              />
            }
            style={styles.input}
            outlineStyle={styles.inputOutline}
            disabled={loading}
          />

          {successMessage ? (
            <HelperText type="info" visible={true} style={styles.successText}>
              {successMessage}
            </HelperText>
          ) : null}

          {error ? (
            <HelperText type="error" visible={true} style={styles.errorText}>
              {error}
            </HelperText>
          ) : null}

          <Button
            mode="contained"
            onPress={handleLogin}
            disabled={loading}
            style={styles.button}
            contentStyle={styles.buttonContent}
            labelStyle={styles.buttonLabel}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              'Iniciar Sesión'
            )}
          </Button>

          <View style={styles.linkContainer}>
            <Text variant="bodyMedium" style={styles.linkText}>
              ¿No tienes cuenta?{' '}
            </Text>
            <Link href="/(auth)/register" asChild>
              <Text
                variant="bodyMedium"
                style={styles.linkAction}
                onPress={() => {}}
              >
                Regístrate aquí
              </Text>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E8E6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  iconEmoji: {
    fontSize: 48,
  },
  title: {
    fontWeight: '800',
    color: '#1A1A2E',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    color: '#6B7280',
    letterSpacing: 0.2,
  },
  formContainer: {
    width: '100%',
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#FAFAFA',
  },
  inputOutline: {
    borderRadius: 12,
    borderColor: '#D1CFE2',
  },
  errorText: {
    fontSize: 14,
    marginBottom: 8,
  },
  successText: {
    fontSize: 14,
    marginBottom: 8,
    color: '#16A34A',
  },
  button: {
    marginTop: 8,
    borderRadius: 12,
    backgroundColor: '#6C63FF',
    elevation: 4,
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  buttonContent: {
    height: 52,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  linkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  linkText: {
    color: '#6B7280',
  },
  linkAction: {
    color: '#6C63FF',
    fontWeight: '700',
  },
});
