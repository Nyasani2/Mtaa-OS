import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { addTeacher } from '@/lib/services/education-service';

export default function InviteTeacherScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', subject: '', qualification: '', experience_years: '', institution_id: '' });

  const handleSubmit = async () => {
    if (!form.full_name || !form.email || !form.subject) { Alert.alert('Error', 'Please fill required fields'); return; }
    try {
      setLoading(true);
      await addTeacher({ ...form, experience_years: parseInt(form.experience_years) || 0, user_id: user?.id, status: 'pending' });
      Alert.alert('Success', 'Teacher invitation sent!'); router.back();
    } catch (e: any) { Alert.alert('Error', e.message); }
    finally { setLoading(false); }
  };

  const Input = ({ label, value, onChangeText, placeholder, required = false }: any) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label} {required && <Text style={{ color: '#ef4444' }}>*</Text>}</Text>
      <TextInput style={styles.input} value={value} onChangeText={onChangeText} placeholder={placeholder} />
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Invite Teacher</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView style={styles.content}>
        <Input label="Full Name" value={form.full_name} onChangeText={(t: string) => setForm({ ...form, full_name: t })} placeholder="e.g. John Doe" required />
        <Input label="Email" value={form.email} onChangeText={(t: string) => setForm({ ...form, email: t })} placeholder="teacher@school.com" required />
        <Input label="Phone" value={form.phone} onChangeText={(t: string) => setForm({ ...form, phone: t })} placeholder="+254 7XX XXX XXX" />
        <Input label="Subject" value={form.subject} onChangeText={(t: string) => setForm({ ...form, subject: t })} placeholder="e.g. Mathematics" required />
        <Input label="Qualification" value={form.qualification} onChangeText={(t: string) => setForm({ ...form, qualification: t })} placeholder="e.g. B.Ed, M.Sc" />
        <Input label="Experience (years)" value={form.experience_years} onChangeText={(t: string) => setForm({ ...form, experience_years: t })} placeholder="5" />
        <Input label="School ID" value={form.institution_id} onChangeText={(t: string) => setForm({ ...form, institution_id: t })} placeholder="School UUID" />
        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Send Invitation</Text>}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#1e3a5f', paddingTop: 50, paddingHorizontal: 16, paddingBottom: 16 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  content: { padding: 16 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#334155', marginBottom: 6 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, padding: 12, fontSize: 14, color: '#1e293b' },
  submitBtn: { backgroundColor: '#3b82f6', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8, marginBottom: 40 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
