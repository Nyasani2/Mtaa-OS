import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  Image, ActivityIndicator, Alert, KeyboardAvoidingView, Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';

let ImagePicker: any = null;
try { ImagePicker = require('expo-image-picker'); } catch { ImagePicker = null; }

interface ProfileForm {
  display_name: string;
  username: string;
  full_name: string;
  bio: string;
  country: string;
  region: string;
  city: string;
  website: string;
  avatar_url: string | null;
}

export default function EditProfileScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState<ProfileForm>({
    display_name: '', username: '', full_name: '', bio: '',
    country: '', region: '', city: '', website: '', avatar_url: null,
  });

  useEffect(() => { if (user?.id) fetchProfile(); else setLoading(false); }, [user?.id]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('display_name, username, full_name, bio, country, region, city, website, avatar_url')
        .eq('user_id', user!.id)
        .maybeSingle();

      if (error) { console.error(error); setLoading(false); return; }
      if (data) {
        setForm({
          display_name: data.display_name || '', username: data.username || '',
          full_name: data.full_name || '', bio: data.bio || '',
          country: data.country || '', region: data.region || '',
          city: data.city || '', website: data.website || '',
          avatar_url: data.avatar_url,
        });
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const pickImage = async () => {
    if (!ImagePicker) { Alert.alert('Image picker not available'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      await uploadAvatar(result.assets[0].uri);
    }
  };

  const uploadAvatar = async (uri: string) => {
    if (!user?.id) return;
    setUploading(true);
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const ext = uri.split('.').pop() || 'jpg';
      const path = `avatars/${user.id}.${ext}`;

      const { error: upError } = await supabase.storage.from('profiles').upload(path, blob, { upsert: true, contentType: `image/${ext}` });
      if (upError) { Alert.alert('Upload failed', upError.message); setUploading(false); return; }

      const { data: urlData } = supabase.storage.from('profiles').getPublicUrl(path);
      const publicUrl = urlData?.publicUrl;
      if (publicUrl) {
        setForm(f => ({ ...f, avatar_url: publicUrl }));
        await supabase.from('user_profiles').update({ avatar_url: publicUrl }).eq('user_id', user.id);
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!user?.id) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('user_profiles').update({
        display_name: form.display_name.trim() || null,
        username: form.username.trim() || null,
        full_name: form.full_name.trim() || null,
        bio: form.bio.trim() || null,
        country: form.country.trim() || null,
        region: form.region.trim() || null,
        city: form.city.trim() || null,
        website: form.website.trim() || null,
        avatar_url: form.avatar_url,
        updated_at: new Date().toISOString(),
      }).eq('user_id', user.id);

      if (error) Alert.alert('Error', error.message);
      else Alert.alert('Success', 'Profile updated', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (err: any) { Alert.alert('Error', err?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  if (loading) return <View style={[styles.container, styles.center]}><ActivityIndicator size="large" color="#3b82f6" /></View>;

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#f1f5f9" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator size="small" color="#3b82f6" /> : <Text style={styles.saveText}>Save</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.form} keyboardShouldPersistTaps="handled">
        <View style={styles.avatarSection}>
          {form.avatar_url ? (
            <Image source={{ uri: form.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}><Ionicons name="person" size={40} color="#64748b" /></View>
          )}
          <TouchableOpacity style={styles.cameraBtn} onPress={pickImage} disabled={uploading}>
            {uploading ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="camera" size={16} color="#fff" />}
          </TouchableOpacity>
          <Text style={styles.avatarHint}>Tap to change photo</Text>
        </View>

        <Input label="Display Name" value={form.display_name} onChange={(t: string) => setForm({ ...form, display_name: t })} />
        <Input label="Username" value={form.username} onChange={(t: string) => setForm({ ...form, username: t })} autoCapitalize="none" />
        <Input label="Full Name" value={form.full_name} onChange={(t: string) => setForm({ ...form, full_name: t })} />

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Bio</Text>
          <TextInput style={[styles.input, styles.bioInput]} multiline numberOfLines={4}
            placeholder="Tell us about yourself..." placeholderTextColor="#64748b"
            value={form.bio} onChangeText={(t) => setForm({ ...form, bio: t })} maxLength={500} />
          <Text style={styles.charCount}>{form.bio.length}/500</Text>
        </View>

        <Input label="Country" value={form.country} onChange={(t: string) => setForm({ ...form, country: t })} />
        <Input label="Region" value={form.region} onChange={(t: string) => setForm({ ...form, region: t })} placeholder="e.g. Nairobi" />
        <Input label="City" value={form.city} onChange={(t: string) => setForm({ ...form, city: t })} />
        <Input label="Website" value={form.website} onChange={(t: string) => setForm({ ...form, website: t })} autoCapitalize="none" keyboardType="url" />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Input({ label, value, onChange, placeholder, autoCapitalize = 'words', keyboardType = 'default' }: any) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput style={styles.input} placeholder={placeholder || ''} placeholderTextColor="#64748b"
        value={value} onChangeText={onChange} autoCapitalize={autoCapitalize} keyboardType={keyboardType} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 50, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#f1f5f9' },
  saveText: { fontSize: 15, color: '#3b82f6', fontWeight: '600' },
  form: { padding: 16 },
  avatarSection: { alignItems: 'center', marginBottom: 24, position: 'relative' },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: '#3b82f6' },
  avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#1e293b', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#334155' },
  cameraBtn: { position: 'absolute', bottom: 20, right: '35%', backgroundColor: '#3b82f6', width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#0f172a' },
  avatarHint: { fontSize: 12, color: '#64748b', marginTop: 8 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 12, color: '#94a3b8', fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  input: { backgroundColor: '#1e293b', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, color: '#f1f5f9', fontSize: 15, borderWidth: 1, borderColor: '#334155' },
  bioInput: { height: 100, textAlignVertical: 'top', paddingTop: 12 },
  charCount: { fontSize: 11, color: '#64748b', textAlign: 'right', marginTop: 4 },
});
