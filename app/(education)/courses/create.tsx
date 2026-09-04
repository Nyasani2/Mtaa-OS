// @ts-nocheck
import React, { useState } from 'react';
import { Alert, View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Platform, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

export default function CreateCourseScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    subject: '',
    grade_level: '',
    language: 'English',
    is_paid: false,
    price: '',
    duration_hours: '',
    max_students: '',
    start_date: '',
    end_date: '',
    syllabus: '',
    requirements: '',
    tags: '',
  });

  const subjects = ['Mathematics', 'Science', 'English', 'Kiswahili', 'History', 'Geography', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'Business', 'Agriculture', 'Religion', 'Music', 'Art'];
  const grades = ['Pre-Primary', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12', 'University', 'Adult Learning'];

  const handleChange = (field: string, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!user?.id) { Alert.alert('Error', 'Please sign in'); return; }
    if (!form.title.trim()) { Alert.alert('Missing', 'Course title is required'); return; }
    if (!form.subject) { Alert.alert('Missing', 'Subject is required'); return; }
    if (!form.grade_level) { Alert.alert('Missing', 'Grade level is required'); return; }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('education_courses')
        .insert({
          title: form.title.trim(),
          description: form.description.trim() || null,
          subject: form.subject,
          grade_level: form.grade_level,
          language: form.language,
          is_paid: form.is_paid,
          price: form.is_paid ? parseFloat(form.price) || 0 : 0,
          duration_hours: parseFloat(form.duration_hours) || null,
          max_students: parseInt(form.max_students) || null,
          start_date: form.start_date || null,
          end_date: form.end_date || null,
          syllabus: form.syllabus.trim() || null,
          requirements: form.requirements.trim() || null,
          tags: form.tags ? form.tags.split(',').map((t: any) => t.trim()).filter(Boolean) : [],
          teacher_id: user.id,
          creator_id: user.id,
          status: 'draft',
          enrolled_count: 0,
          created_at: new Date().toISOString(),
        })
        .select()
        .maybeSingle();

      if (error) throw error;

      Alert.alert('Success', 'Course created successfully!');
      router.push(`/(education as any)/courses/${data.id}` as any);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Course</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Basic Information</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Course Title <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Advanced Calculus for Grade 12"
            placeholderTextColor="#666"
            value={form.title}
            onChangeText={(v) => handleChange('title', v)}
            maxLength={200}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="Describe what students will learn..."
            placeholderTextColor="#666"
            value={form.description}
            onChangeText={(v) => handleChange('description', v)}
            multiline
            numberOfLines={4}
            maxLength={2000}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Subject <Text style={styles.required}>*</Text></Text>
          <View style={styles.chipContainer}>
            {subjects.map((s: any) => (
              <TouchableOpacity
                key={s}
                style={[styles.chip, form.subject === s && styles.chipActive]}
                onPress={() => handleChange('subject', s)}
              >
                <Text style={[styles.chipText, form.subject === s && styles.chipTextActive]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Grade Level <Text style={styles.required}>*</Text></Text>
          <View style={styles.chipContainer}>
            {grades.map((g: any) => (
              <TouchableOpacity
                key={g}
                style={[styles.chip, form.grade_level === g && styles.chipActive]}
                onPress={() => handleChange('grade_level', g)}
              >
                <Text style={[styles.chipText, form.grade_level === g && styles.chipTextActive]}>{g}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Text style={styles.sectionTitle}>Pricing & Access</Text>

        <View style={styles.row}>
          <Text style={styles.label}>Paid Course</Text>
          <Switch
            value={form.is_paid}
            onValueChange={(v) => handleChange('is_paid', v)}
            trackColor={{ false: '#333', true: '#00d4ff' }}
            thumbColor={form.is_paid ? '#fff' : '#888'}
          />
        </View>

        {form.is_paid && (
          <View style={styles.field}>
            <Text style={styles.label}>Price (KES)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 500"
              placeholderTextColor="#666"
              value={form.price}
              onChangeText={(v) => handleChange('price', v)}
              keyboardType="numeric"
            />
          </View>
        )}

        <Text style={styles.sectionTitle}>Course Details</Text>

        <View style={styles.rowFields}>
          <View style={[styles.field, { flex: 1 }]}>
            <Text style={styles.label}>Duration (hours)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 20"
              placeholderTextColor="#666"
              value={form.duration_hours}
              onChangeText={(v) => handleChange('duration_hours', v)}
              keyboardType="numeric"
            />
          </View>
          <View style={[styles.field, { flex: 1 }]}>
            <Text style={styles.label}>Max Students</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 50"
              placeholderTextColor="#666"
              value={form.max_students}
              onChangeText={(v) => handleChange('max_students', v)}
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.rowFields}>
          <View style={[styles.field, { flex: 1 }]}>
            <Text style={styles.label}>Start Date</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#666"
              value={form.start_date}
              onChangeText={(v) => handleChange('start_date', v)}
            />
          </View>
          <View style={[styles.field, { flex: 1 }]}>
            <Text style={styles.label}>End Date</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#666"
              value={form.end_date}
              onChangeText={(v) => handleChange('end_date', v)}
            />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Syllabus Overview</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="List topics, modules, or learning outcomes..."
            placeholderTextColor="#666"
            value={form.syllabus}
            onChangeText={(v) => handleChange('syllabus', v)}
            multiline
            numberOfLines={5}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Requirements</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="Prerequisites, materials needed..."
            placeholderTextColor="#666"
            value={form.requirements}
            onChangeText={(v) => handleChange('requirements', v)}
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Tags (comma separated)</Text>
          <TextInput
            style={styles.input}
            placeholder="math, calculus, grade12, kcse..."
            placeholderTextColor="#666"
            value={form.tags}
            onChangeText={(v) => handleChange('tags', v)}
          />
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#000" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color="#000" />
              <Text style={styles.submitBtnText}>Create Course</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  form: { padding: 16 },
  sectionTitle: { color: '#00d4ff', fontSize: 14, fontWeight: '700', marginTop: 20, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
  field: { marginBottom: 16 },
  label: { color: '#fff', fontSize: 14, fontWeight: '600', marginBottom: 8 },
  required: { color: '#ff4444' },
  input: {
    backgroundColor: '#111',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#fff',
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#1a1a1a',
  },
  textarea: {
    height: 120,
    textAlignVertical: 'top',
    paddingTop: 14,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#1a1a1a',
  },
  chipActive: {
    backgroundColor: '#00d4ff15',
    borderColor: '#00d4ff',
  },
  chipText: {
    color: '#888',
    fontSize: 12,
  },
  chipTextActive: {
    color: '#00d4ff',
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  rowFields: {
    flexDirection: 'row',
    gap: 12,
  },
  submitBtn: {
    backgroundColor: '#00d4ff',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 24,
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitBtnText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },
});