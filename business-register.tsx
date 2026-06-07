import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '@/hooks/useAuthStore';
import { supabase } from '@/lib/supabase';

const BUSINESS_TYPES = [
  'Sole Proprietorship',
  'Partnership',
  'Limited Company',
  'Cooperative',
  'NGO / Non-Profit',
  'SACCO',
];

const CATEGORIES = [
  'Retail',
  'Food & Beverage',
  'Transport',
  'Agriculture',
  'Technology',
  'Healthcare',
  'Education',
  'Construction',
  'Finance',
  'Manufacturing',
  'Services',
  'Other',
];

export default function BusinessRegisterScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [category, setCategory] = useState('');
  const [regNumber, setRegNumber] = useState('');
  const [taxPin, setTaxPin] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [description, setDescription] = useState('');

  const totalSteps = 3;

  const validateStep = () => {
    if (step === 1) {
      if (!name.trim()) return Alert.alert('Error', 'Business name is required');
      if (!type) return Alert.alert('Error', 'Select a business type');
      if (!category) return Alert.alert('Error', 'Select a category');
    }
    if (step === 2) {
      if (!phone.trim()) return Alert.alert('Error', 'Phone number is required');
      if (!address.trim()) return Alert.alert('Error', 'Address is required');
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep() !== true) return;
    if (step < totalSteps) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const submitRegistration = async () => {
    if (!user?.id) return Alert.alert('Error', 'You must be logged in');
    setLoading(true);

    const { error } = await supabase.from('business_profiles').insert({
      owner_id: user.id,
      name: name.trim(),
      type,
      category,
      registration_number: regNumber.trim() || null,
      tax_pin: taxPin.trim() || null,
      phone: phone.trim(),
      email: email.trim() || null,
      address: address.trim(),
      city: city.trim() || null,
      description: description.trim() || null,
      status: 'pending',
      verified: false,
      revenue_today: 0,
      revenue_month: 0,
      transaction_count: 0,
    });

    setLoading(false);

    if (error) {
      Alert.alert('Registration Failed', error.message);
    } else {
      Alert.alert('Success', 'Business registered successfully! Awaiting verification.', [
        { text: 'OK', onPress: () => router.replace('/(os)/wallet/business') },
      ]);
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepRow}>
      {[1, 2, 3].map((s) => (
        <View key={s} style={styles.stepWrapper}>
          <View style={[styles.stepDot, s === step && styles.stepDotActive, s < step && styles.stepDotDone]}>
            {s < step ? (
              <Ionicons name="checkmark" size={14} color="#fff" />
            ) : (
              <Text style={[styles.stepNum, s === step && styles.stepNumActive]}>{s}</Text>
            )}
          </View>
          {s < 3 && <View style={[styles.stepLine, s < step && styles.stepLineDone]} />}
        </View>
      ))}
    </View>
  );

  const renderStep1 = () => (
    <View>
      <Text style={styles.stepTitle}>Business Information</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Business Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Mama Njoro Shop"
          placeholderTextColor="#6B7280"
          value={name}
          onChangeText={setName}
        />
      </View>

      <Text style={styles.label}>Business Type *</Text>
      <View style={styles.chipGrid}>
        {BUSINESS_TYPES.map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.chip, type === t && styles.chipActive]}
            onPress={() => setType(t)}
          >
            <Text style={[styles.chipText, type === t && styles.chipTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Category *</Text>
      <View style={styles.chipGrid}>
        {CATEGORIES.map((c) => (
          <TouchableOpacity
            key={c}
            style={[styles.chip, category === c && styles.chipActive]}
            onPress={() => setCategory(c)}
          >
            <Text style={[styles.chipText, category === c && styles.chipTextActive]}>{c}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Registration Number (Optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. BN/2024/123456"
          placeholderTextColor="#6B7280"
          value={regNumber}
          onChangeText={setRegNumber}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Tax PIN (Optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. A123456789B"
          placeholderTextColor="#6B7280"
          value={taxPin}
          onChangeText={setTaxPin}
          autoCapitalize="characters"
        />
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View>
      <Text style={styles.stepTitle}>Contact Details</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Phone Number *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. +254712345678"
          placeholderTextColor="#6B7280"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Email (Optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="business@example.com"
          placeholderTextColor="#6B7280"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Physical Address *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Street, Building, Floor..."
          placeholderTextColor="#6B7280"
          value={address}
          onChangeText={setAddress}
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>City / Town</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Nairobi"
          placeholderTextColor="#6B7280"
          value={city}
          onChangeText={setCity}
        />
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View>
      <Text style={styles.stepTitle}>Review & Submit</Text>

      <View style={styles.reviewCard}>
        <Text style={styles.reviewSection}>Business Information</Text>
        <ReviewRow label="Name" value={name} />
        <ReviewRow label="Type" value={type} />
        <ReviewRow label="Category" value={category} />
        <ReviewRow label="Reg. Number" value={regNumber || '—'} />
        <ReviewRow label="Tax PIN" value={taxPin || '—'} />

        <Text style={[styles.reviewSection, { marginTop: 16 }]}>Contact Details</Text>
        <ReviewRow label="Phone" value={phone} />
        <ReviewRow label="Email" value={email || '—'} />
        <ReviewRow label="Address" value={address} />
        <ReviewRow label="City" value={city || '—'} />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Description (Optional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Briefly describe what your business does..."
          placeholderTextColor="#6B7280"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
        />
      </View>

      <Text style={styles.termsText}>
        By submitting, you agree that all information provided is accurate and you authorize MTAA to verify your business details.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => step === 1 ? router.back() : prevStep()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Register Business</Text>
        <View style={{ width: 24 }} />
      </View>

      {renderStepIndicator()}

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}

        <View style={{ height: 40 }} />
      </ScrollView>

      <View style={styles.footer}>
        {step < totalSteps ? (
          <TouchableOpacity style={styles.btnPrimary} onPress={nextStep}>
            <Text style={styles.btnPrimaryText}>Continue</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.btnPrimary, loading && { opacity: 0.6 }]}
            onPress={submitRegistration}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.btnPrimaryText}>Submit Registration</Text>
                <Ionicons name="checkmark-circle" size={18} color="#fff" />
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.reviewRow}>
      <Text style={styles.reviewLabel}>{label}</Text>
      <Text style={styles.reviewValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 40,
  },
  stepWrapper: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotActive: { backgroundColor: '#3B82F6' },
  stepDotDone: { backgroundColor: '#22C55E' },
  stepNum: { fontSize: 12, fontWeight: '700', color: '#94A3B8' },
  stepNumActive: { color: '#fff' },
  stepLine: { flex: 1, height: 2, backgroundColor: '#334155', marginHorizontal: 4 },
  stepLineDone: { backgroundColor: '#22C55E' },
  scroll: { flex: 1, paddingHorizontal: 16 },
  stepTitle: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 16, marginTop: 8 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#CBD5E1', marginBottom: 6 },
  input: {
    backgroundColor: '#1E293B',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
  },
  chipActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  chipText: { fontSize: 12, color: '#CBD5E1' },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  reviewCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  reviewSection: { fontSize: 14, fontWeight: '700', color: '#60A5FA', marginBottom: 10 },
  reviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  reviewLabel: { fontSize: 12, color: '#94A3B8' },
  reviewValue: { fontSize: 12, color: '#fff', fontWeight: '600', flex: 1, textAlign: 'right' },
  termsText: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    backgroundColor: '#0F172A',
  },
  btnPrimary: {
    backgroundColor: '#3B82F6',
    borderRadius: 10,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  btnPrimaryText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
