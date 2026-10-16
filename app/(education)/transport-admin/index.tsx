// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';
export default function TransportAdminScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [routes, setRoutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const load = async () => {
    try {
      const { data, error } = await supabase
        .from('education_transport_routes')
        .select('*')
        .order('route_name', { ascending: true });
      if (error) throw error;
      setRoutes(data || []);
    } catch (err) {
      console.error('[TransportAdmin] load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  useEffect(() => { load(); }, []);
  const onRefresh = () => { setRefreshing(true); load(); };
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0ea5e9" />
      </View>
    );
  }
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transport Admin</Text>
        <TouchableOpacity onPress={() => router.push('/(education)/transport-admin/create' as any)}>
          <Ionicons name="add-circle" size={24} color="#0ea5e9" />
        </TouchableOpacity>
      </View>
      <FlatList
        data={routes}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.cardTitle}>{item.route_name || 'Unnamed Route'}</Text>
              <View style={[styles.badge, { backgroundColor: item.status === 'active' ? '#064e3b' : '#451a03' }]}>
                <Text style={{ color: item.status === 'active' ? '#6ee7b7' : '#fcd34d', fontSize: 11, fontWeight: '600' }}>{item.status?.toUpperCase()}</Text>
              </View>
            </View>
            <Text style={styles.cardBody}>{item.vehicle_plate || 'No vehicle'} · {item.driver_name || 'No driver'}</Text>
            <Text style={styles.cardMeta}>Stops: {item.stops_count || 0} · Students: {item.student_count || 0}</Text>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="bus-outline" size={48} color="#475569" />
            <Text style={styles.emptyText}>No routes configured</Text>
          </View>
        }
      />
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12, backgroundColor: '#1e293b' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  card: { backgroundColor: '#1e293b', borderRadius: 12, padding: 16, marginBottom: 12 },
  cardTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  cardBody: { color: '#94a3b8', fontSize: 14, marginTop: 4 },
  cardMeta: { color: '#64748b', fontSize: 12, marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: '#64748b', marginTop: 12, fontSize: 16 },
});
