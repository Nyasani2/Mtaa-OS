// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Alert, View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Pill, CheckCircle2, Clock, User, AlertTriangle } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useHealthRole } from '@/lib/health/hooks';

interface RxQueueItem {
  id: string;
  prescription_id: string;
  patient_name: string;
  doctor_name: string;
  status: 'pending' | 'dispensing' | 'ready' | 'collected';
  created_at: string;
  item_count: number;
}

export default function PharmacyQueueScreen() {
  const router = useRouter();
  const { staffRecord } = useHealthRole();
  const [items, setItems] = useState<RxQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'ready'>('all');

  useEffect(() => { fetchQueue(); }, [staffRecord?.facility_id]);

  const fetchQueue = async () => {
    if (!staffRecord?.facility_id) { setLoading(false); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('health_prescriptions')
        .select('id, patient_name, doctor_name, status, created_at, facility_id')
        .eq('facility_id', staffRecord.facility_id)
        .in('status', ['pending', 'dispensing', 'ready'])
        .order('created_at', { ascending: true });
      if (error) throw error;
      setItems((data || []).map((d: any) => ({ ...d, prescription_id: d.id, item_count: 0 })));
    } catch (err) {
      console.error('Pharmacy queue error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase.from('health_prescriptions').update({ status }).eq('id', id);
      if (error) throw error;
      fetchQueue();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'pending': return '#f59e0b';
      case 'dispensing': return '#2563eb';
      case 'ready': return '#22c55e';
      case 'collected': return '#6b7280';
      default: return '#9ca3af';
    }
  };

  const filtered = filter === 'all' ? items : items.filter((i) => i.status === filter);

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchQueue(); }} />}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><ArrowLeft size={24} color="#1f2937" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Rx Queue</Text>
      </View>

      <View style={styles.filterRow}>
        {(['all', 'pending', 'ready'] as const).map((f) => (
          <TouchableOpacity key={f} style={[styles.filterChip, filter === f && styles.filterChipActive]} onPress={() => setFilter(f)}>
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading && !refreshing ? (
        <ActivityIndicator size="large" color="#a855f7" style={{ marginTop: 40 }} />
      ) : filtered.length === 0 ? (
        <View style={styles.empty}>
          <Pill size={48} color="#d1d5db" />
          <Text style={styles.emptyTitle}>No prescriptions in queue</Text>
        </View>
      ) : (
        filtered.map((item) => (
          <View key={item.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.patientRow}>
                <User size={14} color="#6b7280" />
                <Text style={styles.patientName}>{item.patient_name || 'Unknown'}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
              </View>
            </View>
            <Text style={styles.doctorText}>Dr. {item.doctor_name || 'Unknown'}</Text>
            <View style={styles.timeRow}>
              <Clock size={12} color="#9ca3af" />
              <Text style={styles.timeText}>{new Date(item.created_at).toLocaleString()}</Text>
            </View>
            <View style={styles.actionsRow}>
              {item.status === 'pending' && (
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#2563eb15' }]} onPress={() => updateStatus(item.id, 'dispensing')}>
                  <Pill size={14} color="#2563eb" />
                  <Text style={[styles.actionText, { color: '#2563eb' }]}>Start Dispensing</Text>
                </TouchableOpacity>
              )}
              {item.status === 'dispensing' && (
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#22c55e15' }]} onPress={() => updateStatus(item.id, 'ready')}>
                  <CheckCircle2 size={14} color="#22c55e" />
                  <Text style={[styles.actionText, { color: '#22c55e' }]}>Mark Ready</Text>
                </TouchableOpacity>
              )}
              {item.status === 'ready' && (
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#6b728015' }]} onPress={() => updateStatus(item.id, 'collected')}>
                  <CheckCircle2 size={14} color="#6b7280" />
                  <Text style={[styles.actionText, { color: '#6b7280' }]}>Collected</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  backBtn: { padding: 4, marginRight: 12 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#1f2937' },
  filterRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb' },
  filterChipActive: { backgroundColor: '#a855f7', borderColor: '#a855f7' },
  filterText: { fontSize: 12, fontWeight: '600', color: '#6b7280' },
  filterTextActive: { color: '#fff' },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#6b7280', marginTop: 12 },
  card: { backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 10, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  patientRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  patientName: { fontSize: 14, fontWeight: '700', color: '#1f2937' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },
  doctorText: { fontSize: 12, color: '#6b7280', marginBottom: 4 },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  timeText: { fontSize: 11, color: '#9ca3af' },
  actionsRow: { flexDirection: 'row', gap: 8, marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, gap: 4 },
  actionText: { fontSize: 11, fontWeight: '600' },
});
