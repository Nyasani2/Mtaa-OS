import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, TextInput } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

export default function TakeExamScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user } = useAuthStore();
  const [exam, setExam] = useState<any>(null);
  const [answers, setAnswers] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await supabase.from('education_exams').select('*').eq('id', id).single();
        setExam(data);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, [id]);

  const handleSubmit = async () => {
    if (!answers.trim()) { Alert.alert('Error', 'Please provide your answers'); return; }
    setSubmitting(true);
    try {
      const { error } = await supabase.from('education_exam_submissions').insert({
        exam_id: id, student_id: user?.id, answers: answers.trim(), submitted_at: new Date().toISOString()
      });
      if (error) throw error;
      Alert.alert('Success', 'Exam submitted for grading');
      router.back();
    } catch (e: any) { Alert.alert('Error', e.message); }
    finally { setSubmitting(false); }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#ef4444" /></View>;
  if (!exam) return <View style={styles.center}><Text style={styles.empty}>Exam not found</Text></View>;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.headerTitle}>{exam.title}</Text>
        <View style={{ width: 24 }} />
      </View>
      <View style={styles.content}>
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Subject</Text>
          <Text style={styles.infoValue}>{exam.subject}</Text>
          <Text style={styles.infoLabel}>Duration</Text>
          <Text style={styles.infoValue}>{exam.duration_minutes} minutes</Text>
          <Text style={styles.infoLabel}>Total Marks</Text>
          <Text style={styles.infoValue}>{exam.total_marks}</Text>
        </View>
        {exam.instructions && (
          <View style={styles.instructionsCard}>
            <Text style={styles.instructionsTitle}>Instructions</Text>
            <Text style={styles.instructionsText}>{exam.instructions}</Text>
          </View>
        )}
        <Text style={styles.label}>Your Answers *</Text>
        <TextInput style={styles.textarea} placeholder="Type your answers here..." placeholderTextColor="#666" multiline numberOfLines={10} value={answers} onChangeText={setAnswers} />
        <TouchableOpacity style={[styles.submitBtn, submitting && styles.submitBtnDisabled]} onPress={handleSubmit} disabled={submitting}>
          {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Submit Exam</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12, backgroundColor: '#1e293b' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  content: { padding: 16 },
  infoCard: { backgroundColor: '#1e293b', borderRadius: 12, padding: 16, marginBottom: 16, flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  infoLabel: { color: '#94a3b8', fontSize: 11, textTransform: 'uppercase', width: '45%' },
  infoValue: { color: '#fff', fontSize: 14, fontWeight: '700', width: '45%', marginBottom: 8 },
  instructionsCard: { backgroundColor: '#451a03', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#f59e0b' },
  instructionsTitle: { color: '#fcd34d', fontSize: 13, fontWeight: '700', marginBottom: 6 },
  instructionsText: { color: '#fde68a', fontSize: 13, lineHeight: 18 },
  label: { color: '#94a3b8', fontSize: 12, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase' },
  textarea: { backgroundColor: '#1e293b', borderRadius: 12, padding: 14, color: '#fff', fontSize: 15, borderWidth: 1, borderColor: '#334155', minHeight: 200, textAlignVertical: 'top' },
  submitBtn: { backgroundColor: '#ef4444', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 20 },
  submitBtnDisabled: { opacity: 0.6 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  empty: { color: '#64748b', fontSize: 16 },
});
