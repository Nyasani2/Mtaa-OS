import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  ActivityIndicator, Alert, Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const STEPS = ['Personal Info', 'Skills & Experience', 'Preferences', 'Review'];

export default function JobsOnboarding() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const [fullName, setFullName] = useState('');
  const [headline, setHeadline] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [bio, setBio] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [yearsExperience, setYearsExperience] = useState('');
  const [education, setEducation] = useState('');
  const [currentRole, setCurrentRole] = useState('');
  const [currentCompany, setCurrentCompany] = useState('');
  const [jobTypes, setJobTypes] = useState<string[]>([]);
  const [expectedSalary, setExpectedSalary] = useState('');
  const [isOpenToRemote, setIsOpenToRemote] = useState(false);
  const [isOpenToRelocation, setIsOpenToRelocation] = useState(false);
  const [preferredIndustries, setPreferredIndustries] = useState('');

  const skillOptions = [
    'JavaScript', 'Python', 'React', 'Node.js', 'Design',
    'Marketing', 'Sales', 'Data Analysis', 'Project Management',
    'Writing', 'Customer Service', 'Accounting', 'HR', 'Legal',
  ];

  const jobTypeOptions = ['Full-time', 'Part-time', 'Contract', 'Freelance', 'Internship'];

  const toggleSkill = (skill: string) => {
    setSkills(prev => prev.includes(skill) ? prev.filter((s: any) => s !== skill) : [...prev, skill]);
  };

  const toggleJobType = (type: string) => {
    setJobTypes(prev => prev.includes(type) ? prev.filter((t: any) => t !== type) : [...prev, type]);
  };

  const validateStep = () => {
    switch (step) {
      case 0:
        if (!fullName.trim()) return 'Full name is required';
        if (!phone.trim()) return 'Phone number is required';
        if (!city.trim()) return 'City is required';
        break;
      case 1:
        if (skills.length === 0) return 'Select at least one skill';
        if (!yearsExperience.trim()) return 'Years of experience is required';
        break;
      case 2:
        if (jobTypes.length === 0) return 'Select at least one job type';
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
        .from('worker_profiles')
        .insert({
          user_id: user.id,
          full_name: fullName.trim(),
          headline: headline.trim(),
          phone: phone.trim(),
          email: email.trim(),
          city: city.trim(),
          bio: bio.trim(),
          skills: skills,
          years_experience: parseInt(yearsExperience, 10) || 0,
          education: education.trim(),
          current_role: currentRole.trim(),
          current_company: currentCompany.trim(),
          job_types: jobTypes,
          expected_salary: parseFloat(expectedSalary) || null,
          is_open_to_remote: isOpenToRemote,
          is_open_to_relocation: isOpenToRelocation,
          preferred_industries: preferredIndustries.split(',').map((i: any) => i.trim()).filter(Boolean),
          status: 'active',
          is_available: true,
          profile_views: 0,
          applications_count: 0,
          worker_handle: fullName.trim().toLowerCase().replace(/\s+/g, '_'),
          is_active: true,
        });

      if (insertError) throw insertError;

      Alert.alert(
        'Profile Created',
        'Your professional profile is now live. Employers can find you and you can start applying to jobs.',
        [{ text: 'OK', onPress: () => router.replace('/(jobs)') }]
      );
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create profile');
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
            <Input label="Professional Headline" value={headline} onChangeText={setHeadline} icon="briefcase" placeholder="e.g. Senior React Developer" />
            <Input label="Phone *" value={phone} onChangeText={setPhone} icon="phone" keyboardType="phone-pad" />
            <Input label="Email" value={email} onChangeText={setEmail} icon="email" keyboardType="email-address" />
            <Input label="City *" value={city} onChangeText={setCity} icon="map-marker" />
            <Input label="Bio" value={bio} onChangeText={setBio} icon="text" placeholder="Tell employers about yourself" multiline />
          </View>
        );
      case 1:
        return (
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Skills & Experience</Text>
            <Text style={styles.label}>Skills *</Text>
            <View style={styles.chipContainer}>
              {skillOptions.map((skill: any) => (
                <TouchableOpacity key={skill} style={[styles.chip, skills.includes(skill) && styles.chipActive]} onPress={() => toggleSkill(skill)}>
                  <Text style={[styles.chipText, skills.includes(skill) && styles.chipTextActive]}>{skill}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Input label="Years of Experience *" value={yearsExperience} onChangeText={setYearsExperience} icon="calendar" keyboardType="number-pad" />
            <Input label="Education" value={education} onChangeText={setEducation} icon="school" placeholder="e.g. BSc Computer Science" />
            <Input label="Current Role" value={currentRole} onChangeText={setCurrentRole} icon="briefcase" />
            <Input label="Current Company" value={currentCompany} onChangeText={setCurrentCompany} icon="office-building" />
          </View>
        );
      case 2:
        return (
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Job Preferences</Text>
            <Text style={styles.label}>Job Types *</Text>
            <View style={styles.chipContainer}>
              {jobTypeOptions.map((type: any) => (
                <TouchableOpacity key={type} style={[styles.chip, jobTypes.includes(type) && styles.chipActive]} onPress={() => toggleJobType(type)}>
                  <Text style={[styles.chipText, jobTypes.includes(type) && styles.chipTextActive]}>{type}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Input label="Expected Salary (KES/month)" value={expectedSalary} onChangeText={setExpectedSalary} icon="cash" keyboardType="decimal-pad" />
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Open to Remote Work</Text>
              <Switch value={isOpenToRemote} onValueChange={setIsOpenToRemote} trackColor={{ false: '#E5E7EB', true: '#2563EB' }} />
            </View>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Open to Relocation</Text>
              <Switch value={isOpenToRelocation} onValueChange={setIsOpenToRelocation} trackColor={{ false: '#E5E7EB', true: '#2563EB' }} />
            </View>
            <Input label="Preferred Industries (comma separated)" value={preferredIndustries} onChangeText={setPreferredIndustries} icon="domain" placeholder="e.g. Technology, Finance, Healthcare" />
          </View>
        );
      case 3:
        return (
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Review Your Profile</Text>
            <ReviewRow label="Name" value={fullName} />
            <ReviewRow label="Headline" value={headline} />
            <ReviewRow label="Contact" value={`${phone}${email ? ' / ' + email : ''}`} />
            <ReviewRow label="City" value={city} />
            <ReviewRow label="Skills" value={skills.join(', ')} />
            <ReviewRow label="Experience" value={`${yearsExperience} years`} />
            <ReviewRow label="Education" value={education} />
            <ReviewRow label="Current" value={`${currentRole}${currentCompany ? ' at ' + currentCompany : ''}`} />
            <ReviewRow label="Job Types" value={jobTypes.join(', ')} />
            <ReviewRow label="Salary" value={expectedSalary ? `KES ${expectedSalary}` : 'Not specified'} />
            <ReviewRow label="Remote" value={isOpenToRemote ? 'Yes' : 'No'} />
            <ReviewRow label="Relocation" value={isOpenToRelocation ? 'Yes' : 'No'} />
            <ReviewRow label="Industries" value={preferredIndustries} />
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
        <Text style={styles.headerTitle}>Create Job Profile</Text>
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
              <><Text style={styles.nextButtonText}>Create Profile</Text><MaterialCommunityIcons name="check" size={18} color="#FFF" /></>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

function Input({ label, value, onChangeText, icon, keyboardType = 'default', placeholder, multiline }: any) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputWrapper, multiline && { height: 100, alignItems: 'flex-start', paddingTop: 12 }]}>
        <MaterialCommunityIcons name={icon} size={18} color="#9CA3AF" style={styles.inputIcon} />
        <TextInput 
          style={[styles.input, multiline && { height: 80, textAlignVertical: 'top' }]} 
          value={value} 
          onChangeText={onChangeText} 
          keyboardType={keyboardType} 
          placeholder={placeholder} 
          placeholderTextColor="#9CA3AF"
          multiline={multiline}
        />
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
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  switchLabel: { fontSize: 15, color: '#374151', fontWeight: '500' },
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
