// @ts-nocheck
import React, { useState } from 'react';
import { Alert, View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Switch, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { Ionicons } from '@expo/vector-icons';

const FACILITY_TYPES = [
  { value: 'pharmacy', label: 'Pharmacy', level: 1 },
  { value: 'clinic', label: 'Clinic', level: 2 },
  { value: 'laboratory', label: 'Laboratory', level: 3 },
  { value: 'diagnostic_center', label: 'Diagnostic Center', level: 3 },
  { value: 'maternity', label: 'Maternity Home', level: 3 },
  { value: 'dental', label: 'Dental Clinic', level: 2 },
  { value: 'optical', label: 'Optical Center', level: 2 },
  { value: 'physiotherapy', label: 'Physiotherapy Center', level: 2 },
  { value: 'specialist_center', label: 'Specialist Center', level: 4 },
  { value: 'hospital', label: 'Hospital', level: 5 },
  { value: 'ambulance_service', label: 'Ambulance Service', level: 1 },
];

const OWNERSHIP_TYPES = [
  { value: 'private', label: 'Private' },
  { value: 'public', label: 'Public / Government' },
  { value: 'faith_based', label: 'Faith-Based' },
  { value: 'ngo', label: 'NGO / Non-Profit' },
  { value: 'community', label: 'Community' },
  { value: 'parastatal', label: 'Parastatal' },
];

const SPECIALTIES = [
  'General Medicine', 'Pediatrics', 'Cardiology', 'Orthopedics',
  'Obstetrics', 'Dermatology', 'Psychiatry', 'Oncology',
  'Neurology', 'Radiology', 'Pathology', 'Anesthesiology',
  'Emergency Medicine', 'Surgery', 'Dental', 'Optical',
  'Physiotherapy', 'Laboratory', 'Pharmacy', 'Maternity'
];

export default function FacilityRegistrationScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  const [form, setForm] = useState({
    name: '', type: 'pharmacy', ownership: 'private', level: 1,
    country: 'Kenya', county: '', town: '', address: '',
    phone: '', email: '', bed_capacity: '0',
    has_emergency: false, is_24hr: false, has_ambulance: false,
    has_icu: false, has_maternity: false, has_dialysis: false, has_radiology: false,
    selectedSpecialties: [] as string[],
    founder_name: '', founder_id_number: '', founder_phone: '', founder_email: '',
    license_number: '', license_body: '',
  });

  const updateForm = (key: string, value: any) => setForm(prev => ({ ...prev, [key]: value }));

  const toggleSpecialty = (spec: string) => {
    setForm(prev => ({
      ...prev,
      selectedSpecialties: prev.selectedSpecialties.includes(spec)
        ? prev.selectedSpecialties.filter(s => s !== spec)
        : [...prev.selectedSpecialties, spec]
    }));
  };

  const handleSubmit = async () => {
    if (!form.name || !form.phone || !form.founder_name) {
      Alert.alert('Missing Information', 'Please fill in all required fields.');
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.from('health_facilities').insert({
        name: form.name, type: form.type, ownership: form.ownership, level: form.level,
        country: form.country, county: form.county, town: form.town, address: form.address,
        phone: form.phone, email: form.email, bed_capacity: parseInt(form.bed_capacity || '0'),
        has_emergency: form.has_emergency, is_24hr: form.is_24hr, has_ambulance: form.has_ambulance,
        has_icu: form.has_icu, has_maternity: form.has_maternity, has_dialysis: form.has_dialysis,
        has_radiology: form.has_radiology, specialties: form.selectedSpecialties,
        founder_name: form.founder_name, founder_id_number: form.founder_id_number,
        license_number: form.license_number, license_body: form.license_body,
        status: 'UNDER_REVIEW', created_by: user?.id || null
      }).select().single();

      if (error) throw error;

      if (data && user?.id) {
        await supabase.from('health_facility_staff').insert({
          user_id: user.id, facility_id: data.id, role: 'ADMIN', status: 'ACTIVE'
        });
      }

      Alert.alert('Registration Submitted', 'Your facility has been registered and is now UNDER_REVIEW. You will be notified once verified.');
      router.replace('/(os)/health');
    } catch (e: any) {
      Alert.alert('Registration Failed', e.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Step 1: Facility Information</Text>
      <Text style={styles.label}>Facility Name *</Text>
      <TextInput style={styles.input} value={form.name} onChangeText={v => updateForm('name', v)} placeholder="e.g., Haltons Pharmacy" />
      
      <Text style={styles.label}>Facility Type *</Text>
      <View style={styles.optionsGrid}>
        {FACILITY_TYPES.map((type: any) => (
          <TouchableOpacity key={type.value} style={[styles.optionChip, form.type === type.value && styles.optionChipActive]} onPress={() => updateForm('type', type.value)}>
            <Text style={[styles.optionChipText, form.type === type.value && styles.optionChipTextActive]}>{type.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Ownership *</Text>
      <View style={styles.optionsGrid}>
        {OWNERSHIP_TYPES.map((type: any) => (
          <TouchableOpacity key={type.value} style={[styles.optionChip, form.ownership === type.value && styles.optionChipActive]} onPress={() => updateForm('ownership', type.value)}>
            <Text style={[styles.optionChipText, form.ownership === type.value && styles.optionChipTextActive]}>{type.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Bed Capacity</Text>
      <TextInput style={styles.input} value={form.bed_capacity} onChangeText={v => updateForm('bed_capacity', v)} keyboardType="numeric" placeholder="0" />

      <Text style={styles.label}>Phone *</Text>
      <TextInput style={styles.input} value={form.phone} onChangeText={v => updateForm('phone', v)} keyboardType="phone-pad" placeholder="+254 7XX XXX XXX" />

      <TouchableOpacity style={styles.nextButton} onPress={() => setStep(2)}>
        <Text style={styles.nextButtonText}>Next: Location & Services</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Step 2: Location & Services</Text>
      <Text style={styles.label}>County / Region</Text>
      <TextInput style={styles.input} value={form.county} onChangeText={v => updateForm('county', v)} placeholder="e.g., Nairobi" />
      
      <Text style={styles.label}>Town / City</Text>
      <TextInput style={styles.input} value={form.town} onChangeText={v => updateForm('town', v)} placeholder="e.g., Westlands" />

      <Text style={styles.label}>Services Available</Text>
      <View style={styles.switchesContainer}>
        {[
          { key: 'has_emergency', label: 'Emergency Services' },
          { key: 'is_24hr', label: 'Open 24 Hours' },
          { key: 'has_ambulance', label: 'Ambulance Service' },
          { key: 'has_icu', label: 'ICU Available' },
          { key: 'has_maternity', label: 'Maternity Services' },
          { key: 'has_radiology', label: 'Radiology / Imaging' },
        ].map((service: any) => (
          <View key={service.key} style={styles.switchRow}>
            <Text style={styles.switchLabel}>{service.label}</Text>
            <Switch value={form[service.key as keyof typeof form] as boolean} onValueChange={v => updateForm(service.key, v)} />
          </View>
        ))}
      </View>

      <Text style={styles.label}>Specialties Offered</Text>
      <View style={styles.optionsGrid}>
        {SPECIALTIES.map((spec: any) => (
          <TouchableOpacity key={spec} style={[styles.optionChip, form.selectedSpecialties.includes(spec) && styles.optionChipActive]} onPress={() => toggleSpecialty(spec)}>
            <Text style={[styles.optionChipText, form.selectedSpecialties.includes(spec) && styles.optionChipTextActive]}>{spec}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => setStep(1)}><Text style={styles.backButtonText}>Back</Text></TouchableOpacity>
        <TouchableOpacity style={styles.nextButton} onPress={() => setStep(3)}><Text style={styles.nextButtonText}>Next: Founder Info</Text></TouchableOpacity>
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Step 3: Founder / Primary Contact</Text>
      <Text style={styles.label}>Full Name *</Text>
      <TextInput style={styles.input} value={form.founder_name} onChangeText={v => updateForm('founder_name', v)} />
      
      <Text style={styles.label}>ID Number</Text>
      <TextInput style={styles.input} value={form.founder_id_number} onChangeText={v => updateForm('founder_id_number', v)} />

      <Text style={styles.label}>License Number</Text>
      <TextInput style={styles.input} value={form.license_number} onChangeText={v => updateForm('license_number', v)} />

      <Text style={styles.label}>Issuing Body</Text>
      <TextInput style={styles.input} value={form.license_body} onChangeText={v => updateForm('license_body', v)} placeholder="e.g. Ministry of Health" />

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => setStep(2)}><Text style={styles.backButtonText}>Back</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.submitButton, loading && styles.submitButtonDisabled]} onPress={handleSubmit} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>Submit Registration</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Register Your Facility</Text>
          <Text style={styles.headerSubtitle}>Any pharmacy, clinic, lab, or hospital across Africa</Text>
        </View>
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { padding: 20, backgroundColor: '#0A7B5A', paddingTop: 60 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  headerSubtitle: { fontSize: 14, color: '#E0F2E9', marginTop: 4 },
  stepContainer: { padding: 20 },
  stepTitle: { fontSize: 18, fontWeight: '600', marginBottom: 16, color: '#1a1a1a' },
  label: { fontSize: 14, fontWeight: '500', marginBottom: 6, marginTop: 12, color: '#333' },
  input: { backgroundColor: '#fff', borderRadius: 8, padding: 12, fontSize: 15, borderWidth: 1, borderColor: '#ddd' },
  optionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  optionChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd' },
  optionChipActive: { backgroundColor: '#0A7B5A', borderColor: '#0A7B5A' },
  optionChipText: { fontSize: 13, color: '#333' },
  optionChipTextActive: { color: '#fff', fontWeight: '500' },
  switchesContainer: { marginTop: 8 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
  switchLabel: { fontSize: 15, color: '#333' },
  buttonRow: { flexDirection: 'row', gap: 12, marginTop: 24 },
  nextButton: { backgroundColor: '#0A7B5A', padding: 14, borderRadius: 8, alignItems: 'center', flex: 1 },
  nextButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  backButton: { backgroundColor: '#fff', padding: 14, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#ddd', flex: 1 },
  backButtonText: { color: '#333', fontSize: 16, fontWeight: '600' },
  submitButton: { backgroundColor: '#0A7B5A', padding: 14, borderRadius: 8, alignItems: 'center', flex: 2 },
  submitButtonDisabled: { opacity: 0.6 },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
