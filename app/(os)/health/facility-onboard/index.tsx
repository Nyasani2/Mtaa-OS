import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { healthRoleService } from '@/lib/health/services/health-role.service';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

const FACILITY_TYPES = [
  { id: 'hospital', label: 'Hospital', icon: 'business' },
  { id: 'clinic', label: 'Clinic', icon: 'medical' },
  { id: 'pharmacy', label: 'Pharmacy', icon: 'cube' },
  { id: 'laboratory', label: 'Laboratory', icon: 'flask' },
  { id: 'radiology_center', label: 'Radiology Center', icon: 'scan' },
  { id: 'ambulance_service', label: 'Ambulance Service', icon: 'car' },
];

export default function FacilityOnboardScreen() {
  const { user } = useAuthStore();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1: Basic Info
  const [name, setName] = useState('');
  const [type, setType] = useState('hospital');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');

  // Step 2: Location & Contact
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [county, setCounty] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');

  // Step 3: Services & Capacity
  const [bedCapacity, setBedCapacity] = useState('');
  const [icuBeds, setIcuBeds] = useState('');
  const [specialties, setSpecialties] = useState('');
  const [services, setServices] = useState('');

  const handleNext = () => {
    if (step === 1) {
      if (!name || !licenseNumber) {
        Alert.alert('Error', 'Facility name and license number are required');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!address || !city) {
        Alert.alert('Error', 'Address and city are required');
        return;
      }
      setStep(3);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'You must be logged in');
      return;
    }

    setLoading(true);
    try {
      await healthRoleService.registerFacility({
        name,
        type,
        license_number: licenseNumber,
        registration_number: registrationNumber || null,
        address,
        city,
        county: county || null,
        phone: phone || null,
        email: email || null,
        website: website || null,
        bed_capacity: parseInt(bedCapacity) || 0,
        icu_beds: parseInt(icuBeds) || 0,
        specialties: specialties ? specialties.split(',').map(s => s.trim()) : [],
        services: services ? services.split(',').map(s => s.trim()) : [],
      }, user.id);

      Alert.alert('Success', 'Facility registered successfully! It will be reviewed by the MTAA Health Authority.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to register facility');
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <>
      <Text style={styles.stepTitle}>Step 1: Basic Information</Text>

      <Text style={styles.inputLabel}>Facility Name *</Text>
      <TextInput style={styles.input} placeholder="e.g. Nairobi General Hospital" value={name} onChangeText={setName} />

      <Text style={styles.inputLabel}>Facility Type *</Text>
      <View style={styles.typeGrid}>
        {FACILITY_TYPES.map(ft => (
          <TouchableOpacity
            key={ft.id}
            style={[styles.typeCard, type === ft.id && styles.typeCardActive]}
            onPress={() => setType(ft.id)}
          >
            <Ionicons name={ft.icon as any} size={24} color={type === ft.id ? '#1A237E' : '#999'} />
            <Text style={[styles.typeCardText, type === ft.id && styles.typeCardTextActive]}>{ft.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.inputLabel}>License Number *</Text>
      <TextInput style={styles.input} placeholder="e.g. HOSP-2024-001" value={licenseNumber} onChangeText={setLicenseNumber} autoCapitalize="characters" />

      <Text style={styles.inputLabel}>Registration Number (optional)</Text>
      <TextInput style={styles.input} placeholder="e.g. REG-123456" value={registrationNumber} onChangeText={setRegistrationNumber} />
    </>
  );

  const renderStep2 = () => (
    <>
      <Text style={styles.stepTitle}>Step 2: Location & Contact</Text>

      <Text style={styles.inputLabel}>Physical Address *</Text>
      <TextInput style={styles.input} placeholder="e.g. 123 Hospital Road" value={address} onChangeText={setAddress} />

      <Text style={styles.inputLabel}>City *</Text>
      <TextInput style={styles.input} placeholder="e.g. Nairobi" value={city} onChangeText={setCity} />

      <Text style={styles.inputLabel}>County</Text>
      <TextInput style={styles.input} placeholder="e.g. Nairobi County" value={county} onChangeText={setCounty} />

      <Text style={styles.inputLabel}>Phone Number</Text>
      <TextInput style={styles.input} placeholder="e.g. +254 700 123 456" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />

      <Text style={styles.inputLabel}>Email</Text>
      <TextInput style={styles.input} placeholder="e.g. info@hospital.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />

      <Text style={styles.inputLabel}>Website</Text>
      <TextInput style={styles.input} placeholder="e.g. www.hospital.com" value={website} onChangeText={setWebsite} autoCapitalize="none" />
    </>
  );

  const renderStep3 = () => (
    <>
      <Text style={styles.stepTitle}>Step 3: Services & Capacity</Text>

      <Text style={styles.inputLabel}>Bed Capacity</Text>
      <TextInput style={styles.input} placeholder="e.g. 200" value={bedCapacity} onChangeText={setBedCapacity} keyboardType="number-pad" />

      <Text style={styles.inputLabel}>ICU Beds</Text>
      <TextInput style={styles.input} placeholder="e.g. 20" value={icuBeds} onChangeText={setIcuBeds} keyboardType="number-pad" />

      <Text style={styles.inputLabel}>Specialties (comma separated)</Text>
      <TextInput 
        style={[styles.input, styles.textArea]} 
        placeholder="e.g. Cardiology, Pediatrics, Orthopedics, General Medicine" 
        value={specialties} 
        onChangeText={setSpecialties}
        multiline
      />

      <Text style={styles.inputLabel}>Services (comma separated)</Text>
      <TextInput 
        style={[styles.input, styles.textArea]} 
        placeholder="e.g. Emergency, Surgery, Laboratory, Pharmacy, Radiology" 
        value={services} 
        onChangeText={setServices}
        multiline
      />

      <View style={styles.reviewCard}>
        <Text style={styles.reviewTitle}>Review Your Submission</Text>
        <Text style={styles.reviewText}>Name: {name}</Text>
        <Text style={styles.reviewText}>Type: {FACILITY_TYPES.find(f => f.id === type)?.label}</Text>
        <Text style={styles.reviewText}>License: {licenseNumber}</Text>
        <Text style={styles.reviewText}>Address: {address}, {city}</Text>
        <Text style={styles.reviewText}>Status: Pending Verification</Text>
      </View>
    </>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => step === 1 ? router.back() : handleBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Register Facility</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Progress */}
      <View style={styles.progressBar}>
        {[1, 2, 3].map(s => (
          <View key={s} style={[styles.progressStep, step >= s && styles.progressStepActive]}>
            <Text style={[styles.progressStepText, step >= s && styles.progressStepTextActive]}>{s}</Text>
          </View>
        ))}
      </View>

      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
      </ScrollView>

      {/* Footer Buttons */}
      <View style={styles.footer}>
        {step < 3 ? (
          <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
            <Text style={styles.nextBtnText}>Next Step</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.nextBtn, loading && styles.nextBtnDisabled]} onPress={handleSubmit} disabled={loading}>
            <Text style={styles.nextBtnText}>{loading ? 'Submitting...' : 'Submit for Verification'}</Text>
            {!loading && <Ionicons name="checkmark" size={18} color="#fff" />}
          </TouchableOpacity>
        )}
      </View>
    </View>
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
  progressBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    gap: 12,
    backgroundColor: '#fff',
  },
  progressStep: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressStepActive: { backgroundColor: '#1A237E' },
  progressStepText: { fontSize: 14, fontWeight: '600', color: '#999' },
  progressStepTextActive: { color: '#fff' },
  content: { flex: 1, padding: 16 },
  stepTitle: { fontSize: 20, fontWeight: '700', color: '#333', marginBottom: 16 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 6, marginTop: 12 },
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
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
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
  typeCardText: { fontSize: 12, color: '#666', marginTop: 6, textAlign: 'center' },
  typeCardTextActive: { color: '#1A237E', fontWeight: '600' },
  reviewCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#1A237E',
  },
  reviewTitle: { fontSize: 16, fontWeight: '700', color: '#333', marginBottom: 10 },
  reviewText: { fontSize: 14, color: '#666', marginBottom: 4 },
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
