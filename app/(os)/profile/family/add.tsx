import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

export default function AddChildScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [childName, setChildName] = useState('');
  const [school, setSchool] = useState('');
  const [grade, setGrade] = useState('');
  const [allowance, setAllowance] = useState('');
  const [transportAllowed, setTransportAllowed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!childName.trim()) {
      Alert.alert('Error', 'Child name is required');
      return;
    }
    if (!user?.id) {
      Alert.alert('Error', 'You must be signed in');
      return;
    }

    setLoading(true);
    const { error } = await supabase.from('family_profiles').insert({
      parent_id: user.id,
      child_name: childName.trim(),
      school: school.trim() || null,
      grade: grade.trim() || null,
      allowance_balance: parseFloat(allowance) || 0,
      transport_allowed: transportAllowed,
    });
    setLoading(false);

    if (error) {
      Alert.alert('Error', error.message);
      return;
    }

    Alert.alert('Success', `${childName} has been added to your family profile.`, [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Child</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
        <Text style={styles.label}>Child Name *</Text>
        <TextInput style={styles.input} placeholder="Enter child's full name" placeholderTextColor="#666" value={childName} onChangeText={setChildName} />

        <Text style={styles.label}>School</Text>
        <TextInput style={styles.input} placeholder="School name" placeholderTextColor="#666" value={school} onChangeText={setSchool} />

        <Text style={styles.label}>Grade / Class</Text>
        <TextInput style={styles.input} placeholder="e.g., Grade 5, Form 2" placeholderTextColor="#666" value={grade} onChangeText={setGrade} />

        <Text style={styles.label}>Weekly Allowance (KSh)</Text>
        <TextInput style={styles.input} placeholder="0" placeholderTextColor="#666" keyboardType="numeric" value={allowance} onChangeText={setAllowance} />

        <TouchableOpacity style={styles.toggleRow} onPress={() => setTransportAllowed(!transportAllowed)}>
          <Ionicons name={transportAllowed ? 'checkbox' : 'square-outline'} size={24} color="#00d4ff" />
          <Text style={styles.toggleText}>Allow transport services (MTaxi/Boda)</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.saveBtn, loading && { opacity: 0.6 }]} onPress={handleSave} disabled={loading}>
          <Text style={styles.saveText}>{loading ? 'Saving...' : 'Save Child'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  form: { padding: 16 },
  label: { color: '#fff', fontSize: 14, fontWeight: '600', marginTop: 16, marginBottom: 8 },
  input: { backgroundColor: '#111', color: '#fff', padding: 14, borderRadius: 12, fontSize: 16, borderWidth: 1, borderColor: '#222' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', marginTop: 24, gap: 12 },
  toggleText: { color: '#fff', fontSize: 14 },
  saveBtn: { backgroundColor: '#00d4ff', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 32 },
  saveText: { color: '#000', fontSize: 16, fontWeight: '700' },
});
