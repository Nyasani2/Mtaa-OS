// @ts-nocheck
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth/store/auth.store';

const WARDS = ['General', 'Maternity', 'Pediatrics', 'ICU', 'HDU', 'Surgical', 'Isolation'];

export default function AdmitPatientScreen() {
  const router = useRouter();
  const { patientId, patientName } = useLocalSearchParams();
  const { user } = useAuthStore();
  
  const [loading, setLoading] = useState(false);
  const [ward, setWard] = useState('General');
  const [bedNumber, setBedNumber] = useState('');
  const [reason, setReason] = useState('');

  const submit = async () => {
    if (!patientId) { Alert.alert('Error', 'No patient selected.'); return; }
    if (!bedNumber.trim()) { Alert.alert('Validation', 'Bed number is required.'); return; }
    if (!reason.trim()) { Alert.alert('Validation', 'Reason for admission is required.'); return; }

    setLoading(true);
    try {
      const { error } = await supabase.from('health_admissions').insert({
        patient_id: patientId,
        facility_id: null, // Would come from context in production
        attending_doctor_id: user?.id,
        ward,
        bed_number: bedNumber.trim(),
        admission_reason: reason.trim(),
        status: 'admitted',
        admission_date: new Date().toISOString(),
      });

      if (error) throw error;

      Alert.alert('Success', 'Patient successfully admitted.', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (err) {
      Alert.alert('Error', err?.message || 'Failed to admit patient');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <Text style={s.title}>Admit Patient</Text>
      
      {patientName && (
        <View style={s.patientBanner}>
          <Ionicons name="bed-outline" size={24} color="#8b5cf6" />
          <Text style={s.patientName}>Admitting: {patientName}</Text>
        </View>
      )}

      <Text style={s.label}>Ward / Unit</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipRow}>
        {WARDS.map((w) => (
          <TouchableOpacity key={w} style={[s.chip, ward === w && s.chipActive]} onPress={() => setWard(w)}>
            <Text style={[s.chipText, ward === w && s.chipTextActive]}>{w}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={s.label}>Bed Number *</Text>
      <TextInput style={s.input} placeholder="e.g. ICU-04" value={bedNumber} onChangeText={setBedNumber} autoCapitalize="characters" />

      <Text style={s.label}>Reason for Admission *</Text>
      <TextInput 
        style={[s.input, s.textarea]} 
        multiline 
        numberOfLines={4} 
        placeholder="e.g. Severe pneumonia, requires oxygen support" 
        value={reason} 
        onChangeText={setReason} 
      />

      <View style={s.warningBox}>
        <Ionicons name="information-circle" size={20} color="#f59e0b" />
        <Text style={s.warningText}>Ensure the bed is clean and prepared before finalizing admission.</Text>
      </View>

      <TouchableOpacity style={s.submitBtn} onPress={submit} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <><Ionicons name="checkmark" size={20} color="#fff" /><Text style={s.submitText}>Confirm Admission</Text></>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, paddingTop: 48, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: '800', color: '#0f172a', marginBottom: 16 },
  patientBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#f5f3ff', padding: 14, borderRadius: 10, marginBottom: 20, borderWidth: 1, borderColor: '#e9d5ff' },
  patientName: { fontSize: 16, fontWeight: '700', color: '#6b21a8' },
  label: { fontSize: 14, fontWeight: '600', color: '#475569', marginBottom: 6, marginTop: 14 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12, fontSize: 15 },
  textarea: { minHeight: 100, textAlignVertical: 'top' },
  chipRow: { marginBottom: 4 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', marginRight: 8 },
  chipActive: { backgroundColor: '#8b5cf6', borderColor: '#8b5cf6' },
  chipText: { fontSize: 13, color: '#475569', fontWeight: '500' },
  chipTextActive: { color: '#fff', fontWeight: '700' },
  warningBox: { flexDirection: 'row', gap: 10, backgroundColor: '#fffbeb', padding: 12, borderRadius: 8, marginTop: 20, borderWidth: 1, borderColor: '#fde68a' },
  warningText: { flex: 1, fontSize: 13, color: '#92400e', lineHeight: 18 },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#8b5cf6', borderRadius: 10, padding: 16, marginTop: 30 },
  submitText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
