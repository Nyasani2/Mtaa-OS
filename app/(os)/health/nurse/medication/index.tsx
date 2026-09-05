// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Alert, View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Pill, CheckCircle2, Clock, AlertTriangle, User } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useHealthRole } from '@/lib/health/hooks';

interface MedTask {
  id: string;
  patient_name: string;
  bed_number: string;
  medication: string;
  dosage: string;
  scheduled_time: string;
  status: 'pending' | 'administered' | 'missed';
  instructions: string;
}

export default function NurseMedicationScreen() {
  const router = useRouter();
  const { staffRecord } = useHealthRole();
  const [tasks, setTasks] = useState<MedTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { fetchTasks(); }, [staffRecord?.facility_id]);

  const fetchTasks = async () => {
    if (!staffRecord?.facility_id) { setLoading(false); return; }
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('health_medication_administrations')
        .select('id, patient_name, bed_number, medication, dosage, scheduled_time, status, instructions')
        .eq('facility_id', staffRecord.facility_id)
        .eq('administered_date', today)
        .order('scheduled_time', { ascending: true });
      if (error) throw error;
      setTasks(data || []);
    } catch (err) {
      console.error('Medication error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const administer = async (id: string) => {
    try {
      const { error } = await supabase.from('health_medication_administrations').update({
        status: 'administered',
        administered_by: staffRecord?.id,
        administered_at: new Date().toISOString(),
      }).eq('id', id);
      if (error) throw error;
      fetchTasks();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  const getStatusColor = (s: string) => s === 'administered' ? '#22c55e' : s === 'missed' ? '#ef4444' : '#f59e0b';

  const pendingCount = tasks.filter((t) => t.status === 'pending').length;

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchTasks(); }} />}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><ArrowLeft size={24} color="#1f2937" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Medication</Text>
        {pendingCount > 0 && <View style={styles.badge}><Text style={styles.badgeText}>{pendingCount}</Text></View>}
      </View>

      {loading && !refreshing ? (
        <ActivityIndicator size="large" color="#a855f7" style={{ marginTop: 40 }} />
      ) : tasks.length === 0 ? (
        <View style={styles.empty}>
          <Pill size={48} color="#d1d5db" />
          <Text style={styles.emptyTitle}>No medications scheduled</Text>
          <Text style={styles.emptySub}>All caught up for today.</Text>
        </View>
      ) : (
        tasks.map((t) => (
          <View key={t.id} style={styles.taskCard}>
            <View style={styles.taskHeader}>
              <View style={styles.patientRow}>
                <User size={14} color="#6b7280" />
                <Text style={styles.patientName}>{t.patient_name}</Text>
                <Text style={styles.bedText}>· Bed {t.bed_number}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(t.status) + '20' }]}>
                <Text style={[styles.statusText, { color: getStatusColor(t.status) }]}>{t.status}</Text>
              </View>
            </View>
            <View style={styles.medRow}>
              <Pill size={16} color="#a855f7" />
              <Text style={styles.medText}>{t.medication} · {t.dosage}</Text>
            </View>
            <View style={styles.timeRow}>
              <Clock size={14} color="#9ca3af" />
              <Text style={styles.timeText}>{t.scheduled_time?.slice(0, 5) || 'TBD'}</Text>
            </View>
            {t.instructions && <Text style={styles.instructions}>Note: {t.instructions}</Text>}
            {t.status === 'pending' && (
              <TouchableOpacity style={styles.adminBtn} onPress={() => administer(t.id)}>
                <CheckCircle2 size={16} color="#fff" />
                <Text style={styles.adminText}>Mark Administered</Text>
              </TouchableOpacity>
            )}
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
  badge: { backgroundColor: '#ef4444', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#6b7280', marginTop: 12 },
  emptySub: { fontSize: 13, color: '#9ca3af', marginTop: 4 },
  taskCard: { backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 10, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  taskHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  patientRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  patientName: { fontSize: 14, fontWeight: '700', color: '#1f2937' },
  bedText: { fontSize: 12, color: '#9ca3af' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },
  medRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  medText: { fontSize: 13, fontWeight: '600', color: '#a855f7' },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  timeText: { fontSize: 12, color: '#9ca3af' },
  instructions: { fontSize: 12, color: '#6b7280', marginTop: 6, fontStyle: 'italic' },
  adminBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#22c55e', marginTop: 10, paddingVertical: 10, borderRadius: 8, gap: 6 },
  adminText: { color: '#fff', fontSize: 13, fontWeight: '700' },
});
