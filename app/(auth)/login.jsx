import React, { useState } from 'react';
import { View, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { TextInput, Button, Text, HelperText, ActivityIndicator } from 'react-native-paper';
import { Link, useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

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
      <LinearGradient
        colors={['rgba(90,138,60,0.3)', '#F0EDE4', 'rgba(232,131,74,0.2)']}
        locations={[0, 0.5, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          {/* Header decorativo */}
          <View style={styles.headerContainer}>
            <View style={styles.iconCircle}>
              <Text style={styles.iconEmoji}>🐾</Text>
            </View>
            <Text style={styles.title}>PetsWorld</Text>
            <Text style={styles.subtitle}>Encuentra a tu mascota perdida</Text>
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
            placeholderTextColor="#9B8B6E"
            left={<TextInput.Icon icon="email" color="#9B8B6E" />}
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
            placeholderTextColor="#9B8B6E"
            left={<TextInput.Icon icon="lock" color="#9B8B6E" />}
            right={
              <TextInput.Icon
                icon={showPassword ? 'eye-off' : 'eye'}
                color="#9B8B6E"
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
        </View>

        <Text style={styles.footerText}>
          PetsWorld v1.0.0 - Hecho con cariño para los que buscan
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F0E8',
    position: 'relative',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 40,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    marginHorizontal: 20,
    alignSelf: 'center',
    width: '100%',
    maxWidth: 450,
    padding: 32,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#E8F5D6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconEmoji: {
    fontSize: 32,
  },
  title: {
    fontFamily: 'serif',
    fontSize: 32,
    fontWeight: 'bold',
    color: '#3B6B2A',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#9B8B6E',
  },
  formContainer: {
    width: '100%',
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#F9F7F4',
  },
  inputOutline: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E0D0',
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
    backgroundColor: '#3B6B2A',
  },
  buttonContent: {
    height: 52,
  },
  buttonLabel: {
    fontFamily: 'serif',
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  linkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  linkText: {
    color: '#9B8B6E',
  },
  linkAction: {
    color: '#E8834A',
    fontWeight: '700',
  },
  footerText: {
    marginTop: 32,
    fontSize: 12,
    color: '#9B8B6E',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
});
