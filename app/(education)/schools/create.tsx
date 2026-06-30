import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Alert, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEducation } from '@/lib/hooks/useEducation';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export default function CreateSchool() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { createInstitution } = useEducation();
  const [form, setForm] = useState({
    name: '',
    type: 'primary',
    address: '',
    city: '',
    country: 'Kenya',
    phone: '',
    email: '',
    website: '',
    description: '',
    is_public: true,
    registration_number: '',
    curriculum_type: 'CBC',
  });
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  const update = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const handleSubmit = async () => {
    if (!form.name || !form.address || !form.city) {
      Alert.alert('Required Fields', 'Please fill in school name, address, and city');
      return;
    }
    setLoading(true);
    try {
      const institution = await createInstitution({
        ...form,
        created_by: user?.id,
        status: 'active',
      });
      Alert.alert(
        'School Created!',
        `${form.name} has been registered. You can now add teachers and students.`,
        [{ text: 'Add Teachers', onPress: () => router.push(`/(education)/schools/${institution.id}/add-teacher`) },
         { text: 'Done', onPress: () => router.back() }]
      );
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create School</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Step Indicator */}
      <View style={styles.steps}>
        <StepDot active={step >= 1} label="Basic" />
        <StepLine active={step >= 2} />
        <StepDot active={step >= 2} label="Contact" />
        <StepLine active={step >= 3} />
        <StepDot active={step >= 3} label="Details" />
      </View>

      <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
        {step === 1 && (
          <>
            <Input label="School Name *" value={form.name} onChange={v => update('name', v)} placeholder="e.g. Greenfield Academy" />
            <Input label="Type" value={form.type} onChange={v => update('type', v)} picker options={['primary', 'secondary', 'university', 'vocational', 'special_needs']} />
            <Input label="Address *" value={form.address} onChange={v => update('address', v)} placeholder="Street address" />
            <Input label="City *" value={form.city} onChange={v => update('city', v)} placeholder="e.g. Nairobi" />
            <Input label="Country" value={form.country} onChange={v => update('country', v)} />
          </>
        )}

        {step === 2 && (
          <>
            <Input label="Phone" value={form.phone} onChange={v => update('phone', v)} placeholder="+254 700 000 000" keyboardType="phone-pad" />
            <Input label="Email" value={form.email} onChange={v => update('email', v)} placeholder="school@example.com" keyboardType="email-address" />
            <Input label="Website" value={form.website} onChange={v => update('website', v)} placeholder="https://school.edu" />
            <Input label="Registration Number" value={form.registration_number} onChange={v => update('registration_number', v)} placeholder="MOE/REG/1234" />
          </>
        )}

        {step === 3 && (
          <>
            <Input label="Description" value={form.description} onChange={v => update('description', v)} placeholder="Brief description of the school" multiline numberOfLines={3} />
            <Input label="Curriculum" value={form.curriculum_type} onChange={v => update('curriculum_type', v)} picker options={['CBC', '8-4-4', 'IGCSE', 'IB', 'American', 'Other']} />
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Public School</Text>
              <Switch value={form.is_public} onValueChange={v => update('is_public', v)} trackColor={{ false: '#e5e7eb', true: '#6366f1' }} />
            </View>
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Navigation Buttons */}
      <View style={styles.footer}>
        {step > 1 && (
          <TouchableOpacity style={styles.backBtn} onPress={() => setStep(step - 1)}>
            <Text style={styles.backBtnText}>Back</Text>
          </TouchableOpacity>
        )}
        {step < 3 ? (
          <TouchableOpacity style={styles.nextBtn} onPress={() => setStep(step + 1)}>
            <Text style={styles.nextBtnText}>Next</Text>
            <Ionicons name="arrow-forward" size={16} color="#fff" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.nextBtn, loading && styles.nextBtnDisabled]} onPress={handleSubmit} disabled={loading}>
            <Text style={styles.nextBtnText}>{loading ? 'Creating...' : 'Create School'}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

function StepDot({ active, label }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <View style={[styles.stepDot, active && styles.stepDotActive]}>
        {active && <Ionicons name="checkmark" size={12} color="#fff" />}
      </View>
      <Text style={[styles.stepLabel, active && styles.stepLabelActive]}>{label}</Text>
    </View>
  );
}

function StepLine({ active }) {
  return <View style={[styles.stepLine, active && styles.stepLineActive]} />;
}

function Input({ label, value, onChange, placeholder, keyboardType, multiline, numberOfLines, picker, options }) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      {picker ? (
        <View style={styles.pickerRow}>
          {options.map(opt => (
            <TouchableOpacity
              key={opt}
              style={[styles.pickerOption, value === opt && styles.pickerOptionActive]}
              onPress={() => onChange(opt)}
            >
              <Text style={[styles.pickerOptionText, value === opt && styles.pickerOptionTextActive]}>{opt}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <TextInput
          style={[styles.input, multiline && styles.inputMultiline]}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor="#9ca3af"
          keyboardType={keyboardType || 'default'}
          multiline={multiline}
          numberOfLines={numberOfLines}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 60, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
  steps: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 20, backgroundColor: '#fff' },
  stepDot: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center' },
  stepDotActive: { backgroundColor: '#6366f1' },
  stepLabel: { fontSize: 11, color: '#9ca3af', marginTop: 4 },
  stepLabelActive: { color: '#6366f1', fontWeight: '600' },
  stepLine: { width: 40, height: 2, backgroundColor: '#e5e7eb', marginHorizontal: 8 },
  stepLineActive: { backgroundColor: '#6366f1' },
  form: { flex: 1, padding: 16 },
  inputGroup: { marginBottom: 20 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 14, fontSize: 15, color: '#111827' },
  inputMultiline: { height: 100, textAlignVertical: 'top' },
  pickerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pickerOption: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f3f4f6', borderWidth: 1, borderColor: '#e5e7eb' },
  pickerOptionActive: { backgroundColor: '#ede9fe', borderColor: '#6366f1' },
  pickerOptionText: { fontSize: 13, color: '#6b7280' },
  pickerOptionTextActive: { color: '#6366f1', fontWeight: '600' },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
  switchLabel: { fontSize: 15, fontWeight: '600', color: '#374151' },
  footer: { flexDirection: 'row', padding: 16, gap: 12, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  backBtn: { paddingHorizontal: 20, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  backBtnText: { fontSize: 15, fontWeight: '600', color: '#374151' },
  nextBtn: { flex: 1, backgroundColor: '#6366f1', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, gap: 8 },
  nextBtnDisabled: { backgroundColor: '#c7d2fe' },
  nextBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
