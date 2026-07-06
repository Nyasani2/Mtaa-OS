import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { Ionicons } from '@expo/vector-icons';

interface DispatchRecord {
  id: string;
  dispatch_code: string;
  patient_name: string;
  patient_phone: string | null;
  pickup_address: string;
  pickup_coordinates: { lat: number; lng: number } | null;
  destination_facility_id: string | null;
  destination_facility_name: string | null;
  emergency_type: 'cardiac' | 'trauma' | 'respiratory' | 'obstetric' | 'pediatric' | 'psychiatric' | 'burn' | 'poisoning' | 'other';
  priority: 'critical' | 'urgent' | 'routine';
  status: 'dispatched' | 'en_route' | 'on_scene' | 'transporting' | 'at_hospital' | 'completed' | 'cancelled';
  assigned_vehicle_id: string | null;
  assigned_vehicle_plate: string | null;
  assigned_crew: string[] | null;
  eta_minutes: number | null;
  dispatch_time: string;
  arrival_time: string | null;
  completion_time: string | null;
  notes: string | null;
  created_at: string;
}

export default function AmbulanceDispatchesScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [records, setRecords] = useState<DispatchRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | DispatchRecord['status']>('all');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    patient_name: '',
    patient_phone: '',
    pickup_address: '',
    emergency_type: 'other' as DispatchRecord['emergency_type'],
    priority: 'urgent' as DispatchRecord['priority'],
    notes: '',
  });

  const emergencyTypes: DispatchRecord['emergency_type'][] = ['cardiac', 'trauma', 'respiratory', 'obstetric', 'pediatric', 'psychiatric', 'burn', 'poisoning', 'other'];
  const priorities: DispatchRecord['priority'][] = ['critical', 'urgent', 'routine'];

  useEffect(() => {
    loadDispatches();
  }, [filter]);

  async function loadDispatches() {
    if (!user) return;
    setLoading(true);
    try {
      let query = supabase
        .from('health_ambulance_dispatches')
        .select('*, health_ambulance_vehicles(plate_number), health_facilities(name)')
        .order('dispatch_time', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;
      if (error) throw error;

      const mapped: DispatchRecord[] = (data || []).map((r: any) => ({
        id: r.id,
        dispatch_code: r.dispatch_code || `DISP-${r.id.slice(0, 6).toUpperCase()}`,
        patient_name: r.patient_name,
        patient_phone: r.patient_phone,
        pickup_address: r.pickup_address,
        pickup_coordinates: r.pickup_coordinates,
        destination_facility_id: r.destination_facility_id,
        destination_facility_name: r.health_facilities?.name || 'Not assigned',
        emergency_type: r.emergency_type,
        priority: r.priority,
        status: r.status,
        assigned_vehicle_id: r.assigned_vehicle_id,
        assigned_vehicle_plate: r.health_ambulance_vehicles?.plate_number || 'Unassigned',
        assigned_crew: r.assigned_crew,
        eta_minutes: r.eta_minutes,
        dispatch_time: r.dispatch_time,
        arrival_time: r.arrival_time,
        completion_time: r.completion_time,
        notes: r.notes,
        created_at: r.created_at,
      }));

      setRecords(mapped);
    } catch (err) {
      console.error('Dispatches load error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function createDispatch() {
    if (!user || !form.patient_name || !form.pickup_address) return;
    const code = `DISP-${Date.now().toString(36).toUpperCase().slice(-6)}`;
    const { error } = await supabase.from('health_ambulance_dispatches').insert({
      dispatch_code: code,
      patient_name: form.patient_name,
      patient_phone: form.patient_phone || null,
      pickup_address: form.pickup_address,
      emergency_type: form.emergency_type,
      priority: form.priority,
      status: 'dispatched',
      notes: form.notes || null,
      dispatch_time: new Date().toISOString(),
    });
    if (!error) {
      setShowForm(false);
      setForm({ patient_name: '', patient_phone: '', pickup_address: '', emergency_type: 'other', priority: 'urgent', notes: '' });
      loadDispatches();
    }
  }

  async function updateStatus(id: string, status: DispatchRecord['status']) {
    const updates: any = { status };
    if (status === 'en_route') updates.eta_minutes = 15;
    if (status === 'on_scene') updates.arrival_time = new Date().toISOString();
    if (status === 'completed') updates.completion_time = new Date().toISOString();
    const { error } = await supabase.from('health_ambulance_dispatches').update(updates).eq('id', id);
    if (!error) loadDispatches();
  }

  const statusConfig: Record<string, { color: string; next: DispatchRecord['status'] | null; label: string }> = {
    dispatched: { color: '#f59e0b', next: 'en_route', label: 'En Route' },
    en_route: { color: '#3b82f6', next: 'on_scene', label: 'On Scene' },
    on_scene: { color: '#8b5cf6', next: 'transporting', label: 'Transporting' },
    transporting: { color: '#0ea5e9', next: 'at_hospital', label: 'At Hospital' },
    at_hospital: { color: '#22c55e', next: 'completed', label: 'Complete' },
    completed: { color: '#22c55e', next: null, label: 'Completed' },
    cancelled: { color: '#ef4444', next: null, label: 'Cancelled' },
  };

  const emergencyConfig: Record<string, { color: string; icon: string }> = {
    cardiac: { color: '#ef4444', icon: 'heart' },
    trauma: { color: '#f59e0b', icon: 'fitness' },
    respiratory: { color: '#3b82f6', icon: 'airplane' },
    obstetric: { color: '#ec4899', icon: 'woman' },
    pediatric: { color: '#22c55e', icon: 'happy' },
    psychiatric: { color: '#8b5cf6', icon: 'brain' },
    burn: { color: '#f97316', icon: 'flame' },
    poisoning: { color: '#14b8a6', icon: 'skull' },
    other: { color: '#9ca3af', icon: 'help-circle' },
  };

  const priorityConfig: Record<string, { color: string }> = {
    critical: { color: '#ef4444' },
    urgent: { color: '#f59e0b' },
    routine: { color: '#22c55e' },
  };

  const activeDispatches = records.filter(r => r.status !== 'completed' && r.status !== 'cancelled').length;
  const completedToday = records.filter(r => r.status === 'completed' && new Date(r.completion_time || '').toDateString() === new Date().toDateString()).length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ambulance Dispatches</Text>
        <TouchableOpacity onPress={() => setShowForm(!showForm)}>
          <Ionicons name={showForm ? 'close' : 'add'} size={24} color="#ef4444" />
        </TouchableOpacity>
      </View>

      <View style={styles.totalsRow}>
        <View style={[styles.totalCard, { backgroundColor: '#ef444420' }]}>
          <Text style={[styles.totalValue, { color: '#ef4444' }]}>{activeDispatches}</Text>
          <Text style={styles.totalLabel}>Active</Text>
        </View>
        <View style={[styles.totalCard, { backgroundColor: '#22c55e20' }]}>
          <Text style={[styles.totalValue, { color: '#22c55e' }]}>{completedToday}</Text>
          <Text style={styles.totalLabel}>Completed Today</Text>
        </View>
      </View>

      {showForm && (
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>New Dispatch</Text>
          <TextInput style={styles.input} value={form.patient_name} onChangeText={t => setForm(f => ({ ...f, patient_name: t }))} placeholder="Patient name" placeholderTextColor="#64748b" />
          <TextInput style={styles.input} value={form.patient_phone} onChangeText={t => setForm(f => ({ ...f, patient_phone: t }))} placeholder="Patient phone" placeholderTextColor="#64748b" keyboardType="phone-pad" />
          <TextInput style={styles.input} value={form.pickup_address} onChangeText={t => setForm(f => ({ ...f, pickup_address: t }))} placeholder="Pickup address" placeholderTextColor="#64748b" />
          <View style={styles.typeRow}>
            {emergencyTypes.map(t => (
              <TouchableOpacity key={t} style={[styles.typeBtn, form.emergency_type === t && { backgroundColor: emergencyConfig[t]?.color }]} onPress={() => setForm(f => ({ ...f, emergency_type: t }))}>
                <Text style={[styles.typeBtnText, form.emergency_type === t && { color: '#fff' }]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.priorityRow}>
            {priorities.map(p => (
              <TouchableOpacity key={p} style={[styles.priorityBtn, form.priority === p && { backgroundColor: priorityConfig[p]?.color }]} onPress={() => setForm(f => ({ ...f, priority: p }))}>
                <Text style={[styles.priorityText, form.priority === p && { color: '#fff' }]}>{p.toUpperCase()}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput style={[styles.input, { height: 60 }]} value={form.notes} onChangeText={t => setForm(f => ({ ...f, notes: t }))} placeholder="Notes" placeholderTextColor="#64748b" multiline />
          <TouchableOpacity style={styles.submitBtn} onPress={createDispatch}>
            <Text style={styles.submitBtnText}>Dispatch Ambulance</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.filterRow}>
        {(['all', 'dispatched', 'en_route', 'on_scene', 'transporting', 'at_hospital', 'completed'] as const).map(f => (
          <TouchableOpacity key={f} style={[styles.filterBtn, filter === f && styles.filterBtnActive]} onPress={() => setFilter(f)}>
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f.replace('_', ' ')}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#ef4444" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={records}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardLeft}>
                  <View style={[styles.emergencyIcon, { backgroundColor: emergencyConfig[item.emergency_type]?.color + '20' }]}>
                    <Ionicons name={emergencyConfig[item.emergency_type]?.icon as any} size={18} color={emergencyConfig[item.emergency_type]?.color} />
                  </View>
                  <View>
                    <Text style={styles.cardTitle}>{item.dispatch_code}</Text>
                    <Text style={styles.cardPatient}>{item.patient_name}</Text>
                    <Text style={styles.cardAddress}>{item.pickup_address}</Text>
                  </View>
                </View>
                <View style={[styles.priorityBadge, { backgroundColor: priorityConfig[item.priority]?.color + '20' }]}>
                  <Text style={[styles.priorityText, { color: priorityConfig[item.priority]?.color }]}>{item.priority.toUpperCase()}</Text>
                </View>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailText}>Type: {item.emergency_type}</Text>
                <Text style={styles.detailText}>Vehicle: {item.assigned_vehicle_plate}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailText}>Destination: {item.destination_facility_name}</Text>
                {item.eta_minutes && <Text style={styles.etaText}>ETA: {item.eta_minutes} min</Text>}
              </View>
              <View style={styles.statusRow}>
                <View style={[styles.statusBadge, { backgroundColor: statusConfig[item.status]?.color + '20' }]}>
                  <Text style={[styles.statusText, { color: statusConfig[item.status]?.color }]}>{item.status.replace('_', ' ').toUpperCase()}</Text>
                </View>
                <Text style={styles.timeText}>Dispatched: {new Date(item.dispatch_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
              </View>
              {item.notes && <Text style={styles.notesText}>{item.notes}</Text>}
              {statusConfig[item.status]?.next && (
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: statusConfig[item.status]?.color }]} onPress={() => updateStatus(item.id, statusConfig[item.status].next!)}>
                  <Text style={styles.actionBtnText}>{statusConfig[item.status]?.label}</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="medical-outline" size={48} color="#9ca3af" />
              <Text style={styles.emptyText}>No dispatches found</Text>
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
  totalsRow: { flexDirection: 'row', padding: 16, gap: 12 },
  totalCard: { flex: 1, borderRadius: 12, padding: 14, alignItems: 'center' },
  totalValue: { fontSize: 24, fontWeight: '700' },
  totalLabel: { fontSize: 12, color: '#64748b', marginTop: 4 },
  formCard: { backgroundColor: '#1e293b', margin: 16, borderRadius: 12, padding: 16 },
  formTitle: { fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 12 },
  input: { backgroundColor: '#0f172a', borderRadius: 8, padding: 10, color: '#e2e8f0', fontSize: 14, borderWidth: 1, borderColor: '#334155', marginBottom: 8 },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  typeBtn: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: 6, backgroundColor: '#334155' },
  typeBtnText: { fontSize: 10, color: '#94a3b8' },
  priorityRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  priorityBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: '#334155', alignItems: 'center' },
  priorityText: { fontSize: 12, color: '#94a3b8', fontWeight: '600' },
  submitBtn: { backgroundColor: '#ef4444', borderRadius: 8, padding: 12, alignItems: 'center', marginTop: 8 },
  submitBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  filterRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 6, marginBottom: 8, flexWrap: 'wrap' },
  filterBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 16, backgroundColor: '#1e293b' },
  filterBtnActive: { backgroundColor: '#ef4444' },
  filterText: { fontSize: 11, color: '#94a3b8' },
  filterTextActive: { color: '#fff', fontWeight: '600' },
  card: { backgroundColor: '#1e293b', borderRadius: 12, padding: 14, marginBottom: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  cardLeft: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  emergencyIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#fff' },
  cardPatient: { fontSize: 15, fontWeight: '600', color: '#e2e8f0', marginTop: 2 },
  cardAddress: { fontSize: 12, color: '#94a3b8', marginTop: 1 },
  priorityBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  detailRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
  detailText: { fontSize: 12, color: '#64748b' },
  etaText: { fontSize: 12, color: '#0ea5e9', fontWeight: '600' },
  statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: '700' },
  timeText: { fontSize: 11, color: '#64748b' },
  notesText: { fontSize: 12, color: '#64748b', marginTop: 6, fontStyle: 'italic' },
  actionBtn: { borderRadius: 8, padding: 10, alignItems: 'center', marginTop: 10 },
  actionBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  empty: { alignItems: 'center', marginTop: 40 },
  emptyText: { color: '#94a3b8', marginTop: 12, fontSize: 14 },
});
