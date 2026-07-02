import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  Image, ActivityIndicator, Alert, Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Camera, Save, Calendar } from 'lucide-react-native';

// Conditional datetimepicker import
try {
  var DateTimePicker = require('@react-native-community/datetimepicker').default;
} catch {
  var DateTimePicker = null;
}

interface ProfileForm {
  full_name: string;
  bio: string;
  location: string;
  website: string;
  phone: string;
  date_of_birth: string;
  gender: string;
}

const GENDER_OPTIONS = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];

export default function ProfileEdit() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [form, setForm] = useState<ProfileForm>({
    full_name: '', bio: '', location: '', website: '', phone: '', date_of_birth: '', gender: ''
  });
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateValue, setDateValue] = useState(new Date());

  useEffect(() => {
    if (!user?.id) return;
    supabase.from('user_profiles').select('*').eq('id', user.id).single()
      .then(({ data, error }) => {
        if (data) {
          setForm({
            full_name: data.full_name || '',
            bio: data.bio || '',
            location: data.location || '',
            website: data.website || '',
            phone: data.phone || '',
            date_of_birth: data.date_of_birth || '',
            gender: data.gender || ''
          });
          setAvatarUrl(data.avatar_url);
          if (data.date_of_birth) setDateValue(new Date(data.date_of_birth));
        }
        setLoading(false);
      });
  }, [user?.id]);

  const handleAvatarUpload = async () => {
    if (!user?.id) return;

    // Web file picker
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async (e: any) => {
        const file = e.target.files?.[0];
        if (!file) return;
        await uploadAvatar(file);
      };
      input.click();
    } else {
      // Native — use Alert to inform user
      Alert.alert('Upload Photo', 'Choose a photo from your library', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Continue', onPress: () => {
          // On native, we'd use expo-image-picker but it's not installed
          // For now, show a placeholder instruction
          Alert.alert('Note', 'Please install expo-image-picker for native image selection. For now, use the web version.');
        }}
      ]);
    }
  };

  const uploadAvatar = async (file: File | Blob) => {
    if (!user?.id) return;
    setUploading(true);
    try {
      const fileExt = (file as File).name?.split('.').pop() || 'jpg';
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath);

      setAvatarUrl(publicUrl);

      // Also update the profile record
      await supabase.from('user_profiles').update({
        avatar_url: publicUrl,
        updated_at: new Date().toISOString()
      }).eq('id', user.id);

      Alert.alert('Success', 'Avatar uploaded');
    } catch (err: any) {
      Alert.alert('Upload Error', err.message || 'Failed to upload avatar');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!user?.id) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('user_profiles').upsert({
        id: user.id,
        ...form,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString()
      });
      if (error) throw error;
      Alert.alert('Success', 'Profile updated');
      router.back();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDateValue(selectedDate);
      setForm(f => ({ ...f, date_of_birth: selectedDate.toISOString().split('T')[0] }));
    }
  };

  const openDatePicker = () => {
    if (DateTimePicker) {
      setShowDatePicker(true);
    } else {
      Alert.alert('Date Picker', 'Please enter date as YYYY-MM-DD');
    }
  };

  const updateField = (field: keyof ProfileForm, value: string) => {
    setForm(f => ({ ...f, [field]: value }));
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#38bdf8" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="#f8fafc" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator size="small" color="#38bdf8" /> : <Save size={24} color="#38bdf8" />}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrapper}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Camera size={32} color="#64748b" />
              </View>
            )}
            <TouchableOpacity style={styles.cameraButton} onPress={handleAvatarUpload} disabled={uploading}>
              {uploading ? (
                <ActivityIndicator size="small" color="#f8fafc" />
              ) : (
                <Camera size={16} color="#f8fafc" />
              )}
            </TouchableOpacity>
          </View>
          <Text style={styles.avatarHint}>Tap camera to change photo</Text>
        </View>

        {/* Form Fields */}
        <View style={styles.form}>
          <FormField label="Full Name" value={form.full_name} onChange={v => updateField('full_name', v)} />
          <FormField label="Bio" value={form.bio} onChange={v => updateField('bio', v)} multiline numberOfLines={3} />
          <FormField label="Location" value={form.location} onChange={v => updateField('location', v)} />
          <FormField label="Website" value={form.website} onChange={v => updateField('website', v)} />
          <FormField label="Phone" value={form.phone} onChange={v => updateField('phone', v)} keyboardType="phone-pad" />

          {/* Date of Birth */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Date of Birth</Text>
            <TouchableOpacity style={styles.dateButton} onPress={openDatePicker}>
              <Calendar size={16} color="#64748b" />
              <Text style={styles.dateText}>{form.date_of_birth || 'Select date'}</Text>
            </TouchableOpacity>
            {showDatePicker && DateTimePicker && (
              <DateTimePicker
                value={dateValue}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onDateChange}
                maximumDate={new Date()}
              />
            )}
            {!DateTimePicker && (
              <TextInput
                style={styles.input}
                value={form.date_of_birth}
                onChangeText={v => updateField('date_of_birth', v)}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#475569"
              />
            )}
          </View>

          {/* Gender */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Gender</Text>
            <View style={styles.chipRow}>
              {GENDER_OPTIONS.map(g => (
                <TouchableOpacity
                  key={g}
                  style={[styles.chip, form.gender === g && styles.chipActive]}
                  onPress={() => updateField('gender', g)}
                >
                  <Text style={[styles.chipText, form.gender === g && styles.chipTextActive]}>{g}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

function FormField({ label, value, onChange, multiline, numberOfLines, keyboardType }: any) {
  return (
    <View style={styles.fieldContainer}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.inputMultiline]}
        value={value}
        onChangeText={onChange}
        placeholder={`Enter ${label.toLowerCase()}`}
        placeholderTextColor="#475569"
        multiline={multiline}
        numberOfLines={numberOfLines}
        keyboardType={keyboardType}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  center: { justifyContent: 'center', alignItems: 'center', flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 60, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#f8fafc' },
  scroll: { flex: 1 },
  avatarSection: { alignItems: 'center', paddingVertical: 24 },
  avatarWrapper: { position: 'relative' },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: '#38bdf8' },
  avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#1e293b', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#334155' },
  cameraButton: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#38bdf8', borderRadius: 14, padding: 6, borderWidth: 2, borderColor: '#0f172a' },
  avatarHint: { fontSize: 12, color: '#64748b', marginTop: 8 },
  form: { paddingHorizontal: 16, gap: 16 },
  fieldContainer: { gap: 8 },
  label: { fontSize: 13, fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { backgroundColor: '#1e293b', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: '#f8fafc', borderWidth: 1, borderColor: '#334155' },
  inputMultiline: { height: 80, textAlignVertical: 'top', paddingTop: 12 },
  dateButton: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#1e293b', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, borderWidth: 1, borderColor: '#334155' },
  dateText: { fontSize: 15, color: '#f8fafc' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#1e293b', borderRadius: 20, borderWidth: 1, borderColor: '#334155' },
  chipActive: { backgroundColor: '#38bdf820', borderColor: '#38bdf8' },
  chipText: { fontSize: 13, color: '#94a3b8' },
  chipTextActive: { color: '#38bdf8', fontWeight: '600' },
});
