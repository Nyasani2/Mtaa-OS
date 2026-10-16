import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal, Alert, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';

export default function SubmissionsScreen() {
  const router = useRouter();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [gradingId, setGradingId] = useState<string | null>(null);
  const [gradeForm, setGradeForm] = useState({ score: '', feedback: '' });

  useEffect(() => { loadSubmissions(); }, []);

  const loadSubmissions = async () => {
    try {
      const { data } = await supabase
        .from('education_submissions')
        .select('*, assignment:education_assignments(title), student:education_students(full_name)')
        .eq('status', 'submitted')
        .order('submitted_at', { ascending: false });
      setSubmissions(data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleGrade = async () => {
    if (!gradeForm.score) { Alert.alert('Error', 'Score is required'); return; }
    try {
      await supabase.from('education_submissions').update({
        status: 'graded', score: parseFloat(gradeForm.score), feedback: gradeForm.feedback,
        graded_at: new Date().toISOString()
      }).eq('id', gradingId);
      Alert.alert('Success', 'Submission graded');
      setGradingId(null); setGradeForm({ score: '', feedback: '' });
      loadSubmissions();
    } catch (e: any) { Alert.alert('Error', e.message); }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Submissions</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {submissions.map((sub) => (
          <View key={sub.id} style={styles.card}>
            <Text style={styles.cardTitle}>{sub.assignment?.title}</Text>
            <Text style={styles.cardMeta}>Student: {sub.student?.full_name}</Text>
            <Text style={styles.cardMeta}>Submitted: {new Date(sub.submitted_at).toLocaleDateString()}</Text>
            {sub.content && <Text style={styles.cardContent}>Answer: {sub.content}</Text>}
            <TouchableOpacity style={styles.gradeBtn} onPress={() => setGradingId(sub.id)}>
              <Ionicons name="create" size={16} color="#fff" /><Text style={styles.gradeText}>Grade</Text>
            </TouchableOpacity>
          </View>
        ))}
        {submissions.length === 0 && <Text style={styles.emptyText}>No pending submissions</Text>}
      </ScrollView>

      <Modal visible={!!gradingId} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Grade Submission</Text>
            <TextInput style={styles.input} placeholder="Score (e.g., 85)" keyboardType="numeric" value={gradeForm.score} onChangeText={t => setGradeForm({...gradeForm, score: t})} />
            <TextInput style={styles.input} placeholder="Feedback (Optional)" value={gradeForm.feedback} onChangeText={t => setGradeForm({...gradeForm, feedback: t})} multiline />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setGradingId(null)}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleGrade}><Text style={styles.saveText}>Submit Grade</Text></TouchableOpacity>
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
  cardTitle: { color: '#fff', fontSize: 15, fontWeight: '700' },
  cardMeta: { color: '#64748b', fontSize: 12, marginTop: 4 },
  cardContent: { color: '#cbd5e1', fontSize: 13, marginTop: 8, fontStyle: 'italic' },
  gradeBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: '#8b5cf6', padding: 10, borderRadius: 8, marginTop: 12, gap: 6 },
  gradeText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  emptyText: { color: '#64748b', textAlign: 'center', marginTop: 40 },
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
