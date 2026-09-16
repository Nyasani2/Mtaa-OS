// @ts-nocheck
import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export default function AddStaffScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [formData, setFormData] = useState({ full_name: '', email: '', role: 'doctor', department: '', phone: '' });

  const roles = ['doctor', 'nurse', 'lab_technician', 'pharmacist', 'receptionist', 'accountant', 'admin', 'housekeeping'];

  const handleAdd = async () => {
    if (!formData.full_name || !formData.email) { Alert.alert('Error', 'Name and email required'); return; }
    try {
      const { error } = await supabase.from('health_staff').insert({
        ...formData, user_id: null, facility_id: null, status: 'pending', created_at: new Date().toISOString()
      });
      if (error) throw error;
      Alert.alert('Success', 'Staff member added!');
      router.back();
    } catch (err) { Alert.alert('Error', err.message); }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.title}>Add Staff Member</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Full Name *</Text>
        <TextInput style={styles.input} placeholder="Dr. John Doe" value={formData.full_name} onChangeText={(t) => setFormData({...formData, full_name: t})} />

        <Text style={styles.label}>Email *</Text>
        <TextInput style={styles.input} placeholder="john@hospital.com" value={formData.email} onChangeText={(t) => setFormData({...formData, email: t})} keyboardType="email-address" />

        <Text style={styles.label}>Phone</Text>
        <TextInput style={styles.input} placeholder="+254 7XX XXX XXX" value={formData.phone} onChangeText={(t) => setFormData({...formData, phone: t})} keyboardType="phone-pad" />

        <Text style={styles.label}>Department</Text>
        <TextInput style={styles.input} placeholder="e.g., Cardiology" value={formData.department} onChangeText={(t) => setFormData({...formData, department: t})} />

        <Text style={styles.label}>Role *</Text>
        <View style={styles.roleGrid}>
          {roles.map((role) => (
            <TouchableOpacity key={role} style={[styles.roleCard, formData.role === role && styles.roleActive]} onPress={() => setFormData({...formData, role})}>
              <Text style={[styles.roleText, formData.role === role && styles.roleTextActive]}>{role.replace('_', ' ').toUpperCase()}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.submitBtn} onPress={handleAdd}>
          <Text style={styles.submitBtnText}>Add Staff Member</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 60, backgroundColor: '#3b82f6' },
  backBtn: { marginRight: 16 }, title: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  form: { padding: 20 },
  label: { fontSize: 14, color: '#94a3b8', marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: '#1e293b', padding: 16, borderRadius: 12, color: '#fff', fontSize: 16 },
  roleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  roleCard: { backgroundColor: '#1e293b', padding: 12, borderRadius: 8, minWidth: '45%' },
  roleActive: { backgroundColor: '#3b82f6' },
  roleText: { color: '#94a3b8', fontSize: 12, fontWeight: '600', textAlign: 'center' }, roleTextActive: { color: '#fff' },
  submitBtn: { backgroundColor: '#3b82f6', padding: 16, borderRadius: 12, marginTop: 24, alignItems: 'center' },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
