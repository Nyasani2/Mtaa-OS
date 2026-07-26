import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  ActivityIndicator, Alert, Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

export default function CreateExamScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    subject: '',
    exam_type: 'mid_term',
    class_id: '',
    duration_minutes: '60',
    total_marks: '100',
    exam_date: '',
    instructions: '',
    is_published: false,
  });

  const examTypes = ['mid_term', 'end_term', 'cat', 'quiz', 'final', 'practical', 'oral'];

  const handleChange = (field: string, value: any) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async () => {
    if (!user?.id) { Alert.alert('Error', 'Please sign in'); return; }
    if (!form.title.trim()) { Alert.alert('Missing', 'Title is required'); return; }
    if (!form.subject) { Alert.alert('Missing', 'Subject is required'); return; }
    if (!form.exam_date) { Alert.alert('Missing', 'Exam date is required'); return; }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('education_exams')
        .insert({
          title: form.title.trim(),
          subject: form.subject,
          exam_type: form.exam_type,
          class_id: form.class_id || null,
          duration_minutes: parseInt(form.duration_minutes) || 60,
          total_marks: parseInt(form.total_marks) || 100,
          exam_date: form.exam_date,
          instructions: form.instructions.trim() || null,
          teacher_id: user.id,
          status: form.is_published ? 'published' : 'draft',
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      Alert.alert('Success', 'Exam created successfully');
      router.push(`/education/exams/${data.id}`);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Create Exam</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
        <View style={styles.field}>
          <Text style={styles.label}>Exam Title <Text style={styles.required}>*</Text></Text>
          <TextInput style={styles.input} placeholder="e.g., Mathematics Mid-Term Exam" placeholderTextColor="#666" value={form.title} onChangeText={(v) => handleChange('title', v)} />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Subject <Text style={styles.required}>*</Text></Text>
          <TextInput style={styles.input} placeholder="Subject" placeholderTextColor="#666" value={form.subject} onChangeText={(v) => handleChange('subject', v)} />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Exam Type</Text>
          <View style={styles.chipContainer}>
            {examTypes.map(t => (
              <TouchableOpacity key={t} style={[styles.chip, form.exam_type === t && styles.chipActive]} onPress={() => handleChange('exam_type', t)}>
                <Text style={[styles.chipText, form.exam_type === t && styles.chipTextActive]}>{t.replace('_', ' ')}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.rowFields}>
          <View style={[styles.field, { flex: 1 }]}>
            <Text style={styles.label}>Duration (min)</Text>
            <TextInput style={styles.input} placeholder="60" placeholderTextColor="#666" value={form.duration_minutes} onChangeText={(v) => handleChange('duration_minutes', v)} keyboardType="numeric" />
          </View>
          <View style={[styles.field, { flex: 1 }]}>
            <Text style={styles.label}>Total Marks</Text>
            <TextInput style={styles.input} placeholder="100" placeholderTextColor="#666" value={form.total_marks} onChangeText={(v) => handleChange('total_marks', v)} keyboardType="numeric" />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Exam Date <Text style={styles.required}>*</Text></Text>
          <TextInput style={styles.input} placeholder="YYYY-MM-DD" placeholderTextColor="#666" value={form.exam_date} onChangeText={(v) => handleChange('exam_date', v)} />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Instructions</Text>
          <TextInput style={[styles.input, styles.textarea]} placeholder="Exam instructions for students..." placeholderTextColor="#666" value={form.instructions} onChangeText={(v) => handleChange('instructions', v)} multiline numberOfLines={4} />
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Publish Immediately</Text>
          <Switch value={form.is_published} onValueChange={(v) => handleChange('is_published', v)} trackColor={{ false: '#333', true: '#00d4ff' }} thumbColor={form.is_published ? '#fff' : '#888'} />
        </View>

        <TouchableOpacity style={[styles.submitBtn, loading && styles.submitBtnDisabled]} onPress={handleSubmit} disabled={loading}>
          {loading ? <ActivityIndicator size="small" color="#000" /> : <><Ionicons name="school" size={20} color="#000" /><Text style={styles.submitBtnText}>Create Exam</Text></>}
        </TouchableOpacity>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  form: { padding: 16 },
  field: { marginBottom: 16 },
  label: { color: '#fff', fontSize: 14, fontWeight: '600', marginBottom: 8 },
  required: { color: '#ff4444' },
  input: { backgroundColor: '#111', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, color: '#fff', fontSize: 15, borderWidth: 1, borderColor: '#1a1a1a' },
  textarea: { height: 120, textAlignVertical: 'top', paddingTop: 14 },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#111', borderWidth: 1, borderColor: '#1a1a1a' },
  chipActive: { backgroundColor: '#00d4ff15', borderColor: '#00d4ff' },
  chipText: { color: '#888', fontSize: 12, textTransform: 'capitalize' },
  chipTextActive: { color: '#00d4ff', fontWeight: '600' },
  rowFields: { flexDirection: 'row', gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  submitBtn: { backgroundColor: '#00d4ff', borderRadius: 12, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 24 },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { color: '#000', fontSize: 16, fontWeight: '700' },
});
