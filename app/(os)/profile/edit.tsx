import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  ActivityIndicator, Platform, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

export default function ProfileEditScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    display_name: '',
    username: '',
    bio: '',
    city: '',
    country: '',
    profession: '',
    website: '',
    phone: '',
    date_of_birth: '',
    gender: '',
    languages: '',
    skills: '',
  });

  useEffect(() => {
    if (!user?.id) return;
    supabase.from('profiles')
      .select('display_name, username, bio, city, country, profession, website, phone, date_of_birth, gender, languages, skills')
      .eq('user_id', user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setForm({
            display_name: data.display_name || '',
            username: data.username || '',
            bio: data.bio || '',
            city: data.city || '',
            country: data.country || '',
            profession: data.profession || '',
            website: data.website || '',
            phone: data.phone || '',
            date_of_birth: data.date_of_birth || '',
            gender: data.gender || '',
            languages: (data.languages || []).join(', '),
            skills: (data.skills || []).join(', '),
          });
        }
        setLoading(false);
      });
  }, [user?.id]);

  const handleSave = async () => {
    if (!user?.id) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('profiles').update({
        display_name: form.display_name || null,
        username: form.username || null,
        bio: form.bio || null,
        city: form.city || null,
        country: form.country || null,
        profession: form.profession || null,
        website: form.website || null,
        phone: form.phone || null,
        date_of_birth: form.date_of_birth || null,
        gender: form.gender || null,
        languages: form.languages ? form.languages.split(',').map(s => s.trim()).filter(Boolean) : null,
        skills: form.skills ? form.skills.split(',').map(s => s.trim()).filter(Boolean) : null,
        updated_at: new Date().toISOString(),
      }).eq('user_id', user.id);

      if (error) throw error;
      Alert.alert('Saved', 'Profile updated successfully');
      router.back();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#00d4ff" />
      </View>
    );
  }

  const renderField = (label: string, key: keyof typeof form, props?: any) => (
    <View style={styles.field} key={key}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={form[key]}
        onChangeText={text => setForm(prev => ({ ...prev, [key]: text }))}
        placeholderTextColor="#555"
        {...props}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator size="small" color="#00d4ff" /> : <Text style={styles.saveBtn}>Save</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
        {renderField('Display Name', 'display_name')}
        {renderField('Username', 'username', { autoCapitalize: 'none' })}
        {renderField('Bio', 'bio', { multiline: true, numberOfLines: 3 })}
        {renderField('Profession', 'profession')}
        {renderField('City', 'city')}
        {renderField('Country', 'country')}
        {renderField('Website', 'website', { autoCapitalize: 'none', keyboardType: 'url' })}
        {renderField('Phone', 'phone', { keyboardType: 'phone-pad' })}
        {renderField('Date of Birth (YYYY-MM-DD)', 'date_of_birth')}
        {renderField('Gender', 'gender', { placeholder: 'male | female | non_binary | prefer_not_to_say' })}
        {renderField('Languages (comma separated)', 'languages', { placeholder: 'English, Swahili, French' })}
        {renderField('Skills (comma separated)', 'skills', { placeholder: 'React, Node.js, Design' })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 50 : 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  saveBtn: { color: '#00d4ff', fontWeight: '700', fontSize: 14 },
  form: { padding: 16 },
  field: { marginBottom: 16 },
  label: { color: '#888', fontSize: 12, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { backgroundColor: '#111', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, color: '#fff', fontSize: 14, borderWidth: 1, borderColor: '#222' },
});
