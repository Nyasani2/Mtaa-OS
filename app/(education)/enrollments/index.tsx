import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal, Alert, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';

export default function EnrollmentsScreen() {
  const router = useRouter();
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ full_name: '', admission_number: '', grade_level: '', stream: '' });

  useEffect(() => { loadStudents(); }, []);

  const loadStudents = async () => {
    try {
      const { data } = await supabase.from('education_students').select('*').order('created_at', { ascending: false });
      setStudents(data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleEnroll = async () => {
    if (!form.full_name || !form.admission_number) { Alert.alert('Error', 'Name and admission number are required'); return; }
    try {
      await supabase.from('education_students').insert({ ...form, enrollment_status: 'active', created_at: new Date().toISOString() });
      Alert.alert('Success', 'Student enrolled successfully');
      setShowModal(false); setForm({ full_name: '', admission_number: '', grade_level: '', stream: '' });
      loadStudents();
    } catch (e: any) { Alert.alert('Error', e.message); }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Enrollments</Text>
        <TouchableOpacity onPress={() => setShowModal(true)}><Ionicons name="person-add" size={24} color="#10b981" /></TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {students.map((s) => (
          <View key={s.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{s.full_name}</Text>
              <View style={[styles.badge, { backgroundColor: '#10b98120' }]}>
                <Text style={[styles.badgeText, { color: '#10b981' }]}>{s.enrollment_status?.toUpperCase()}</Text>
              </View>
            </View>
            <Text style={styles.cardMeta}>Adm: {s.admission_number} • Grade {s.grade_level} {s.stream ? `(${s.stream})` : ''}</Text>
          </View>
        ))}
      </ScrollView>

      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Enroll New Student</Text>
            <TextInput style={styles.input} placeholder="Full Name" value={form.full_name} onChangeText={t => setForm({...form, full_name: t})} />
            <TextInput style={styles.input} placeholder="Admission Number" value={form.admission_number} onChangeText={t => setForm({...form, admission_number: t})} />
            <TextInput style={styles.input} placeholder="Grade Level (e.g., Grade 8)" value={form.grade_level} onChangeText={t => setForm({...form, grade_level: t})} />
            <TextInput style={styles.input} placeholder="Stream (e.g., A, B)" value={form.stream} onChangeText={t => setForm({...form, stream: t})} />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowModal(false)}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleEnroll}><Text style={styles.saveText}>Enroll</Text></TouchableOpacity>
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
  cardMeta: { color: '#64748b', fontSize: 12, marginTop: 4 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 10, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20 },
  modal: { backgroundColor: '#1e293b', borderRadius: 16, padding: 20 },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 16 },
  input: { backgroundColor: '#0f172a', borderRadius: 10, padding: 14, color: '#fff', borderWidth: 1, borderColor: '#334155', marginBottom: 12 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 10, backgroundColor: '#334155', alignItems: 'center' },
  cancelText: { color: '#fff', fontWeight: '600' },
  saveBtn: { flex: 1, padding: 14, borderRadius: 10, backgroundColor: '#10b981', alignItems: 'center' },
  saveText: { color: '#fff', fontWeight: '700' },
});
