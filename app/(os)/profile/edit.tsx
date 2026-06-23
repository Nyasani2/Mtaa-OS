import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/lib/auth/useAuth';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    display_name: '',
    username: '',
    bio: '',
    phone: '',
    profession: '',
    location: '',
    city: '',
    region: '',
    country: '',
    website: '',
    avatar_url: '',
  });

  useEffect(() => {
    if (profile) {
      setForm({
        display_name: profile.display_name || profile.full_name || '',
        username: profile.username || '',
        bio: profile.bio || '',
        phone: profile.phone || '',
        profession: profile.profession || '',
        location: profile.location || '',
        city: profile.city || '',
        region: profile.region || '',
        country: profile.country || '',
        website: profile.website || '',
        avatar_url: profile.avatar_url || '',
      });
    }
    setLoading(false);
  }, [profile]);

  const handleSave = async () => {
    if (!user) {
      Alert.alert('Error', 'Not authenticated');
      return;
    }

    setSaving(true);
    try {
      // CRITICAL FIX: Use user_profiles table, not profiles
      // Also update display_name (what Streets reads) not just full_name
      const { error } = await supabase
        .from('user_profiles')
        .update({
          display_name: form.display_name.trim() || null,
          username: form.username.trim() || null,
          bio: form.bio.trim() || null,
          phone: form.phone.trim() || null,
          profession: form.profession.trim() || null,
          location: form.location.trim() || null,
          city: form.city.trim() || null,
          region: form.region.trim() || null,
          country: form.country.trim() || null,
          website: form.website.trim() || null,
          avatar_url: form.avatar_url.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) {
        Alert.alert('Error', error.message);
        return;
      }

      Alert.alert('Saved', 'Profile updated successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUrl = () => {
    Alert.alert(
      'Change Avatar',
      'Enter an image URL or use a default avatar',
      [
        { 
          text: 'Use Default', 
          onPress: () => setForm(prev => ({ 
            ...prev, 
            avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(form.display_name || 'User')}&background=6366f1&color=fff&size=256` 
          })) 
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const avatarUri = form.avatar_url || 
    `https://ui-avatars.com/api/?name=${encodeURIComponent(form.display_name || 'User')}&background=6366f1&color=fff&size=256`;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#111" />
        </TouchableOpacity>
        <Text style={styles.title}>Edit Profile</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving}>
          {saving ? (
            <ActivityIndicator size="small" color="#6366f1" />
          ) : (
            <Text style={styles.saveText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.avatarSection}>
        <Image source={{ uri: avatarUri }} style={styles.avatar} />
        <TouchableOpacity style={styles.changeAvatarBtn} onPress={handleAvatarUrl}>
          <Ionicons name="camera" size={16} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleAvatarUrl}>
          <Text style={styles.changeAvatarText}>Change Photo</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.form}>
        <Field label="Display Name" value={form.display_name} onChange={(v) => setForm(p => ({ ...p, display_name: v }))} />
        <Field label="Username" value={form.username} onChange={(v) => setForm(p => ({ ...p, username: v }))} />
        <Field label="Bio" value={form.bio} onChange={(v) => setForm(p => ({ ...p, bio: v }))} multiline />
        <Field label="Phone" value={form.phone} onChange={(v) => setForm(p => ({ ...p, phone: v }))} keyboardType="phone-pad" />
        <Field label="Profession" value={form.profession} onChange={(v) => setForm(p => ({ ...p, profession: v }))} />
        <Field label="Location" value={form.location} onChange={(v) => setForm(p => ({ ...p, location: v }))} />
        <Field label="City" value={form.city} onChange={(v) => setForm(p => ({ ...p, city: v }))} />
        <Field label="Region" value={form.region} onChange={(v) => setForm(p => ({ ...p, region: v }))} />
        <Field label="Country" value={form.country} onChange={(v) => setForm(p => ({ ...p, country: v }))} />
        <Field label="Website" value={form.website} onChange={(v) => setForm(p => ({ ...p, website: v }))} keyboardType="url" />
        <Field label="Avatar URL" value={form.avatar_url} onChange={(v) => setForm(p => ({ ...p, avatar_url: v }))} placeholder="https://..." />
      </View>
    </ScrollView>
  );
}

function Field({ label, value, onChange, multiline, keyboardType, placeholder }: any) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.fieldInput, multiline && styles.fieldInputMultiline]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder || label}
        placeholderTextColor="#9ca3af"
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        keyboardType={keyboardType || 'default'}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 50, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  title: { fontSize: 18, fontWeight: '700', color: '#111' },
  saveText: { color: '#6366f1', fontSize: 16, fontWeight: '600' },
  avatarSection: { alignItems: 'center', padding: 24 },
  avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#f3f4f6' },
  changeAvatarBtn: { position: 'absolute', bottom: 50, right: '35%', width: 32, height: 32, borderRadius: 16, backgroundColor: '#6366f1', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#fff' },
  changeAvatarText: { color: '#6366f1', fontSize: 14, fontWeight: '500', marginTop: 12 },
  form: { padding: 16 },
  field: { marginBottom: 16 },
  fieldLabel: { fontSize: 13, color: '#6b7280', marginBottom: 6, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5 },
  fieldInput: { fontSize: 16, color: '#111', padding: 12, backgroundColor: '#f9fafb', borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  fieldInputMultiline: { minHeight: 80, paddingTop: 12 },
});
