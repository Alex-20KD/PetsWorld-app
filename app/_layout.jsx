import React from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider, MD3DarkTheme, MD3LightTheme } from 'react-native-paper';
import { AuthProvider } from '../context/AuthContext';
import { ReportsProvider } from '../context/ReportsContext';

const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#6C63FF',
    primaryContainer: '#E8E6FF',
    secondary: '#FF6B6B',
    secondaryContainer: '#FFE0E0',
    tertiary: '#26C6DA',
    tertiaryContainer: '#E0F7FA',
    surface: '#FAFAFA',
    surfaceVariant: '#F0EFF5',
    background: '#FFFFFF',
    error: '#EF5350',
    onPrimary: '#FFFFFF',
    onSecondary: '#FFFFFF',
    onBackground: '#1A1A2E',
    onSurface: '#1A1A2E',
    outline: '#D1CFE2',
  },
  roundness: 12,
};

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <AuthProvider>
          <ReportsProvider>
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: theme.colors.background },
                animation: 'slide_from_right',
              }}
            >
              <Stack.Screen name="index" />
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(tabs)" />
            </Stack>
          </ReportsProvider>
        </AuthProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
