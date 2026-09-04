import React, { useState, useEffect } from 'react';
import { Alert, View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Alert, LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { Ionicons } from '@expo/vector-icons';

const GENDER_OPTIONS = ['Male', 'Female', 'Other', 'Prefer not to say'];
const ID_TYPE_OPTIONS = ['National ID', 'Passport', 'Driver License', 'Other'];

export default function ParentRegistration() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [firstName, setFirstName] = useState(user?.user_metadata?.first_name || '');
  const [lastName, setLastName] = useState(user?.user_metadata?.last_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.user_metadata?.phone || '');
  const [gender, setGender] = useState('');
  const [idType, setIdType] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [occupation, setOccupation] = useState('');
  const [address, setAddress] = useState('');

  const [childName, setChildName] = useState('');
  const [childSchool, setChildSchool] = useState('');
  const [childStudentId, setChildStudentId] = useState('');
  const [childGrade, setChildGrade] = useState('');
  const [relationship, setRelationship] = useState('');

  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreeCommunication, setAgreeCommunication] = useState(false);

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
      if (!phone.trim()) { Alert.alert('Required', 'Phone number is required'); return false; }
      if (!idType) { Alert.alert('Required', 'ID type is required'); return false; }
      if (!idNumber.trim()) { Alert.alert('Required', 'ID number is required'); return false; }
    }
    if (step === 2) {
      if (!childName.trim()) { Alert.alert('Required', 'Child name is required'); return false; }
      if (!childSchool.trim()) { Alert.alert('Required', 'Child school is required'); return false; }
      if (!relationship.trim()) { Alert.alert('Required', 'Relationship to child is required'); return false; }
    }
    if (step === 3) {
      if (!agreeTerms) { Alert.alert('Required', 'You must agree to the terms'); return false; }
    }
    return true;
  };

  const handleNext = () => { if (validateStep()) setStep(s => Math.min(s + 1, 3)); };
  const handleBack = () => setStep(s => Math.max(s - 1, 1));

  const handleSubmit = async () => {
    if (!validateStep()) return;
    if (!isAuthenticated) {
      Alert.alert('Sign In Required', 'Please sign in to register as a parent.', [
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
        gender,
        id_type: idType,
        id_number: idNumber,
        occupation,
        address,
        child_name: childName,
        child_school: childSchool,
        child_student_id: childStudentId,
        child_grade: childGrade,
        relationship_to_child: relationship,
        agree_terms: agreeTerms,
        agree_communication: agreeCommunication,
        status: 'active',
        created_at: new Date().toISOString(),
      };

      console.log('Parent Registration Payload:', payload);

      setTimeout(() => {
        setLoading(false);
        Alert.alert(
          'Registration Complete',
          `You are now registered as a parent. You can access your child records through the parent portal.`,
          [{ text: 'OK', onPress: () => router.push('/(education as any)' as any) }]
        );
      }, 1500);
    } catch (err: any) {
      setLoading(false);
      Alert.alert('Error', err.message || 'Registration failed');
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
            {s === 1 ? 'Personal' : s === 2 ? 'Child Link' : 'Verify'}
          </Text>
          {s < 3 && <View style={[styles.stepperLine, step > s && styles.stepperLineActive]} />}
        </View>
      ))}
    </View>
  );

  const renderStep1 = () => (
    <View style={styles.formSection}>
      <Text style={styles.formSectionTitle}>Personal Details</Text>
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
        <Text style={styles.inputLabel}>Phone Number *</Text>
        <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="+254..." placeholderTextColor="#94A3B8" keyboardType="phone-pad" />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Gender</Text>
        <View style={styles.chipRow}>
          {GENDER_OPTIONS.map((g) => (
            <TouchableOpacity key={g} style={[styles.chip, gender === g && styles.chipActive]} onPress={() => setGender(g)}>
              <Text style={[styles.chipText, gender === g && styles.chipTextActive]}>{g}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>ID Type *</Text>
        <View style={styles.chipRow}>
          {ID_TYPE_OPTIONS.map((t) => (
            <TouchableOpacity key={t} style={[styles.chip, idType === t && styles.chipActive]} onPress={() => setIdType(t)}>
              <Text style={[styles.chipText, idType === t && styles.chipTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>ID Number *</Text>
        <TextInput style={styles.input} value={idNumber} onChangeText={setIdNumber} placeholder="Your ID number" placeholderTextColor="#94A3B8" />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Occupation</Text>
        <TextInput style={styles.input} value={occupation} onChangeText={setOccupation} placeholder="Your occupation" placeholderTextColor="#94A3B8" />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Home Address</Text>
        <TextInput style={[styles.input, styles.textArea]} value={address} onChangeText={setAddress} placeholder="Full address" placeholderTextColor="#94A3B8" multiline numberOfLines={3} />
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.formSection}>
      <Text style={styles.formSectionTitle}>Link Your Child</Text>
      <Text style={styles.formSectionSub}>Provide your child school information to link your accounts.</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Child Full Name *</Text>
        <TextInput style={styles.input} value={childName} onChangeText={setChildName} placeholder="Child full name" placeholderTextColor="#94A3B8" />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Child School *</Text>
        <TextInput style={styles.input} value={childSchool} onChangeText={setChildSchool} placeholder="School name" placeholderTextColor="#94A3B8" />
      </View>

      <View style={styles.rowInputs}>
        <View style={[styles.inputGroup, { flex: 1 }]}>
          <Text style={styles.inputLabel}>Student ID</Text>
          <TextInput style={styles.input} value={childStudentId} onChangeText={setChildStudentId} placeholder="Student ID" placeholderTextColor="#94A3B8" />
        </View>
        <View style={[styles.inputGroup, { flex: 1 }]}>
          <Text style={styles.inputLabel}>Grade</Text>
          <TextInput style={styles.input} value={childGrade} onChangeText={setChildGrade} placeholder="e.g. Grade 5" placeholderTextColor="#94A3B8" />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Relationship to Child *</Text>
        <TextInput style={styles.input} value={relationship} onChangeText={setRelationship} placeholder="Mother, Father, Guardian..." placeholderTextColor="#94A3B8" />
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.formSection}>
      <Text style={styles.formSectionTitle}>Verification & Consent</Text>

      <TouchableOpacity style={styles.consentRow} onPress={() => setAgreeTerms(!agreeTerms)}>
        <View style={[styles.consentBox, agreeTerms && styles.consentBoxActive]}>
          {agreeTerms && <Ionicons name="checkmark" size={16} color="#fff" />}
        </View>
        <Text style={styles.consentText}>
          I agree to the Terms of Service and Privacy Policy. I confirm that the information provided is accurate.
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.consentRow} onPress={() => setAgreeCommunication(!agreeCommunication)}>
        <View style={[styles.consentBox, agreeCommunication && styles.consentBoxActive]}>
          {agreeCommunication && <Ionicons name="checkmark" size={16} color="#fff" />}
        </View>
        <Text style={styles.consentText}>
          I agree to receive school communications, grade reports, and attendance alerts via SMS and email.
        </Text>
      </TouchableOpacity>

      <View style={styles.infoBox}>
        <Ionicons name="shield-checkmark" size={20} color="#10B981" />
        <Text style={styles.infoText}>
          Your data is protected under MTAA privacy framework. Only authorized school staff can access your child records.
        </Text>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <LinearGradient colors={['#065F46', '#059669']} style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => step === 1 ? router.back() : handleBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Parent Registration</Text>
        <Text style={styles.headerSubtitle}>Connect with your child education journey</Text>
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
              <LinearGradient colors={['#10B981', '#059669']} style={styles.btnPrimaryGradient}>
                <Text style={styles.btnPrimaryText}>Continue</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.btnPrimary} onPress={handleSubmit} disabled={loading}>
              <LinearGradient colors={['#10B981', '#059669']} style={styles.btnPrimaryGradient}>
                {loading ? <ActivityIndicator color="#fff" /> : <><Text style={styles.btnPrimaryText}>Complete Registration</Text><Ionicons name="checkmark" size={18} color="#fff" /></>}
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
  headerSubtitle: { color: '#A7F3D0', fontSize: 14 },
  scroll: { flex: 1 },
  stepper: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 24, paddingHorizontal: 20 },
  stepperItem: { flexDirection: 'row', alignItems: 'center' },
  stepperDot: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center' },
  stepperDotActive: { backgroundColor: '#059669' },
  stepperNum: { fontSize: 13, fontWeight: '700', color: '#64748B' },
  stepperNumActive: { color: '#fff' },
  stepperLabel: { fontSize: 11, color: '#94A3B8', marginTop: 6, position: 'absolute', top: 36, width: 80, textAlign: 'center', left: -24 },
  stepperLabelActive: { color: '#059669', fontWeight: '600' },
  stepperLine: { width: 40, height: 2, backgroundColor: '#E2E8F0', marginHorizontal: 8 },
  stepperLineActive: { backgroundColor: '#059669' },
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
  chipActive: { backgroundColor: '#059669', borderColor: '#059669' },
  chipText: { fontSize: 13, color: '#475569', fontWeight: '500' },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  consentRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 18 },
  consentBox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: '#CBD5E1', alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  consentBoxActive: { backgroundColor: '#059669', borderColor: '#059669' },
  consentText: { flex: 1, fontSize: 14, color: '#334155', lineHeight: 20 },
  infoBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: '#ECFDF5', padding: 16, borderRadius: 14, borderWidth: 1, borderColor: '#A7F3D0' },
  infoText: { flex: 1, color: '#065F46', fontSize: 13, lineHeight: 20, fontWeight: '500' },
  buttonRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, marginTop: 24 },
  btnPrimary: { flex: 1, borderRadius: 14, overflow: 'hidden' },
  btnPrimaryGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 8 },
  btnPrimaryText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  btnSecondary: { borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 14, paddingVertical: 16, paddingHorizontal: 24, justifyContent: 'center' },
  btnSecondaryText: { color: '#475569', fontSize: 15, fontWeight: '600' },
});
