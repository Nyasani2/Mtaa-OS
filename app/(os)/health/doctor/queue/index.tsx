// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Users, Clock, ChevronRight } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useHealthRole } from '@/lib/health/hooks';

export default function DoctorQueueScreen() {
  const router = useRouter();
  const { staffRecord } = useHealthRole();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => { fetchQueue(); }, [staffRecord?.facility_id]);

  const fetchQueue = async () => {
    if (!staffRecord?.facility_id) { setLoading(false); return; }
    setLoading(true);
    try {
      // 1. Fetch appointments with CORRECT column names
      const { data: appts, error: apptError } = await supabase
        .from('health_appointments')
        .select('id, patient_id, scheduled_date, scheduled_time, status, reason, priority')
        .eq('facility_id', staffRecord.facility_id)
        .eq('staff_id', staffRecord.id)
        .eq('scheduled_date', new Date().toISOString().split('T')[0])
        .in('status', ['waiting', 'in_progress', 'confirmed'])
        .order('priority', { ascending: false })
        .order('scheduled_time', { ascending: true });

      if (apptError) throw apptError;

      // 2. Fetch patient names and latest vitals
      const patientIds = appts?.map((a) => a.patient_id).filter(Boolean) || [];
      let patientsData = [], vitalsData = [];

      if (patientIds.length > 0) {
        const { data: pData } = await supabase.from('health_patients').select('id, name').in('id', patientIds);
        patientsData = pData || [];

        const { data: vData } = await supabase
          .from('health_vitals')
          .select('patient_id, temperature, blood_pressure, heart_rate, oxygen_saturation, recorded_at')
          .in('patient_id', patientIds)
          .eq('facility_id', staffRecord.facility_id)
          .order('recorded_at', { ascending: false });
        
        const latestVitalsMap = new Map();
        vData?.forEach((v) => { if (!latestVitalsMap.has(v.patient_id)) latestVitalsMap.set(v.patient_id, v); });
        vitalsData = Array.from(latestVitalsMap.values());
      }

      // 3. Merge data
      const mergedPatients = (appts || []).map((appt) => {
        const patient = patientsData.find((p) => p.id === appt.patient_id);
        const vitals = vitalsData.find((v) => v.patient_id === appt.patient_id);
        return {
          id: appt.id, patient_id: appt.patient_id, patient_name: patient?.name || 'Unknown',
          appointment_time: appt.scheduled_time || 'TBD',
          status: appt.status === 'confirmed' ? 'waiting' : appt.status,
          reason: appt.reason || 'General consultation', priority: appt.priority || 'normal', vitals: vitals || null
        };
      });

      setPatients(mergedPatients);
    } catch (err) { console.error('Queue fetch error:', err); } 
    finally { setLoading(false); setRefreshing(false); }
  };

  const updateStatus = async (id, status) => {
    try {
      const { error } = await supabase.from('health_appointments').update({ status }).eq('id', id);
      if (error) throw error;
      fetchQueue();
    } catch (err) { alert('Update failed: ' + err.message); }
  };

  const filtered = filter === 'all' ? patients : patients.filter((p) => p.status === filter);
  const getPriorityColor = (p) => p === 'emergency' ? '#dc2626' : p === 'urgent' ? '#f97316' : '#22c55e';

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchQueue(); }} />}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><ArrowLeft size={24} color="#1f2937" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Patient Queue</Text>
        <View style={styles.countBadge}><Text style={styles.countText}>{patients.length}</Text></View>
      </View>

      <View style={styles.filterRow}>
        {['all', 'waiting', 'in_progress'].map((f) => (
          <TouchableOpacity key={f} style={[styles.filterChip, filter === f && styles.filterChipActive]} onPress={() => setFilter(f)}>
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f === 'all' ? 'All' : f === 'waiting' ? 'Waiting' : 'In Progress'}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading && !refreshing ? (
        <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 40 }} />
      ) : filtered.length === 0 ? (
        <View style={styles.empty}><Users size={48} color="#d1d5db" /><Text style={styles.emptyTitle}>No patients in queue</Text></View>
      ) : (
        filtered.map((p) => (
          <View key={p.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.nameRow}>
                <Text style={styles.patientName}>{p.patient_name}</Text>
                <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(p.priority) + '20' }]}>
                  <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(p.priority) }]} />
                  <Text style={[styles.priorityText, { color: getPriorityColor(p.priority) }]}>{p.priority}</Text>
                </View>
              </View>
              <Text style={styles.reason}>{p.reason}</Text>
              
              {/* Display Nurse-Recorded Vitals */}
              {p.vitals && (
                <View style={styles.vitalsRow}>
                  {p.vitals.blood_pressure && <Text style={styles.vitalBadge}>🩸 BP: {p.vitals.blood_pressure}</Text>}
                  {p.vitals.heart_rate && <Text style={styles.vitalBadge}>❤️ HR: {p.vitals.heart_rate}</Text>}
                  {p.vitals.temperature && <Text style={styles.vitalBadge}>🌡️ {p.vitals.temperature}°C</Text>}
                  {p.vitals.oxygen_saturation && <Text style={styles.vitalBadge}>💧 SpO2: {p.vitals.oxygen_saturation}%</Text>}
                </View>
              )}
            </View>
            <View style={styles.cardFooter}>
              <View style={styles.timeRow}><Clock size={14} color="#9ca3af" /><Text style={styles.timeText}>{p.appointment_time}</Text></View>
              {p.status === 'waiting' ? (
                <TouchableOpacity style={styles.actionBtn} onPress={() => updateStatus(p.id, 'in_progress')}><Text style={styles.actionText}>Start</Text><ChevronRight size={16} color="#fff" /></TouchableOpacity>
              ) : p.status === 'in_progress' ? (
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#16a34a' }]} onPress={() => updateStatus(p.id, 'completed')}><Text style={styles.actionText}>Complete</Text><ChevronRight size={16} color="#fff" /></TouchableOpacity>
              ) : <Text style={styles.statusText}>{p.status}</Text>}
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
  backBtn: { padding: 4, marginRight: 12 }, headerTitle: { fontSize: 20, fontWeight: '700', color: '#1f2937', flex: 1 },
  countBadge: { backgroundColor: '#2563eb', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }, countText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  filterRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb' },
  filterChipActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' }, filterText: { fontSize: 12, fontWeight: '600', color: '#6b7280' }, filterTextActive: { color: '#fff' },
  empty: { alignItems: 'center', marginTop: 60 }, emptyTitle: { fontSize: 16, fontWeight: '600', color: '#6b7280', marginTop: 12 },
  card: { backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 10, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  cardHeader: { marginBottom: 10 }, nameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  patientName: { fontSize: 15, fontWeight: '700', color: '#1f2937' },
  priorityBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, gap: 4 }, priorityDot: { width: 6, height: 6, borderRadius: 3 }, priorityText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  reason: { fontSize: 13, color: '#6b7280' },
  vitalsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  vitalBadge: { fontSize: 11, fontWeight: '600', color: '#0f766e', backgroundColor: '#ccfbf1', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 }, timeText: { fontSize: 12, color: '#9ca3af' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2563eb', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, gap: 4 }, actionText: { color: '#fff', fontSize: 12, fontWeight: '600' }, statusText: { fontSize: 12, color: '#9ca3af', fontWeight: '500' },
});
