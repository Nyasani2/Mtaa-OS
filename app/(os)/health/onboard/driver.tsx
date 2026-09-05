import React, { useState } from 'react';
import { Alert, View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

const STEPS = ['Personal & License', 'Vehicle & Insurance', 'Emergency & Certs'];

export default function DriverRegistrationScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    licenseNumber: '',
    licenseExpiry: '',
    vehicleNumber: '',
    vehicleModel: '',
    insuranceProvider: '',
    insurancePolicy: '',
    emergencyContact: '',
    emergencyPhone: '',
    certifications: '',
  });

  const update = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const validateStep = () => {
    if (step === 0) {
      if (!form.fullName.trim()) return 'Full name is required';
      if (!form.phone.trim()) return 'Phone number is required';
      if (!form.licenseNumber.trim()) return 'License number is required';
      if (!form.licenseExpiry.trim()) return 'License expiry is required';
    }
    if (step === 1) {
      if (!form.vehicleNumber.trim()) return 'Vehicle number is required';
      if (!form.vehicleModel.trim()) return 'Vehicle model is required';
    }
    return null;
  };

  const handleNext = () => {
    const err = validateStep();
    if (err) { Alert.alert('Validation', err); return; }
    if (step < STEPS.length - 1) setStep(step + 1);
    else handleSubmit();
  };

  const handleSubmit = async () => {
    if (!user?.id) { Alert.alert('Error', 'You must be logged in'); return; }
    setLoading(true);
    try {
      // 1. Create staff record for driver (NO is_verified — uses status)
      const { error: staffError } = await supabase.from('health_staff').upsert({
        user_id: user.id,
        full_name: form.fullName.trim(),
        role: 'ambulance_driver',
        phone: form.phone.trim(),
        status: 'pending',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

      if (staffError) {
          const r: any = await supabase.from('health_staff').upsert({ user_id: user.id, role: 'ambulance_driver', status: 'pending', updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
          if (r.error) throw r.error;
        }

      // 2. Create ambulance driver record
      const { error: driverError } = await supabase.from('health_ambulance_drivers').upsert({
        user_id: user.id,
        full_name: form.fullName.trim(),
        phone: form.phone.trim(),
        license_number: form.licenseNumber.trim(),
        license_expiry: form.licenseExpiry.trim(),
        emergency_contact_name: form.emergencyContact.trim() || null,
        emergency_contact_phone: form.emergencyPhone.trim() || null,
        certifications: form.certifications.trim() || null,
        status: 'pending',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

      if (driverError) throw driverError;

      // 3. Create ambulance vehicle record (optional — link to driver)
      if (form.vehicleNumber.trim()) {
        await supabase.from('health_ambulances').insert({
          vehicle_number: form.vehicleNumber.trim(),
          model: form.vehicleModel.trim(),
          insurance_provider: form.insuranceProvider.trim() || null,
          insurance_policy: form.insurancePolicy.trim() || null,
          status: 'available',
          created_at: new Date().toISOString(),
        });
      }

      Alert.alert(
        'Application Submitted',
        'Your driver registration is pending approval. You will be notified once verified.',
        [{ text: 'OK', onPress: () => router.replace('/health') }]
      );
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to submit registration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={22} color="#1e293b" />
      </TouchableOpacity>

      <Text style={s.title}>Driver Registration</Text>

      <View style={s.stepper}>
        {STEPS.map((_, i) => (
          <View key={i} style={s.stepWrap}>
            <View style={[s.stepCircle, i === step && s.stepActive, i < step && s.stepDone]}>
              <Text style={[s.stepNum, (i === step || i < step) && s.stepNumActive]}>{i + 1}</Text>
            </View>
            <Text style={[s.stepLabel, i === step && s.stepLabelActive]}>{STEPS[i]}</Text>
          </View>
        ))}
      </View>

      {step === 0 && (
        <View style={s.form}>
          <Text style={s.label}>Full Name</Text>
          <View style={s.inputWrap}>
            <Ionicons name="person-outline" size={18} color="#94a3b8" style={s.inputIcon} />
            <TextInput style={s.input} placeholder="John Doe" value={form.fullName} onChangeText={(v) => update('fullName', v)} />
          </View>

          <Text style={s.label}>Phone Number</Text>
          <View style={s.inputWrap}>
            <Ionicons name="call-outline" size={18} color="#94a3b8" style={s.inputIcon} />
            <TextInput style={s.input} placeholder="+254 700 000 000" value={form.phone} onChangeText={(v) => update('phone', v)} keyboardType="phone-pad" />
          </View>

          <Text style={s.label}>Driver License Number</Text>
          <View style={s.inputWrap}>
            <Ionicons name="card-outline" size={18} color="#94a3b8" style={s.inputIcon} />
            <TextInput style={s.input} placeholder="DL-12345678" value={form.licenseNumber} onChangeText={(v) => update('licenseNumber', v)} />
          </View>

          <Text style={s.label}>License Expiry Date</Text>
          <View style={s.inputWrap}>
            <Ionicons name="calendar-outline" size={18} color="#94a3b8" style={s.inputIcon} />
            <TextInput style={s.input} placeholder="YYYY-MM-DD" value={form.licenseExpiry} onChangeText={(v) => update('licenseExpiry', v)} />
          </View>
        </View>
      )}

      {step === 1 && (
        <View style={s.form}>
          <Text style={s.label}>Vehicle Registration Number</Text>
          <View style={s.inputWrap}>
            <Ionicons name="car-outline" size={18} color="#94a3b8" style={s.inputIcon} />
            <TextInput style={s.input} placeholder="KXX 123X" value={form.vehicleNumber} onChangeText={(v) => update('vehicleNumber', v)} />
          </View>

          <Text style={s.label}>Vehicle Model</Text>
          <View style={s.inputWrap}>
            <Ionicons name="build-outline" size={18} color="#94a3b8" style={s.inputIcon} />
            <TextInput style={s.input} placeholder="Toyota Hiace Ambulance" value={form.vehicleModel} onChangeText={(v) => update('vehicleModel', v)} />
          </View>

          <Text style={s.label}>Insurance Provider</Text>
          <View style={s.inputWrap}>
            <Ionicons name="shield-outline" size={18} color="#94a3b8" style={s.inputIcon} />
            <TextInput style={s.input} placeholder="e.g. Jubilee Insurance" value={form.insuranceProvider} onChangeText={(v) => update('insuranceProvider', v)} />
          </View>

          <Text style={s.label}>Insurance Policy Number</Text>
          <View style={s.inputWrap}>
            <Ionicons name="document-text-outline" size={18} color="#94a3b8" style={s.inputIcon} />
            <TextInput style={s.input} placeholder="Policy number" value={form.insurancePolicy} onChangeText={(v) => update('insurancePolicy', v)} />
          </View>
        </View>
      )}

      {step === 2 && (
        <View style={s.form}>
          <Text style={s.label}>Emergency Contact Name</Text>
          <View style={s.inputWrap}>
            <Ionicons name="people-outline" size={18} color="#94a3b8" style={s.inputIcon} />
            <TextInput style={s.input} placeholder="Next of kin" value={form.emergencyContact} onChangeText={(v) => update('emergencyContact', v)} />
          </View>

          <Text style={s.label}>Emergency Contact Phone</Text>
          <View style={s.inputWrap}>
            <Ionicons name="call-outline" size={18} color="#94a3b8" style={s.inputIcon} />
            <TextInput style={s.input} placeholder="+254 700 000 000" value={form.emergencyPhone} onChangeText={(v) => update('emergencyPhone', v)} keyboardType="phone-pad" />
          </View>

          <Text style={s.label}>Certifications / Training</Text>
          <View style={[s.inputWrap, { height: 100, alignItems: 'flex-start', paddingTop: 10 }]}>
            <TextInput
              style={[s.input, { height: 80, textAlignVertical: 'top' }]}
              placeholder="BLS, ACLS, etc."
              value={form.certifications}
              onChangeText={(v) => update('certifications', v)}
              multiline
            />
          </View>
        </View>
      )}

      <View style={s.actions}>
        {step > 0 && (
          <TouchableOpacity style={s.backAction} onPress={() => setStep(step - 1)} disabled={loading}>
            <Text style={s.backActionText}>Back</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={[s.nextAction, step === 0 && { flex: 1 }]} onPress={handleNext} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.nextActionText}>{step === STEPS.length - 1 ? 'Submit' : 'Next'}</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, paddingTop: 48, paddingBottom: 40 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  title: { fontSize: 22, fontWeight: '800', color: '#1e293b', marginBottom: 20 },
  stepper: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  stepWrap: { alignItems: 'center', flex: 1 },
  stepCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center' },
  stepActive: { backgroundColor: '#0ea5e9' },
  stepDone: { backgroundColor: '#10b981' },
  stepNum: { fontSize: 13, fontWeight: '700', color: '#64748b' },
  stepNumActive: { color: '#fff' },
  stepLabel: { fontSize: 10, color: '#94a3b8', marginTop: 6, textAlign: 'center' },
  stepLabelActive: { color: '#0ea5e9', fontWeight: '600' },
  form: { gap: 14 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: -6 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', paddingHorizontal: 12, height: 50 },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, fontSize: 15, color: '#1e293b' },
  actions: { flexDirection: 'row', gap: 12, marginTop: 24 },
  backAction: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#e2e8f0', alignItems: 'center' },
  backActionText: { fontSize: 15, fontWeight: '700', color: '#475569' },
  nextAction: { flex: 2, paddingVertical: 14, borderRadius: 12, backgroundColor: '#0ea5e9', alignItems: 'center' },
  nextActionText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
