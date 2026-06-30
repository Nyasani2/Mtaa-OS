import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';

const INDUSTRIES = ['Technology', 'Finance', 'Healthcare', 'Education', 'Agriculture', 'Manufacturing', 'Retail', 'Construction', 'Transport', 'Other'];

export default function ProfessionalEditScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [jobTitle, setJobTitle] = useState('');
  const [company, setCompany] = useState('');
  const [industry, setIndustry] = useState('');
  const [yearsExp, setYearsExp] = useState('');
  const [skills, setSkills] = useState('');
  const [bio, setBio] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [portfolio, setPortfolio] = useState('');
  const [isPublic, setIsPublic] = useState(true);

  useEffect(() => { loadExisting(); }, []);

  const loadExisting = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data } = await supabase.from('professional_profiles').select('*').eq('user_id', user.id).maybeSingle();
      if (data) {
        setJobTitle(data.job_title || ''); setCompany(data.company || ''); setIndustry(data.industry || '');
        setYearsExp(data.years_experience?.toString() || ''); setSkills(data.skills?.join(', ') || '');
        setBio(data.bio || ''); setLinkedin(data.linkedin_url || ''); setPortfolio(data.portfolio_url || '');
        setIsPublic(data.is_public !== false);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const saveProfile = async () => {
    if (!jobTitle.trim()) { Alert.alert('Error', 'Job title is required'); return; }
    if (!user?.id) return;
    setSaving(true);
    try {
      const payload = {
        user_id: user.id, job_title: jobTitle.trim(), company: company.trim() || null, industry: industry || null,
        years_experience: parseInt(yearsExp) || 0, skills: skills.split(',').map(s => s.trim()).filter(Boolean),
        bio: bio.trim() || null, linkedin_url: linkedin.trim() || null, portfolio_url: portfolio.trim() || null,
        is_public: isPublic, updated_at: new Date().toISOString(),
      };
      const { error } = await supabase.from('professional_profiles').upsert(payload, { onConflict: 'user_id' });
      if (error) throw error;
      Alert.alert('Success', 'Professional profile saved');
      router.back();
    } catch (err: any) { Alert.alert('Error', err.message || 'Failed to save'); }
    finally { setSaving(false); }
  };

  if (loading) return <View style={styles.container}><ActivityIndicator size="large" color="#3b82f6" /></View>;

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#f1f5f9" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Professional Profile</Text>
        <TouchableOpacity onPress={saveProfile} disabled={saving}>{saving ? <ActivityIndicator color="#3b82f6" /> : <Text style={styles.saveText}>Save</Text>}</TouchableOpacity>
      </View>
      <View style={styles.form}>
        <Text style={styles.label}>Job Title *</Text>
        <TextInput style={styles.input} value={jobTitle} onChangeText={setJobTitle} placeholder="e.g. Software Engineer" placeholderTextColor="#64748b" />
        <Text style={styles.label}>Company</Text>
        <TextInput style={styles.input} value={company} onChangeText={setCompany} placeholder="Company name" placeholderTextColor="#64748b" />
        <Text style={styles.label}>Industry</Text>
        <View style={styles.chipContainer}>
          {INDUSTRIES.map((ind) => <TouchableOpacity key={ind} style={[styles.chip, industry === ind && styles.chipActive]} onPress={() => setIndustry(ind)}><Text style={[styles.chipText, industry === ind && styles.chipTextActive]}>{ind}</Text></TouchableOpacity>)}
        </View>
        <Text style={styles.label}>Years of Experience</Text>
        <TextInput style={styles.input} value={yearsExp} onChangeText={setYearsExp} placeholder="5" placeholderTextColor="#64748b" keyboardType="number-pad" />
        <Text style={styles.label}>Skills (comma separated)</Text>
        <TextInput style={styles.input} value={skills} onChangeText={setSkills} placeholder="React, Node.js, Python, Design" placeholderTextColor="#64748b" />
        <Text style={styles.label}>Bio</Text>
        <TextInput style={[styles.input, styles.textArea]} value={bio} onChangeText={setBio} placeholder="Tell us about your career..." placeholderTextColor="#64748b" multiline numberOfLines={4} />
        <Text style={styles.label}>LinkedIn URL</Text>
        <TextInput style={styles.input} value={linkedin} onChangeText={setLinkedin} placeholder="https://linkedin.com/in/..." placeholderTextColor="#64748b" autoCapitalize="none" />
        <Text style={styles.label}>Portfolio URL</Text>
        <TextInput style={styles.input} value={portfolio} onChangeText={setPortfolio} placeholder="https://..." placeholderTextColor="#64748b" autoCapitalize="none" />
        <View style={styles.toggleRow}><Text style={styles.label}>Public Profile</Text><Switch value={isPublic} onValueChange={setIsPublic} trackColor={{ false: '#334155', true: '#3b82f6' }} /></View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 50, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#f1f5f9' },
  saveText: { color: '#3b82f6', fontWeight: '700', fontSize: 16 },
  form: { padding: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#94a3b8', marginTop: 16, marginBottom: 8 },
  input: { backgroundColor: '#1e293b', borderRadius: 8, padding: 14, color: '#f1f5f9', fontSize: 15, borderWidth: 1, borderColor: '#334155' },
  textArea: { height: 100, textAlignVertical: 'top' },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: '#1e293b', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#334155', marginBottom: 8 },
  chipActive: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  chipText: { color: '#94a3b8', fontSize: 13 },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 20, paddingVertical: 8 },
});
