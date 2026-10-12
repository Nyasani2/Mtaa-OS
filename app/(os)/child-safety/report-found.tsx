// @ts-nocheck
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export default function ReportFoundChild() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ 
    child_name: '', 
    age: '', 
    location: '', 
    finder_phone: user?.phone || '' 
  });

  const handleSubmit = async () => {
    if (!form.child_name || !form.finder_phone) {
      Alert.alert('Missing Info', 'Child name and your contact phone are required.');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.from('missing_children_reports').insert({
        child_name: form.child_name,
        age: parseInt(form.age) || null,
        last_seen_location: form.location || 'Unknown',
        finder_user_id: user?.id,
        finder_contact_phone: form.finder_phone,
        status: 'found_safe'
      });

      if (error) throw error;
      Alert.alert(
        'Thank You!', 
        'Your report has been filed. The MTAA community and authorities have been alerted to help find the parents.', 
        [{ text: 'OK', onPress: () => router.replace('/(os)/child-safety') }]
      );
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to file report.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0F172A' }} edges={['top']}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 }}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700', marginLeft: 16 }}>Report Found Child</Text>
      </View>
      
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View style={{ backgroundColor: '#1E293B', padding: 16, borderRadius: 12, marginBottom: 20, borderLeftWidth: 4, borderLeftColor: '#F59E0B' }}>
          <Text style={{ color: '#F59E0B', fontSize: 14, fontWeight: '700', marginBottom: 4 }}>⚠️ Unregistered Child</Text>
          <Text style={{ color: '#94A3B8', fontSize: 13 }}>This child is not in the MTAA database. Your report will help alert the community and authorities to find their parents.</Text>
        </View>

        <Text style={styles.label}>Child's Name (or description) *</Text>
        <TextInput style={styles.input} value={form.child_name} onChangeText={v => setForm({...form, child_name: v})} placeholderTextColor="#64748B" />

        <Text style={styles.label}>Approximate Age</Text>
        <TextInput style={styles.input} value={form.age} onChangeText={v => setForm({...form, age: v})} keyboardType="numeric" placeholderTextColor="#64748B" />

        <Text style={styles.label}>Current Location</Text>
        <TextInput style={styles.input} value={form.location} onChangeText={v => setForm({...form, location: v})} placeholder="e.g., Near Westlands Mall" placeholderTextColor="#64748B" />

        <Text style={styles.label}>Your Contact Phone *</Text>
        <TextInput style={styles.input} value={form.finder_phone} onChangeText={v => setForm({...form, finder_phone: v})} keyboardType="phone-pad" placeholderTextColor="#64748B" />

        <TouchableOpacity onPress={handleSubmit} disabled={loading} style={{ backgroundColor: '#F59E0B', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10 }}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>🚨 File Found Child Report</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = { label: { color: '#94A3B8', fontSize: 12, marginBottom: 6, fontWeight: '600' }, input: { backgroundColor: '#1E293B', color: '#fff', padding: 14, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: '#334155' } };
