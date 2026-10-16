import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

export default function TakeQuizScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user } = useAuthStore();
  const [quiz, setQuiz] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const { data: q } = await supabase.from('education_tests').select('*').eq('id', id).single();
        setQuiz(q);
        const { data: qs } = await supabase.from('education_test_questions').select('*').eq('test_id', id).order('order_index');
        setQuestions(qs || []);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, [id]);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const { data: attempt } = await supabase.from('education_test_attempts').insert({
        test_id: id, student_id: user?.id, status: 'submitted', submitted_at: new Date().toISOString()
      }).select().single();
      
      for (const q of questions) {
        await supabase.from('education_test_answers').insert({
          attempt_id: attempt.id, question_id: q.id, answer: answers[q.id] || null
        });
      }
      Alert.alert('Success', 'Quiz submitted for grading');
      router.back();
    } catch (e: any) { Alert.alert('Error', e.message); }
    finally { setSubmitting(false); }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#8b5cf6" /></View>;
  if (!quiz) return <View style={styles.center}><Text style={styles.empty}>Quiz not found</Text></View>;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.headerTitle}>{quiz.title}</Text>
        <View style={{ width: 24 }} />
      </View>
      <View style={styles.content}>
        {questions.map((q, i) => (
          <View key={q.id} style={styles.questionCard}>
            <Text style={styles.qNum}>Question {i + 1}</Text>
            <Text style={styles.qText}>{q.question_text}</Text>
            {q.options?.map((opt: any, idx: number) => (
              <TouchableOpacity key={idx} style={[styles.option, answers[q.id] === opt.id && styles.optionActive]} onPress={() => setAnswers({...answers, [q.id]: opt.id})}>
                <Text style={[styles.optionText, answers[q.id] === opt.id && styles.optionTextActive]}>{String.fromCharCode(65 + idx)}. {opt.text}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
        <TouchableOpacity style={[styles.submitBtn, submitting && styles.submitBtnDisabled]} onPress={handleSubmit} disabled={submitting}>
          {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Submit Quiz</Text>}
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
  questionCard: { backgroundColor: '#1e293b', borderRadius: 12, padding: 16, marginBottom: 16 },
  qNum: { color: '#8b5cf6', fontSize: 12, fontWeight: '700', marginBottom: 8 },
  qText: { color: '#fff', fontSize: 15, fontWeight: '600', marginBottom: 12 },
  option: { backgroundColor: '#0f172a', borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#334155' },
  optionActive: { backgroundColor: '#8b5cf620', borderColor: '#8b5cf6' },
  optionText: { color: '#94a3b8', fontSize: 14 },
  optionTextActive: { color: '#8b5cf6', fontWeight: '600' },
  submitBtn: { backgroundColor: '#8b5cf6', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 },
  submitBtnDisabled: { opacity: 0.6 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  empty: { color: '#64748b', fontSize: 16 },
});
