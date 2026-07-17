import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { fetchAdminStats, fetchAdminUsers } from '../../services/api';

function AdminStatCard({ icon, label, value, color }) {
  return (
    <View style={{
      backgroundColor: '#FDF5E6', borderRadius: 12, padding: 16,
      width: '47%', alignItems: 'center',
      borderWidth: 0.5, borderColor: 'rgba(107,90,62,0.15)',
      elevation: 2,
    }}>
      <Text style={{ fontSize: 24 }}>{icon}</Text>
      <Text style={{ fontSize: 28, fontWeight: 'bold', color, fontFamily: 'serif', marginTop: 4 }}>
        {value ?? '—'}
      </Text>
      <Text style={{ fontSize: 11, color: '#9B8B6E', textAlign: 'center', marginTop: 2 }}>
        {label}
      </Text>
    </View>
  );
}

export default function AdminScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== 'admin') {
      router.replace('/(tabs)');
      return;
    }
    Promise.all([fetchAdminStats(), fetchAdminUsers()])
      .then(([statsData, usersData]) => {
        setStats(statsData);
        setUsers(usersData);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F0E8' }}>
        <Text style={{ color: '#6B5A3E' }}>Cargando panel...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#F5F0E8' }} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Header */}
      <View style={{ backgroundColor: '#3B6B2A', paddingTop: 50, paddingBottom: 16, paddingHorizontal: 16 }}>
        <Text style={{ fontSize: 11, color: 'rgba(253,245,230,0.6)', letterSpacing: 2 }}>PETSWORLD</Text>
        <Text style={{ fontSize: 32, color: '#FDF5E6', fontFamily: 'serif', fontWeight: 'bold' }}>
          Panel Admin
        </Text>
        <Text style={{ fontSize: 13, color: 'rgba(253,245,230,0.8)' }}>
          Gestión de la plataforma
        </Text>
      </View>

      {/* Estadísticas */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, padding: 16 }}>
        <AdminStatCard icon="👥" label="Total usuarios" value={stats?.users?.total} color="#3B6B2A" />
        <AdminStatCard icon="✅" label="Usuarios activos" value={stats?.users?.active} color="#5A8A3C" />
        <AdminStatCard icon="🚫" label="Baneados" value={stats?.users?.banned} color="#C4521A" />
        <AdminStatCard icon="🐾" label="Rescatadas" value={stats?.reports?.rescued} color="#E8834A" />
        <AdminStatCard icon="📋" label="Total reportes" value={stats?.reports?.total} color="#6B5A3E" />
        <AdminStatCard icon="🔍" label="Activos hoy" value={stats?.reports?.today} color="#5A8A3C" />
      </View>

      {/* Top Rescatadores */}
      <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#3B6B2A', marginBottom: 12 }}>
          🏆 Top Rescatadores
        </Text>
        {stats?.top_rescuers?.map((rescuer, index) => (
          <View key={rescuer.id} style={{
            flexDirection: 'row', alignItems: 'center',
            backgroundColor: '#FDF5E6', borderRadius: 12,
            padding: 12, marginBottom: 8,
            borderWidth: 0.5, borderColor: 'rgba(107,90,62,0.15)',
          }}>
            <Text style={{ fontSize: 20, marginRight: 10 }}>
              {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
            </Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#3B6B2A' }}>
                {rescuer.full_name}
              </Text>
              <Text style={{ fontSize: 12, color: '#9B8B6E' }}>{rescuer.email}</Text>
            </View>
            <View style={{ backgroundColor: '#E8F5D6', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 }}>
              <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#3B6B2A' }}>
                {rescuer.rescued_count} 🐾
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Usuarios registrados */}
      <View style={{ paddingHorizontal: 16 }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#3B6B2A', marginBottom: 12 }}>
          👥 Usuarios registrados
        </Text>
        {users?.map((u) => (
          <View key={u.id} style={{
            flexDirection: 'row', alignItems: 'center',
            backgroundColor: '#FFFFFF', borderRadius: 12,
            padding: 12, marginBottom: 8,
            borderWidth: 0.5, borderColor: 'rgba(107,90,62,0.15)',
          }}>
            <View style={{
              width: 40, height: 40, borderRadius: 20, backgroundColor: '#3B6B2A',
              justifyContent: 'center', alignItems: 'center', marginRight: 12
            }}>
              <Text style={{ color: '#FDF5E6', fontWeight: 'bold', fontSize: 16 }}>
                {u.full_name ? u.full_name.charAt(0).toUpperCase() : '?'}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#6B5A3E' }}>
                {u.full_name}
              </Text>
              <Text style={{ fontSize: 12, color: '#9B8B6E' }}>{u.email}</Text>
              
              <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
                <View style={{ backgroundColor: 'rgba(59,107,42,0.1)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 }}>
                  <Text style={{ fontSize: 10, color: '#3B6B2A', fontWeight: 'bold' }}>{u.role}</Text>
                </View>
                {u.is_banned && (
                  <View style={{ backgroundColor: '#FFEBEE', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 }}>
                    <Text style={{ fontSize: 10, color: '#C62828', fontWeight: 'bold' }}>Baneado</Text>
                  </View>
                )}
              </View>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontSize: 11, color: '#9B8B6E' }}>Reportes: {u.reports_count || 0}</Text>
              <Text style={{ fontSize: 11, color: '#9B8B6E' }}>Rescates: {u.rescued_count || 0}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
