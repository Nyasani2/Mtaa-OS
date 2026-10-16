import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal, Alert, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

export default function CounsellorScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ student_name: '', issue: '', status: 'pending', notes: '' });

  useEffect(() => { loadCases(); }, []);

  const loadCases = async () => {
    try {
      const { data } = await supabase.from('education_counselling_cases').select('*').order('created_at', { ascending: false });
      setCases(data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleCreate = async () => {
    if (!form.student_name || !form.issue) { Alert.alert('Error', 'Student name and issue are required'); return; }
    try {
      await supabase.from('education_counselling_cases').insert({ ...form, counsellor_id: user?.id, created_at: new Date().toISOString() });
      Alert.alert('Success', 'Case logged successfully');
      setShowModal(false); setForm({ student_name: '', issue: '', status: 'pending', notes: '' });
      loadCases();
    } catch (e: any) { Alert.alert('Error', e.message); }
  };

  const getStatusColor = (s: string) => s === 'resolved' ? '#10b981' : s === 'in_progress' ? '#f59e0b' : '#f59e0b';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Counselling</Text>
        <TouchableOpacity onPress={() => setShowModal(true)}><Ionicons name="add-circle" size={24} color="#8b5cf6" /></TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {cases.map((c) => (
          <View key={c.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{c.student_name}</Text>
              <View style={[styles.badge, { backgroundColor: getStatusColor(c.status) + '20' }]}>
                <Text style={[styles.badgeText, { color: getStatusColor(c.status) }]}>{c.status.replace('_', ' ').toUpperCase()}</Text>
              </View>
            </View>
            <Text style={styles.cardDesc}>{c.issue}</Text>
            {c.notes && <Text style={styles.cardNotes}>Notes: {c.notes}</Text>}
          </View>
        ))}
      </ScrollView>

      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Log New Case</Text>
            <TextInput style={styles.input} placeholder="Student Name" value={form.student_name} onChangeText={t => setForm({...form, student_name: t})} />
            <TextInput style={styles.input} placeholder="Issue / Reason" value={form.issue} onChangeText={t => setForm({...form, issue: t})} />
            <TextInput style={styles.input} placeholder="Notes (Optional)" value={form.notes} onChangeText={t => setForm({...form, notes: t})} multiline />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowModal(false)}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleCreate}><Text style={styles.saveText}>Log Case</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12, backgroundColor: '#1e293b' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  scrollContent: { padding: 16 },
  card: { backgroundColor: '#1e293b', borderRadius: 12, padding: 16, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { color: '#fff', fontSize: 15, fontWeight: '700', flex: 1 },
  cardDesc: { color: '#cbd5e1', fontSize: 13, marginTop: 6 },
  cardNotes: { color: '#94a3b8', fontSize: 12, marginTop: 6, fontStyle: 'italic' },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 10, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20 },
  modal: { backgroundColor: '#1e293b', borderRadius: 16, padding: 20 },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 16 },
  input: { backgroundColor: '#0f172a', borderRadius: 10, padding: 14, color: '#fff', borderWidth: 1, borderColor: '#334155', marginBottom: 12 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 10, backgroundColor: '#334155', alignItems: 'center' },
  cancelText: { color: '#fff', fontWeight: '600' },
  saveBtn: { flex: 1, padding: 14, borderRadius: 10, backgroundColor: '#8b5cf6', alignItems: 'center' },
  saveText: { color: '#fff', fontWeight: '700' },
});
