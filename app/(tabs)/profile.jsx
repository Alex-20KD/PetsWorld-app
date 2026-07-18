import React from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Button, Avatar, Card, Divider, ActivityIndicator } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { StyleSheet, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';

export default function ProfileScreen() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();

  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const isTablet = width >= 768;
  const isSmall = width < 375;
  const contentMaxWidth = isTablet ? 600 : width;
  const horizontalPadding = isTablet ? 32 : isSmall ? 12 : 16;

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
      <LinearGradient
        colors={['#F5F0E8', '#EDE8DC']}
        style={[styles.profileTopSection, { flexDirection: isLandscape ? 'row' : 'column', gap: isLandscape ? 24 : 0, paddingHorizontal: horizontalPadding, paddingTop: isLandscape ? 8 : 64, paddingBottom: isLandscape ? 8 : 24 }]}
      >
        <View style={styles.avatarContainer}>
          <Avatar.Text
            size={96}
            label={getInitials(user?.full_name || user?.name)}
            style={styles.avatar}
            labelStyle={styles.avatarLabel}
          />
          <View style={styles.statusDot} />
        </View>

        <View style={{ alignItems: isLandscape ? 'flex-start' : 'center', justifyContent: 'center' }}>
          <Text style={styles.userName}>
            {user?.full_name || user?.name || 'Usuario'}
          </Text>
          <Text style={styles.userEmail}>
            {user?.email || 'Sin correo'}
          </Text>

          <View style={styles.rolBadge}>
            <Text style={styles.rolText}>
              {getRolLabel(user?.role || user?.rol)}
            </Text>
          </View>

          {user?.role === 'admin' && (
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/admin')}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 8,
                backgroundColor: '#3B6B2A', borderRadius: 12,
                paddingHorizontal: 20, paddingVertical: 10,
                marginTop: 12, alignSelf: 'center',
              }}>
              <Text style={{ fontSize: 16 }}>⚙️</Text>
              <Text style={{ color: '#FDF5E6', fontWeight: '600', fontSize: 14 }}>
                Panel de Administración
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      <Divider style={styles.divider} />

      {/* Info cards */}
      <View style={[styles.infoSection, { paddingHorizontal: horizontalPadding }]}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Información de la cuenta
        </Text>

        <MotiView
          from={{ opacity: 0, translateY: 15 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', delay: 120 }}
        >
        <Card style={[styles.infoCard, { maxWidth: contentMaxWidth }]} mode="elevated">
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
        </MotiView>
      </View>

      {/* Logout */}
      <Button
        mode="contained"
        icon="logout"
        onPress={handleLogout}
        disabled={loggingOut}
        style={styles.logoutButton}
        contentStyle={styles.logoutContent}
        labelStyle={[styles.logoutLabel, { fontSize: isSmall ? 14 : isTablet ? 18 : 16 }]}
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
    backgroundColor: '#F5F0E8',
  },
  content: {
    paddingBottom: 40,
    alignSelf: 'center',
    width: '100%',
    maxWidth: 600,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileTopSection: {
    alignItems: 'center',
    paddingTop: 64,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    backgroundColor: '#FDF5E6',
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  avatarLabel: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#3B6B2A',
  },
  statusDot: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#8BC34A',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  userName: {
    fontFamily: 'serif',
    fontSize: 26,
    fontWeight: 'bold',
    color: '#6B5A3E',
    marginBottom: 4,
  },
  userEmail: {
    color: '#9B8B6E',
    fontSize: 15,
    marginBottom: 12,
  },
  rolBadge: {
    backgroundColor: 'rgba(59,107,42,0.1)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(59,107,42,0.2)',
  },
  rolText: {
    color: '#3B6B2A',
    fontWeight: 'bold',
    fontSize: 13,
  },
  divider: {
    marginVertical: 16,
    backgroundColor: 'transparent',
  },
  infoSection: {
    paddingTop: 24,
  },
  sectionTitle: {
    fontWeight: '700',
    color: '#6B5A3E',
    marginBottom: 12,
  },
  infoCard: {
    borderRadius: 12,
    backgroundColor: '#FDF5E6',
    borderWidth: 0.5,
    borderColor: 'rgba(107,90,62,0.15)',
    elevation: 0,
    alignSelf: 'center',
    width: '100%',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    flexWrap: 'wrap',
  },
  infoLabel: {
    color: '#9B8B6E',
  },
  infoValue: {
    color: '#6B5A3E',
    fontWeight: '600',
    flexShrink: 1,
    textAlign: 'right',
    maxWidth: '55%',
  },
  infoDivider: {
    backgroundColor: 'rgba(107,90,62,0.15)',
  },
  logoutButton: {
    marginHorizontal: 20,
    marginTop: 32,
    borderRadius: 12,
    backgroundColor: '#E8834A',
  },
  logoutContent: {
    minHeight: 48,
  },
  logoutLabel: {
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  version: {
    textAlign: 'center',
    color: '#9B8B6E',
    marginTop: 24,
  },
});
