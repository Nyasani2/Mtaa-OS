import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { Ionicons } from '@expo/vector-icons';

interface CheckInRecord {
  id: string;
  patient_id: string;
  patient_name: string;
  patient_phone: string | null;
  visit_type: 'walk_in' | 'appointment' | 'emergency' | 'follow_up' | 'referral';
  department: string;
  doctor_id: string | null;
  doctor_name: string | null;
  status: 'waiting' | 'in_consultation' | 'completed' | 'cancelled' | 'no_show';
  priority: 'routine' | 'urgent' | 'emergency';
  checked_in_at: string;
  checked_out_at: string | null;
  notes: string | null;
  queue_number: number;
}

export default function ReceptionistCheckInScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [records, setRecords] = useState<CheckInRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'waiting' | 'in_consultation' | 'completed'>('all');
  const [showForm, setShowForm] = useState(false);
  const [searchPatient, setSearchPatient] = useState('');
  const [patients, setPatients] = useState<Array<{ id: string; full_name: string; phone: string | null }>>([]);
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const [form, setForm] = useState({
    visit_type: 'walk_in' as CheckInRecord['visit_type'],
    department: 'general',
    priority: 'routine' as CheckInRecord['priority'],
    notes: '',
  });

  const visitTypes: CheckInRecord['visit_type'][] = ['walk_in', 'appointment', 'emergency', 'follow_up', 'referral'];
  const priorities: CheckInRecord['priority'][] = ['routine', 'urgent', 'emergency'];
  const departments = ['general', 'cardiology', 'pediatrics', 'orthopedics', 'obstetrics', 'emergency', 'surgery', 'dental', 'ophthalmology', 'dermatology', 'neurology', 'psychiatry'];

  useEffect(() => {
    loadCheckIns();
  }, [filter]);

  useEffect(() => {
    if (searchPatient.length >= 2) searchPatients();
  }, [searchPatient]);

  async function loadCheckIns() {
    if (!user) return;
    setLoading(true);
    try {
      let query = supabase
        .from('health_check_ins')
        .select('*, health_patients(id, full_name, phone), health_staff(id, user_profiles(full_name))')
        .order('checked_in_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;
      if (error) throw error;

      const mapped: CheckInRecord[] = (data || []).map((r: any) => ({
        id: r.id,
        patient_id: r.patient_id,
        patient_name: r.health_patients?.full_name || 'Unknown',
        patient_phone: r.health_patients?.phone || null,
        visit_type: r.visit_type,
        department: r.department,
        doctor_id: r.doctor_id,
        doctor_name: r.health_staff?.user_profiles?.full_name || 'Unassigned',
        status: r.status,
        priority: r.priority,
        checked_in_at: r.checked_in_at,
        checked_out_at: r.checked_out_at,
        notes: r.notes,
        queue_number: r.queue_number || 0,
      }));

      setRecords(mapped);
    } catch (err) {
      console.error('Check-ins load error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function searchPatients() {
    const { data } = await supabase
      .from('health_patients')
      .select('id, full_name, phone')
      .ilike('full_name', `%${searchPatient}%`)
      .limit(10);
    setPatients(data || []);
  }

  async function checkIn() {
    if (!user || !selectedPatient) return;
    const { error } = await supabase.from('health_check_ins').insert({
      patient_id: selectedPatient,
      visit_type: form.visit_type,
      department: form.department,
      priority: form.priority,
      status: 'waiting',
      notes: form.notes || null,
      checked_in_at: new Date().toISOString(),
    });
    if (!error) {
      setShowForm(false);
      setSelectedPatient(null);
      setSearchPatient('');
      setPatients([]);
      setForm({ visit_type: 'walk_in', department: 'general', priority: 'routine', notes: '' });
      loadCheckIns();
    }
  }

  async function updateStatus(id: string, status: CheckInRecord['status']) {
    const updates: any = { status };
    if (status === 'completed') updates.checked_out_at = new Date().toISOString();
    const { error } = await supabase.from('health_check_ins').update(updates).eq('id', id);
    if (!error) loadCheckIns();
  }

  const statusColors: Record<string, string> = {
    waiting: '#f59e0b',
    in_consultation: '#3b82f6',
    completed: '#22c55e',
    cancelled: '#ef4444',
    no_show: '#9ca3af',
  };

  const priorityConfig: Record<string, { color: string; icon: string }> = {
    routine: { color: '#22c55e', icon: 'time' },
    urgent: { color: '#f59e0b', icon: 'alert' },
    emergency: { color: '#ef4444', icon: 'flash' },
  };

  const waitingCount = records.filter(r => r.status === 'waiting').length;
  const inConsultationCount = records.filter(r => r.status === 'in_consultation').length;
  const completedToday = records.filter(r => r.status === 'completed' && new Date(r.checked_out_at || '').toDateString() === new Date().toDateString()).length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Patient Check-In</Text>
        <TouchableOpacity onPress={() => setShowForm(!showForm)}>
          <Ionicons name={showForm ? 'close' : 'add'} size={24} color="#0ea5e9" />
        </TouchableOpacity>
      </View>

      <View style={styles.totalsRow}>
        <View style={[styles.totalCard, { backgroundColor: '#f59e0b20' }]}>
          <Text style={[styles.totalValue, { color: '#f59e0b' }]}>{waitingCount}</Text>
          <Text style={styles.totalLabel}>Waiting</Text>
        </View>
        <View style={[styles.totalCard, { backgroundColor: '#3b82f620' }]}>
          <Text style={[styles.totalValue, { color: '#3b82f6' }]}>{inConsultationCount}</Text>
          <Text style={styles.totalLabel}>In Room</Text>
        </View>
        <View style={[styles.totalCard, { backgroundColor: '#22c55e20' }]}>
          <Text style={[styles.totalValue, { color: '#22c55e' }]}>{completedToday}</Text>
          <Text style={styles.totalLabel}>Done Today</Text>
        </View>
      </View>

      {showForm && (
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>New Check-In</Text>
          <TextInput
            style={styles.input}
            value={searchPatient}
            onChangeText={t => { setSearchPatient(t); setSelectedPatient(null); }}
            placeholder="Search patient by name..."
            placeholderTextColor="#64748b"
          />
          {patients.length > 0 && !selectedPatient && (
            <View style={styles.patientList}>
              {patients.map(p => (
                <TouchableOpacity key={p.id} style={styles.patientItem} onPress={() => { setSelectedPatient(p.id); setSearchPatient(p.full_name); setPatients([]); }}>
                  <Text style={styles.patientItemName}>{p.full_name}</Text>
                  <Text style={styles.patientItemPhone}>{p.phone || 'No phone'}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          {selectedPatient && (
            <View style={styles.selectedPatient}>
              <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
              <Text style={styles.selectedText}>{searchPatient} selected</Text>
            </View>
          )}
          <View style={styles.typeRow}>
            {visitTypes.map(t => (
              <TouchableOpacity key={t} style={[styles.typeBtn, form.visit_type === t && styles.typeBtnActive]} onPress={() => setForm(f => ({ ...f, visit_type: t }))}>
                <Text style={[styles.typeBtnText, form.visit_type === t && styles.typeBtnTextActive]}>{t.replace('_', ' ')}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.typeRow}>
            {departments.map(d => (
              <TouchableOpacity key={d} style={[styles.deptBtn, form.department === d && styles.deptBtnActive]} onPress={() => setForm(f => ({ ...f, department: d }))}>
                <Text style={[styles.deptText, form.department === d && styles.deptTextActive]}>{d}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.priorityRow}>
            {priorities.map(p => (
              <TouchableOpacity key={p} style={[styles.priorityBtn, form.priority === p && { backgroundColor: priorityConfig[p]?.color }]} onPress={() => setForm(f => ({ ...f, priority: p }))}>
                <Ionicons name={priorityConfig[p]?.icon as any} size={14} color={form.priority === p ? '#fff' : priorityConfig[p]?.color} />
                <Text style={[styles.priorityText, form.priority === p && { color: '#fff' }]}>{p.toUpperCase()}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput style={[styles.input, { height: 60 }]} value={form.notes} onChangeText={t => setForm(f => ({ ...f, notes: t }))} placeholder="Notes" placeholderTextColor="#64748b" multiline />
          <TouchableOpacity style={styles.submitBtn} onPress={checkIn}>
            <Text style={styles.submitBtnText}>Check In Patient</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.filterRow}>
        {(['all', 'waiting', 'in_consultation', 'completed'] as const).map(f => (
          <TouchableOpacity key={f} style={[styles.filterBtn, filter === f && styles.filterBtnActive]} onPress={() => setFilter(f)}>
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f.replace('_', ' ')}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#0ea5e9" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={records}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardLeft}>
                  <View style={styles.queueBadge}>
                    <Text style={styles.queueText}>#{item.queue_number}</Text>
                  </View>
                  <View>
                    <Text style={styles.cardName}>{item.patient_name}</Text>
                    <Text style={styles.cardDetail}>{item.department} — {item.visit_type.replace('_', ' ')}</Text>
                    <Text style={styles.cardDoctor}>Doctor: {item.doctor_name}</Text>
                  </View>
                </View>
                <View style={[styles.priorityBadge, { backgroundColor: priorityConfig[item.priority]?.color + '20' }]}>
                  <Ionicons name={priorityConfig[item.priority]?.icon as any} size={12} color={priorityConfig[item.priority]?.color} />
                  <Text style={[styles.priorityBadgeText, { color: priorityConfig[item.priority]?.color }]}>{item.priority.toUpperCase()}</Text>
                </View>
              </View>
              <View style={styles.statusRow}>
                <View style={[styles.statusBadge, { backgroundColor: statusColors[item.status] + '20' }]}>
                  <Text style={[styles.statusText, { color: statusColors[item.status] }]}>{item.status.replace('_', ' ').toUpperCase()}</Text>
                </View>
                <Text style={styles.timeText}>{new Date(item.checked_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
              </View>
              {item.notes && <Text style={styles.notesText}>{item.notes}</Text>}
              <View style={styles.actionRow}>
                {item.status === 'waiting' && (
                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#3b82f6' }]} onPress={() => updateStatus(item.id, 'in_consultation')}>
                    <Text style={styles.actionBtnText}>Send to Room</Text>
                  </TouchableOpacity>
                )}
                {item.status === 'in_consultation' && (
                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#22c55e' }]} onPress={() => updateStatus(item.id, 'completed')}>
                    <Text style={styles.actionBtnText}>Complete Visit</Text>
                  </TouchableOpacity>
                )}
                {(item.status === 'waiting' || item.status === 'in_consultation') && (
                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#ef4444' }]} onPress={() => updateStatus(item.id, 'cancelled')}>
                    <Text style={styles.actionBtnText}>Cancel</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="clipboard-outline" size={48} color="#9ca3af" />
              <Text style={styles.emptyText}>No check-ins found</Text>
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
  totalValue: { fontSize: 22, fontWeight: '700' },
  totalLabel: { fontSize: 11, color: '#64748b', marginTop: 4 },
  formCard: { backgroundColor: '#1e293b', margin: 16, borderRadius: 12, padding: 16 },
  formTitle: { fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 12 },
  input: { backgroundColor: '#0f172a', borderRadius: 8, padding: 10, color: '#e2e8f0', fontSize: 14, borderWidth: 1, borderColor: '#334155', marginBottom: 8 },
  patientList: { backgroundColor: '#0f172a', borderRadius: 8, marginBottom: 8, maxHeight: 150 },
  patientItem: { padding: 10, borderBottomWidth: 1, borderBottomColor: '#334155' },
  patientItemName: { fontSize: 14, color: '#e2e8f0', fontWeight: '600' },
  patientItemPhone: { fontSize: 12, color: '#64748b', marginTop: 2 },
  selectedPatient: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8, padding: 8, backgroundColor: '#22c55e20', borderRadius: 8 },
  selectedText: { fontSize: 13, color: '#22c55e', fontWeight: '600' },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  typeBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, backgroundColor: '#334155' },
  typeBtnActive: { backgroundColor: '#0ea5e9' },
  typeBtnText: { fontSize: 11, color: '#94a3b8' },
  typeBtnTextActive: { color: '#fff', fontWeight: '600' },
  deptBtn: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: '#334155' },
  deptBtnActive: { backgroundColor: '#8b5cf6' },
  deptText: { fontSize: 10, color: '#94a3b8' },
  deptTextActive: { color: '#fff', fontWeight: '600' },
  priorityRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  priorityBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: '#334155', justifyContent: 'center' },
  priorityText: { fontSize: 12, color: '#94a3b8', fontWeight: '600' },
  submitBtn: { backgroundColor: '#0ea5e9', borderRadius: 8, padding: 12, alignItems: 'center', marginTop: 8 },
  submitBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  filterRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 6, marginBottom: 8, flexWrap: 'wrap' },
  filterBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 16, backgroundColor: '#1e293b' },
  filterBtnActive: { backgroundColor: '#0ea5e9' },
  filterText: { fontSize: 11, color: '#94a3b8' },
  filterTextActive: { color: '#fff', fontWeight: '600' },
  card: { backgroundColor: '#1e293b', borderRadius: 12, padding: 14, marginBottom: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  cardLeft: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  queueBadge: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#0ea5e9', alignItems: 'center', justifyContent: 'center' },
  queueText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  cardName: { fontSize: 15, fontWeight: '700', color: '#fff' },
  cardDetail: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  cardDoctor: { fontSize: 12, color: '#64748b', marginTop: 1 },
  priorityBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  priorityBadgeText: { fontSize: 10, fontWeight: '700' },
  statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: '700' },
  timeText: { fontSize: 12, color: '#64748b' },
  notesText: { fontSize: 12, color: '#64748b', marginTop: 6, fontStyle: 'italic' },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  actionBtn: { flex: 1, borderRadius: 8, padding: 10, alignItems: 'center' },
  actionBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  empty: { alignItems: 'center', marginTop: 40 },
  emptyText: { color: '#94a3b8', marginTop: 12, fontSize: 14 },
});
