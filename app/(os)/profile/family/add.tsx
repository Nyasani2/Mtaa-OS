import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';

const RELATIONSHIPS = ['Parent', 'Sibling', 'Child', 'Spouse', 'Grandparent', 'Grandchild', 'Cousin', 'Other'];

export default function AddFamilyMemberScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [loading, setLoading] = useState(false);

  const addMember = async () => {
    if (!name.trim() || !relationship) { Alert.alert('Error', 'Name and relationship are required'); return; }
    if (!user?.id) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('family_members').insert({
        user_id: user.id, name: name.trim(), relationship, email: email.trim() || null, phone: phone.trim() || null, date_of_birth: dob || null, is_primary: false,
      });
      if (error) throw error;
      router.back();
    } catch (err: any) { Alert.alert('Error', err.message || 'Failed to add member'); }
    finally { setLoading(false); }
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#f1f5f9" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Add Family Member</Text>
        <View style={{ width: 24 }} />
      </View>
      <View style={styles.form}>
        <Text style={styles.label}>Full Name *</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Enter full name" placeholderTextColor="#64748b" />
        <Text style={styles.label}>Relationship *</Text>
        <View style={styles.chipContainer}>
          {RELATIONSHIPS.map((rel) => (
            <TouchableOpacity key={rel} style={[styles.chip, relationship === rel && styles.chipActive]} onPress={() => setRelationship(rel)}>
              <Text style={[styles.chipText, relationship === rel && styles.chipTextActive]}>{rel}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.label}>Email</Text>
        <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="email@example.com" placeholderTextColor="#64748b" keyboardType="email-address" autoCapitalize="none" />
        <Text style={styles.label}>Phone</Text>
        <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="+254 7XX XXX XXX" placeholderTextColor="#64748b" keyboardType="phone-pad" />
        <Text style={styles.label}>Date of Birth</Text>
        <TextInput style={styles.input} value={dob} onChangeText={setDob} placeholder="YYYY-MM-DD" placeholderTextColor="#64748b" />
        <TouchableOpacity style={styles.submitBtn} onPress={addMember} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Add Member</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 50, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#f1f5f9' },
  form: { padding: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#94a3b8', marginTop: 16, marginBottom: 8 },
  input: { backgroundColor: '#1e293b', borderRadius: 8, padding: 14, color: '#f1f5f9', fontSize: 15, borderWidth: 1, borderColor: '#334155' },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: '#1e293b', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#334155', marginBottom: 8 },
  chipActive: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  chipText: { color: '#94a3b8', fontSize: 13 },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  submitBtn: { backgroundColor: '#3b82f6', borderRadius: 8, padding: 16, alignItems: 'center', marginTop: 32 },
  submitBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
