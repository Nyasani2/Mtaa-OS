import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Image, ActivityIndicator, Alert, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';

const GENDER_OPTIONS = ['Male', 'Female', 'Other', 'Prefer not to say'];

// ─── Helpers ───────────────────────────────────────────────────────────────

function isBase64DataUri(uri: string): boolean {
  return uri.startsWith('data:');
}

function getExtensionFromUri(uri: string): string {
  if (isBase64DataUri(uri)) {
    const mime = uri.match(/^data:([^;]+);/)?.[1] || 'image/png';
    const map: Record<string, string> = {
      'image/png': 'png', 'image/jpeg': 'jpg', 'image/jpg': 'jpg',
      'image/webp': 'webp', 'image/gif': 'gif',
    };
    return map[mime] || 'png';
  }
  const clean = uri.split('?')[0].split('#')[0];
  const parts = clean.split('.');
  if (parts.length < 2) return 'jpg';
  const ext = parts.pop()?.toLowerCase() || 'jpg';
  const valid = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'heic'];
  return valid.includes(ext) ? ext : 'jpg';
}

function dataUriToBlob(dataUri: string): Blob {
  const mime = dataUri.match(/^data:([^;]+);/)?.[1] || 'image/png';
  const base64 = dataUri.split(',')[1];
  const byteString = atob(base64);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
  return new Blob([ab], { type: mime });
}

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, profile, refreshProfile } = useAuthStore();

  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // ONLY fields that exist in user_profiles schema
  const [form, setForm] = useState({
    display_name: '',
    username: '',
    full_name: '',
    bio: '',
    country: '',
    region: '',
    city: '',
    gender: '',
    date_of_birth: '',
  });

  // Load profile data — ONLY existing columns
  useEffect(() => {
    if (profile) {
      setForm({
        display_name: profile.display_name || '',
        username: profile.username || '',
        full_name: profile.full_name || '',
        bio: profile.bio || '',
        country: profile.country || '',
        region: profile.region || '',
        city: profile.city || '',
        gender: profile.gender || '',
        date_of_birth: profile.date_of_birth || '',
      });
      setAvatarUrl(profile.avatar_url || null);
    }
    // Auth debug
    const au = useAuthStore.getState().user;
      console.log('[ProfileEdit] Auth:', {
        authId: au?.id, storeId: user?.id, profileId: profile?.user_id,
        match: au?.id === user?.id && user?.id === profile?.user_id,
      });
    });

  // ─── Avatar Upload ───────────────────────────────────────────────────────

  const pickAvatar = async (source: 'camera' | 'gallery' = 'gallery') => {
    if (!user?.id) { Alert.alert('Error', 'You must be logged in'); return; }

    try {
      let result;
      if (source === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') { Alert.alert('Permission Denied', 'Camera required.'); return; }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true, aspect: [1, 1], quality: 0.8,
        });
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') { Alert.alert('Permission Denied', 'Photo library required.'); return; }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true, aspect: [1, 1], quality: 0.8,
        });
      }

      if (result.canceled || !result.assets?.length) return;
      const uri = result.assets[0].uri;
      setAvatarPreview(uri);
      setUploadingAvatar(true);

      const ext = getExtensionFromUri(uri);
      const mimeType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : ext === 'gif' ? 'image/gif' : 'image/jpeg';
      const fileName = `${user.id}/${Date.now()}.${ext}`;

      let fileData: File | Blob | ArrayBuffer;
      if (isBase64DataUri(uri)) {
        fileData = dataUriToBlob(uri);
      } else if (Platform.OS === 'web') {
        fileData = await (await fetch(uri)).blob();
      } else {
        fileData = await (await fetch(uri)).arrayBuffer();
      }

      // Upload to Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars').upload(fileName, fileData, { contentType: mimeType, upsert: true });
      if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
      const publicUrl = urlData?.publicUrl;
      if (!publicUrl) throw new Error('Failed to get public URL');

      // FIX: Use .update() instead of .upsert()
      const { error: updateError, data: updateData } = await supabase
        .from('user_profiles')
        .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .select();

      if (updateError) throw new Error(`Database update failed: ${updateError.message}`);

      // If no row updated, create it
      if (!updateData || updateData.length === 0) {
        const { error: insertError } = await supabase
          .from('user_profiles')
          .insert({ user_id: user.id, avatar_url: publicUrl, updated_at: new Date().toISOString() });
        if (insertError) throw new Error(`Profile creation failed: ${insertError.message}`);
      }

      setAvatarUrl(publicUrl);
      setAvatarPreview(null);
      Alert.alert('Success', 'Avatar updated successfully');
    } catch (err: any) {
      console.error('Avatar upload failed:', err);
      setAvatarPreview(null);
      Alert.alert('Upload Failed', err?.message || 'Could not upload avatar.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const showImagePickerOptions = () => {
    if (Platform.OS === 'ios') {
      Alert.alert('Change Photo', 'Choose a source', [
        { text: 'Camera', onPress: () => pickAvatar('camera') },
        { text: 'Photo Library', onPress: () => pickAvatar('gallery') },
        { text: 'Cancel', style: 'cancel' },
      ]);
    } else {
      pickAvatar('gallery');
    }
  };

  // ─── Save Profile ────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!user?.id) { Alert.alert('Error', 'You must be logged in'); return; }

    setSaving(true);
    try {
      // ONLY update columns that actually exist in user_profiles
      const updatePayload = {
        display_name: form.display_name || null,
        username: form.username || null,
        full_name: form.full_name || null,
        bio: form.bio || null,
        country: form.country || null,
        region: form.region || null,
        city: form.city || null,
        gender: form.gender || null,
        date_of_birth: form.date_of_birth || null,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      };

      // FIX: Use .update() instead of .upsert()
      const { error: updateError, data: updateData } = await supabase
        .from('user_profiles')
        .update(updatePayload)
        .eq('user_id', user.id)
        .select();

      if (updateError) throw new Error(`Save failed: ${updateError.message}`);

      if (!updateData || updateData.length === 0) {
        const { error: insertError } = await supabase
          .from('user_profiles')
          .insert({ user_id: user.id, ...updatePayload });
        if (insertError) throw new Error(`Profile creation failed: ${insertError.message}`);
      }

      await refreshProfile();
      Alert.alert('Success', 'Profile saved successfully');
      router.back();
    } catch (err: any) {
      console.error('Save profile error:', err);
      Alert.alert('Save Failed', err?.message || 'Could not save profile.');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const displayAvatar = avatarPreview || avatarUrl;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.avatarSection}>
        <TouchableOpacity onPress={showImagePickerOptions} disabled={uploadingAvatar}>
          <View style={styles.avatarContainer}>
            {displayAvatar ? (
              <Image source={{ uri: displayAvatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={40} color="#666" />
              </View>
            )}
            {uploadingAvatar && (
              <View style={styles.uploadingOverlay}>
                <ActivityIndicator color="#fff" />
              </View>
            )}
            <View style={styles.cameraIcon}>
              <Ionicons name="camera" size={16} color="#fff" />
            </View>
          </View>
        </TouchableOpacity>
        <Text style={styles.avatarText}>
          {uploadingAvatar ? 'Uploading...' : 'Tap to change photo'}
        </Text>
      </View>

      <View style={styles.form}>
        <FormField label="Display Name" value={form.display_name} onChange={(v) => updateField('display_name', v)} />
        <FormField label="Username" value={form.username} onChange={(v) => updateField('username', v)} />
        <FormField label="Full Name" value={form.full_name} onChange={(v) => updateField('full_name', v)} />
        <FormField label="Bio" value={form.bio} onChange={(v) => updateField('bio', v)} multiline maxLength={500} />
        <FormField label="Country" value={form.country} onChange={(v) => updateField('country', v)} />
        <FormField label="Region" value={form.region} onChange={(v) => updateField('region', v)} placeholder="e.g. Nairobi" />
        <FormField label="City" value={form.city} onChange={(v) => updateField('city', v)} placeholder="e.g. Nairobi" />

        <Text style={styles.label}>Gender</Text>
        <View style={styles.genderRow}>
          {GENDER_OPTIONS.map((g) => (
            <TouchableOpacity
              key={g}
              style={[styles.genderBtn, form.gender === g && styles.genderBtnActive]}
              onPress={() => updateField('gender', g)}
            >
              <Text style={[styles.genderText, form.gender === g && styles.genderTextActive]}>{g}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <FormField label="Date of Birth" value={form.date_of_birth} onChange={(v) => updateField('date_of_birth', v)} placeholder="YYYY-MM-DD" />
      </View>

      <TouchableOpacity
        style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Profile</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

function FormField({ label, value, onChange, multiline, maxLength, placeholder }: {
  label: string; value: string; onChange: (v: string) => void;
  multiline?: boolean; maxLength?: number; placeholder?: string;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.inputMultiline]}
        value={value}
        onChangeText={onChange}
        multiline={multiline}
        maxLength={maxLength}
        placeholder={placeholder}
        placeholderTextColor="#555"
      />
      {maxLength && <Text style={styles.charCount}>{value.length}/{maxLength}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  content: { padding: 20, paddingBottom: 40 },
  avatarSection: { alignItems: 'center', marginBottom: 24 },
  avatarContainer: { position: 'relative' },
  avatar: { width: 120, height: 120, borderRadius: 60, borderWidth: 3, borderColor: '#3b82f6' },
  avatarPlaceholder: {
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: '#1a1a1a', justifyContent: 'center', alignItems: 'center',
    borderWidth: 3, borderColor: '#333',
  },
  uploadingOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 60,
    justifyContent: 'center', alignItems: 'center',
  },
  cameraIcon: {
    position: 'absolute', bottom: 0, right: 0,
    backgroundColor: '#3b82f6', width: 32, height: 32, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#0a0a0a',
  },
  avatarText: { color: '#888', marginTop: 8, fontSize: 13 },
  form: { gap: 16 },
  field: {},
  label: { color: '#888', fontSize: 12, textTransform: 'uppercase', marginBottom: 6, letterSpacing: 0.5 },
  input: {
    backgroundColor: '#1a1a1a', color: '#fff', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15,
    borderWidth: 1, borderColor: '#2a2a2a',
  },
  inputMultiline: { minHeight: 80, textAlignVertical: 'top' },
  charCount: { color: '#555', fontSize: 11, textAlign: 'right', marginTop: 4 },
  genderRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  genderBtn: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#2a2a2a',
  },
  genderBtnActive: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  genderText: { color: '#aaa', fontSize: 13 },
  genderTextActive: { color: '#fff', fontWeight: '600' },
  saveBtn: {
    backgroundColor: '#3b82f6', borderRadius: 12, paddingVertical: 14,
    alignItems: 'center', marginTop: 24,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
