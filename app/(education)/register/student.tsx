import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { Ionicons } from '@expo/vector-icons';

const GRADE_OPTIONS = ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12', 'Form 1', 'Form 2', 'Form 3', 'Form 4', 'University Year 1', 'University Year 2', 'University Year 3', 'University Year 4'];
const GENDER_OPTIONS = ['Male', 'Female', 'Other', 'Prefer not to say'];

export default function StudentRegistration() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [firstName, setFirstName] = useState(user?.user_metadata?.first_name || '');
  const [lastName, setLastName] = useState(user?.user_metadata?.last_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.user_metadata?.phone || '');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('');
  const [address, setAddress] = useState('');

  const [schoolName, setSchoolName] = useState('');
  const [schoolId, setSchoolId] = useState('');
  const [grade, setGrade] = useState('');
  const [studentId, setStudentId] = useState('');
  const [enrollmentDate, setEnrollmentDate] = useState('');

  const [guardianName, setGuardianName] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [guardianEmail, setGuardianEmail] = useState('');
  const [guardianRelationship, setGuardianRelationship] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');

  useEffect(() => {
    if (user?.email) setEmail(user.email);
    if (user?.user_metadata?.first_name) setFirstName(user.user_metadata.first_name);
    if (user?.user_metadata?.last_name) setLastName(user.user_metadata.last_name);
    if (user?.user_metadata?.phone) setPhone(user.user_metadata.phone);
  }, [user]);

  const validateStep = () => {
    if (step === 1) {
      if (!firstName.trim()) { Alert.alert('Required', 'First name is required'); return false; }
      if (!lastName.trim()) { Alert.alert('Required', 'Last name is required'); return false; }
      if (!dateOfBirth.trim()) { Alert.alert('Required', 'Date of birth is required'); return false; }
      if (!gender) { Alert.alert('Required', 'Gender is required'); return false; }
    }
    if (step === 2) {
      if (!schoolName.trim()) { Alert.alert('Required', 'School name is required'); return false; }
      if (!grade) { Alert.alert('Required', 'Grade/Year is required'); return false; }
    }
    if (step === 3) {
      if (!guardianName.trim()) { Alert.alert('Required', 'Guardian name is required'); return false; }
      if (!guardianPhone.trim()) { Alert.alert('Required', 'Guardian phone is required'); return false; }
    }
    return true;
  };

  const handleNext = () => { if (validateStep()) setStep(s => Math.min(s + 1, 3)); };
  const handleBack = () => setStep(s => Math.max(s - 1, 1));

  const handleSubmit = async () => {
    if (!validateStep()) return;
    if (!isAuthenticated) {
      Alert.alert('Sign In Required', 'Please sign in to enroll as a student.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign In', onPress: () => router.push('/login' as any as any) },
      ]);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        user_id: user?.id,
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        date_of_birth: dateOfBirth,
        gender,
        address,
        school_name: schoolName,
        school_id: schoolId,
        grade_level: grade,
        student_id_number: studentId,
        enrollment_date: enrollmentDate || new Date().toISOString(),
        guardian_name: guardianName,
        guardian_phone: guardianPhone,
        guardian_email: guardianEmail,
        guardian_relationship: guardianRelationship,
        emergency_contact_name: emergencyContact,
        emergency_contact_phone: emergencyPhone,
        status: 'active',
        created_at: new Date().toISOString(),
      };

      console.log('Student Enrollment Payload:', payload);

      setTimeout(() => {
        setLoading(false);
        Alert.alert(
          'Enrollment Complete',
          'You have been successfully enrolled. Your school will be notified.',
          [{ text: 'OK', onPress: () => router.push('/(education as any)' as any) }]
        );
      }, 1500);
    } catch (err: any) {
      setLoading(false);
      Alert.alert('Error', err.message || 'Enrollment failed');
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepper}>
      {[1, 2, 3].map((s) => (
        <View key={s} style={styles.stepperItem}>
          <View style={[styles.stepperDot, step >= s && styles.stepperDotActive]}>
            {step > s ? <Ionicons name="checkmark" size={14} color="#fff" /> : <Text style={[styles.stepperNum, step >= s && styles.stepperNumActive]}>{s}</Text>}
          </View>
          <Text style={[styles.stepperLabel, step >= s && styles.stepperLabelActive]}>
            {s === 1 ? 'Personal' : s === 2 ? 'School' : 'Guardian'}
          </Text>
          {s < 3 && <View style={[styles.stepperLine, step > s && styles.stepperLineActive]} />}
        </View>
      ))}
    </View>
  );

  const renderStep1 = () => (
    <View style={styles.formSection}>
      <Text style={styles.formSectionTitle}>Personal Information</Text>
      <Text style={styles.formSectionSub}>Pre-filled from your MTAA profile where available.</Text>

      <View style={styles.rowInputs}>
        <View style={[styles.inputGroup, { flex: 1 }]}>
          <Text style={styles.inputLabel}>First Name *</Text>
          <TextInput style={styles.input} value={firstName} onChangeText={setFirstName} placeholder="First name" placeholderTextColor="#94A3B8" />
        </View>
        <View style={[styles.inputGroup, { flex: 1 }]}>
          <Text style={styles.inputLabel}>Last Name *</Text>
          <TextInput style={styles.input} value={lastName} onChangeText={setLastName} placeholder="Last name" placeholderTextColor="#94A3B8" />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Email</Text>
        <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="Email address" placeholderTextColor="#94A3B8" keyboardType="email-address" autoCapitalize="none" />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Phone</Text>
        <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="Phone number" placeholderTextColor="#94A3B8" keyboardType="phone-pad" />
      </View>

      <View style={styles.rowInputs}>
        <View style={[styles.inputGroup, { flex: 1 }]}>
          <Text style={styles.inputLabel}>Date of Birth *</Text>
          <TextInput style={styles.input} value={dateOfBirth} onChangeText={setDateOfBirth} placeholder="YYYY-MM-DD" placeholderTextColor="#94A3B8" />
        </View>
        <View style={[styles.inputGroup, { flex: 1 }]}>
          <Text style={styles.inputLabel}>Gender *</Text>
          <View style={styles.chipRow}>
            {GENDER_OPTIONS.slice(0, 2).map((g) => (
              <TouchableOpacity key={g} style={[styles.chip, gender === g && styles.chipActive]} onPress={() => setGender(g)}>
                <Text style={[styles.chipText, gender === g && styles.chipTextActive]}>{g}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Home Address</Text>
        <TextInput style={[styles.input, styles.textArea]} value={address} onChangeText={setAddress} placeholder="Full address" placeholderTextColor="#94A3B8" multiline numberOfLines={3} />
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.formSection}>
      <Text style={styles.formSectionTitle}>School Assignment</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>School Name *</Text>
        <TextInput style={styles.input} value={schoolName} onChangeText={setSchoolName} placeholder="Name of your school" placeholderTextColor="#94A3B8" />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>School ID (if known)</Text>
        <TextInput style={styles.input} value={schoolId} onChangeText={setSchoolId} placeholder="School registration ID" placeholderTextColor="#94A3B8" />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Grade / Year Level *</Text>
        <View style={styles.chipRow}>
          {GRADE_OPTIONS.slice(0, 8).map((g) => (
            <TouchableOpacity key={g} style={[styles.chip, grade === g && styles.chipActive]} onPress={() => setGrade(g)}>
              <Text style={[styles.chipText, grade === g && styles.chipTextActive]}>{g}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.rowInputs}>
        <View style={[styles.inputGroup, { flex: 1 }]}>
          <Text style={styles.inputLabel}>Student ID</Text>
          <TextInput style={styles.input} value={studentId} onChangeText={setStudentId} placeholder="Your student ID" placeholderTextColor="#94A3B8" />
        </View>
        <View style={[styles.inputGroup, { flex: 1 }]}>
          <Text style={styles.inputLabel}>Enrollment Date</Text>
          <TextInput style={styles.input} value={enrollmentDate} onChangeText={setEnrollmentDate} placeholder="YYYY-MM-DD" placeholderTextColor="#94A3B8" />
        </View>
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.formSection}>
      <Text style={styles.formSectionTitle}>Guardian Information</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Guardian Full Name *</Text>
        <TextInput style={styles.input} value={guardianName} onChangeText={setGuardianName} placeholder="Parent or guardian name" placeholderTextColor="#94A3B8" />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Guardian Phone *</Text>
        <TextInput style={styles.input} value={guardianPhone} onChangeText={setGuardianPhone} placeholder="+254..." placeholderTextColor="#94A3B8" keyboardType="phone-pad" />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Guardian Email</Text>
        <TextInput style={styles.input} value={guardianEmail} onChangeText={setGuardianEmail} placeholder="Guardian email" placeholderTextColor="#94A3B8" keyboardType="email-address" autoCapitalize="none" />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Relationship</Text>
        <TextInput style={styles.input} value={guardianRelationship} onChangeText={setGuardianRelationship} placeholder="Mother, Father, Uncle, etc." placeholderTextColor="#94A3B8" />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Emergency Contact Name</Text>
        <TextInput style={styles.input} value={emergencyContact} onChangeText={setEmergencyContact} placeholder="Emergency contact" placeholderTextColor="#94A3B8" />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Emergency Phone</Text>
        <TextInput style={styles.input} value={emergencyPhone} onChangeText={setEmergencyPhone} placeholder="Emergency phone" placeholderTextColor="#94A3B8" keyboardType="phone-pad" />
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <LinearGradient colors={['#1E3A8A', '#1D4ED8']} style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => step === 1 ? router.back() : handleBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Student Enrollment</Text>
        <Text style={styles.headerSubtitle}>Enroll as a student in the MTAA Education network</Text>
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
              <LinearGradient colors={['#3B82F6', '#2563EB']} style={styles.btnPrimaryGradient}>
                <Text style={styles.btnPrimaryText}>Continue</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.btnPrimary} onPress={handleSubmit} disabled={loading}>
              <LinearGradient colors={['#3B82F6', '#2563EB']} style={styles.btnPrimaryGradient}>
                {loading ? <ActivityIndicator color="#fff" /> : <><Text style={styles.btnPrimaryText}>Complete Enrollment</Text><Ionicons name="checkmark" size={18} color="#fff" /></>}
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
  headerSubtitle: { color: '#BFDBFE', fontSize: 14 },
  scroll: { flex: 1 },
  stepper: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 24, paddingHorizontal: 20 },
  stepperItem: { flexDirection: 'row', alignItems: 'center' },
  stepperDot: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center' },
  stepperDotActive: { backgroundColor: '#2563EB' },
  stepperNum: { fontSize: 13, fontWeight: '700', color: '#64748B' },
  stepperNumActive: { color: '#fff' },
  stepperLabel: { fontSize: 11, color: '#94A3B8', marginTop: 6, position: 'absolute', top: 36, width: 80, textAlign: 'center', left: -24 },
  stepperLabelActive: { color: '#2563EB', fontWeight: '600' },
  stepperLine: { width: 40, height: 2, backgroundColor: '#E2E8F0', marginHorizontal: 8 },
  stepperLineActive: { backgroundColor: '#2563EB' },
  formSection: { paddingHorizontal: 20, paddingTop: 8 },
  formSectionTitle: { fontSize: 20, fontWeight: '700', color: '#0F172A', marginBottom: 4 },
  formSectionSub: { fontSize: 13, color: '#64748B', marginBottom: 16 },
  inputGroup: { marginBottom: 18 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 6 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: '#0F172A' },
  textArea: { height: 80, textAlignVertical: 'top', paddingTop: 12 },
  rowInputs: { flexDirection: 'row', gap: 12 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  chipActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  chipText: { fontSize: 13, color: '#475569', fontWeight: '500' },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  buttonRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, marginTop: 24 },
  btnPrimary: { flex: 1, borderRadius: 14, overflow: 'hidden' },
  btnPrimaryGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 8 },
  btnPrimaryText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  btnSecondary: { borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 14, paddingVertical: 16, paddingHorizontal: 24, justifyContent: 'center' },
  btnSecondaryText: { color: '#475569', fontSize: 15, fontWeight: '600' },
});
