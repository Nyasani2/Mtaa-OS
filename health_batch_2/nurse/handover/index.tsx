import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, ClipboardList, Send, UserCheck, Clock, AlertCircle } from 'lucide-react-native';
import { supabase } from '@/lib/supabase/client';
import { useHealthRole } from '@/lib/health/hooks';

interface HandoverNote {
  id: string;
  patient_name: string;
  bed_number: string;
  note: string;
  priority: 'normal' | 'high' | 'critical';
  created_by: string;
  created_at: string;
  status: 'open' | 'resolved';
}

export default function NurseHandoverScreen() {
  const router = useRouter();
  const { staffRecord } = useHealthRole();
  const [notes, setNotes] = useState<HandoverNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [patientName, setPatientName] = useState('');
  const [bedNumber, setBedNumber] = useState('');
  const [priority, setPriority] = useState<'normal' | 'high' | 'critical'>('normal');
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchNotes(); }, [staffRecord?.facility_id]);

  const fetchNotes = async () => {
    if (!staffRecord?.facility_id) { setLoading(false); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('health_handover_notes')
        .select('id, patient_name, bed_number, note, priority, created_by, created_at, status')
        .eq('facility_id', staffRecord.facility_id)
        .eq('status', 'open')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setNotes(data || []);
    } catch (err) {
      console.error('Handover error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const submitNote = async () => {
    if (!newNote.trim() || !patientName.trim()) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('health_handover_notes').insert({
        facility_id: staffRecord?.facility_id,
        patient_name: patientName,
        bed_number: bedNumber || null,
        note: newNote,
        priority,
        created_by: staffRecord?.id,
        status: 'open',
      });
      if (error) throw error;
      setNewNote('');
      setPatientName('');
      setBedNumber('');
      setPriority('normal');
      fetchNotes();
    } catch (err: any) {
      alert('Failed: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const resolveNote = async (id: string) => {
    try {
      const { error } = await supabase.from('health_handover_notes').update({ status: 'resolved' }).eq('id', id);
      if (error) throw error;
      fetchNotes();
    } catch (err: any) {
      alert('Failed: ' + err.message);
    }
  };

  const getPriorityColor = (p: string) => p === 'critical' ? '#dc2626' : p === 'high' ? '#f97316' : '#22c55e';

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchNotes(); }} />}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><ArrowLeft size={24} color="#1f2937" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Handover Notes</Text>
      </View>

      <View style={styles.formSection}>
        <Text style={styles.label}>New Handover Note</Text>
        <TextInput style={styles.input} placeholder="Patient name" value={patientName} onChangeText={setPatientName} placeholderTextColor="#9ca3af" />
        <TextInput style={styles.input} placeholder="Bed number (optional)" value={bedNumber} onChangeText={setBedNumber} placeholderTextColor="#9ca3af" />
        <TextInput style={[styles.input, { minHeight: 80 }]} placeholder="Write handover note..." value={newNote} onChangeText={setNewNote} multiline placeholderTextColor="#9ca3af" />
        <View style={styles.priorityRow}>
          {(['normal', 'high', 'critical'] as const).map((p) => (
            <TouchableOpacity key={p} style={[styles.priorityChip, priority === p && { backgroundColor: getPriorityColor(p) }]} onPress={() => setPriority(p)}>
              <Text style={[styles.priorityText, priority === p && { color: '#fff' }]}>{p}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={[styles.submitBtn, saving && { opacity: 0.6 }]} onPress={submitNote} disabled={saving}>
          <Send size={16} color="#fff" /><Text style={styles.submitText}>Add Note</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Active Notes ({notes.length})</Text>

      {loading && !refreshing ? (
        <ActivityIndicator size="large" color="#06b6d4" style={{ marginTop: 20 }} />
      ) : notes.length === 0 ? (
        <View style={styles.empty}>
          <ClipboardList size={48} color="#d1d5db" />
          <Text style={styles.emptyTitle}>No active handover notes</Text>
        </View>
      ) : (
        notes.map((n) => (
          <View key={n.id} style={styles.noteCard}>
            <View style={styles.noteHeader}>
              <View style={styles.notePatient}>
                <UserCheck size={14} color="#6b7280" />
                <Text style={styles.notePatientText}>{n.patient_name}</Text>
                {n.bed_number && <Text style={styles.noteBed}>· Bed {n.bed_number}</Text>}
              </View>
              <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(n.priority) + '20' }]}>
                <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(n.priority) }]} />
                <Text style={[styles.priorityBadgeText, { color: getPriorityColor(n.priority) }]}>{n.priority}</Text>
              </View>
            </View>
            <Text style={styles.noteText}>{n.note}</Text>
            <View style={styles.noteFooter}>
              <View style={styles.timeRow}>
                <Clock size={12} color="#9ca3af" />
                <Text style={styles.timeText}>{new Date(n.created_at).toLocaleString()}</Text>
              </View>
              <TouchableOpacity style={styles.resolveBtn} onPress={() => resolveNote(n.id)}>
                <Text style={styles.resolveText}>Resolve</Text>
              </TouchableOpacity>
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
  formSection: { padding: 16, backgroundColor: '#fff', marginBottom: 8, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  label: { fontSize: 14, fontWeight: '700', color: '#1f2937', marginBottom: 10 },
  input: { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#1f2937', marginBottom: 8 },
  priorityRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  priorityChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8, backgroundColor: '#f3f4f6' },
  priorityText: { fontSize: 12, fontWeight: '600', color: '#6b7280', textTransform: 'capitalize' },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#06b6d4', paddingVertical: 12, borderRadius: 10, gap: 6 },
  submitText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#6b7280', marginHorizontal: 16, marginTop: 12, marginBottom: 8 },
  empty: { alignItems: 'center', marginTop: 40 },
  emptyTitle: { fontSize: 14, color: '#9ca3af', marginTop: 8 },
  noteCard: { backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 10, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  noteHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  notePatient: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  notePatientText: { fontSize: 14, fontWeight: '700', color: '#1f2937' },
  noteBed: { fontSize: 12, color: '#9ca3af' },
  priorityBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, gap: 4 },
  priorityDot: { width: 6, height: 6, borderRadius: 3 },
  priorityBadgeText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  noteText: { fontSize: 13, color: '#374151', lineHeight: 18 },
  noteFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  timeText: { fontSize: 11, color: '#9ca3af' },
  resolveBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, backgroundColor: '#22c55e15' },
  resolveText: { fontSize: 11, fontWeight: '700', color: '#22c55e' },
});
