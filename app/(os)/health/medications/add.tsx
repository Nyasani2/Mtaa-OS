// @ts-nocheck
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth/store/auth.store';

const FREQUENCIES = ['Once daily', 'Twice daily', 'Three times daily', 'Every 4 hours', 'Every 6 hours', 'Every 8 hours', 'At bedtime', 'As needed (PRN)'];
const DURATIONS = ['3 days', '5 days', '7 days', '10 days', '14 days', '30 days', 'Ongoing'];

export default function AddMedicationScreen() {
  const router = useRouter();
  const { patientId, patientName } = useLocalSearchParams();
  const { user } = useAuthStore();
  
  const [loading, setLoading] = useState(false);
  const [medName, setMedName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('Once daily');
  const [duration, setDuration] = useState('7 days');
  const [instructions, setInstructions] = useState('');

  const submit = async () => {
    if (!medName.trim() || !dosage.trim()) {
      Alert.alert('Validation', 'Medication name and dosage are required.');
      return;
    }
    if (!patientId) {
      Alert.alert('Error', 'No patient selected for this prescription.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('health_prescriptions').insert({
        patient_id: patientId,
        doctor_id: user?.id,
        medication_name: medName.trim(),
        dosage: dosage.trim(),
        frequency,
        duration,
        instructions: instructions.trim() || null,
        status: 'active',
        prescribed_at: new Date().toISOString(),
      });

      if (error) throw error;

      Alert.alert('Success', 'Prescription added to patient record.', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (err) {
      Alert.alert('Error', err?.message || 'Failed to save prescription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <Text style={s.title}>New Prescription</Text>
      {patientName && (
        <View style={s.patientBanner}>
          <Ionicons name="person-circle" size={24} color="#0ea5e9" />
          <Text style={s.patientName}>For: {patientName}</Text>
        </View>
      )}

      <Text style={s.label}>Medication Name *</Text>
      <TextInput style={s.input} placeholder="e.g. Amoxicillin" value={medName} onChangeText={setMedName} />

      <Text style={s.label}>Dosage *</Text>
      <TextInput style={s.input} placeholder="e.g. 500mg" value={dosage} onChangeText={setDosage} />

      <Text style={s.label}>Frequency</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipRow}>
        {FREQUENCIES.map((f) => (
          <TouchableOpacity key={f} style={[s.chip, frequency === f && s.chipActive]} onPress={() => setFrequency(f)}>
            <Text style={[s.chipText, frequency === f && s.chipTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={s.label}>Duration</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipRow}>
        {DURATIONS.map((d) => (
          <TouchableOpacity key={d} style={[s.chip, duration === d && s.chipActive]} onPress={() => setDuration(d)}>
            <Text style={[s.chipText, duration === d && s.chipTextActive]}>{d}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={s.label}>Special Instructions</Text>
      <TextInput 
        style={[s.input, s.textarea]} 
        multiline 
        numberOfLines={3} 
        placeholder="e.g. Take after meals with a full glass of water" 
        value={instructions} 
        onChangeText={setInstructions} 
      />

      <TouchableOpacity style={s.submitBtn} onPress={submit} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.submitText}>Save Prescription</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, paddingTop: 48, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: '800', color: '#0f172a', marginBottom: 16 },
  patientBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#e0f2fe', padding: 12, borderRadius: 10, marginBottom: 16 },
  patientName: { fontSize: 16, fontWeight: '600', color: '#0369a1' },
  label: { fontSize: 14, fontWeight: '600', color: '#475569', marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12, fontSize: 15 },
  textarea: { minHeight: 80, textAlignVertical: 'top' },
  chipRow: { marginBottom: 8, marginTop: 4 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', marginRight: 8 },
  chipActive: { backgroundColor: '#0ea5e9', borderColor: '#0ea5e9' },
  chipText: { fontSize: 13, color: '#475569' },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  submitBtn: { backgroundColor: '#0ea5e9', borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 30 },
  submitText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
