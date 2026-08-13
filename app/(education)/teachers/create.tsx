// @ts-nocheck

// app/(education)/teachers/create.tsx
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { addTeacher } from '@/lib/services/education-service';

export default function AddTeacherScreen() {
  const router = useRouter();
  const { schoolId } = useLocalSearchParams<{ schoolId: string }>();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    user_id: '',
    employee_number: '',
    subjects: '',
    specialization: '',
    years_experience: '0',
  });

  const handleAdd = async () => {
    if (!form.user_id.trim()) { Alert.alert('Error', 'Teacher user ID is required'); return; }
    if (!schoolId) { Alert.alert('Error', 'School ID missing'); return; }

    setLoading(true);
    try {
      await addTeacher({
        user_id: form.user_id,
        institution_id: schoolId,
        employee_number: form.employee_number || null,
        subjects: form.subjects.split(',').map((s: any) => s.trim()).filter(Boolean),
        specialization: form.specialization || null,
        years_experience: parseInt(form.years_experience) || 0,
      });
      Alert.alert('Success', 'Teacher added successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Teacher</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.subtitle}>Add a teacher to your school</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Teacher MTAA User ID *</Text>
          <TextInput
            style={styles.input}
            value={form.user_id}
            onChangeText={text => setForm(prev => ({ ...prev, user_id: text }))}
            placeholder="Enter teacher's MTAA user ID"
            placeholderTextColor="#666"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Employee Number</Text>
          <TextInput
            style={styles.input}
            value={form.employee_number}
            onChangeText={text => setForm(prev => ({ ...prev, employee_number: text }))}
            placeholder="e.g. EMP-2024-001"
            placeholderTextColor="#666"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Subjects (comma separated)</Text>
          <TextInput
            style={styles.input}
            value={form.subjects}
            onChangeText={text => setForm(prev => ({ ...prev, subjects: text }))}
            placeholder="e.g. Mathematics, Physics, Chemistry"
            placeholderTextColor="#666"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Specialization</Text>
          <TextInput
            style={styles.input}
            value={form.specialization}
            onChangeText={text => setForm(prev => ({ ...prev, specialization: text }))}
            placeholder="e.g. Pure Mathematics"
            placeholderTextColor="#666"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Years of Experience</Text>
          <TextInput
            style={styles.input}
            value={form.years_experience}
            onChangeText={text => setForm(prev => ({ ...prev, years_experience: text }))}
            placeholder="0"
            placeholderTextColor="#666"
            keyboardType="number-pad"
          />
        </View>

        <TouchableOpacity style={[styles.submitBtn, loading && styles.submitBtnDisabled]} onPress={handleAdd} disabled={loading}>
          <Text style={styles.submitBtnText}>{loading ? 'Adding...' : 'Add Teacher'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12 },
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '700' },
  content: { paddingHorizontal: 20, paddingTop: 8 },
  subtitle: { color: '#888', fontSize: 14, marginBottom: 24, lineHeight: 20 },
  inputGroup: { marginBottom: 18 },
  label: { color: '#fff', fontSize: 14, fontWeight: '600', marginBottom: 8 },
  input: { backgroundColor: '#1a1a1a', borderRadius: 12, borderWidth: 1, borderColor: '#333', color: '#fff', fontSize: 15, paddingHorizontal: 16, paddingVertical: 14 },
  submitBtn: { backgroundColor: '#00d4ff', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 16, marginBottom: 40 },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { color: '#000', fontSize: 16, fontWeight: '700' },
});
