import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase/client';
import { Ionicons } from '@expo/vector-icons';

const INDUSTRIES = [
  'Technology', 'Finance', 'Healthcare', 'Education', 'Agriculture',
  'Manufacturing', 'Retail', 'Transport', 'Other'
];

interface ProfessionalProfile {
  id: string;
  user_id: string;
  job_title: string;
  company: string;
  industry: string;
  years_experience: number;
  skills: string[];
  bio: string;
  linkedin_url: string;
  portfolio_url: string;
}

export default function EditProfessionalScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [existingId, setExistingId] = useState<string | null>(null);
  const [tableExists, setTableExists] = useState(true);
  const [form, setForm] = useState({
    job_title: '',
    company: '',
    industry: '',
    years_experience: '',
    skills: '',
    bio: '',
    linkedin_url: '',
    portfolio_url: '',
  });

  const updateField = useCallback((field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  }, []);

  useEffect(() => {
    const fetchExisting = async () => {
      if (!user?.id) return;
      try {
        const { data, error } = await supabase
          .from('professional_profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          if (error.message?.includes('does not exist') || error.code === '42P01') {
            setTableExists(false);
          }
          return;
        }

        if (data) {
          setExistingId(data.id);
          setForm({
            job_title: data.job_title || '',
            company: data.company || '',
            industry: data.industry || '',
            years_experience: data.years_experience?.toString() || '',
            skills: Array.isArray(data.skills) ? data.skills.join(', ') : data.skills || '',
            bio: data.bio || '',
            linkedin_url: data.linkedin_url || '',
            portfolio_url: data.portfolio_url || '',
          });
        }
      } catch (err) {
        console.error('Fetch existing error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchExisting();
  }, [user?.id]);

  const validate = useCallback(() => {
    if (!form.job_title.trim()) {
      Alert.alert('Validation Error', 'Job title is required');
      return false;
    }
    if (form.linkedin_url && !form.linkedin_url.match(/^https?:\/\/.+/)) {
      Alert.alert('Validation Error', 'LinkedIn URL must start with http:// or https://');
      return false;
    }
    if (form.portfolio_url && !form.portfolio_url.match(/^https?:\/\/.+/)) {
      Alert.alert('Validation Error', 'Portfolio URL must start with http:// or https://');
      return false;
    }
    const years = parseInt(form.years_experience);
    if (form.years_experience && (isNaN(years) || years < 0 || years > 60)) {
      Alert.alert('Validation Error', 'Years of experience must be between 0 and 60');
      return false;
    }
    return true;
  }, [form]);

  const handleSave = useCallback(async () => {
    if (!validate()) return;
    if (!user?.id) {
      Alert.alert('Error', 'You must be logged in');
      return;
    }
    if (!tableExists) {
      Alert.alert('Error', 'Professional profiles table does not exist. Run the SQL migration first.');
      return;
    }

    setSaving(true);
    try {
      const skillsArray = form.skills
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      const payload = {
        user_id: user.id,
        job_title: form.job_title.trim(),
        company: form.company.trim() || null,
        industry: form.industry || null,
        years_experience: form.years_experience ? parseInt(form.years_experience) : null,
        skills: skillsArray.length > 0 ? skillsArray : null,
        bio: form.bio.trim() || null,
        linkedin_url: form.linkedin_url.trim() || null,
        portfolio_url: form.portfolio_url.trim() || null,
        updated_at: new Date().toISOString(),
      };

      let error;
      if (existingId) {
        const result = await supabase
          .from('professional_profiles')
          .update(payload)
          .eq('id', existingId);
        error = result.error;
      } else {
        const result = await supabase
          .from('professional_profiles')
          .insert({ ...payload, created_at: new Date().toISOString() });
        error = result.error;
      }

      if (error) {
        console.error('Save professional error:', error);
        Alert.alert('Save Failed', error.message);
        setSaving(false);
        return;
      }

      router.back();
    } catch (err: any) {
      console.error('Save error:', err);
      Alert.alert('Error', err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  }, [form, user?.id, existingId, tableExists, validate, router]);

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color="#3b82f6" />
      </SafeAreaView>
    );
  }

  if (!tableExists) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0a0a0a' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={{ color: '#fff', fontSize: 18, fontWeight: '600' }}>Edit Professional Profile</Text>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <Ionicons name="warning-outline" size={48} color="#f59e0b" />
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600', marginTop: 16, textAlign: 'center' }}>
            professional_profiles table does not exist
          </Text>
          <Text style={{ color: '#666', fontSize: 14, textAlign: 'center', marginTop: 8 }}>
            Run the SQL migration to create this table before editing.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0a0a0a' }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={{ color: '#fff', fontSize: 18, fontWeight: '600', flex: 1 }}>
            {existingId ? 'Edit' : 'Create'} Professional Profile
          </Text>
          <TouchableOpacity onPress={handleSave} disabled={saving}>
            {saving ? (
              <ActivityIndicator color="#3b82f6" size="small" />
            ) : (
              <Text style={{ color: '#3b82f6', fontSize: 16, fontWeight: '600' }}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Job Title */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ color: '#888', fontSize: 12, marginBottom: 6, textTransform: 'uppercase' }}>
            Job Title *
          </Text>
          <TextInput
            value={form.job_title}
            onChangeText={(text) => updateField('job_title', text)}
            placeholder="e.g. Software Engineer"
            placeholderTextColor="#444"
            style={{ backgroundColor: '#1a1a1a', color: '#fff', padding: 12, borderRadius: 8, fontSize: 14 }}
          />
        </View>

        {/* Company */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ color: '#888', fontSize: 12, marginBottom: 6, textTransform: 'uppercase' }}>
            Company
          </Text>
          <TextInput
            value={form.company}
            onChangeText={(text) => updateField('company', text)}
            placeholder="Company name"
            placeholderTextColor="#444"
            style={{ backgroundColor: '#1a1a1a', color: '#fff', padding: 12, borderRadius: 8, fontSize: 14 }}
          />
        </View>

        {/* Industry */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ color: '#888', fontSize: 12, marginBottom: 6, textTransform: 'uppercase' }}>
            Industry
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {INDUSTRIES.map((ind) => (
              <TouchableOpacity
                key={ind}
                onPress={() => updateField('industry', ind)}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 20,
                  backgroundColor: form.industry === ind ? '#3b82f6' : '#1a1a1a',
                  borderWidth: 1,
                  borderColor: form.industry === ind ? '#3b82f6' : '#333',
                }}
              >
                <Text style={{ color: form.industry === ind ? '#fff' : '#888', fontSize: 12 }}>{ind}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Years of Experience */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ color: '#888', fontSize: 12, marginBottom: 6, textTransform: 'uppercase' }}>
            Years of Experience
          </Text>
          <TextInput
            value={form.years_experience}
            onChangeText={(text) => updateField('years_experience', text)}
            placeholder="5"
            placeholderTextColor="#444"
            keyboardType="numeric"
            style={{ backgroundColor: '#1a1a1a', color: '#fff', padding: 12, borderRadius: 8, fontSize: 14 }}
          />
        </View>

        {/* Skills */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ color: '#888', fontSize: 12, marginBottom: 6, textTransform: 'uppercase' }}>
            Skills (comma separated)
          </Text>
          <TextInput
            value={form.skills}
            onChangeText={(text) => updateField('skills', text)}
            placeholder="React, Node.js, Python, Design"
            placeholderTextColor="#444"
            style={{ backgroundColor: '#1a1a1a', color: '#fff', padding: 12, borderRadius: 8, fontSize: 14 }}
          />
        </View>

        {/* Bio */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ color: '#888', fontSize: 12, marginBottom: 6, textTransform: 'uppercase' }}>
            Bio
          </Text>
          <TextInput
            value={form.bio}
            onChangeText={(text) => updateField('bio', text)}
            placeholder="Tell us about your career"
            placeholderTextColor="#444"
            multiline
            numberOfLines={4}
            maxLength={1000}
            style={{ backgroundColor: '#1a1a1a', color: '#fff', padding: 12, borderRadius: 8, fontSize: 14, height: 100, textAlignVertical: 'top' }}
          />
          <Text style={{ color: '#444', fontSize: 11, textAlign: 'right', marginTop: 4 }}>
            {form.bio.length}/1000
          </Text>
        </View>

        {/* LinkedIn URL */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ color: '#888', fontSize: 12, marginBottom: 6, textTransform: 'uppercase' }}>
            LinkedIn URL
          </Text>
          <TextInput
            value={form.linkedin_url}
            onChangeText={(text) => updateField('linkedin_url', text)}
            placeholder="https://linkedin.com/in/..."
            placeholderTextColor="#444"
            autoCapitalize="none"
            keyboardType="url"
            style={{ backgroundColor: '#1a1a1a', color: '#fff', padding: 12, borderRadius: 8, fontSize: 14 }}
          />
        </View>

        {/* Portfolio URL */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ color: '#888', fontSize: 12, marginBottom: 6, textTransform: 'uppercase' }}>
            Portfolio URL
          </Text>
          <TextInput
            value={form.portfolio_url}
            onChangeText={(text) => updateField('portfolio_url', text)}
            placeholder="https://..."
            placeholderTextColor="#444"
            autoCapitalize="none"
            keyboardType="url"
            style={{ backgroundColor: '#1a1a1a', color: '#fff', padding: 12, borderRadius: 8, fontSize: 14 }}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
