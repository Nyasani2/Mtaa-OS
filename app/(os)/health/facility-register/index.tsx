// @ts-nocheck
import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { Ionicons } from '@expo/vector-icons';

const FACILITY_TYPES = [
  { id: 'hospital', label: 'Hospital', icon: 'business' },
  { id: 'clinic', label: 'Clinic', icon: 'medical' },
  { id: 'pharmacy', label: 'Pharmacy', icon: 'cube' },
  { id: 'laboratory', label: 'Laboratory', icon: 'flask' },
];

const JURISDICTION_TYPES = [
  { id: 'national', label: 'National Hospital' },
  { id: 'county', label: 'County/State Hospital' },
  { id: 'municipal', label: 'Municipal/City' },
  { id: 'private_independent', label: 'Private Independent' },
  { id: 'faith_jurisdiction', label: 'Faith-Based' },
];

export default function FacilityRegisterScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Step 1: Basic Info
  const [name, setName] = useState('');
  const [type, setType] = useState('hospital');
  const [licenseNumber, setLicenseNumber] = useState('');
  
  // Step 2: Location
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [county, setCounty] = useState('');
  const [address, setAddress] = useState('');
  const [jurisdictionType, setJurisdictionType] = useState('county');
  
  // Step 3: Capacity
  const [bedCapacity, setBedCapacity] = useState('');
  const [icuBeds, setIcuBeds] = useState('');
  
  const handleNext = () => {
    if (step === 1 && (!name || !licenseNumber)) {
      Alert.alert('Error', 'Facility name and license number are required');
      return;
    }
    if (step === 2 && (!address || !city)) {
      Alert.alert('Error', 'Address and city are required');
      return;
    }
    setStep(step + 1);
  };

  const handleSubmit = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'You must be logged in');
      return;
    }
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('health_facilities')
        .insert({
          name,
          type,
          license_number: licenseNumber,
          address,
          city,
          county,
          country,
          jurisdiction_type: jurisdictionType,
          bed_capacity: parseInt(bedCapacity) || 0,
          icu_beds: parseInt(icuBeds) || 0,
          owner_id: user.id,
          status: 'pending_verification',
          created_at: new Date().toISOString(),
        });
      
      if (error) throw error;
      
      Alert.alert('Success', 'Facility registered successfully!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to register facility');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Register Facility</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Progress Indicator */}
      <View style={styles.progress}>
        {[1, 2, 3].map((s) => (
          <View
            key={s}
            style={[
              styles.progressDot,
              step >= s && styles.progressDotActive,
            ]}
          >
            <Text
              style={[
                styles.progressText,
                step >= s && styles.progressTextActive,
              ]}
            >
              {s}
            </Text>
          </View>
        ))}
      </View>

      <ScrollView style={styles.content}>
        {step === 1 && (
          <>
            <Text style={styles.stepTitle}>Step 1: Basic Information</Text>
            <Text style={styles.label}>Facility Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Nairobi General Hospital"
              value={name}
              onChangeText={setName}
            />

            <Text style={styles.label}>Facility Type *</Text>
            <View style={styles.typeGrid}>
              {FACILITY_TYPES.map((ft) => (
                <TouchableOpacity
                  key={ft.id}
                  style={[
                    styles.typeCard,
                    type === ft.id && styles.typeCardActive,
                  ]}
                  onPress={() => setType(ft.id)}
                >
                  <Ionicons
                    name={ft.icon as any}
                    size={24}
                    color={type === ft.id ? '#1A237E' : '#999'}
                  />
                  <Text
                    style={[
                      styles.typeText,
                      type === ft.id && styles.typeTextActive,
                    ]}
                  >
                    {ft.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>License Number *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. HOSP-2024-001"
              value={licenseNumber}
              onChangeText={setLicenseNumber}
              autoCapitalize="characters"
            />
          </>
        )}

        {step === 2 && (
          <>
            <Text style={styles.stepTitle}>Step 2: Location & Jurisdiction</Text>
            <Text style={styles.label}>Country *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Kenya"
              value={country}
              onChangeText={setCountry}
            />

            <Text style={styles.label}>City *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Nairobi"
              value={city}
              onChangeText={setCity}
            />

            <Text style={styles.label}>County</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Nairobi County"
              value={county}
              onChangeText={setCounty}
            />

            <Text style={styles.label}>Physical Address *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Street address"
              value={address}
              onChangeText={setAddress}
              multiline
            />

            <Text style={styles.label}>Jurisdiction Type</Text>
            {JURISDICTION_TYPES.map((j) => (
              <TouchableOpacity
                key={j.id}
                style={[
                  styles.jurisdictionCard,
                  jurisdictionType === j.id && styles.jurisdictionCardActive,
                ]}
                onPress={() => setJurisdictionType(j.id)}
              >
                <Text
                  style={[
                    styles.jurisdictionText,
                    jurisdictionType === j.id && styles.jurisdictionTextActive,
                  ]}
                >
                  {j.label}
                </Text>
              </TouchableOpacity>
            ))}
          </>
        )}

        {step === 3 && (
          <>
            <Text style={styles.stepTitle}>Step 3: Operational Capacity</Text>
            <Text style={styles.label}>Total Bed Capacity</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 200"
              value={bedCapacity}
              onChangeText={setBedCapacity}
              keyboardType="number-pad"
            />

            <Text style={styles.label}>ICU Beds</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 20"
              value={icuBeds}
              onChangeText={setIcuBeds}
              keyboardType="number-pad"
            />

            <View style={styles.summaryBox}>
              <Text style={styles.summaryTitle}>Review Submission</Text>
              <Text style={styles.summaryText}>Name: {name}</Text>
              <Text style={styles.summaryText}>Type: {type}</Text>
              <Text style={styles.summaryText}>License: {licenseNumber}</Text>
              <Text style={styles.summaryText}>
                Location: {city}, {country}
              </Text>
              <Text style={styles.summaryText}>Beds: {bedCapacity || '0'}</Text>
            </View>
          </>
        )}
      </ScrollView>

      {/* Footer Buttons */}
      <View style={styles.footer}>
        {step < 3 ? (
          <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
            <Text style={styles.nextBtnText}>Next Step</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.nextBtn, loading && styles.nextBtnDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.nextBtnText}>
              {loading ? 'Submitting...' : 'Submit Registration'}
            </Text>
            {!loading && <Ionicons name="checkmark" size={18} color="#fff" />}
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingTop: 50,
  },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#333' },
  progress: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 16,
    gap: 12,
    backgroundColor: '#fff',
  },
  progressDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressDotActive: { backgroundColor: '#1A237E' },
  progressText: { fontSize: 14, fontWeight: '600', color: '#999' },
  progressTextActive: { color: '#fff' },
  content: { flex: 1, padding: 16 },
  stepTitle: { fontSize: 20, fontWeight: '700', color: '#333', marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 6, marginTop: 12 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: '#333',
    backgroundColor: '#fff',
  },
  textArea: { height: 80, textAlignVertical: 'top' },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  typeCard: {
    width: '30%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  typeCardActive: { borderColor: '#1A237E', backgroundColor: '#E8EAF6' },
  typeText: { fontSize: 12, color: '#666', marginTop: 6, textAlign: 'center' },
  typeTextActive: { color: '#1A237E', fontWeight: '600' },
  jurisdictionCard: {
    padding: 14,
    borderRadius: 10,
    backgroundColor: '#fff',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  jurisdictionCardActive: {
    borderColor: '#1A237E',
    backgroundColor: '#E8EAF6',
  },
  jurisdictionText: { fontSize: 14, color: '#666' },
  jurisdictionTextActive: { color: '#1A237E', fontWeight: '600' },
  summaryBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#1A237E',
  },
  summaryTitle: { fontSize: 16, fontWeight: '700', color: '#333', marginBottom: 10 },
  summaryText: { fontSize: 14, color: '#666', marginBottom: 4 },
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1A237E',
    padding: 14,
    borderRadius: 12,
  },
  nextBtnDisabled: { opacity: 0.6 },
  nextBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
