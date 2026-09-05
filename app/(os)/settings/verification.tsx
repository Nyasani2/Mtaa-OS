// @ts-nocheck
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth/store/auth.store';

const ID_TYPES = [
  { value: 'national_id', label: 'National ID', icon: 'card-outline' },
  { value: 'passport', label: 'Passport', icon: 'airplane-outline' },
  { value: 'drivers_license', label: "Driver's License", icon: 'car-outline' },
  { value: 'work_permit', label: 'Work Permit', icon: 'briefcase-outline' },
];

export default function VerificationScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [idType, setIdType] = useState('national_id');
  const [idNumber, setIdNumber] = useState('');
  const [step, setStep] = useState(1);

  const submit = async () => {
    if (!idNumber.trim()) {
      Alert.alert('Validation', 'ID number is required');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('identity_verification_requests').insert({
        user_id: user?.id,
        id_type: idType,
        id_number: idNumber.trim(),
        status: 'pending',
      });

      if (error) throw error;

      Alert.alert('Success', 'Verification request submitted. You will be notified once reviewed.', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (err) {
      Alert.alert('Error', err?.message || 'Failed to submit verification');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <Text style={s.title}>Identity Verification</Text>
      <Text style={s.subtitle}>Verify your identity to unlock full MTAA features</Text>

      <View style={s.stepper}>
        {[1, 2].map((n) => (
          <View key={n} style={[s.stepDot, step >= n && s.stepDotActive]} />
        ))}
      </View>

      {step === 1 && (
        <>
          <Text style={s.label}>Select ID Type</Text>
          <View style={s.idTypeGrid}>
            {ID_TYPES.map((type) => (
              <TouchableOpacity
                key={type.value}
                style={[s.idTypeCard, idType === type.value && s.idTypeCardActive]}
                onPress={() => setIdType(type.value)}
              >
                <Ionicons name={type.icon as any} size={32} color={idType === type.value ? '#fff' : '#0ea5e9'} />
                <Text style={[s.idTypeLabel, idType === type.value && s.idTypeLabelActive]}>{type.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={s.label}>ID Number</Text>
          <TextInput
            style={s.input}
            placeholder="e.g. 12345678"
            value={idNumber}
            onChangeText={setIdNumber}
            autoCapitalize="characters"
          />

          <TouchableOpacity style={s.nextBtn} onPress={() => setStep(2)}>
            <Text style={s.nextText}>Continue</Text>
          </TouchableOpacity>
        </>
      )}

      {step === 2 && (
        <>
          <Text style={s.sectionTitle}>Document Upload</Text>
          <Text style={s.hint}>In a production environment, you would upload photos of your ID here.</Text>

          <TouchableOpacity style={s.uploadBtn}>
            <Ionicons name="camera-outline" size={32} color="#0ea5e9" />
            <Text style={s.uploadText}>Front of ID</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.uploadBtn}>
            <Ionicons name="camera-outline" size={32} color="#0ea5e9" />
            <Text style={s.uploadText}>Back of ID</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.uploadBtn}>
            <Ionicons name="person-outline" size={32} color="#0ea5e9" />
            <Text style={s.uploadText}>Selfie with ID</Text>
          </TouchableOpacity>

          <View style={s.navRow}>
            <TouchableOpacity style={s.backBtn} onPress={() => setStep(1)}>
              <Text style={s.backText}>Back</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.submitBtn} onPress={submit} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.submitText}>Submit</Text>}
            </TouchableOpacity>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, paddingTop: 48, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: '800', color: '#0f172a' },
  subtitle: { fontSize: 14, color: '#64748b', marginBottom: 20 },
  stepper: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  stepDot: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#e2e8f0' },
  stepDotActive: { backgroundColor: '#0ea5e9' },
  label: { fontSize: 14, fontWeight: '600', color: '#475569', marginBottom: 10, marginTop: 16 },
  idTypeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  idTypeCard: { width: '47%', backgroundColor: '#fff', borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 2, borderColor: '#e2e8f0' },
  idTypeCardActive: { backgroundColor: '#0ea5e9', borderColor: '#0ea5e9' },
  idTypeLabel: { fontSize: 13, fontWeight: '600', color: '#475569', marginTop: 8, textAlign: 'center' },
  idTypeLabelActive: { color: '#fff' },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 14, fontSize: 16 },
  nextBtn: { backgroundColor: '#0ea5e9', borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 30 },
  nextText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a', marginBottom: 8 },
  hint: { fontSize: 13, color: '#64748b', marginBottom: 16, fontStyle: 'italic' },
  uploadBtn: { backgroundColor: '#fff', borderRadius: 12, padding: 20, alignItems: 'center', marginBottom: 12, borderWidth: 2, borderColor: '#e2e8f0', borderStyle: 'dashed' },
  uploadText: { fontSize: 14, color: '#64748b', marginTop: 8 },
  navRow: { flexDirection: 'row', gap: 12, marginTop: 30 },
  backBtn: { flex: 1, padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center' },
  backText: { color: '#64748b', fontWeight: '600' },
  submitBtn: { flex: 2, padding: 14, borderRadius: 10, backgroundColor: '#0ea5e9', alignItems: 'center' },
  submitText: { color: '#fff', fontWeight: '700' },
});
