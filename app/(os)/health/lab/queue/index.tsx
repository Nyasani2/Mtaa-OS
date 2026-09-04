// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Alert, View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Alert, ArrowLeft, FlaskConical, Clock, User, CheckCircle2, AlertTriangle } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { Alert, useHealthRole } from '@/lib/health/hooks';

interface LabQueueItem {
  id: string;
  patient_name: string;
  doctor_name: string;
  test_name: string;
  urgency: string;
  status: string;
  created_at: string;
}

export default function LabQueueScreen() {
  const router = useRouter();
  const { staffRecord } = useHealthRole();
  const [items, setItems] = useState<LabQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'in_progress'>('all');

  useEffect(() => { fetchQueue(); }, [staffRecord?.facility_id]);

  const fetchQueue = async () => {
    if (!staffRecord?.facility_id) { setLoading(false); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('health_lab_order_items')
        .select('id, test_name, urgency, status, created_at, order_id')
        .in('status', ['pending', 'in_progress'])
        .order('urgency', { ascending: false })
        .order('created_at', { ascending: true });
      if (error) throw error;
      setItems((data || []).map((d: any) => ({ ...d, patient_name: 'Unknown', doctor_name: 'Unknown' })));
    } catch (err) {
      console.error('Lab queue error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase.from('health_lab_order_items').update({ status }).eq('id', id);
      if (error) throw error;
      fetchQueue();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  const getUrgencyColor = (u: string) => u === 'stat' ? '#dc2626' : u === 'urgent' ? '#f97316' : '#22c55e';

  const filtered = filter === 'all' ? items : items.filter((i) => i.status === filter);

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchQueue(); }} />}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><ArrowLeft size={24} color="#1f2937" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Test Queue</Text>
      </View>

      <View style={styles.filterRow}>
        {(['all', 'pending', 'in_progress'] as const).map((f) => (
          <TouchableOpacity key={f} style={[styles.filterChip, filter === f && styles.filterChipActive]} onPress={() => setFilter(f)}>
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f === 'all' ? 'All' : f === 'in_progress' ? 'In Progress' : 'Pending'}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading && !refreshing ? (
        <ActivityIndicator size="large" color="#06b6d4" style={{ marginTop: 40 }} />
      ) : filtered.length === 0 ? (
        <View style={styles.empty}>
          <FlaskConical size={48} color="#d1d5db" />
          <Text style={styles.emptyTitle}>No tests in queue</Text>
        </View>
      ) : (
        filtered.map((item) => (
          <View key={item.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.patientRow}>
                <User size={14} color="#6b7280" />
                <Text style={styles.patientName}>{item.patient_name}</Text>
              </View>
              <View style={[styles.urgencyBadge, { backgroundColor: getUrgencyColor(item.urgency) + '20' }]}>
                <Text style={[styles.urgencyText, { color: getUrgencyColor(item.urgency) }]}>{item.urgency}</Text>
              </View>
            </View>
            <Text style={styles.testName}>{item.test_name}</Text>
            <Text style={styles.doctorText}>Ordered by Dr. {item.doctor_name}</Text>
            <View style={styles.actionsRow}>
              {item.status === 'pending' && (
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#2563eb15' }]} onPress={() => updateStatus(item.id, 'in_progress')}>
                  <FlaskConical size={14} color="#2563eb" />
                  <Text style={[styles.actionText, { color: '#2563eb' }]}>Start Test</Text>
                </TouchableOpacity>
              )}
              {item.status === 'in_progress' && (
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#22c55e15' }]} onPress={() => updateStatus(item.id, 'completed')}>
                  <CheckCircle2 size={14} color="#22c55e" />
                  <Text style={[styles.actionText, { color: '#22c55e' }]}>Complete</Text>
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
  filterChipActive: { backgroundColor: '#06b6d4', borderColor: '#06b6d4' },
  filterText: { fontSize: 12, fontWeight: '600', color: '#6b7280' },
  filterTextActive: { color: '#fff' },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#6b7280', marginTop: 12 },
  card: { backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 10, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  patientRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  patientName: { fontSize: 14, fontWeight: '700', color: '#1f2937' },
  urgencyBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  urgencyText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  testName: { fontSize: 15, fontWeight: '600', color: '#06b6d4', marginBottom: 4 },
  doctorText: { fontSize: 12, color: '#6b7280', marginBottom: 8 },
  actionsRow: { flexDirection: 'row', gap: 8, marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, gap: 4 },
  actionText: { fontSize: 11, fontWeight: '600' },
});
