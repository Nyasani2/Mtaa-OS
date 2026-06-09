// ============================================================================
// MTAA Profile OS — Edit Profile Screen
// Full profile creation/editing form
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useProfile } from '@/lib/profile';
import { useAuth } from '@/hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';

// Available options
const GENDER_OPTIONS = ['male', 'female', 'other', 'prefer_not_to_say'];
const ID_TYPE_OPTIONS = ['national_id', 'passport', 'drivers_license', 'other'];
const OCCUPATION_OPTIONS = [
  'student', 'employed', 'self_employed', 'business_owner',
  'freelancer', 'unemployed', 'retired', 'other'
];
const INCOME_OPTIONS = [
  'under_10k', '10k_30k', '30k_50k', '50k_100k', '100k_300k', 'above_300k'
];

export default function EditProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { profile, isLoading, updateProfile, loadProfile } = useProfile();

  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<'basic' | 'contact' | 'professional' | 'bio'>('basic');

  // Form state
  const [form, setForm] = useState({
    full_name: '',
    display_name: '',
    username: '',
    bio: '',
    short_bio: '',
    headline: '',
    date_of_birth: '',
    gender: '',
    nationality: '',
    id_number: '',
    id_type: '',
    phone: '',
    address_line1: '',
    address_line2: '',
    city: '',
    region: '',
    country: 'KE',
    postal_code: '',
    occupation: '',
    employer: '',
    income_range: '',
    profession: '',
    years_of_experience: '',
    education_level: '',
    languages: '',
    skills: '',
    interests: '',
    website_url: '',
    mission: '',
    vision: '',
  });

  // Load existing profile data into form
  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name || '',
        display_name: profile.display_name || '',
        username: profile.username || '',
        bio: profile.bio || '',
        short_bio: profile.short_bio || '',
        headline: profile.headline || '',
        date_of_birth: profile.date_of_birth || '',
        gender: profile.gender || '',
        nationality: profile.nationality || '',
        id_number: profile.id_number || '',
        id_type: profile.id_type || '',
        phone: profile.phone || '',
        address_line1: profile.address_line1 || '',
        address_line2: profile.address_line2 || '',
        city: profile.city || '',
        region: profile.region || '',
        country: profile.country || 'KE',
        postal_code: profile.postal_code || '',
        occupation: profile.occupation || '',
        employer: profile.employer || '',
        income_range: profile.income_range || '',
        profession: profile.profession || '',
        years_of_experience: profile.years_of_experience?.toString() || '',
        education_level: profile.education_level || '',
        languages: Array.isArray(profile.languages) ? profile.languages.join(', ') : '',
        skills: Array.isArray(profile.skills) ? profile.skills.join(', ') : '',
        interests: Array.isArray(profile.interests) ? profile.interests.join(', ') : '',
        website_url: profile.website_url || '',
        mission: profile.mission || '',
        vision: profile.vision || '',
      });
    }
  }, [profile]);

  const updateField = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!form.full_name.trim()) {
      Alert.alert('Required', 'Full name is required');
      return;
    }

    setSaving(true);
    try {
      const updates: any = {
        full_name: form.full_name.trim(),
        display_name: form.display_name.trim() || form.full_name.trim(),
        username: form.username.trim().toLowerCase(),
        bio: form.bio.trim(),
        short_bio: form.short_bio.trim(),
        headline: form.headline.trim(),
        date_of_birth: form.date_of_birth || null,
        gender: form.gender || null,
        nationality: form.nationality.trim() || null,
        id_number: form.id_number.trim() || null,
        id_type: form.id_type || null,
        phone: form.phone.trim() || null,
        address_line1: form.address_line1.trim() || null,
        address_line2: form.address_line2.trim() || null,
        city: form.city.trim() || null,
        region: form.region.trim() || null,
        country: form.country.trim() || 'KE',
        postal_code: form.postal_code.trim() || null,
        occupation: form.occupation || null,
        employer: form.employer.trim() || null,
        income_range: form.income_range || null,
        profession: form.profession.trim() || null,
        years_of_experience: form.years_of_experience ? parseInt(form.years_of_experience) : null,
        education_level: form.education_level || null,
        languages: form.languages ? form.languages.split(',').map(s => s.trim()).filter(Boolean) : null,
        skills: form.skills ? form.skills.split(',').map(s => s.trim()).filter(Boolean) : null,
        interests: form.interests ? form.interests.split(',').map(s => s.trim()).filter(Boolean) : null,
        website_url: form.website_url.trim() || null,
        mission: form.mission.trim() || null,
        vision: form.vision.trim() || null,
        updated_at: new Date().toISOString(),
      };

      await updateProfile(updates);
      Alert.alert('Success', 'Profile saved successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const SectionButton = ({ section, label, icon }: { section: typeof activeSection; label: string; icon: string }) => (
    <TouchableOpacity
      style={[styles.sectionTab, activeSection === section && styles.sectionTabActive]}
      onPress={() => setActiveSection(section)}
    >
      <Ionicons name={icon as any} size={18} color={activeSection === section ? '#6366f1' : '#64748b'} />
      <Text style={[styles.sectionTabText, activeSection === section && styles.sectionTabTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const InputField = ({ label, field, placeholder, multiline = false, numeric = false }: any) => (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.inputMultiline]}
        placeholder={placeholder}
        placeholderTextColor="#94a3b8"
        value={form[field]}
        onChangeText={(text) => updateField(field, text)}
        multiline={multiline}
        keyboardType={numeric ? 'numeric' : 'default'}
      />
    </View>
  );

  const SelectField = ({ label, field, options }: { label: string; field: string; options: string[] }) => (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.selectRow}>
        {options.map((opt) => (
          <TouchableOpacity
            key={opt}
            style={[styles.selectChip, form[field] === opt && styles.selectChipActive]}
            onPress={() => updateField(field, opt === form[field] ? '' : opt)}
          >
            <Text style={[styles.selectChipText, form[field] === opt && styles.selectChipTextActive]}>
              {opt.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  if (isLoading && !profile) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} disabled={saving}>
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.title}>{profile ? 'Edit Profile' : 'Create Profile'}</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving}>
          {saving ? (
            <ActivityIndicator size="small" color="#6366f1" />
          ) : (
            <Text style={styles.saveButton}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Section Tabs */}
      <View style={styles.sectionBar}>
        <SectionButton section="basic" label="Basic" icon="person-outline" />
        <SectionButton section="contact" label="Contact" icon="location-outline" />
        <SectionButton section="professional" label="Work" icon="briefcase-outline" />
        <SectionButton section="bio" label="Bio" icon="document-text-outline" />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* ===== BASIC INFO ===== */}
        {activeSection === 'basic' && (
          <View>
            <InputField label="Full Name *" field="full_name" placeholder="John Doe" />
            <InputField label="Display Name" field="display_name" placeholder="How you want to be called" />
            <InputField label="Username" field="username" placeholder="johndoe (no spaces)" />
            <InputField label="Date of Birth" field="date_of_birth" placeholder="YYYY-MM-DD" />
            <SelectField label="Gender" field="gender" options={GENDER_OPTIONS} />
            <InputField label="Nationality" field="nationality" placeholder="Kenyan" />
            <SelectField label="ID Type" field="id_type" options={ID_TYPE_OPTIONS} />
            <InputField label="ID Number" field="id_number" placeholder="ID / Passport number" />
            <InputField label="Phone" field="phone" placeholder="+254 700 000 000" />
          </View>
        )}

        {/* ===== CONTACT INFO ===== */}
        {activeSection === 'contact' && (
          <View>
            <InputField label="Address Line 1" field="address_line1" placeholder="Street address" />
            <InputField label="Address Line 2" field="address_line2" placeholder="Apartment, suite, etc." />
            <InputField label="City" field="city" placeholder="Nairobi" />
            <InputField label="Region / County" field="region" placeholder="Nairobi County" />
            <InputField label="Country" field="country" placeholder="KE" />
            <InputField label="Postal Code" field="postal_code" placeholder="00100" />
          </View>
        )}

        {/* ===== PROFESSIONAL INFO ===== */}
        {activeSection === 'professional' && (
          <View>
            <InputField label="Headline" field="headline" placeholder="e.g. Software Engineer at MTAA" />
            <SelectField label="Occupation" field="occupation" options={OCCUPATION_OPTIONS} />
            <InputField label="Profession" field="profession" placeholder="e.g. Software Engineering" />
            <InputField label="Employer" field="employer" placeholder="Company or organization" />
            <SelectField label="Income Range (KES/month)" field="income_range" options={INCOME_OPTIONS} />
            <InputField label="Years of Experience" field="years_of_experience" placeholder="5" numeric />
            <InputField label="Education Level" field="education_level" placeholder="e.g. Bachelor's Degree" />
            <InputField label="Languages (comma separated)" field="languages" placeholder="English, Swahili, French" />
            <InputField label="Skills (comma separated)" field="skills" placeholder="React, Node.js, Design" />
            <InputField label="Website" field="website_url" placeholder="https://yourwebsite.com" />
          </View>
        )}

        {/* ===== BIO ===== */}
        {activeSection === 'bio' && (
          <View>
            <InputField label="Short Bio" field="short_bio" placeholder="One-line bio" />
            <InputField
              label="Full Bio"
              field="bio"
              placeholder="Tell your story..."
              multiline
            />
            <InputField
              label="Mission"
              field="mission"
              placeholder="Your personal mission statement"
              multiline
            />
            <InputField
              label="Vision"
              field="vision"
              placeholder="Your vision for the future"
              multiline
            />
            <InputField label="Interests (comma separated)" field="interests" placeholder="Technology, Music, Travel" />
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: '#64748b' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  title: { fontSize: 17, fontWeight: '700', color: '#1e293b' },
  saveButton: { fontSize: 15, fontWeight: '600', color: '#6366f1' },

  sectionBar: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    gap: 4,
  },
  sectionTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  sectionTabActive: { backgroundColor: '#eef2ff' },
  sectionTabText: { fontSize: 12, color: '#64748b', fontWeight: '500' },
  sectionTabTextActive: { color: '#6366f1', fontWeight: '600' },

  scroll: { flex: 1 },
  scrollContent: { padding: 16 },

  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1e293b',
  },
  inputMultiline: {
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: 12,
  },

  selectRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  selectChipActive: {
    backgroundColor: '#eef2ff',
    borderColor: '#6366f1',
  },
  selectChipText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  selectChipTextActive: {
    color: '#6366f1',
    fontWeight: '600',
  },
});
