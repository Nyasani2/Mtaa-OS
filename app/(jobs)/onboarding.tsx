import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  ActivityIndicator, Alert, Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/lib/auth/useAuth';
import { supabase } from '@/lib/supabase';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const STEPS = ['Basic Info', 'Skills & Experience', 'Preferences', 'Review'];

export default function JobsOnboarding() {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const [fullName, setFullName] = useState('');
  const [headline, setHeadline] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [bio, setBio] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState('');
  const [yearsExperience, setYearsExperience] = useState('');
  const [education, setEducation] = useState('');
  const [currentRole, setCurrentRole] = useState('');
  const [currentCompany, setCurrentCompany] = useState('');
  const [jobTypes, setJobTypes] = useState<string[]>([]);
  const [expectedSalary, setExpectedSalary] = useState('');
  const [isOpenToRemote, setIsOpenToRemote] = useState(false);
  const [isOpenToRelocation, setIsOpenToRelocation] = useState(false);
  const [preferredIndustries, setPreferredIndustries] = useState('');

  const skillSuggestions = ['JavaScript', 'React', 'Python', 'Sales', 'Marketing', 'Accounting', 'Nursing', 'Teaching', 'Driving', 'Carpentry', 'Plumbing', 'Electrician', 'Chef', 'Customer Service'];
  const jobTypeOptions = ['Full-time', 'Part-time', 'Contract', 'Freelance', 'Internship', 'Remote'];

  const validateStep = () => {
    switch (step) {
      case 0:
        if (!fullName.trim()) return 'Full name is required';
        if (!headline.trim()) return 'Professional headline is required';
        if (!phone.trim()) return 'Phone number is required';
        if (!city.trim()) return 'City is required';
        break;
      case 1:
        if (skills.length === 0) return 'Add at least one skill';
        if (!yearsExperience.trim()) return 'Years of experience is required';
        break;
      case 2:
        if (jobTypes.length === 0) return 'Select at least one job type';
        break;
    }
    return null;
  };

  const addSkill = () => {
    if (!newSkill.trim()) return;
    if (!skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
    }
    setNewSkill('');
  };

  const removeSkill = (skill: string) => {
    setSkills(skills.filter(s => s !== skill));
  };

  const toggleJobType = (type: string) => {
    setJobTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
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
        .from('job_seekers')
        .insert({
          user_id: user.id,
          full_name: fullName.trim(),
          headline: headline.trim(),
          phone: phone.trim(),
          email: email.trim(),
          city: city.trim(),
          bio: bio.trim(),
          skills: skills,
          years_experience: parseInt(yearsExperience) || 0,
          education: education.trim(),
          current_role: currentRole.trim(),
          current_company: currentCompany.trim(),
          job_types: jobTypes,
          expected_salary: parseFloat(expectedSalary) || null,
          is_open_to_remote: isOpenToRemote,
          is_open_to_relocation: isOpenToRelocation,
          preferred_industries: preferredIndustries.split(',').map(i => i.trim()).filter(Boolean),
          status: 'active',
          is_available: true,
          profile_views: 0,
          applications_count: 0,
          created_at: new Date().toISOString(),
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
            <Text style={styles.sectionTitle}>Basic Information</Text>
            <Input label="Full Name *" value={fullName} onChangeText={setFullName} icon="account" />
            <Input label="Professional Headline *" value={headline} onChangeText={setHeadline} icon="briefcase" placeholder="e.g. Senior React Developer" />
            <Input label="Phone *" value={phone} onChangeText={setPhone} icon="phone" keyboardType="phone-pad" />
            <Input label="Email" value={email} onChangeText={setEmail} icon="email" keyboardType="email-address" />
            <Input label="City *" value={city} onChangeText={setCity} icon="city" />
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Bio / Summary</Text>
              <View style={[styles.inputWrapper, { alignItems: 'flex-start', paddingVertical: 10 }]}>
                <MaterialCommunityIcons name="text" size={18} color="#9CA3AF" style={[styles.inputIcon, { marginTop: 4 }]} />
                <TextInput
                  style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
                  value={bio}
                  onChangeText={setBio}
                  multiline
                  numberOfLines={4}
                  placeholder="Tell employers about yourself..."
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>
          </View>
        );
      case 1:
        return (
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Skills & Experience</Text>
            <Text style={styles.label}>Your Skills *</Text>
            <View style={styles.chipContainer}>
              {skills.map(skill => (
                <TouchableOpacity key={skill} style={styles.skillChip} onPress={() => removeSkill(skill)}>
                  <Text style={styles.skillChipText}>{skill}</Text>
                  <MaterialCommunityIcons name="close" size={14} color="#2563EB" />
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons name="plus" size={18} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={newSkill}
                onChangeText={setNewSkill}
                placeholder="Type a skill and tap Add"
                placeholderTextColor="#9CA3AF"
                onSubmitEditing={addSkill}
              />
              <TouchableOpacity style={styles.addSkillBtn} onPress={addSkill}>
                <Text style={styles.addSkillBtnText}>Add</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.suggestionsLabel}>Suggestions:</Text>
            <View style={styles.chipContainer}>
              {skillSuggestions.filter(s => !skills.includes(s)).map(s => (
                <TouchableOpacity key={s} style={styles.suggestionChip} onPress={() => { setNewSkill(s); addSkill(); }}>
                  <Text style={styles.suggestionChipText}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Input label="Years of Experience *" value={yearsExperience} onChangeText={setYearsExperience} icon="calendar-clock" keyboardType="number-pad" />
            <Input label="Education" value={education} onChangeText={setEducation} icon="school" placeholder="e.g. BSc Computer Science, University of Nairobi" />
            <Input label="Current Role" value={currentRole} onChangeText={setCurrentRole} icon="briefcase-account" placeholder="e.g. Software Engineer" />
            <Input label="Current Company" value={currentCompany} onChangeText={setCurrentCompany} icon="office-building" />
          </View>
        );
      case 2:
        return (
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Job Preferences</Text>
            <Text style={styles.label}>Job Types *</Text>
            <View style={styles.chipContainer}>
              {jobTypeOptions.map(type => (
                <TouchableOpacity key={type} style={[styles.chip, jobTypes.includes(type) && styles.chipActive]} onPress={() => toggleJobType(type)}>
                  <Text style={[styles.chipText, jobTypes.includes(type) && styles.chipTextActive]}>{type}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Input label="Expected Salary (KES/month)" value={expectedSalary} onChangeText={setExpectedSalary} icon="cash" keyboardType="number-pad" />
            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Open to Remote Work</Text>
              <Switch value={isOpenToRemote} onValueChange={setIsOpenToRemote} trackColor={{ false: '#E5E7EB', true: '#2563EB' }} />
            </View>
            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Open to Relocation</Text>
              <Switch value={isOpenToRelocation} onValueChange={setIsOpenToRelocation} trackColor={{ false: '#E5E7EB', true: '#2563EB' }} />
            </View>
            <Input label="Preferred Industries" value={preferredIndustries} onChangeText={setPreferredIndustries} icon="domain" placeholder="e.g. Technology, Healthcare, Finance" />
          </View>
        );
      case 3:
        return (
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Review Your Profile</Text>
            <ReviewRow label="Name" value={fullName} />
            <ReviewRow label="Headline" value={headline} />
            <ReviewRow label="Phone" value={phone} />
            <ReviewRow label="City" value={city} />
            <ReviewRow label="Experience" value={`${yearsExperience} years`} />
            <ReviewRow label="Education" value={education} />
            <ReviewRow label="Current Role" value={`${currentRole}${currentCompany ? ' at ' + currentCompany : ''}`} />
            <ReviewRow label="Skills" value={skills.join(', ')} />
            <ReviewRow label="Job Types" value={jobTypes.join(', ')} />
            <ReviewRow label="Expected Salary" value={expectedSalary ? `KES ${expectedSalary}/month` : ''} />
            <ReviewRow label="Remote" value={isOpenToRemote ? 'Yes' : 'No'} />
            <ReviewRow label="Relocation" value={isOpenToRelocation ? 'Yes' : 'No'} />
            <View style={styles.infoBox}>
              <MaterialCommunityIcons name="check-circle" size={20} color="#10B981" />
              <Text style={styles.infoText}>By submitting, you confirm all information is accurate and agree to MTAA Jobs terms.</Text>
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
        <Text style={styles.headerTitle}>Create Professional Profile</Text>
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
  skillChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#DBEAFE', borderWidth: 1, borderColor: '#2563EB' },
  skillChipText: { fontSize: 13, color: '#2563EB', fontWeight: '600' },
  suggestionChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB' },
  suggestionChipText: { fontSize: 12, color: '#6B7280' },
  addSkillBtn: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#2563EB', borderRadius: 8, marginLeft: 8 },
  addSkillBtnText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  suggestionsLabel: { fontSize: 12, color: '#9CA3AF', marginBottom: 8, marginTop: 4 },
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
