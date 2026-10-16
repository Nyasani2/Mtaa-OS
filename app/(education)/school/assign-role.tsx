import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

const ROLES = [
  { key: 'teacher', label: 'Teacher', icon: 'people', color: '#3b82f6' },
  { key: 'student', label: 'Student', icon: 'school', color: '#10b981' },
  { key: 'parent', label: 'Parent', icon: 'heart', color: '#ec4899' },
  { key: 'staff', label: 'Staff', icon: 'briefcase', color: '#f59e0b' },
];

export default function AssignRoleScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [userId, setUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState('teacher');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAssign = async () => {
    if (!userId.trim() || !name.trim()) { Alert.alert('Error', 'User ID and Name are required'); return; }
    setLoading(true);
    try {
      const table = selectedRole === 'teacher' ? 'education_teachers' :
                    selectedRole === 'student' ? 'education_students' :
                    selectedRole === 'parent' ? 'education_parents' : 'education_staff';
      
      const payload: any = { user_id: userId.trim(), full_name: name.trim(), status: 'active' };
      if (selectedRole === 'student') payload.admission_number = `ADM-${Date.now().toString().slice(-6)}`;
      
      const { error } = await supabase.from(table).insert(payload);
      if (error) throw error;
      Alert.alert('Success', `${name} assigned as ${selectedRole}`);
      router.back();
    } catch (e: any) { Alert.alert('Error', e.message); }
    finally { setLoading(false); }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Assign Role</Text>
        <View style={{ width: 24 }} />
      </View>
      <View style={styles.form}>
        <Text style={styles.label}>Select Role</Text>
        <View style={styles.roleGrid}>
          {ROLES.map(r => (
            <TouchableOpacity key={r.key} style={[styles.roleCard, selectedRole === r.key && { borderColor: r.color, backgroundColor: r.color + '15' }]} onPress={() => setSelectedRole(r.key)}>
              <Ionicons name={r.icon as any} size={24} color={selectedRole === r.key ? r.color : '#64748b'} />
              <Text style={[styles.roleLabel, { color: selectedRole === r.key ? r.color : '#94a3b8' }]}>{r.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.label}>User ID (UUID) *</Text>
        <TextInput style={styles.input} placeholder="Enter user UUID" placeholderTextColor="#666" value={userId} onChangeText={setUserId} />
        <Text style={styles.label}>Full Name *</Text>
        <TextInput style={styles.input} placeholder="Enter full name" placeholderTextColor="#666" value={name} onChangeText={setName} />
        <TouchableOpacity style={[styles.submitBtn, loading && styles.submitBtnDisabled]} onPress={handleAssign} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Assign Role</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12, backgroundColor: '#1e293b' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  form: { padding: 16 },
  label: { color: '#94a3b8', fontSize: 12, fontWeight: '600', marginBottom: 8, marginTop: 16, textTransform: 'uppercase' },
  roleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  roleCard: { width: '22%', backgroundColor: '#1e293b', borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  roleLabel: { fontSize: 11, fontWeight: '600', marginTop: 6 },
  input: { backgroundColor: '#1e293b', borderRadius: 10, padding: 14, color: '#fff', fontSize: 15, borderWidth: 1, borderColor: '#334155' },
  submitBtn: { backgroundColor: '#6366f1', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 24 },
  submitBtnDisabled: { opacity: 0.6 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
