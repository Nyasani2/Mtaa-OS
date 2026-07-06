import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Users, Clock, ChevronRight, AlertCircle, Search } from 'lucide-react-native';
import { supabase } from '@/lib/supabase/client';
import { useHealthRole } from '@/lib/health/hooks';

interface QueuePatient {
  id: string;
  patient_name: string;
  patient_id: string;
  appointment_time: string;
  status: 'waiting' | 'in_progress' | 'completed' | 'no_show';
  reason: string;
  priority: 'normal' | 'urgent' | 'emergency';
}

export default function DoctorQueueScreen() {
  const router = useRouter();
  const { staffRecord } = useHealthRole();
  const [patients, setPatients] = useState<QueuePatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'waiting' | 'in_progress'>('all');

  useEffect(() => { fetchQueue(); }, [staffRecord?.facility_id]);

  const fetchQueue = async () => {
    if (!staffRecord?.facility_id) { setLoading(false); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('health_appointments')
        .select('id, patient_name, patient_id, appointment_time, status, reason, priority')
        .eq('facility_id', staffRecord.facility_id)
        .eq('doctor_id', staffRecord.id)
        .eq('appointment_date', new Date().toISOString().split('T')[0])
        .in('status', ['waiting', 'in_progress', 'confirmed'])
        .order('priority', { ascending: false })
        .order('appointment_time', { ascending: true });

      if (error) throw error;
      setPatients((data || []).map((d: any) => ({ ...d, status: d.status === 'confirmed' ? 'waiting' : d.status })));
    } catch (err) {
      console.error('Queue fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase.from('health_appointments').update({ status }).eq('id', id);
      if (error) throw error;
      fetchQueue();
    } catch (err: any) {
      alert('Update failed: ' + err.message);
    }
  };

  const filtered = filter === 'all' ? patients : patients.filter((p) => p.status === filter);

  const getPriorityColor = (p: string) => p === 'emergency' ? '#dc2626' : p === 'urgent' ? '#f97316' : '#22c55e';

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchQueue(); }} />}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><ArrowLeft size={24} color="#1f2937" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Patient Queue</Text>
        <View style={styles.countBadge}><Text style={styles.countText}>{patients.length}</Text></View>
      </View>

      <View style={styles.filterRow}>
        {(['all', 'waiting', 'in_progress'] as const).map((f) => (
          <TouchableOpacity key={f} style={[styles.filterChip, filter === f && styles.filterChipActive]} onPress={() => setFilter(f)}>
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f === 'all' ? 'All' : f === 'waiting' ? 'Waiting' : 'In Progress'}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading && !refreshing ? (
        <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 40 }} />
      ) : filtered.length === 0 ? (
        <View style={styles.empty}>
          <Users size={48} color="#d1d5db" />
          <Text style={styles.emptyTitle}>No patients in queue</Text>
          <Text style={styles.emptySub}>Your queue is clear for now.</Text>
        </View>
      ) : (
        filtered.map((p) => (
          <View key={p.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.nameRow}>
                <Text style={styles.patientName}>{p.patient_name || 'Unknown'}</Text>
                <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(p.priority) + '20' }]}>
                  <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(p.priority) }]} />
                  <Text style={[styles.priorityText, { color: getPriorityColor(p.priority) }]}>{p.priority}</Text>
                </View>
              </View>
              <Text style={styles.reason}>{p.reason || 'General consultation'}</Text>
            </View>
            <View style={styles.cardFooter}>
              <View style={styles.timeRow}><Clock size={14} color="#9ca3af" /><Text style={styles.timeText}>{p.appointment_time || 'TBD'}</Text></View>
              {p.status === 'waiting' ? (
                <TouchableOpacity style={styles.actionBtn} onPress={() => updateStatus(p.id, 'in_progress')}>
                  <Text style={styles.actionText}>Start</Text>
                  <ChevronRight size={16} color="#fff" />
                </TouchableOpacity>
              ) : p.status === 'in_progress' ? (
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#16a34a' }]} onPress={() => updateStatus(p.id, 'completed')}>
                  <Text style={styles.actionText}>Complete</Text>
                  <ChevronRight size={16} color="#fff" />
                </TouchableOpacity>
              ) : (
                <Text style={styles.statusText}>{p.status}</Text>
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
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#1f2937', flex: 1 },
  countBadge: { backgroundColor: '#2563eb', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  countText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  filterRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb' },
  filterChipActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  filterText: { fontSize: 12, fontWeight: '600', color: '#6b7280' },
  filterTextActive: { color: '#fff' },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#6b7280', marginTop: 12 },
  emptySub: { fontSize: 13, color: '#9ca3af', marginTop: 4 },
  card: { backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 10, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  cardHeader: { marginBottom: 10 },
  nameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  patientName: { fontSize: 15, fontWeight: '700', color: '#1f2937' },
  priorityBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, gap: 4 },
  priorityDot: { width: 6, height: 6, borderRadius: 3 },
  priorityText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  reason: { fontSize: 13, color: '#6b7280' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  timeText: { fontSize: 12, color: '#9ca3af' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2563eb', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, gap: 4 },
  actionText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  statusText: { fontSize: 12, color: '#9ca3af', fontWeight: '500' },
});
