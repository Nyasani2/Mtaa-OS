import React, { useState, useEffect } from 'react';
import { Alert, View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Alert, LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { Alert, Ionicons } from '@expo/vector-icons';

const GENDER_OPTIONS = ['Male', 'Female', 'Other', 'Prefer not to say'];
const SUBJECT_OPTIONS = ['Mathematics', 'English', 'Science', 'Social Studies', 'Kiswahili', 'ICT', 'Arts', 'Music', 'PE', 'Religion', 'Business', 'Agriculture'];
const EMPLOYMENT_OPTIONS = ['Full-time', 'Part-time', 'Contract', 'Intern', 'Volunteer'];

export default function TeacherRegistration() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [firstName, setFirstName] = useState(user?.user_metadata?.first_name || '');
  const [lastName, setLastName] = useState(user?.user_metadata?.last_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.user_metadata?.phone || '');
  const [gender, setGender] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [address, setAddress] = useState('');

  const [schoolName, setSchoolName] = useState('');
  const [schoolId, setSchoolId] = useState('');
  const [employmentType, setEmploymentType] = useState('');
  const [subjects, setSubjects] = useState<string[]>([]);
  const [joinDate, setJoinDate] = useState('');

  const [highestQualification, setHighestQualification] = useState('');
  const [institution, setInstitution] = useState('');
  const [yearCompleted, setYearCompleted] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseBody, setLicenseBody] = useState('');
  const [yearsExperience, setYearsExperience] = useState('');
  const [bio, setBio] = useState('');

  useEffect(() => {
    if (user?.email) setEmail(user.email);
    if (user?.user_metadata?.first_name) setFirstName(user.user_metadata.first_name);
    if (user?.user_metadata?.last_name) setLastName(user.user_metadata.last_name);
    if (user?.user_metadata?.phone) setPhone(user.user_metadata.phone);
  }, [user]);

  const toggleSubject = (subj: string) => {
    setSubjects(prev => prev.includes(subj) ? prev.filter((s: any) => s !== subj) : [...prev, subj]);
  };

  const validateStep = () => {
    if (step === 1) {
      if (!firstName.trim()) { Alert.alert('Required', 'First name is required'); return false; }
      if (!lastName.trim()) { Alert.alert('Required', 'Last name is required'); return false; }
      if (!phone.trim()) { Alert.alert('Required', 'Phone number is required'); return false; }
      if (!nationalId.trim()) { Alert.alert('Required', 'National ID is required'); return false; }
    }
    if (step === 2) {
      if (!schoolName.trim()) { Alert.alert('Required', 'School name is required'); return false; }
      if (!employmentType) { Alert.alert('Required', 'Employment type is required'); return false; }
      if (subjects.length === 0) { Alert.alert('Required', 'Select at least one subject'); return false; }
    }
    if (step === 3) {
      if (!highestQualification.trim()) { Alert.alert('Required', 'Highest qualification is required'); return false; }
      if (!institution.trim()) { Alert.alert('Required', 'Institution is required'); return false; }
    }
    return true;
  };

  const handleNext = () => { if (validateStep()) setStep(s => Math.min(s + 1, 3)); };
  const handleBack = () => setStep(s => Math.max(s - 1, 1));

  const handleSubmit = async () => {
    if (!validateStep()) return;
    if (!isAuthenticated) {
      Alert.alert('Sign In Required', 'Please sign in to register as a teacher.', [
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
        date_of_birth: dateOfBirth,
        national_id: nationalId,
        address,
        school_name: schoolName,
        school_id: schoolId,
        employment_type: employmentType,
        subjects_taught: subjects,
        join_date: joinDate,
        highest_qualification: highestQualification,
        institution,
        year_completed: yearCompleted,
        license_number: licenseNumber,
        license_body: licenseBody,
        years_experience: parseInt(yearsExperience) || 0,
        bio,
        status: 'pending_approval',
        created_at: new Date().toISOString(),
      };

      console.log('Teacher Registration Payload:', payload);

      setTimeout(() => {
        setLoading(false);
        Alert.alert(
          'Application Submitted',
          'Your teacher application has been submitted. The school administration will review and approve your profile.',
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
            {s === 1 ? 'Personal' : s === 2 ? 'School' : 'Qualifications'}
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
        <Text style={styles.inputLabel}>Phone Number *</Text>
        <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="+254..." placeholderTextColor="#94A3B8" keyboardType="phone-pad" />
      </View>

      <View style={styles.rowInputs}>
        <View style={[styles.inputGroup, { flex: 1 }]}>
          <Text style={styles.inputLabel}>Gender</Text>
          <View style={styles.chipRow}>
            {GENDER_OPTIONS.slice(0, 2).map((g) => (
              <TouchableOpacity key={g} style={[styles.chip, gender === g && styles.chipActive]} onPress={() => setGender(g)}>
                <Text style={[styles.chipText, gender === g && styles.chipTextActive]}>{g}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={[styles.inputGroup, { flex: 1 }]}>
          <Text style={styles.inputLabel}>Date of Birth</Text>
          <TextInput style={styles.input} value={dateOfBirth} onChangeText={setDateOfBirth} placeholder="YYYY-MM-DD" placeholderTextColor="#94A3B8" />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>National ID *</Text>
        <TextInput style={styles.input} value={nationalId} onChangeText={setNationalId} placeholder="National ID number" placeholderTextColor="#94A3B8" />
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
        <TextInput style={styles.input} value={schoolName} onChangeText={setSchoolName} placeholder="School you are joining" placeholderTextColor="#94A3B8" />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>School ID (if known)</Text>
        <TextInput style={styles.input} value={schoolId} onChangeText={setSchoolId} placeholder="School registration ID" placeholderTextColor="#94A3B8" />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Employment Type *</Text>
        <View style={styles.chipRow}>
          {EMPLOYMENT_OPTIONS.map((e) => (
            <TouchableOpacity key={e} style={[styles.chip, employmentType === e && styles.chipActive]} onPress={() => setEmploymentType(e)}>
              <Text style={[styles.chipText, employmentType === e && styles.chipTextActive]}>{e}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Subjects You Teach *</Text>
        <View style={styles.chipRow}>
          {SUBJECT_OPTIONS.map((s) => (
            <TouchableOpacity key={s} style={[styles.chip, subjects.includes(s) && styles.chipActive]} onPress={() => toggleSubject(s)}>
              <Text style={[styles.chipText, subjects.includes(s) && styles.chipTextActive]}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Expected Join Date</Text>
        <TextInput style={styles.input} value={joinDate} onChangeText={setJoinDate} placeholder="YYYY-MM-DD" placeholderTextColor="#94A3B8" />
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.formSection}>
      <Text style={styles.formSectionTitle}>Qualifications & Experience</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Highest Qualification *</Text>
        <TextInput style={styles.input} value={highestQualification} onChangeText={setHighestQualification} placeholder="e.g. Bachelor of Education" placeholderTextColor="#94A3B8" />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Institution *</Text>
        <TextInput style={styles.input} value={institution} onChangeText={setInstitution} placeholder="University or college name" placeholderTextColor="#94A3B8" />
      </View>

      <View style={styles.rowInputs}>
        <View style={[styles.inputGroup, { flex: 1 }]}>
          <Text style={styles.inputLabel}>Year Completed</Text>
          <TextInput style={styles.input} value={yearCompleted} onChangeText={setYearCompleted} placeholder="YYYY" placeholderTextColor="#94A3B8" keyboardType="number-pad" />
        </View>
        <View style={[styles.inputGroup, { flex: 1 }]}>
          <Text style={styles.inputLabel}>Years Experience</Text>
          <TextInput style={styles.input} value={yearsExperience} onChangeText={setYearsExperience} placeholder="e.g. 5" placeholderTextColor="#94A3B8" keyboardType="number-pad" />
        </View>
      </View>

      <View style={styles.rowInputs}>
        <View style={[styles.inputGroup, { flex: 1 }]}>
          <Text style={styles.inputLabel}>License Number</Text>
          <TextInput style={styles.input} value={licenseNumber} onChangeText={setLicenseNumber} placeholder="Teaching license" placeholderTextColor="#94A3B8" />
        </View>
        <View style={[styles.inputGroup, { flex: 1 }]}>
          <Text style={styles.inputLabel}>License Body</Text>
          <TextInput style={styles.input} value={licenseBody} onChangeText={setLicenseBody} placeholder="e.g. TSC Kenya" placeholderTextColor="#94A3B8" />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Professional Bio</Text>
        <TextInput style={[styles.input, styles.textArea]} value={bio} onChangeText={setBio} placeholder="Brief description of your teaching experience and philosophy..." placeholderTextColor="#94A3B8" multiline numberOfLines={4} />
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <LinearGradient colors={['#5B21B6', '#7C3AED']} style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => step === 1 ? router.back() : handleBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Teacher Onboarding</Text>
        <Text style={styles.headerSubtitle}>Join a school as an educator on MTAA</Text>
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
              <LinearGradient colors={['#8B5CF6', '#7C3AED']} style={styles.btnPrimaryGradient}>
                <Text style={styles.btnPrimaryText}>Continue</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.btnPrimary} onPress={handleSubmit} disabled={loading}>
              <LinearGradient colors={['#8B5CF6', '#7C3AED']} style={styles.btnPrimaryGradient}>
                {loading ? <ActivityIndicator color="#fff" /> : <><Text style={styles.btnPrimaryText}>Submit Application</Text><Ionicons name="checkmark" size={18} color="#fff" /></>}
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
  headerSubtitle: { color: '#DDD6FE', fontSize: 14 },
  scroll: { flex: 1 },
  stepper: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 24, paddingHorizontal: 20 },
  stepperItem: { flexDirection: 'row', alignItems: 'center' },
  stepperDot: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center' },
  stepperDotActive: { backgroundColor: '#7C3AED' },
  stepperNum: { fontSize: 13, fontWeight: '700', color: '#64748B' },
  stepperNumActive: { color: '#fff' },
  stepperLabel: { fontSize: 11, color: '#94A3B8', marginTop: 6, position: 'absolute', top: 36, width: 80, textAlign: 'center', left: -24 },
  stepperLabelActive: { color: '#7C3AED', fontWeight: '600' },
  stepperLine: { width: 40, height: 2, backgroundColor: '#E2E8F0', marginHorizontal: 8 },
  stepperLineActive: { backgroundColor: '#7C3AED' },
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
  chipActive: { backgroundColor: '#7C3AED', borderColor: '#7C3AED' },
  chipText: { fontSize: 13, color: '#475569', fontWeight: '500' },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  buttonRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, marginTop: 24 },
  btnPrimary: { flex: 1, borderRadius: 14, overflow: 'hidden' },
  btnPrimaryGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 8 },
  btnPrimaryText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  btnSecondary: { borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 14, paddingVertical: 16, paddingHorizontal: 24, justifyContent: 'center' },
  btnSecondaryText: { color: '#475569', fontSize: 15, fontWeight: '600' },
});
