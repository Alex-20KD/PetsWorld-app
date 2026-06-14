import React from 'react';
import { View, ScrollView } from 'react-native';
import { Text, Button, Avatar, Card, Divider, ActivityIndicator } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { StyleSheet } from 'react-native';

export default function ProfileScreen() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = React.useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    await logout();
    router.replace('/(auth)/login');
  }

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

  function getInitials(name) {
    if (!name) return '?';
    return name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  function getRolLabel(rol) {
    switch (rol) {
      case 'admin':
        return 'Administrador';
      case 'moderator':
        return 'Moderador';
      default:
        return 'Usuario';
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header con avatar */}
      <View style={styles.headerSection}>
        <View style={styles.avatarContainer}>
          <Avatar.Text
            size={96}
            label={getInitials(user?.full_name || user?.name)}
            style={styles.avatar}
            labelStyle={styles.avatarLabel}
          />
          <View style={styles.statusDot} />
        </View>

        <Text variant="headlineSmall" style={styles.userName}>
          {user?.full_name || user?.name || 'Usuario'}
        </Text>
        <Text variant="bodyLarge" style={styles.userEmail}>
          {user?.email || 'Sin correo'}
        </Text>

        <View style={styles.rolBadge}>
          <Text style={styles.rolText}>
            {getRolLabel(user?.role || user?.rol)}
          </Text>
        </View>
      </View>

      <Divider style={styles.divider} />

      {/* Info cards */}
      <View style={styles.infoSection}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Información de la cuenta
        </Text>

        <Card style={styles.infoCard} mode="elevated">
          <Card.Content>
            <View style={styles.infoRow}>
              <Text variant="bodyMedium" style={styles.infoLabel}>
                👤 Nombre
              </Text>
              <Text variant="bodyMedium" style={styles.infoValue}>
                {user?.full_name || user?.name || '—'}
              </Text>
            </View>
            <Divider style={styles.infoDivider} />
            <View style={styles.infoRow}>
              <Text variant="bodyMedium" style={styles.infoLabel}>
                ✉️ Correo
              </Text>
              <Text variant="bodyMedium" style={styles.infoValue}>
                {user?.email || '—'}
              </Text>
            </View>
            <Divider style={styles.infoDivider} />
            <View style={styles.infoRow}>
              <Text variant="bodyMedium" style={styles.infoLabel}>
                🛡️ Rol
              </Text>
              <Text variant="bodyMedium" style={styles.infoValue}>
                {getRolLabel(user?.role || user?.rol)}
              </Text>
            </View>
            {user?.created_at && (
              <>
                <Divider style={styles.infoDivider} />
                <View style={styles.infoRow}>
                  <Text variant="bodyMedium" style={styles.infoLabel}>
                    📅 Miembro desde
                  </Text>
                  <Text variant="bodyMedium" style={styles.infoValue}>
                    {new Date(user.created_at).toLocaleDateString('es-MX', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </Text>
                </View>
              </>
            )}
          </Card.Content>
        </Card>
      </View>

      {/* Logout */}
      <Button
        mode="contained"
        icon="logout"
        onPress={handleLogout}
        disabled={loggingOut}
        style={styles.logoutButton}
        contentStyle={styles.logoutContent}
        labelStyle={styles.logoutLabel}
      >
        {loggingOut ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          'Cerrar Sesión'
        )}
      </Button>

      <Text variant="bodySmall" style={styles.version}>
        PetsWorld v1.0.0
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5FA',
  },
  content: {
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerSection: {
    alignItems: 'center',
    paddingTop: 64,
    paddingBottom: 24,
    backgroundColor: '#FFFFFF',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    backgroundColor: '#6C63FF',
  },
  avatarLabel: {
    fontSize: 36,
    fontWeight: '700',
  },
  statusDot: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#4CAF50',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  userName: {
    fontWeight: '800',
    color: '#1A1A2E',
    marginBottom: 4,
  },
  userEmail: {
    color: '#6B7280',
    marginBottom: 12,
  },
  rolBadge: {
    backgroundColor: '#E8E6FF',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  rolText: {
    color: '#6C63FF',
    fontWeight: '700',
    fontSize: 13,
  },
  divider: {
    marginVertical: 0,
  },
  infoSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionTitle: {
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 12,
  },
  infoCard: {
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  infoLabel: {
    color: '#6B7280',
  },
  infoValue: {
    color: '#1A1A2E',
    fontWeight: '600',
    flexShrink: 1,
    textAlign: 'right',
    maxWidth: '55%',
  },
  infoDivider: {
    backgroundColor: '#F0EFF5',
  },
  logoutButton: {
    marginHorizontal: 20,
    marginTop: 32,
    borderRadius: 12,
    backgroundColor: '#FF6B6B',
    elevation: 4,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  logoutContent: {
    height: 52,
  },
  logoutLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  version: {
    textAlign: 'center',
    color: '#9E9E9E',
    marginTop: 24,
  },
});
