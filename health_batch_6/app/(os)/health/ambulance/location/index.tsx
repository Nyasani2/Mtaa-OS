import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { Ionicons } from '@expo/vector-icons';

interface Vehicle {
  id: string;
  plate_number: string;
  vehicle_type: 'basic_life_support' | 'advanced_life_support' | 'neonatal' | 'patient_transport' | 'air_ambulance';
  status: 'available' | 'en_route' | 'on_scene' | 'at_hospital' | 'maintenance' | 'offline';
  current_location: string | null;
  last_updated: string | null;
  crew_count: number;
  fuel_level: number | null;
  odometer: number | null;
  next_maintenance: string | null;
}

export default function AmbulanceLocationScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | Vehicle['status']>('all');

  useEffect(() => {
    loadVehicles();
    const interval = setInterval(loadVehicles, 30000);
    return () => clearInterval(interval);
  }, [filter]);

  async function loadVehicles() {
    if (!user) return;
    setLoading(true);
    try {
      let query = supabase
        .from('health_ambulance_vehicles')
        .select('*')
        .order('plate_number', { ascending: true });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;
      if (error) throw error;

      const mapped: Vehicle[] = (data || []).map((r: any) => ({
        id: r.id,
        plate_number: r.plate_number,
        vehicle_type: r.vehicle_type,
        status: r.status,
        current_location: r.current_location,
        last_updated: r.last_updated,
        crew_count: r.crew_count || 0,
        fuel_level: r.fuel_level,
        odometer: r.odometer,
        next_maintenance: r.next_maintenance,
      }));

      setVehicles(mapped);
    } catch (err) {
      console.error('Vehicles load error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id: string, status: Vehicle['status']) {
    const { error } = await supabase.from('health_ambulance_vehicles').update({ status, last_updated: new Date().toISOString() }).eq('id', id);
    if (!error) loadVehicles();
  }

  const statusConfig: Record<string, { color: string; icon: string }> = {
    available: { color: '#22c55e', icon: 'checkmark-circle' },
    en_route: { color: '#3b82f6', icon: 'navigate' },
    on_scene: { color: '#8b5cf6', icon: 'location' },
    at_hospital: { color: '#0ea5e9', icon: 'medical' },
    maintenance: { color: '#f59e0b', icon: 'construct' },
    offline: { color: '#9ca3af', icon: 'power' },
  };

  const typeConfig: Record<string, { color: string; label: string }> = {
    basic_life_support: { color: '#22c55e', label: 'BLS' },
    advanced_life_support: { color: '#ef4444', label: 'ALS' },
    neonatal: { color: '#ec4899', label: 'Neonatal' },
    patient_transport: { color: '#3b82f6', label: 'Transport' },
    air_ambulance: { color: '#0ea5e9', label: 'Air' },
  };

  const availableCount = vehicles.filter(v => v.status === 'available').length;
  const activeCount = vehicles.filter(v => v.status === 'en_route' || v.status === 'on_scene' || v.status === 'at_hospital').length;
  const maintenanceCount = vehicles.filter(v => v.status === 'maintenance').length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Fleet Tracker</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.totalsRow}>
        <View style={[styles.totalCard, { backgroundColor: '#22c55e20' }]}>
          <Text style={[styles.totalValue, { color: '#22c55e' }]}>{availableCount}</Text>
          <Text style={styles.totalLabel}>Available</Text>
        </View>
        <View style={[styles.totalCard, { backgroundColor: '#3b82f620' }]}>
          <Text style={[styles.totalValue, { color: '#3b82f6' }]}>{activeCount}</Text>
          <Text style={styles.totalLabel}>Active</Text>
        </View>
        <View style={[styles.totalCard, { backgroundColor: '#f59e0b20' }]}>
          <Text style={[styles.totalValue, { color: '#f59e0b' }]}>{maintenanceCount}</Text>
          <Text style={styles.totalLabel}>Maintenance</Text>
        </View>
      </View>

      <View style={styles.filterRow}>
        {(['all', 'available', 'en_route', 'on_scene', 'at_hospital', 'maintenance', 'offline'] as const).map(f => (
          <TouchableOpacity key={f} style={[styles.filterBtn, filter === f && styles.filterBtnActive]} onPress={() => setFilter(f)}>
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f.replace('_', ' ')}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#ef4444" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={vehicles}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardLeft}>
                  <View style={[styles.typeBadge, { backgroundColor: typeConfig[item.vehicle_type]?.color + '20' }]}>
                    <Text style={[styles.typeText, { color: typeConfig[item.vehicle_type]?.color }]}>{typeConfig[item.vehicle_type]?.label}</Text>
                  </View>
                  <View>
                    <Text style={styles.plateText}>{item.plate_number}</Text>
                    <Text style={styles.typeLabel}>{item.vehicle_type.replace('_', ' ')}</Text>
                  </View>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: statusConfig[item.status]?.color + '20' }]}>
                  <Ionicons name={statusConfig[item.status]?.icon as any} size={14} color={statusConfig[item.status]?.color} />
                  <Text style={[styles.statusText, { color: statusConfig[item.status]?.color }]}>{item.status.replace('_', ' ').toUpperCase()}</Text>
                </View>
              </View>
              {item.current_location && (
                <View style={styles.locationRow}>
                  <Ionicons name="location" size={14} color="#0ea5e9" />
                  <Text style={styles.locationText}>{item.current_location}</Text>
                  {item.last_updated && <Text style={styles.updateText}>Updated {new Date(item.last_updated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>}
                </View>
              )}
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Crew</Text>
                  <Text style={styles.statValue}>{item.crew_count}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Fuel</Text>
                  <Text style={[styles.statValue, { color: (item.fuel_level || 0) < 20 ? '#ef4444' : '#22c55e' }]}>{item.fuel_level || 0}%</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Odometer</Text>
                  <Text style={styles.statValue}>{(item.odometer || 0).toLocaleString()} km</Text>
                </View>
              </View>
              {item.next_maintenance && (
                <Text style={styles.maintenanceText}>Next maintenance: {new Date(item.next_maintenance).toLocaleDateString()}</Text>
              )}
              <View style={styles.actionRow}>
                {item.status === 'maintenance' && (
                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#22c55e' }]} onPress={() => updateStatus(item.id, 'available')}>
                    <Text style={styles.actionBtnText}>Mark Available</Text>
                  </TouchableOpacity>
                )}
                {item.status === 'available' && (
                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#f59e0b' }]} onPress={() => updateStatus(item.id, 'maintenance')}>
                    <Text style={styles.actionBtnText}>Send to Maintenance</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="car-outline" size={48} color="#9ca3af" />
              <Text style={styles.emptyText}>No vehicles in fleet</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 48, backgroundColor: '#1e293b' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  totalsRow: { flexDirection: 'row', padding: 16, gap: 10 },
  totalCard: { flex: 1, borderRadius: 12, padding: 12, alignItems: 'center' },
  totalValue: { fontSize: 20, fontWeight: '700' },
  totalLabel: { fontSize: 10, color: '#64748b', marginTop: 4 },
  filterRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 6, marginBottom: 8, flexWrap: 'wrap' },
  filterBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 16, backgroundColor: '#1e293b' },
  filterBtnActive: { backgroundColor: '#ef4444' },
  filterText: { fontSize: 11, color: '#94a3b8' },
  filterTextActive: { color: '#fff', fontWeight: '600' },
  card: { backgroundColor: '#1e293b', borderRadius: 12, padding: 14, marginBottom: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  typeText: { fontSize: 11, fontWeight: '700' },
  plateText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  typeLabel: { fontSize: 12, color: '#94a3b8', marginTop: 1 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: '700' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  locationText: { fontSize: 13, color: '#e2e8f0', flex: 1 },
  updateText: { fontSize: 11, color: '#64748b' },
  statsRow: { flexDirection: 'row', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#334155' },
  statItem: { flex: 1, alignItems: 'center' },
  statLabel: { fontSize: 11, color: '#64748b' },
  statValue: { fontSize: 14, color: '#e2e8f0', fontWeight: '600', marginTop: 2 },
  maintenanceText: { fontSize: 12, color: '#f59e0b', marginTop: 6 },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  actionBtn: { flex: 1, borderRadius: 8, padding: 10, alignItems: 'center' },
  actionBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  empty: { alignItems: 'center', marginTop: 40 },
  emptyText: { color: '#94a3b8', marginTop: 12, fontSize: 14 },
});
