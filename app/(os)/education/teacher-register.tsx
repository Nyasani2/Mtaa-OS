// @ts-nocheck
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth/store/auth.store';

const SUBJECTS = ['Mathematics', 'English', 'Science', 'History', 'Geography', 'Kiswahili', 'Computer Science', 'Art', 'Music', 'Physical Education'];

export default function TeacherRegisterScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState('');
  const [qualifications, setQualifications] = useState('');
  const [experience, setExperience] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState([]);

  const toggleSubject = (subj) => {
    setSelectedSubjects((prev) =>
      prev.includes(subj) ? prev.filter((s) => s !== subj) : [...prev, subj]
    );
  };

  const submit = async () => {
    if (!fullName.trim()) { Alert.alert('Validation', 'Full name is required'); return; }
    if (!qualifications.trim()) { Alert.alert('Validation', 'Qualifications are required'); return; }
    if (selectedSubjects.length === 0) { Alert.alert('Validation', 'Select at least one subject'); return; }

    setLoading(true);
    try {
      const { error } = await supabase.from('education_teacher_applications').insert({
        user_id: user?.id,
        full_name: fullName.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,
        qualifications: qualifications.trim(),
        experience_years: parseInt(experience) || 0,
        subjects: selectedSubjects,
        status: 'pending',
      });

      if (error) throw error;

      Alert.alert('Success', 'Your application has been submitted for review.', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (err) {
      Alert.alert('Error', err?.message || 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <Text style={s.title}>Teacher Registration</Text>
      <Text style={s.subtitle}>Join MTAA Education as an instructor</Text>

      <Text style={s.label}>Full Name *</Text>
      <TextInput style={s.input} placeholder="Dr. Jane Doe" value={fullName} onChangeText={setFullName} />

      <Text style={s.label}>Email</Text>
      <TextInput style={s.input} placeholder="jane@school.ac.ke" value={email} onChangeText={setEmail} keyboardType="email-address" />

      <Text style={s.label}>Phone</Text>
      <TextInput style={s.input} placeholder="+254 700 000 000" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />

      <Text style={s.label}>Qualifications *</Text>
      <TextInput style={[s.input, s.textarea]} multiline numberOfLines={3} placeholder="B.Ed Mathematics, M.Sc Computer Science, TSC Registration #123456" value={qualifications} onChangeText={setQualifications} />

      <Text style={s.label}>Years of Experience</Text>
      <TextInput style={s.input} placeholder="5" value={experience} onChangeText={setExperience} keyboardType="numeric" />

      <Text style={s.label}>Subjects You Can Teach *</Text>
      <View style={s.subjectGrid}>
        {SUBJECTS.map((subj) => (
          <TouchableOpacity key={subj} style={[s.chip, selectedSubjects.includes(subj) && s.chipActive]} onPress={() => toggleSubject(subj)}>
            <Text style={[s.chipText, selectedSubjects.includes(subj) && s.chipTextActive]}>{subj}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={s.submitBtn} onPress={submit} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <><Ionicons name="send" size={18} color="#fff" /><Text style={s.submitText}>Submit Application</Text></>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, paddingTop: 48, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: '800', color: '#0f172a' },
  subtitle: { fontSize: 14, color: '#64748b', marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#475569', marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12, fontSize: 15 },
  textarea: { minHeight: 80, textAlignVertical: 'top' },
  subjectGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0' },
  chipActive: { backgroundColor: '#10b981', borderColor: '#10b981' },
  chipText: { fontSize: 13, color: '#475569' },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#10b981', borderRadius: 10, padding: 16, marginTop: 30 },
  submitText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
