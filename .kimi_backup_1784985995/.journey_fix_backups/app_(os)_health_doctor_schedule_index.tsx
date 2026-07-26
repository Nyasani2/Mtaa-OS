import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Calendar, Clock, ChevronLeft, ChevronRight, UserCheck, XCircle } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useHealthRole } from '@/lib/health/hooks';

interface ScheduleSlot {
  id: string;
  appointment_time: string;
  patient_name: string;
  reason: string;
  status: string;
  type: string;
}

export default function DoctorScheduleScreen() {
  const router = useRouter();
  const { staffRecord } = useHealthRole();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [slots, setSlots] = useState<ScheduleSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { fetchSchedule(); }, [selectedDate, staffRecord?.id]);

  const fetchSchedule = async () => {
    if (!staffRecord?.id) { setLoading(false); return; }
    setLoading(true);
    const dateStr = selectedDate.toISOString().split('T')[0];
    try {
      const { data, error } = await supabase
        .from('health_appointments')
        .select('id, appointment_time, patient_name, reason, status, type')
        .eq('doctor_id', staffRecord.id)
        .eq('appointment_date', dateStr)
        .order('appointment_time', { ascending: true });
      if (error) throw error;
      setSlots(data || []);
    } catch (err) {
      console.error('Schedule error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const changeDate = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d);
  };

  const cancelAppointment = async (id: string) => {
    try {
      const { error } = await supabase.from('health_appointments').update({ status: 'cancelled' }).eq('id', id);
      if (error) throw error;
      fetchSchedule();
    } catch (err: any) {
      alert('Cancel failed: ' + err.message);
    }
  };

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'confirmed': return '#22c55e';
      case 'completed': return '#3b82f6';
      case 'cancelled': return '#ef4444';
      case 'no_show': return '#9ca3af';
      default: return '#f59e0b';
    }
  };

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchSchedule(); }} />}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><ArrowLeft size={24} color="#1f2937" /></TouchableOpacity>
        <Text style={styles.headerTitle}>My Schedule</Text>
      </View>

      <View style={styles.dateBar}>
        <TouchableOpacity onPress={() => changeDate(-1)} style={styles.dateNav}><ChevronLeft size={20} color="#6b7280" /></TouchableOpacity>
        <View style={styles.dateCenter}>
          <Calendar size={18} color="#2563eb" />
          <Text style={styles.dateText}>{selectedDate.toDateString()}</Text>
        </View>
        <TouchableOpacity onPress={() => changeDate(1)} style={styles.dateNav}><ChevronRight size={20} color="#6b7280" /></TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 40 }} />
      ) : slots.length === 0 ? (
        <View style={styles.empty}>
          <Calendar size={48} color="#d1d5db" />
          <Text style={styles.emptyTitle}>No appointments</Text>
          <Text style={styles.emptySub}>No scheduled appointments for this day.</Text>
        </View>
      ) : (
        slots.map((s) => (
          <View key={s.id} style={styles.slotCard}>
            <View style={styles.slotTime}>
              <Clock size={16} color="#2563eb" />
              <Text style={styles.slotTimeText}>{s.appointment_time?.slice(0, 5) || 'TBD'}</Text>
            </View>
            <View style={styles.slotBody}>
              <Text style={styles.slotPatient}>{s.patient_name || 'Unknown'}</Text>
              <Text style={styles.slotReason}>{s.reason || s.type || 'Consultation'}</Text>
              <View style={styles.slotFooter}>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(s.status) + '20' }]}>
                  <View style={[styles.statusDot, { backgroundColor: getStatusColor(s.status) }]} />
                  <Text style={[styles.statusText, { color: getStatusColor(s.status) }]}>{s.status}</Text>
                </View>
                {s.status === 'confirmed' && (
                  <TouchableOpacity onPress={() => cancelAppointment(s.id)} style={styles.cancelBtn}>
                    <XCircle size={16} color="#ef4444" />
                    <Text style={styles.cancelText}>Cancel</Text>
                  </TouchableOpacity>
                )}
              </View>
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
  dateBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  dateNav: { padding: 8 },
  dateCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dateText: { fontSize: 15, fontWeight: '600', color: '#1f2937' },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#6b7280', marginTop: 12 },
  emptySub: { fontSize: 13, color: '#9ca3af', marginTop: 4 },
  slotCard: { flexDirection: 'row', backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 10, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  slotTime: { alignItems: 'center', marginRight: 14, paddingRight: 14, borderRightWidth: 1, borderRightColor: '#e5e7eb' },
  slotTimeText: { fontSize: 13, fontWeight: '700', color: '#2563eb', marginTop: 4 },
  slotBody: { flex: 1 },
  slotPatient: { fontSize: 15, fontWeight: '700', color: '#1f2937' },
  slotReason: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  slotFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, gap: 4 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  cancelBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cancelText: { fontSize: 12, color: '#ef4444', fontWeight: '600' },
});
