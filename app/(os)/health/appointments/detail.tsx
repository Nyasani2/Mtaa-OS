// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth/store/auth.store';

const STATUS_COLORS = {
  scheduled: '#3b82f6',
  in_progress: '#f59e0b',
  completed: '#10b981',
  cancelled: '#ef4444',
  no_show: '#64748b',
};

export default function AppointmentDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user } = useAuthStore();
  const [appt, setAppt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('health_appointments')
        .select('*, patient:health_patients(*), doctor:user_profiles(*)')
        .eq('id', id)
        .single();
      setAppt(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const updateStatus = async (newStatus) => {
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('health_appointments')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
      if (error) throw error;
      Alert.alert('Success', `Appointment marked as ${newStatus.replace('_', ' ')}`);
      load();
    } catch (err) {
      Alert.alert('Error', err?.message || 'Failed to update');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <View style={[s.container, s.center]}><ActivityIndicator size="large" color="#0ea5e9" /></View>;
  if (!appt) return <View style={[s.container, s.center]}><Text>Appointment not found</Text></View>;

  const statusColor = STATUS_COLORS[appt.status] || '#64748b';

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <View style={[s.statusHeader, { backgroundColor: statusColor }]}>
        <Ionicons name={appt.status === 'completed' ? 'checkmark-circle' : 'time'} size={28} color="#fff" />
        <Text style={s.statusText}>{appt.status.replace('_', ' ').toUpperCase()}</Text>
      </View>

      <View style={s.card}>
        <Text style={s.cardTitle}>Schedule</Text>
        <View style={s.row}>
          <Text style={s.rowLabel}>Date & Time</Text>
          <Text style={s.rowValue}>{new Date(appt.scheduled_at).toLocaleString()}</Text>
        </View>
        <View style={s.row}>
          <Text style={s.rowLabel}>Duration</Text>
          <Text style={s.rowValue}>{appt.duration_minutes || 30} mins</Text>
        </View>
        {appt.reason && (
          <View style={s.row}>
            <Text style={s.rowLabel}>Reason</Text>
            <Text style={s.rowValue}>{appt.reason}</Text>
          </View>
        )}
      </View>

      <View style={s.card}>
        <Text style={s.cardTitle}>Patient</Text>
        <View style={s.row}>
          <Text style={s.rowLabel}>Name</Text>
          <Text style={s.rowValue}>{appt.patient?.first_name || 'Unknown'} {appt.patient?.last_name || ''}</Text>
        </View>
        <View style={s.row}>
          <Text style={s.rowLabel}>Phone</Text>
          <Text style={s.rowValue}>{appt.patient?.phone || '—'}</Text>
        </View>
      </View>

      <View style={s.card}>
        <Text style={s.cardTitle}>Doctor</Text>
        <View style={s.row}>
          <Text style={s.rowLabel}>Name</Text>
          <Text style={s.rowValue}>Dr. {appt.doctor?.first_name || ''} {appt.doctor?.last_name || ''}</Text>
        </View>
      </View>

      <Text style={s.sectionTitle}>Actions</Text>
      <View style={s.actions}>
        {appt.status === 'scheduled' && (
          <>
            <TouchableOpacity style={[s.actionBtn, s.btnPrimary]} onPress={() => updateStatus('in_progress')} disabled={updating}>
              <Ionicons name="play-circle" size={20} color="#fff" />
              <Text style={s.actionBtnText}>Start Appointment</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.actionBtn, s.btnDanger]} onPress={() => updateStatus('no_show')} disabled={updating}>
              <Ionicons name="close-circle" size={20} color="#fff" />
              <Text style={s.actionBtnText}>Mark No-Show</Text>
            </TouchableOpacity>
          </>
        )}
        {appt.status === 'in_progress' && (
          <TouchableOpacity style={[s.actionBtn, s.btnSuccess]} onPress={() => updateStatus('completed')} disabled={updating}>
            <Ionicons name="checkmark-circle" size={20} color="#fff" />
            <Text style={s.actionBtnText}>Complete & Close</Text>
          </TouchableOpacity>
        )}
        {(appt.status === 'scheduled' || appt.status === 'in_progress') && (
          <TouchableOpacity style={[s.actionBtn, s.btnOutline]} onPress={() => updateStatus('cancelled')} disabled={updating}>
            <Text style={s.actionBtnTextOutline}>Cancel Appointment</Text>
          </TouchableOpacity>
        )}
        {updating && <ActivityIndicator size="small" color="#0ea5e9" style={{ marginTop: 12 }} />}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { paddingBottom: 40 },
  center: { justifyContent: 'center', alignItems: 'center', flex: 1 },
  statusHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 20, paddingTop: 50 },
  statusText: { color: '#fff', fontSize: 20, fontWeight: '800', textTransform: 'uppercase' },
  card: { backgroundColor: '#fff', margin: 16, borderRadius: 12, padding: 16 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  rowLabel: { color: '#64748b', fontSize: 14 },
  rowValue: { color: '#0f172a', fontWeight: '600', fontSize: 14, flex: 1, textAlign: 'right', marginLeft: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginHorizontal: 16, marginTop: 8 },
  actions: { padding: 16, gap: 10 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 10, padding: 14 },
  btnPrimary: { backgroundColor: '#0ea5e9' },
  btnSuccess: { backgroundColor: '#10b981' },
  btnDanger: { backgroundColor: '#ef4444' },
  btnOutline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#e2e8f0' },
  actionBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  actionBtnTextOutline: { color: '#64748b', fontWeight: '600', fontSize: 15 },
});
