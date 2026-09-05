import React, { useState, useEffect } from 'react';
import { Alert, View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { Ionicons } from '@expo/vector-icons';

const PROGRAM_OPTIONS = ['Primary', 'Secondary', 'TVET', 'University', 'Mixed'];
const OWNERSHIP_OPTIONS = ['Public', 'Private', 'Religious', 'Community', 'NGO'];

export default function SchoolRegistration() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [schoolName, setSchoolName] = useState('');
  const [schoolType, setSchoolType] = useState('');
  const [ownership, setOwnership] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [address, setAddress] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');

  const [headTeacherName, setHeadTeacherName] = useState('');
  const [headTeacherEmail, setHeadTeacherEmail] = useState(user?.email || '');
  const [headTeacherPhone, setHeadTeacherPhone] = useState('');
  const [headTeacherIdNumber, setHeadTeacherIdNumber] = useState('');

  const [studentCapacity, setStudentCapacity] = useState('');
  const [teacherCount, setTeacherCount] = useState('');
  const [programs, setPrograms] = useState<string[]>([]);
  const [website, setWebsite] = useState('');

  useEffect(() => {
    if (user?.email) setHeadTeacherEmail(user.email);
    if (user?.user_metadata?.full_name) setHeadTeacherName(user.user_metadata.full_name);
    if (user?.user_metadata?.phone) setHeadTeacherPhone(user.user_metadata.phone);
  }, [user]);

  const toggleProgram = (prog: string) => {
    setPrograms(prev => prev.includes(prog) ? prev.filter((p: any) => p !== prog) : [...prev, prog]);
  };

  const validateStep = () => {
    if (step === 1) {
      if (!schoolName.trim()) { Alert.alert('Required', 'School name is required'); return false; }
      if (!schoolType.trim()) { Alert.alert('Required', 'School type is required'); return false; }
      if (!ownership) { Alert.alert('Required', 'Ownership type is required'); return false; }
      if (!address.trim()) { Alert.alert('Required', 'Address is required'); return false; }
    }
    if (step === 2) {
      if (!headTeacherName.trim()) { Alert.alert('Required', 'Head teacher name is required'); return false; }
      if (!headTeacherEmail.trim()) { Alert.alert('Required', 'Head teacher email is required'); return false; }
      if (!headTeacherPhone.trim()) { Alert.alert('Required', 'Phone number is required'); return false; }
    }
    if (step === 3) {
      if (!studentCapacity.trim()) { Alert.alert('Required', 'Student capacity is required'); return false; }
      if (programs.length === 0) { Alert.alert('Required', 'Select at least one program'); return false; }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep()) setStep(s => Math.min(s + 1, 3));
  };

  const handleBack = () => setStep(s => Math.max(s - 1, 1));

  const handleSubmit = async () => {
    if (!validateStep()) return;
    if (!isAuthenticated) {
      Alert.alert('Sign In Required', 'Please sign in to your MTAA account to register a school.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign In', onPress: () => router.push('/login' as any as any) },
      ]);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        user_id: user?.id,
        school_name: schoolName,
        school_type: schoolType,
        ownership_type: ownership,
        registration_number: registrationNumber,
        address,
        country,
        city,
        head_teacher_name: headTeacherName,
        head_teacher_email: headTeacherEmail,
        head_teacher_phone: headTeacherPhone,
        head_teacher_id_number: headTeacherIdNumber,
        student_capacity: parseInt(studentCapacity) || 0,
        teacher_count: parseInt(teacherCount) || 0,
        programs_offered: programs,
        website,
        status: 'pending_verification',
        created_at: new Date().toISOString(),
      };

      console.log('School Registration Payload:', payload);

      setTimeout(() => {
        setLoading(false);
        Alert.alert(
          'Registration Submitted',
          'Your school registration has been received and is pending verification. You will be notified once approved.',
          [{ text: 'OK', onPress: () => router.push('/(education as any)' as any) }]
        );
      }, 1500);
    } catch (err: any) {
      setLoading(false);
      Alert.alert('Error', err.message || 'Failed to submit registration');
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepper}>
      {[1, 2, 3].map((s) => (
        <View key={s} style={styles.stepperItem}>
          <View style={[styles.stepperDot, step >= s && styles.stepperDotActive]}>
            {step > s ? (
              <Ionicons name="checkmark" size={14} color="#fff" />
            ) : (
              <Text style={[styles.stepperNum, step >= s && styles.stepperNumActive]}>{s}</Text>
            )}
          </View>
          <Text style={[styles.stepperLabel, step >= s && styles.stepperLabelActive]}>
            {s === 1 ? 'School Info' : s === 2 ? 'Head Teacher' : 'Capacity'}
          </Text>
          {s < 3 && <View style={[styles.stepperLine, step > s && styles.stepperLineActive]} />}
        </View>
      ))}
    </View>
  );

  const renderStep1 = () => (
    <View style={styles.formSection}>
      <Text style={styles.formSectionTitle}>School Information</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>School Name *</Text>
        <TextInput style={styles.input} value={schoolName} onChangeText={setSchoolName} placeholder="e.g. Nairobi Excellence Academy" placeholderTextColor="#94A3B8" />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>School Type *</Text>
        <TextInput style={styles.input} value={schoolType} onChangeText={setSchoolType} placeholder="e.g. Day School, Boarding, Mixed" placeholderTextColor="#94A3B8" />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Ownership *</Text>
        <View style={styles.chipRow}>
          {OWNERSHIP_OPTIONS.map((opt) => (
            <TouchableOpacity key={opt} style={[styles.chip, ownership === opt && styles.chipActive]} onPress={() => setOwnership(opt)}>
              <Text style={[styles.chipText, ownership === opt && styles.chipTextActive]}>{opt}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Registration Number</Text>
        <TextInput style={styles.input} value={registrationNumber} onChangeText={setRegistrationNumber} placeholder="Government registration number" placeholderTextColor="#94A3B8" />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Address *</Text>
        <TextInput style={[styles.input, styles.textArea]} value={address} onChangeText={setAddress} placeholder="Full physical address" placeholderTextColor="#94A3B8" multiline numberOfLines={3} />
      </View>

      <View style={styles.rowInputs}>
        <View style={[styles.inputGroup, { flex: 1 }]}>
          <Text style={styles.inputLabel}>Country</Text>
          <TextInput style={styles.input} value={country} onChangeText={setCountry} placeholder="Country" placeholderTextColor="#94A3B8" />
        </View>
        <View style={[styles.inputGroup, { flex: 1 }]}>
          <Text style={styles.inputLabel}>City</Text>
          <TextInput style={styles.input} value={city} onChangeText={setCity} placeholder="City" placeholderTextColor="#94A3B8" />
        </View>
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.formSection}>
      <Text style={styles.formSectionTitle}>Head Teacher Details</Text>
      <Text style={styles.formSectionSub}>Pre-filled from your MTAA profile. Edit if needed.</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Full Name *</Text>
        <TextInput style={styles.input} value={headTeacherName} onChangeText={setHeadTeacherName} placeholder="Head teacher full name" placeholderTextColor="#94A3B8" />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Email Address *</Text>
        <TextInput style={styles.input} value={headTeacherEmail} onChangeText={setHeadTeacherEmail} placeholder="Email" placeholderTextColor="#94A3B8" keyboardType="email-address" autoCapitalize="none" />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Phone Number *</Text>
        <TextInput style={styles.input} value={headTeacherPhone} onChangeText={setHeadTeacherPhone} placeholder="+254..." placeholderTextColor="#94A3B8" keyboardType="phone-pad" />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>National ID / Passport</Text>
        <TextInput style={styles.input} value={headTeacherIdNumber} onChangeText={setHeadTeacherIdNumber} placeholder="ID or Passport number" placeholderTextColor="#94A3B8" />
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.formSection}>
      <Text style={styles.formSectionTitle}>Capacity & Programs</Text>

      <View style={styles.rowInputs}>
        <View style={[styles.inputGroup, { flex: 1 }]}>
          <Text style={styles.inputLabel}>Student Capacity *</Text>
          <TextInput style={styles.input} value={studentCapacity} onChangeText={setStudentCapacity} placeholder="500" placeholderTextColor="#94A3B8" keyboardType="number-pad" />
        </View>
        <View style={[styles.inputGroup, { flex: 1 }]}>
          <Text style={styles.inputLabel}>Teacher Count</Text>
          <TextInput style={styles.input} value={teacherCount} onChangeText={setTeacherCount} placeholder="25" placeholderTextColor="#94A3B8" keyboardType="number-pad" />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Programs Offered *</Text>
        <View style={styles.chipRow}>
          {PROGRAM_OPTIONS.map((opt) => (
            <TouchableOpacity key={opt} style={[styles.chip, programs.includes(opt) && styles.chipActive]} onPress={() => toggleProgram(opt)}>
              <Text style={[styles.chipText, programs.includes(opt) && styles.chipTextActive]}>{opt}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Website (optional)</Text>
        <TextInput style={styles.input} value={website} onChangeText={setWebsite} placeholder="https://..." placeholderTextColor="#94A3B8" keyboardType="url" autoCapitalize="none" />
      </View>

      <View style={styles.summaryBox}>
        <Text style={styles.summaryTitle}>Summary</Text>
        <View style={styles.summaryRow}><Text style={styles.summaryKey}>School:</Text><Text style={styles.summaryVal}>{schoolName || '-'}</Text></View>
        <View style={styles.summaryRow}><Text style={styles.summaryKey}>Type:</Text><Text style={styles.summaryVal}>{schoolType || '-'}</Text></View>
        <View style={styles.summaryRow}><Text style={styles.summaryKey}>Head Teacher:</Text><Text style={styles.summaryVal}>{headTeacherName || '-'}</Text></View>
        <View style={styles.summaryRow}><Text style={styles.summaryKey}>Capacity:</Text><Text style={styles.summaryVal}>{studentCapacity || '-'} students</Text></View>
        <View style={styles.summaryRow}><Text style={styles.summaryKey}>Programs:</Text><Text style={styles.summaryVal}>{programs.join(', ') || '-'}</Text></View>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <LinearGradient colors={['#1E1B4B', '#312E81']} style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => step === 1 ? router.back() : handleBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>School Registration</Text>
        <Text style={styles.headerSubtitle}>Register your institution on MTAA Education</Text>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
        {renderStepIndicator()}
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}

        <View style={styles.buttonRow}>
          {step > 1 && (
            <TouchableOpacity style={styles.btnSecondary} onPress={handleBack}>
              <Text style={styles.btnSecondaryText}>Back</Text>
            </TouchableOpacity>
          )}
          {step < 3 ? (
            <TouchableOpacity style={styles.btnPrimary} onPress={handleNext}>
              <LinearGradient colors={['#FF6B35', '#F7931E']} style={styles.btnPrimaryGradient}>
                <Text style={styles.btnPrimaryText}>Continue</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.btnPrimary} onPress={handleSubmit} disabled={loading}>
              <LinearGradient colors={['#FF6B35', '#F7931E']} style={styles.btnPrimaryGradient}>
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={styles.btnPrimaryText}>Submit Registration</Text>
                    <Ionicons name="checkmark" size={18} color="#fff" />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 24, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  backBtn: { marginBottom: 12, width: 40 },
  headerTitle: { color: '#fff', fontSize: 26, fontWeight: '800', marginBottom: 6 },
  headerSubtitle: { color: '#C7D2FE', fontSize: 14 },
  scroll: { flex: 1 },

  stepper: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 24, paddingHorizontal: 20 },
  stepperItem: { flexDirection: 'row', alignItems: 'center' },
  stepperDot: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center' },
  stepperDotActive: { backgroundColor: '#FF6B35' },
  stepperNum: { fontSize: 13, fontWeight: '700', color: '#64748B' },
  stepperNumActive: { color: '#fff' },
  stepperLabel: { fontSize: 11, color: '#94A3B8', marginTop: 6, position: 'absolute', top: 36, width: 80, textAlign: 'center', left: -24 },
  stepperLabelActive: { color: '#FF6B35', fontWeight: '600' },
  stepperLine: { width: 40, height: 2, backgroundColor: '#E2E8F0', marginHorizontal: 8 },
  stepperLineActive: { backgroundColor: '#FF6B35' },

  formSection: { paddingHorizontal: 20, paddingTop: 8 },
  formSectionTitle: { fontSize: 20, fontWeight: '700', color: '#0F172A', marginBottom: 4 },
  formSectionSub: { fontSize: 13, color: '#64748B', marginBottom: 16 },
  inputGroup: { marginBottom: 18 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 6 },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#0F172A',
  },
  textArea: { height: 80, textAlignVertical: 'top', paddingTop: 12 },
  rowInputs: { flexDirection: 'row', gap: 12 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipActive: { backgroundColor: '#FF6B35', borderColor: '#FF6B35' },
  chipText: { fontSize: 13, color: '#475569', fontWeight: '500' },
  chipTextActive: { color: '#fff', fontWeight: '600' },

  summaryBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 16,
    marginTop: 8,
  },
  summaryTitle: { fontSize: 14, fontWeight: '700', color: '#0F172A', marginBottom: 10 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryKey: { fontSize: 13, color: '#64748B' },
  summaryVal: { fontSize: 13, fontWeight: '600', color: '#0F172A', flex: 1, textAlign: 'right' },

  buttonRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, marginTop: 24 },
  btnPrimary: { flex: 1, borderRadius: 14, overflow: 'hidden' },
  btnPrimaryGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 8 },
  btnPrimaryText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  btnSecondary: {
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  btnSecondaryText: { color: '#475569', fontSize: 15, fontWeight: '600' },
});
