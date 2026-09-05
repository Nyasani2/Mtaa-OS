// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import { Alert, View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { Bus, Route, Plus, ChevronRight, Clock } from 'lucide-react-native';

export default function TransportAdminScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [routes, setRoutes] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [institutionId, setInstitutionId] = useState<string | null>(null);
  const [stats, setStats] = useState({ routes: 0, vehicles: 0, active: 0 });

  const load = useCallback(async () => {
    if (!user?.id) { setLoading(false); return; }
    try {
      const { supabase } = await import("@/lib/supabase");
      const { data: staffData } = await supabase
        .from("education_staff").select("institution_id").eq("user_id", user.id).maybeSingle();
      const instId = staffData?.institution_id;
      setInstitutionId(instId);
      if (!instId) { setLoading(false); return; }

      const { data: routeData } = await supabase
        .from("education_transport_routes").select("*").eq("institution_id", instId).order("name", { ascending: true }).limit(50);
      const { data: vehicleData } = await supabase
        .from("education_transport_vehicles").select("*").eq("institution_id", instId).order("vehicle_number", { ascending: true }).limit(50);

      setRoutes(routeData || []);
      setVehicles(vehicleData || []);
      setStats({
        routes: routeData?.length || 0,
        vehicles: vehicleData?.length || 0,
        active: (vehicleData || []).filter((v: any) => v.status === 'active').length,
      });
    } catch (e: any) {
      console.error('[TransportAdmin]', e);
      Alert.alert('Error', e.message || 'Failed to load transport');
    } finally { setLoading(false); }
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" /></View>;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Transport Admin</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/(education as any)/transport-admin/create' as any)}>
          <Plus size={18} color="#fff" /><Text style={styles.addBtnText}>Add</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: '#6366f120' }]}>
          <Route size={20} color="#6366f1" />
          <Text style={styles.statValue}>{stats.routes}</Text>
          <Text style={styles.statLabel}>Routes</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#22c55e20' }]}>
          <Bus size={20} color="#22c55e" />
          <Text style={styles.statValue}>{stats.vehicles}</Text>
          <Text style={styles.statLabel}>Vehicles</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#f59e0b20' }]}>
          <Clock size={20} color="#f59e0b" />
          <Text style={styles.statValue}>{stats.active}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
      </View>
      <Text style={styles.sectionTitle}>Routes</Text>
      {(routes || []).map((r: any) => (
        <TouchableOpacity key={r.id} style={styles.card} onPress={() => router.push(`/(education as any)/transport-admin/routes/${r.id}` as any)}>
          <View style={styles.cardRow}>
            <Route size={18} color="#6366f1" />
            <Text style={styles.cardTitle}>{r.name || 'Unnamed Route'}</Text>
            <Text style={[styles.badge, r.status === 'active' ? styles.badgePaid : styles.badgePending]}>{r.status}</Text>
          </View>
          <Text style={styles.cardSub}>Start: {r.start_point || 'N/A'} · End: {r.end_point || 'N/A'}</Text>
          <Text style={styles.cardSub}>Distance: {r.distance_km || 0}km · Duration: {r.estimated_duration || 'N/A'}</Text>
          <ChevronRight size={16} color="#9ca3af" style={styles.chevron} />
        </TouchableOpacity>
      ))}
      <Text style={styles.sectionTitle}>Vehicles</Text>
      {(vehicles || []).map((v: any) => (
        <TouchableOpacity key={v.id} style={styles.card} onPress={() => router.push(`/(education as any)/transport-admin/vehicles/${v.id}` as any)}>
          <View style={styles.cardRow}>
            <Bus size={18} color="#22c55e" />
            <Text style={styles.cardTitle}>{v.vehicle_number || 'Unknown'}</Text>
            <Text style={[styles.badge, v.status === 'active' ? styles.badgePaid : styles.badgePending]}>{v.status}</Text>
          </View>
          <Text style={styles.cardSub}>Type: {v.vehicle_type || 'N/A'} · Capacity: {v.capacity || 0}</Text>
          <Text style={styles.cardSub}>Driver: {v.driver_name || 'Unassigned'}</Text>
          <ChevronRight size={16} color="#9ca3af" style={styles.chevron} />
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '700', color: '#1e293b' },
  addBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#6366f1', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, gap: 6 },
  addBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard: { flex: 1, padding: 14, borderRadius: 12, alignItems: 'center' },
  statValue: { fontSize: 16, fontWeight: '700', color: '#1e293b', marginTop: 6 },
  statLabel: { fontSize: 11, color: '#64748b', marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b', marginBottom: 10, marginTop: 8 },
  card: { backgroundColor: '#fff', padding: 14, borderRadius: 12, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { flex: 1, fontSize: 15, fontWeight: '600', color: '#1e293b' },
  cardSub: { fontSize: 12, color: '#64748b', marginTop: 4 },
  badge: { fontSize: 11, fontWeight: '600', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, overflow: 'hidden' },
  badgePaid: { backgroundColor: '#22c55e20', color: '#22c55e' },
  badgePending: { backgroundColor: '#f59e0b20', color: '#f59e0b' },
  chevron: { position: 'absolute', right: 14, top: '50%', marginTop: -8 },
});
