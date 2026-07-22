import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  ActivityIndicator, Alert, Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/lib/auth/useAuth';
import { supabase } from '@/lib/supabase';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const STEPS = ['Personal Info', 'Vehicle Details', 'Documents', 'Review'];

export default function BodaOnboarding() {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const [fullName, setFullName] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [area, setArea] = useState('');
  const [vehicleMake, setVehicleMake] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [engineCc, setEngineCc] = useState('');
  const [yearOfManufacture, setYearOfManufacture] = useState('');
  const [hasHelmet, setHasHelmet] = useState(false);
  const [hasReflectiveJacket, setHasReflectiveJacket] = useState(false);
  const [drivingLicense, setDrivingLicense] = useState('');
  const [insuranceProvider, setInsuranceProvider] = useState('');
  const [insuranceNumber, setInsuranceNumber] = useState('');
  const [saccoName, setSaccoName] = useState('');

  const validateStep = () => {
    switch (step) {
      case 0:
        if (!fullName.trim()) return 'Full name is required';
        if (!idNumber.trim()) return 'National ID number is required';
        if (!phone.trim()) return 'Phone number is required';
        if (!city.trim()) return 'City is required';
        break;
      case 1:
        if (!vehicleMake.trim()) return 'Vehicle make is required';
        if (!plateNumber.trim()) return 'Plate number is required';
        if (!engineCc.trim()) return 'Engine CC is required';
        break;
      case 2:
        if (!drivingLicense.trim()) return 'Driving license number is required';
        if (!insuranceProvider.trim()) return 'Insurance provider is required';
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
      // FIXED 2026-07-21: this insert had extensive column mismatches
      // against the real boda_riders table, verified directly — email,
      // city, operating_area, vehicle_make, vehicle_model, engine_cc,
      // year_of_manufacture, has_helmet, has_reflective_jacket,
      // driving_license, insurance_provider, insurance_number,
      // sacco_name, status, and total_rides do NOT exist as written.
      // This would have failed immediately for every user on the first
      // mismatched column Postgres hit.
      //
      // Real columns: id_number, phone, license_number, license_expiry,
      // helmet_serial (a serial number, not a boolean), emergency_contact,
      // vehicle_type, plate_number, is_active, is_approved, photo_url,
      // documents (likely a jsonb catch-all).
      //
      // NOT a silent data-loss fix: email, city, operating_area,
      // vehicle_make, vehicle_model, engine_cc, year_of_manufacture,
      // insurance_provider, insurance_number, and sacco_name are all
      // still collected by this form's UI but have no matching column.
      // Storing them in `documents` (jsonb) as a stopgap rather than
      // silently dropping them, but this needs a real schema decision —
      // structured columns for at least insurance/sacco data, which
      // matter for compliance and dispute resolution.
      const { error: insertError } = await supabase
        .from('boda_riders')
        .insert({
          user_id: user.id,
          full_name: fullName.trim(),
          id_number: idNumber.trim(),
          phone: phone.trim(),
          vehicle_type: `${vehicleMake.trim()} ${vehicleModel.trim()}`.trim(),
          plate_number: plateNumber.trim().toUpperCase(),
          license_number: drivingLicense.trim(),
          is_active: false,
          is_approved: false,
          is_online: false,
          total_trips: 0,
          rating: 0,
          documents: {
            email: email.trim(),
            city: city.trim(),
            operating_area: area.trim(),
            engine_cc: parseInt(engineCc) || 0,
            year_of_manufacture: parseInt(yearOfManufacture) || null,
            has_helmet: hasHelmet,
            has_reflective_jacket: hasReflectiveJacket,
            insurance_provider: insuranceProvider.trim(),
            insurance_number: insuranceNumber.trim(),
            sacco_name: saccoName.trim(),
          },
        });

      if (insertError) throw insertError;

      Alert.alert(
        'Application Submitted',
        'Your Boda rider application is pending verification. You will be notified once approved.',
        [{ text: 'OK', onPress: () => router.replace('/(boda)') }]
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
            <Text style={styles.sectionTitle}>Personal Information</Text>
            <Input label="Full Name *" value={fullName} onChangeText={setFullName} icon="account" />
            <Input label="National ID Number *" value={idNumber} onChangeText={setIdNumber} icon="card-account-details" />
            <Input label="Phone Number *" value={phone} onChangeText={setPhone} icon="phone" keyboardType="phone-pad" />
            <Input label="Email" value={email} onChangeText={setEmail} icon="email" keyboardType="email-address" />
            <Input label="City *" value={city} onChangeText={setCity} icon="city" />
            <Input label="Operating Area / Estate" value={area} onChangeText={setArea} icon="map-marker" placeholder="e.g. CBD, Westlands, Karen" />
          </View>
        );
      case 1:
        return (
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Vehicle Details</Text>
            <Input label="Vehicle Make *" value={vehicleMake} onChangeText={setVehicleMake} icon="motorbike" placeholder="e.g. Boxer, TVS, Honda" />
            <Input label="Vehicle Model" value={vehicleModel} onChangeText={setVehicleModel} icon="motorbike" placeholder="e.g. Boxer 150, TVS Apache" />
            <Input label="Plate Number *" value={plateNumber} onChangeText={setPlateNumber} icon="numeric" placeholder="e.g. KMDA 123A" />
            <Input label="Engine CC *" value={engineCc} onChangeText={setEngineCc} icon="speedometer" keyboardType="number-pad" placeholder="e.g. 150" />
            <Input label="Year of Manufacture" value={yearOfManufacture} onChangeText={setYearOfManufacture} icon="calendar" keyboardType="number-pad" placeholder="e.g. 2022" />
            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>I have a helmet</Text>
              <Switch value={hasHelmet} onValueChange={setHasHelmet} trackColor={{ false: '#E5E7EB', true: '#2563EB' }} />
            </View>
            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>I have a reflective jacket</Text>
              <Switch value={hasReflectiveJacket} onValueChange={setHasReflectiveJacket} trackColor={{ false: '#E5E7EB', true: '#2563EB' }} />
            </View>
          </View>
        );
      case 2:
        return (
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Documents & Membership</Text>
            <Input label="Driving License Number *" value={drivingLicense} onChangeText={setDrivingLicense} icon="card-account-details" />
            <Input label="Insurance Provider *" value={insuranceProvider} onChangeText={setInsuranceProvider} icon="shield-check" />
            <Input label="Insurance Policy Number" value={insuranceNumber} onChangeText={setInsuranceNumber} icon="shield" />
            <Input label="SACCO Name (if any)" value={saccoName} onChangeText={setSaccoName} icon="account-group" placeholder="e.g. Nairobi Boda Boda Association" />
            <View style={styles.infoBox}>
              <MaterialCommunityIcons name="information" size={20} color="#2563EB" />
              <Text style={styles.infoText}>Your driving license and vehicle documents will be verified. Ensure they are valid and up to date.</Text>
            </View>
          </View>
        );
      case 3:
        return (
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Review Your Application</Text>
            <ReviewRow label="Name" value={fullName} />
            <ReviewRow label="ID" value={idNumber} />
            <ReviewRow label="Phone" value={phone} />
            <ReviewRow label="City" value={city} />
            <ReviewRow label="Vehicle" value={`${vehicleMake} ${vehicleModel}`.trim()} />
            <ReviewRow label="Plate" value={plateNumber.toUpperCase()} />
            <ReviewRow label="Engine" value={`${engineCc}cc`} />
            <ReviewRow label="License" value={drivingLicense} />
            <ReviewRow label="Insurance" value={`${insuranceProvider} — ${insuranceNumber}`} />
            <ReviewRow label="SACCO" value={saccoName} />
            <View style={styles.infoBox}>
              <MaterialCommunityIcons name="check-circle" size={20} color="#10B981" />
              <Text style={styles.infoText}>By submitting, you confirm all information is accurate and agree to MTAA Boda terms.</Text>
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
        <Text style={styles.headerTitle}>Become a Boda Rider</Text>
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
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  toggleLabel: { fontSize: 14, color: '#374151', fontWeight: '500' },
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
