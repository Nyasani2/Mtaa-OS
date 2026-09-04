// @ts-nocheck
import React, { useState, useEffect } from 'react';

import { View, Text, TouchableOpacity, StyleSheet, FlatList, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';

interface AmbulanceUnit {
  id: string;
  vehicle_number: string;
  status: 'available' | 'active' | 'off_duty' | 'maintenance';
  driver_name?: string;
  driver_phone?: string;
  latitude?: number;
  longitude?: number;
  last_updated?: string;
}

export default function AmbulanceScreen() {
  const router = useRouter();
  const [units, setUnits] = useState<AmbulanceUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadUnits = async () => {
    try {
      setErrorMsg(null);
      const { data, error } = await supabase
        .from('health_ambulances')
        .select('id, vehicle_number, status, latitude, longitude, updated_at, health_ambulance_drivers(full_name, phone)')
        .order('status', { ascending: true });

      if (error) throw error;

      const mapped = (data || []).map((u: any) => ({
        id: u.id,
        vehicle_number: u.vehicle_number,
        status: u.status,
        latitude: u.latitude,
        longitude: u.longitude,
        last_updated: u.updated_at,
        driver_name: u.health_ambulance_drivers?.full_name,
        driver_phone: u.health_ambulance_drivers?.phone,
      }));

      setUnits(mapped);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to load ambulance units');
      setUnits([]);
    }
  };

  useEffect(() => {
    loadUnits().finally(() => setLoading(false));
  }, []);

  const refresh = async () => {
    setRefreshing(true);
    await loadUnits();
    setRefreshing(false);
  };

  const available = units.filter((u) => u.status === 'available').length;
  const active = units.filter((u) => u.status === 'active').length;
  const offDuty = units.filter((u) => u.status === 'off_duty').length;

  const renderUnit = ({ item }: { item: AmbulanceUnit }) => (
    <View style={s.unitCard}>
      <View style={s.unitRow}>
        <View style={[s.statusDot, s[`dot_${item.status}`]]} />
        <Text style={s.unitTitle}>Unit {item.vehicle_number}</Text>
        <Text style={[s.statusBadge, s[`badge_${item.status}`]]}>{item.status}</Text>
      </View>
      {item.driver_name ? (
        <Text style={s.unitDriver}>Driver: {item.driver_name} {item.driver_phone ? `• ${item.driver_phone}` : ''}</Text>
      ) : null}
      <View style={s.unitActions}>
        <TouchableOpacity style={s.actionBtn} onPress={() => router.push(`/health/ambulance/unit/${item.id}` as any)}>
          <Text style={s.actionText}>Details</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.actionBtn, s.actionPrimary]} onPress={() => router.push(`/health/ambulance/dispatch?unit=${item.id}` as any)}>
          <Text style={[s.actionText, s.actionTextPrimary]}>Dispatch</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Ambulance Control</Text>
        <TouchableOpacity style={s.addBtn} onPress={() => router.push('/health/ambulance/dispatch' as any)}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={s.statsRow}>
        <View style={s.statBox}>
          <Text style={[s.statNum, { color: '#10b981' }]}>{available}</Text>
          <Text style={s.statLabel}>Available</Text>
        </View>
        <View style={s.statBox}>
          <Text style={[s.statNum, { color: '#ef4444' }]}>{active}</Text>
          <Text style={s.statLabel}>Active</Text>
        </View>
        <View style={s.statBox}>
          <Text style={[s.statNum, { color: '#f59e0b' }]}>{offDuty}</Text>
          <Text style={s.statLabel}>Off Duty</Text>
        </View>
        <View style={s.statBox}>
          <Text style={s.statNum}>{units.length}</Text>
          <Text style={s.statLabel}>Total Units</Text>
        </View>
      </View>

      {errorMsg ? (
        <View style={s.errorBox}>
          <Text style={s.errorText}>{errorMsg}</Text>
          <TouchableOpacity onPress={refresh}><Text style={s.retry}>Retry</Text></TouchableOpacity>
        </View>
      ) : null}

      <Text style={s.sectionTitle}>Active Dispatches</Text>
      <View style={s.dispatchBox}>
        <Ionicons name="medical-outline" size={32} color="#cbd5e1" />
        <Text style={s.emptyText}>No active dispatches</Text>
      </View>

      <Text style={s.sectionTitle}>All Units</Text>
      {loading ? (
        <ActivityIndicator style={{ marginTop: 20 }} size="large" color="#0ea5e9" />
      ) : (
        <FlatList
          data={units}
          keyExtractor={(item) => item.id}
          renderItem={renderUnit}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
          contentContainerStyle={{ paddingBottom: 40 }}
          ListEmptyComponent={
            <View style={s.emptyBox}>
              <Text style={s.emptyText}>No ambulance units registered</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 48, paddingHorizontal: 16, paddingBottom: 12, backgroundColor: '#0c4a6e' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
  addBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#ef4444', alignItems: 'center', justifyContent: 'center' },
  statsRow: { flexDirection: 'row', padding: 12, gap: 8 },
  statBox: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 12, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2, elevation: 1 },
  statNum: { fontSize: 20, fontWeight: '800', color: '#1e293b' },
  statLabel: { fontSize: 11, color: '#64748b', marginTop: 4 },
  errorBox: { marginHorizontal: 12, marginVertical: 8, backgroundColor: '#fef2f2', borderRadius: 10, padding: 12, alignItems: 'center' },
  errorText: { color: '#ef4444', fontSize: 13 },
  retry: { color: '#0ea5e9', marginTop: 6, fontWeight: '600' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b', marginHorizontal: 16, marginTop: 16, marginBottom: 8 },
  dispatchBox: { marginHorizontal: 16, backgroundColor: '#fff', borderRadius: 12, padding: 24, alignItems: 'center' },
  emptyBox: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { color: '#94a3b8', marginTop: 8, fontSize: 14 },
  unitCard: { backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 10, borderRadius: 12, padding: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2, elevation: 1 },
  unitRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  dot_available: { backgroundColor: '#10b981' },
  dot_active: { backgroundColor: '#ef4444' },
  dot_off_duty: { backgroundColor: '#f59e0b' },
  dot_maintenance: { backgroundColor: '#64748b' },
  unitTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: '#1e293b' },
  statusBadge: { fontSize: 10, fontWeight: '700', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, overflow: 'hidden' },
  badge_available: { backgroundColor: '#d1fae5', color: '#065f46' },
  badge_active: { backgroundColor: '#fee2e2', color: '#991b1b' },
  badge_off_duty: { backgroundColor: '#fef3c7', color: '#92400e' },
  badge_maintenance: { backgroundColor: '#f1f5f9', color: '#475569' },
  unitDriver: { fontSize: 12, color: '#64748b', marginBottom: 10 },
  unitActions: { flexDirection: 'row', gap: 8 },
  actionBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: '#f1f5f9', alignItems: 'center' },
  actionPrimary: { backgroundColor: '#0ea5e9' },
  actionText: { fontSize: 13, fontWeight: '600', color: '#475569' },
  actionTextPrimary: { color: '#fff' },
} as any);
