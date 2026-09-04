import React, { useState, useEffect } from 'react';
import { Alert, View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';

interface ProfessionalForm {
  job_title: string;
  company: string;
  industry: string;
  experience_years: string;
  skills: string;
  certifications: string;
  linkedin_url: string;
  portfolio_url: string;
  bio: string;
  availability: string;
  expected_salary: string;
}

const INDUSTRIES = ['Technology', 'Healthcare', 'Finance', 'Education', 'Manufacturing', 'Retail', 'Construction', 'Agriculture', 'Transport', 'Other'];
const AVAILABILITY_OPTIONS = ['Full-time', 'Part-time', 'Contract', 'Freelance', 'Open to offers'];

export default function ProfessionalEditScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<ProfessionalForm>({
    job_title: '', company: '', industry: '', experience_years: '', skills: '', certifications: '', linkedin_url: '', portfolio_url: '', bio: '', availability: '', expected_salary: '',
  });

  useEffect(() => { fetchProfile(); }, [user?.id]);

  const fetchProfile = async () => {
    if (!user?.id) { setLoading(false); return; }
    try {
      const { data, error } = await supabase
        .from('professional_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setForm({
          job_title: data.job_title || '',
          company: data.company || '',
          industry: data.industry || '',
          experience_years: data.experience_years?.toString() || '',
          skills: (data.skills || []).join(', '),
          certifications: (data.certifications || []).join(', '),
          linkedin_url: data.linkedin_url || '',
          portfolio_url: data.portfolio_url || '',
          bio: data.bio || '',
          availability: data.availability || '',
          expected_salary: data.expected_salary?.toString() || '',
        });
      }
      if (error && error.code !== 'PGRST116') console.error(error);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const validateForm = (): string | null => {
    if (form.job_title.length > 100) return 'Job title must be under 100 characters';
    if (form.company.length > 100) return 'Company name must be under 100 characters';
    if (form.bio.length > 500) return 'Bio must be under 500 characters';
    if (form.linkedin_url && !form.linkedin_url.match(/^https?:\/\/.*linkedin\.com/i)) return 'LinkedIn URL must be a valid LinkedIn link';
    if (form.portfolio_url && !form.portfolio_url.match(/^https?:\/\//i)) return 'Portfolio URL must start with http:// or https://';
    if (form.experience_years && (isNaN(Number(form.experience_years)) || Number(form.experience_years) < 0 || Number(form.experience_years) > 80)) return 'Experience years must be 0-80';
    if (form.expected_salary && (isNaN(Number(form.expected_salary)) || Number(form.expected_salary) < 0)) return 'Expected salary must be a positive number';
    return null;
  };

  const saveProfile = async () => {
    if (!user?.id) { Alert.alert('Error', 'Not authenticated'); return; }
    const error = validateForm();
    if (error) { Alert.alert('Validation Error', error); return; }

    setSaving(true);
    try {
      const payload = {
        user_id: user.id,
        job_title: form.job_title.trim() || null,
        company: form.company.trim() || null,
        industry: form.industry || null,
        experience_years: form.experience_years ? parseInt(form.experience_years) : null,
        skills: form.skills.split(',').map((s: any) => s.trim()).filter(Boolean),
        certifications: form.certifications.split(',').map((s: any) => s.trim()).filter(Boolean),
        linkedin_url: form.linkedin_url.trim() || null,
        portfolio_url: form.portfolio_url.trim() || null,
        bio: form.bio.trim() || null,
        availability: form.availability || null,
        expected_salary: form.expected_salary ? parseFloat(form.expected_salary) : null,
        updated_at: new Date().toISOString(),
      };

      const { error: upsertErr } = await supabase
        .from('professional_profiles')
        .upsert(payload, { onConflict: 'user_id' });

      if (upsertErr) throw upsertErr;
      Alert.alert('Success', 'Professional profile updated');
      router.back();
    } catch (err: any) {
      console.error(err);
      Alert.alert('Error', err.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const renderInput = (label: string, key: keyof ProfessionalForm, placeholder: string, props?: any) => (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#64748b"
        value={form[key]}
        onChangeText={(text) => setForm(prev => ({ ...prev, [key]: text }))}
        {...props}
      />
    </View>
  );

  if (loading) return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#f1f5f9" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Professional</Text>
        <View style={{ width: 24 }} />
      </View>
      <View style={styles.center}><ActivityIndicator size="large" color="#3b82f6" /></View>
    </View>
  );

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#f1f5f9" /></TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Professional</Text>
          <TouchableOpacity onPress={saveProfile} disabled={saving}>
            {saving ? <ActivityIndicator size="small" color="#3b82f6" /> : <Ionicons name="checkmark" size={24} color="#3b82f6" />}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.form} keyboardShouldPersistTaps="handled">
          {renderInput('Job Title', 'job_title', 'e.g. Software Engineer')}
          {renderInput('Company', 'company', 'e.g. MTAA Technologies')}

          {/* Industry Picker */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Industry</Text>
            <View style={styles.chipRow}>
              {INDUSTRIES.map((ind: any) => (
                <TouchableOpacity key={ind} style={[styles.chip, form.industry === ind && styles.chipActive]} onPress={() => setForm(prev => ({ ...prev, industry: ind }))}>
                  <Text style={[styles.chipText, form.industry === ind && styles.chipTextActive]}>{ind}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {renderInput('Experience (years)', 'experience_years', 'e.g. 5', { keyboardType: 'number-pad', maxLength: 2 })}
          {renderInput('Skills (comma separated)', 'skills', 'e.g. React, Node.js, Python')}
          {renderInput('Certifications', 'certifications', 'e.g. AWS Certified, PMP')}
          {renderInput('LinkedIn URL', 'linkedin_url', 'https://linkedin.com/in/...', { autoCapitalize: 'none', keyboardType: 'url' })}
          {renderInput('Portfolio URL', 'portfolio_url', 'https://...', { autoCapitalize: 'none', keyboardType: 'url' })}

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Bio</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Tell us about your professional background..."
              placeholderTextColor="#64748b"
              value={form.bio}
              onChangeText={(text) => setForm(prev => ({ ...prev, bio: text }))}
              multiline
              numberOfLines={4}
              maxLength={500}
            />
            <Text style={styles.charCount}>{form.bio.length}/500</Text>
          </View>

          {/* Availability */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Availability</Text>
            <View style={styles.chipRow}>
              {AVAILABILITY_OPTIONS.map((opt: any) => (
                <TouchableOpacity key={opt} style={[styles.chip, form.availability === opt && styles.chipActive]} onPress={() => setForm(prev => ({ ...prev, availability: opt }))}>
                  <Text style={[styles.chipText, form.availability === opt && styles.chipTextActive]}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {renderInput('Expected Salary (monthly)', 'expected_salary', 'e.g. 5000', { keyboardType: 'number-pad' })}

          <TouchableOpacity style={styles.saveBtn} onPress={saveProfile} disabled={saving}>
            <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save Profile'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 50, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#f1f5f9' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  form: { padding: 16 },
  inputGroup: { marginBottom: 20 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#94a3b8', marginBottom: 8 },
  input: { backgroundColor: '#1e293b', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12, color: '#f1f5f9', fontSize: 15, borderWidth: 1, borderColor: '#334155' },
  textArea: { height: 100, textAlignVertical: 'top', paddingTop: 12 },
  charCount: { fontSize: 12, color: '#64748b', textAlign: 'right', marginTop: 4 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: '#1e293b', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, borderWidth: 1, borderColor: '#334155' },
  chipActive: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  chipText: { fontSize: 13, color: '#94a3b8' },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  saveBtn: { backgroundColor: '#3b82f6', paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginTop: 8, marginBottom: 32 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
