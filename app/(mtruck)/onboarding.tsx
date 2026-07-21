import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  ActivityIndicator, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/lib/auth/useAuth';
import { supabase } from '@/lib/supabase';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const STEPS = ['Company Info', 'Fleet Details', 'Documents', 'Review'];

export default function MTruckOnboarding() {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const [companyName, setCompanyName] = useState('');
  const [businessReg, setBusinessReg] = useState('');
  const [kraPin, setKraPin] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [fleetSize, setFleetSize] = useState('');
  const [truckTypes, setTruckTypes] = useState<string[]>([]);
  const [coverageAreas, setCoverageAreas] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [insuranceProvider, setInsuranceProvider] = useState('');
  const [insuranceNumber, setInsuranceNumber] = useState('');

  const truckTypeOptions = [
    'Flatbed', 'Refrigerated', 'Tanker', 'Tipper', 'Container',
    'Low Loader', 'Car Carrier', 'Bulk Carrier', 'Box Truck',
  ];

  const toggleTruckType = (type: string) => {
    setTruckTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
  };

  const validateStep = () => {
    switch (step) {
      case 0:
        if (!companyName.trim()) return 'Company name is required';
        if (!businessReg.trim()) return 'Business registration number is required';
        if (!kraPin.trim()) return 'KRA PIN is required';
        if (!contactPhone.trim()) return 'Contact phone is required';
        break;
      case 1:
        if (!fleetSize.trim()) return 'Fleet size is required';
        if (truckTypes.length === 0) return 'Select at least one truck type';
        if (!coverageAreas.trim()) return 'Coverage areas are required';
        break;
      case 2:
        if (!licenseNumber.trim()) return 'Transport license number is required';
        if (!insuranceProvider.trim()) return 'Insurance provider is required';
        if (!insuranceNumber.trim()) return 'Insurance policy number is required';
        break;
    }
    return null;
  };

  const handleNext = () => {
    const error = validateStep();
    if (error) { Alert.alert('Validation Error', error); return; }
    if (step < STEPS.length - 1) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
    else router.back();
  };

  const handleSubmit = async () => {
    const error = validateStep();
    if (error) { Alert.alert('Validation Error', error); return; }
    if (!user) { Alert.alert('Error', 'You must be logged in'); return; }

    setLoading(true);
    try {
      const { error: insertError } = await supabase
        .from('mtruck_fleet')
        .insert({
          owner_id: user.id,
          name: companyName.trim(),
          business_reg: businessReg.trim(),
          kra_pin: kraPin.trim(),
          address: address.trim() || null,
          city: city.trim() || null,
          contact_phone: contactPhone.trim(),
          contact_email: contactEmail.trim() || null,
          vehicle_count: parseInt(fleetSize, 10) || 0,
          truck_types: truckTypes,
          coverage_areas: coverageAreas.split(',').map(a => a.trim()).filter(Boolean),
          license_number: licenseNumber.trim(),
          insurance_provider: insuranceProvider.trim(),
          insurance_number: insuranceNumber.trim(),
          status: 'pending_verification',
          verified: false,
        });

      if (insertError) throw insertError;

      Alert.alert(
        'Application Submitted',
        'Your trucking company registration is pending verification. You will be notified once approved.',
        [{ text: 'OK', onPress: () => router.replace('/(mtruck)') }]
      );
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {STEPS.map((s, i) => (
        <View key={s} style={styles.stepRow}>
          <View style={[styles.stepDot, i <= step && styles.stepDotActive]}>
            <Text style={[styles.stepNumber, i <= step && styles.stepNumberActive]}>{i + 1}</Text>
          </View>
          {i < STEPS.length - 1 && <View style={[styles.stepLine, i < step && styles.stepLineActive]} />}
          <Text style={[styles.stepLabel, i <= step && styles.stepLabelActive]}>{s}</Text>
        </View>
      ))}
    </View>
  );

  const renderStepContent = () => {
    switch (step) {
      case 0:
        return (
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Company Information</Text>
            <Input label="Company Name *" value={companyName} onChangeText={setCompanyName} icon="office-building" />
            <Input label="Business Registration No. *" value={businessReg} onChangeText={setBusinessReg} icon="file-document" />
            <Input label="KRA PIN *" value={kraPin} onChangeText={setKraPin} icon="identifier" />
            <Input label="Physical Address" value={address} onChangeText={setAddress} icon="map-marker" />
            <Input label="City" value={city} onChangeText={setCity} icon="city" />
            <Input label="Contact Phone *" value={contactPhone} onChangeText={setContactPhone} icon="phone" keyboardType="phone-pad" />
            <Input label="Contact Email" value={contactEmail} onChangeText={setContactEmail} icon="email" keyboardType="email-address" />
          </View>
        );
      case 1:
        return (
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Fleet Details</Text>
            <Input label="Fleet Size (number of trucks) *" value={fleetSize} onChangeText={setFleetSize} icon="truck" keyboardType="number-pad" />
            <Text style={styles.label}>Truck Types *</Text>
            <View style={styles.chipContainer}>
              {truckTypeOptions.map(type => (
                <TouchableOpacity key={type} style={[styles.chip, truckTypes.includes(type) && styles.chipActive]} onPress={() => toggleTruckType(type)}>
                  <Text style={[styles.chipText, truckTypes.includes(type) && styles.chipTextActive]}>{type}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Input label="Coverage Areas (comma separated) *" value={coverageAreas} onChangeText={setCoverageAreas} icon="map" placeholder="e.g. Nairobi, Mombasa, Kisumu" />
          </View>
        );
      case 2:
        return (
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Documents & Licenses</Text>
            <Input label="Transport License No. *" value={licenseNumber} onChangeText={setLicenseNumber} icon="certificate" />
            <Input label="Insurance Provider *" value={insuranceProvider} onChangeText={setInsuranceProvider} icon="shield-check" />
            <Input label="Insurance Policy No. *" value={insuranceNumber} onChangeText={setInsuranceNumber} icon="shield" />
            <View style={styles.infoBox}>
              <MaterialCommunityIcons name="information" size={20} color="#2563EB" />
              <Text style={styles.infoText}>You will be required to upload scanned copies of these documents during verification.</Text>
            </View>
          </View>
        );
      case 3:
        return (
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Review Your Application</Text>
            <ReviewRow label="Company" value={companyName} />
            <ReviewRow label="Registration" value={businessReg} />
            <ReviewRow label="KRA PIN" value={kraPin} />
            <ReviewRow label="Contact" value={`${contactPhone}${contactEmail ? ' / ' + contactEmail : ''}`} />
            <ReviewRow label="Fleet Size" value={fleetSize} />
            <ReviewRow label="Truck Types" value={truckTypes.join(', ')} />
            <ReviewRow label="Coverage" value={coverageAreas} />
            <ReviewRow label="License" value={licenseNumber} />
            <ReviewRow label="Insurance" value={`${insuranceProvider} — ${insuranceNumber}`} />
            <View style={styles.infoBox}>
              <MaterialCommunityIcons name="check-circle" size={20} color="#10B981" />
              <Text style={styles.infoText}>By submitting, you confirm all information is accurate and agree to MTAA MTruck terms.</Text>
            </View>
          </View>
        );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Register Trucking Company</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {renderStepIndicator()}
        {renderStepContent()}
        <View style={{ height: 40 }} />
      </ScrollView>
      <View style={styles.footer}>
        {step > 0 && (
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        )}
        {step < STEPS.length - 1 ? (
          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextButtonText}>Next</Text>
            <MaterialCommunityIcons name="arrow-right" size={18} color="#FFF" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.nextButton, loading && styles.nextButtonDisabled]} onPress={handleSubmit} disabled={loading}>
            {loading ? <ActivityIndicator color="#FFF" /> : (
              <><Text style={styles.nextButtonText}>Submit Application</Text><MaterialCommunityIcons name="send" size={18} color="#FFF" /></>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

function Input({ label, value, onChangeText, icon, keyboardType = 'default', placeholder }: any) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrapper}>
        <MaterialCommunityIcons name={icon} size={18} color="#9CA3AF" style={styles.inputIcon} />
        <TextInput style={styles.input} value={value} onChangeText={onChangeText} keyboardType={keyboardType} placeholder={placeholder} placeholderTextColor="#9CA3AF" />
      </View>
    </View>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <View style={styles.reviewRow}>
      <Text style={styles.reviewLabel}>{label}</Text>
      <Text style={styles.reviewValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#1F2937' },
  scroll: { flex: 1, paddingHorizontal: 16 },
  stepIndicator: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-start', paddingVertical: 20 },
  stepRow: { alignItems: 'center', marginHorizontal: 4 },
  stepDot: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center' },
  stepDotActive: { backgroundColor: '#2563EB' },
  stepNumber: { fontSize: 13, fontWeight: '700', color: '#9CA3AF' },
  stepNumberActive: { color: '#FFF' },
  stepLine: { width: 24, height: 2, backgroundColor: '#E5E7EB', marginVertical: 6 },
  stepLineActive: { backgroundColor: '#2563EB' },
  stepLabel: { fontSize: 10, color: '#9CA3AF', marginTop: 4, maxWidth: 60, textAlign: 'center' },
  stepLabelActive: { color: '#2563EB', fontWeight: '600' },
  formSection: { marginTop: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937', marginBottom: 16 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', paddingHorizontal: 12 },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, height: 48, fontSize: 15, color: '#1F2937' },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB' },
  chipActive: { backgroundColor: '#DBEAFE', borderColor: '#2563EB' },
  chipText: { fontSize: 13, color: '#6B7280' },
  chipTextActive: { color: '#2563EB', fontWeight: '600' },
  infoBox: { flexDirection: 'row', backgroundColor: '#EFF6FF', borderRadius: 12, padding: 14, gap: 10, marginTop: 8 },
  infoText: { flex: 1, fontSize: 13, color: '#1E40AF', lineHeight: 18 },
  reviewRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  reviewLabel: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
  reviewValue: { fontSize: 13, color: '#1F2937', fontWeight: '600', flex: 1, textAlign: 'right', marginLeft: 12 },
  footer: { flexDirection: 'row', padding: 16, gap: 12, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  backButton: { flex: 1, height: 50, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center' },
  backButtonText: { fontSize: 15, fontWeight: '600', color: '#6B7280' },
  nextButton: { flex: 2, height: 50, borderRadius: 12, backgroundColor: '#2563EB', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  nextButtonDisabled: { backgroundColor: '#93C5FD' },
  nextButtonText: { fontSize: 15, fontWeight: '700', color: '#FFF' },
});
