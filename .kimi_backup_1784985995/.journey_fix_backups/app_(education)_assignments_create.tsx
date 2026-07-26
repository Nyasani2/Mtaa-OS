import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  ActivityIndicator, Alert, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

export default function CreateAssignmentScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    subject: '',
    grade_level: '',
    due_date: '',
    max_score: '100',
    assignment_type: 'homework',
    instructions: '',
    attachments: '',
    allow_late_submission: false,
    late_penalty_percent: '0',
  });

  const assignmentTypes = ['homework', 'quiz', 'exam', 'project', 'essay', 'lab_report', 'presentation', 'reading'];
  const subjects = ['Mathematics', 'Science', 'English', 'Kiswahili', 'History', 'Geography', 'Physics', 'Chemistry', 'Biology', 'Computer Science'];
  const grades = ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];

  const handleChange = (field: string, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!user?.id) { Alert.alert('Error', 'Please sign in'); return; }
    if (!form.title.trim()) { Alert.alert('Missing', 'Title is required'); return; }
    if (!form.due_date) { Alert.alert('Missing', 'Due date is required'); return; }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('education_assignments')
        .insert({
          title: form.title.trim(),
          description: form.description.trim() || null,
          subject: form.subject || null,
          grade_level: form.grade_level || null,
          due_date: form.due_date,
          max_score: parseInt(form.max_score) || 100,
          assignment_type: form.assignment_type,
          instructions: form.instructions.trim() || null,
          attachments: form.attachments ? form.attachments.split(',').map(a => a.trim()).filter(Boolean) : [],
          allow_late_submission: form.allow_late_submission,
          late_penalty_percent: parseInt(form.late_penalty_percent) || 0,
          teacher_id: user.id,
          status: 'published',
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      Alert.alert('Success', 'Assignment created!');
      router.back();
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
        <Text style={styles.headerTitle}>Create Assignment</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
        <View style={styles.field}>
          <Text style={styles.label}>Title <Text style={styles.required}>*</Text></Text>
          <TextInput style={styles.input} placeholder="Assignment title" placeholderTextColor="#666" value={form.title} onChangeText={(v) => handleChange('title', v)} />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Description</Text>
          <TextInput style={[styles.input, styles.textarea]} placeholder="Describe the assignment..." placeholderTextColor="#666" value={form.description} onChangeText={(v) => handleChange('description', v)} multiline numberOfLines={3} />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Assignment Type</Text>
          <View style={styles.chipContainer}>
            {assignmentTypes.map(t => (
              <TouchableOpacity key={t} style={[styles.chip, form.assignment_type === t && styles.chipActive]} onPress={() => handleChange('assignment_type', t)}>
                <Text style={[styles.chipText, form.assignment_type === t && styles.chipTextActive]}>{t.replace('_', ' ')}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.rowFields}>
          <View style={[styles.field, { flex: 1 }]}>
            <Text style={styles.label}>Subject</Text>
            <TextInput style={styles.input} placeholder="Subject" placeholderTextColor="#666" value={form.subject} onChangeText={(v) => handleChange('subject', v)} />
          </View>
          <View style={[styles.field, { flex: 1 }]}>
            <Text style={styles.label}>Grade</Text>
            <TextInput style={styles.input} placeholder="Grade level" placeholderTextColor="#666" value={form.grade_level} onChangeText={(v) => handleChange('grade_level', v)} />
          </View>
        </View>

        <View style={styles.rowFields}>
          <View style={[styles.field, { flex: 1 }]}>
            <Text style={styles.label}>Due Date <Text style={styles.required}>*</Text></Text>
            <TextInput style={styles.input} placeholder="YYYY-MM-DD" placeholderTextColor="#666" value={form.due_date} onChangeText={(v) => handleChange('due_date', v)} />
          </View>
          <View style={[styles.field, { flex: 1 }]}>
            <Text style={styles.label}>Max Score</Text>
            <TextInput style={styles.input} placeholder="100" placeholderTextColor="#666" value={form.max_score} onChangeText={(v) => handleChange('max_score', v)} keyboardType="numeric" />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Instructions</Text>
          <TextInput style={[styles.input, styles.textarea]} placeholder="Detailed instructions for students..." placeholderTextColor="#666" value={form.instructions} onChangeText={(v) => handleChange('instructions', v)} multiline numberOfLines={5} />
        </View>

        <TouchableOpacity style={[styles.submitBtn, loading && styles.submitBtnDisabled]} onPress={handleSubmit} disabled={loading}>
          {loading ? <ActivityIndicator size="small" color="#000" /> : <><Ionicons name="checkmark-circle" size={20} color="#000" /><Text style={styles.submitBtnText}>Create Assignment</Text></>}
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
  submitBtn: { backgroundColor: '#00d4ff', borderRadius: 12, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 24 },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { color: '#000', fontSize: 16, fontWeight: '700' },
});
