import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { Ionicons } from '@expo/vector-icons';

interface TransportLog {
  id: string;
  dispatch_id: string;
  dispatch_code: string;
  patient_name: string;
  vehicle_plate: string;
  pickup_address: string;
  destination_facility_name: string;
  distance_km: number | null;
  duration_minutes: number | null;
  fuel_used: number | null;
  crew_members: string[] | null;
  patient_condition_start: string | null;
  patient_condition_end: string | null;
  equipment_used: string[] | null;
  medications_administered: string[] | null;
  notes: string | null;
  completed_at: string;
}

export default function AmbulanceLogScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [logs, setLogs] = useState<TransportLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('week');
  const [stats, setStats] = useState({ totalTrips: 0, totalDistance: 0, avgDuration: 0, totalFuel: 0 });

  useEffect(() => {
    loadLogs();
  }, [period]);

  async function loadLogs() {
    if (!user) return;
    setLoading(true);
    try {
      const now = new Date();
      let startDate: Date;
      switch (period) {
        case 'today': startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()); break;
        case 'week': startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); break;
        case 'month': startDate = new Date(now.getFullYear(), now.getMonth(), 1); break;
      }

      const { data, error } = await supabase
        .from('health_ambulance_logs')
        .select('*, health_ambulance_dispatches(dispatch_code, patient_name, pickup_address, destination_facility_id, health_facilities(name)), health_ambulance_vehicles(plate_number)')
        .gte('completed_at', startDate.toISOString())
        .lte('completed_at', now.toISOString())
        .order('completed_at', { ascending: false });

      if (error) throw error;

      const mapped: TransportLog[] = (data || []).map((r: any) => ({
        id: r.id,
        dispatch_id: r.dispatch_id,
        dispatch_code: r.health_ambulance_dispatches?.dispatch_code || 'N/A',
        patient_name: r.health_ambulance_dispatches?.patient_name || 'Unknown',
        vehicle_plate: r.health_ambulance_vehicles?.plate_number || 'Unknown',
        pickup_address: r.health_ambulance_dispatches?.pickup_address || 'Unknown',
        destination_facility_name: r.health_ambulance_dispatches?.health_facilities?.name || 'Unknown',
        distance_km: r.distance_km,
        duration_minutes: r.duration_minutes,
        fuel_used: r.fuel_used,
        crew_members: r.crew_members,
        patient_condition_start: r.patient_condition_start,
        patient_condition_end: r.patient_condition_end,
        equipment_used: r.equipment_used,
        medications_administered: r.medications_administered,
        notes: r.notes,
        completed_at: r.completed_at,
      }));

      setLogs(mapped);
      setStats({
        totalTrips: mapped.length,
        totalDistance: mapped.reduce((s, l) => s + (l.distance_km || 0), 0),
        avgDuration: mapped.length > 0 ? mapped.reduce((s, l) => s + (l.duration_minutes || 0), 0) / mapped.length : 0,
        totalFuel: mapped.reduce((s, l) => s + (l.fuel_used || 0), 0),
      });
    } catch (err) {
      console.error('Log load error:', err);
    } finally {
      setLoading(false);
    }
  }

  const periods: Array<'today' | 'week' | 'month'> = ['today', 'week', 'month'];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transport Log</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.totalsRow}>
        <View style={[styles.totalCard, { backgroundColor: '#1e293b' }]}>
          <Text style={[styles.totalValue, { color: '#0ea5e9' }]}>{stats.totalTrips}</Text>
          <Text style={styles.totalLabel}>Trips</Text>
        </View>
        <View style={[styles.totalCard, { backgroundColor: '#1e293b' }]}>
          <Text style={[styles.totalValue, { color: '#22c55e' }]}>{stats.totalDistance.toFixed(1)} km</Text>
          <Text style={styles.totalLabel}>Distance</Text>
        </View>
        <View style={[styles.totalCard, { backgroundColor: '#1e293b' }]}>
          <Text style={[styles.totalValue, { color: '#f59e0b' }]}>{stats.avgDuration.toFixed(0)} min</Text>
          <Text style={styles.totalLabel}>Avg Time</Text>
        </View>
        <View style={[styles.totalCard, { backgroundColor: '#1e293b' }]}>
          <Text style={[styles.totalValue, { color: '#ef4444' }]}>{stats.totalFuel.toFixed(1)} L</Text>
          <Text style={styles.totalLabel}>Fuel</Text>
        </View>
      </View>

      <View style={styles.periodRow}>
        {periods.map(p => (
          <TouchableOpacity key={p} style={[styles.periodBtn, period === p && styles.periodBtnActive]} onPress={() => setPeriod(p)}>
            <Text style={[styles.periodText, period === p && styles.periodTextActive]}>{p.charAt(0).toUpperCase() + p.slice(1)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#ef4444" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={logs}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.dispatchCode}>{item.dispatch_code}</Text>
                  <Text style={styles.patientName}>{item.patient_name}</Text>
                </View>
                <Text style={styles.vehicleText}>{item.vehicle_plate}</Text>
              </View>
              <View style={styles.routeRow}>
                <View style={styles.routePoint}>
                  <Ionicons name="location" size={14} color="#ef4444" />
                  <Text style={styles.routeText} numberOfLines={1}>{item.pickup_address}</Text>
                </View>
                <Ionicons name="arrow-forward" size={16} color="#64748b" />
                <View style={styles.routePoint}>
                  <Ionicons name="medical" size={14} color="#22c55e" />
                  <Text style={styles.routeText} numberOfLines={1}>{item.destination_facility_name}</Text>
                </View>
              </View>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Distance</Text>
                  <Text style={styles.statValue}>{item.distance_km ? `${item.distance_km} km` : '—'}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Duration</Text>
                  <Text style={styles.statValue}>{item.duration_minutes ? `${item.duration_minutes} min` : '—'}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Fuel</Text>
                  <Text style={styles.statValue}>{item.fuel_used ? `${item.fuel_used} L` : '—'}</Text>
                </View>
              </View>
              {item.crew_members && item.crew_members.length > 0 && (
                <Text style={styles.crewText}>Crew: {item.crew_members.join(', ')}</Text>
              )}
              {item.equipment_used && item.equipment_used.length > 0 && (
                <Text style={styles.equipText}>Equipment: {item.equipment_used.join(', ')}</Text>
              )}
              {item.medications_administered && item.medications_administered.length > 0 && (
                <Text style={styles.medsText}>Meds: {item.medications_administered.join(', ')}</Text>
              )}
              {(item.patient_condition_start || item.patient_condition_end) && (
                <View style={styles.conditionRow}>
                  <Text style={styles.conditionText}>Condition: {item.patient_condition_start || '—'} → {item.patient_condition_end || '—'}</Text>
                </View>
              )}
              {item.notes && <Text style={styles.notesText}>{item.notes}</Text>}
              <Text style={styles.timeText}>Completed: {new Date(item.completed_at).toLocaleString()}</Text>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="document-text-outline" size={48} color="#9ca3af" />
              <Text style={styles.emptyText}>No transport logs for this period</Text>
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
  totalsRow: { flexDirection: 'row', padding: 16, gap: 8 },
  totalCard: { flex: 1, borderRadius: 10, padding: 10, alignItems: 'center' },
  totalValue: { fontSize: 14, fontWeight: '700' },
  totalLabel: { fontSize: 10, color: '#64748b', marginTop: 2 },
  periodRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 8 },
  periodBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: '#1e293b', alignItems: 'center' },
  periodBtnActive: { backgroundColor: '#ef4444' },
  periodText: { fontSize: 12, color: '#94a3b8' },
  periodTextActive: { color: '#fff', fontWeight: '600' },
  card: { backgroundColor: '#1e293b', borderRadius: 12, padding: 14, marginBottom: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  dispatchCode: { fontSize: 14, fontWeight: '700', color: '#0ea5e9' },
  patientName: { fontSize: 15, fontWeight: '600', color: '#e2e8f0', marginTop: 2 },
  vehicleText: { fontSize: 12, color: '#94a3b8' },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6, paddingTop: 6, borderTopWidth: 1, borderTopColor: '#334155' },
  routePoint: { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 },
  routeText: { fontSize: 12, color: '#e2e8f0', flex: 1 },
  statsRow: { flexDirection: 'row', marginTop: 8 },
  statItem: { flex: 1, alignItems: 'center' },
  statLabel: { fontSize: 11, color: '#64748b' },
  statValue: { fontSize: 13, color: '#e2e8f0', fontWeight: '600', marginTop: 2 },
  crewText: { fontSize: 12, color: '#94a3b8', marginTop: 6 },
  equipText: { fontSize: 12, color: '#94a3b8', marginTop: 4 },
  medsText: { fontSize: 12, color: '#94a3b8', marginTop: 4 },
  conditionRow: { marginTop: 6 },
  conditionText: { fontSize: 12, color: '#e2e8f0' },
  notesText: { fontSize: 12, color: '#64748b', marginTop: 6, fontStyle: 'italic' },
  timeText: { fontSize: 11, color: '#64748b', marginTop: 8, textAlign: 'right' },
  empty: { alignItems: 'center', marginTop: 40 },
  emptyText: { color: '#94a3b8', marginTop: 12, fontSize: 14 },
});
