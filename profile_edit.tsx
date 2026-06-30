import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, Alert,
  ActivityIndicator, Platform, KeyboardAvoidingView, Keyboard, Dimensions, Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';

const { width: SCREEN_W } = Dimensions.get('window');

interface ProfileForm {
  display_name: string;
  username: string;
  bio: string;
  city: string;
  country: string;
  profession: string;
  website: string;
  phone: string;
  date_of_birth: string;
  gender: string;
  languages: string;
  skills: string;
  avatar_url: string | null;
  cover_photo_url: string | null;
}

const GENDER_OPTIONS = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];
const MAX_BIO_LENGTH = 280;
const MAX_USERNAME_LENGTH = 30;
const MAX_DISPLAY_NAME_LENGTH = 50;

export default function ProfileEditScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalForm, setOriginalForm] = useState<ProfileForm | null>(null);
  const [form, setForm] = useState<ProfileForm>({
    display_name: '', username: '', bio: '', city: '', country: '',
    profession: '', website: '', phone: '', date_of_birth: '', gender: '',
    languages: '', skills: '', avatar_url: null, cover_photo_url: null,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showGenderPicker, setShowGenderPicker] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const fetchProfile = useCallback(async () => {
    if (!user?.id) { setLoading(false); return; }
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('display_name, username, bio, city, country, profession, website, phone, date_of_birth, gender, languages, skills, avatar_url, cover_photo_url')
        .eq('user_id', user.id)
        .single();
      if (error) throw error;

      const initialForm: ProfileForm = {
        display_name: data?.display_name || '',
        username: data?.username || '',
        bio: data?.bio || '',
        city: data?.city || '',
        country: data?.country || '',
        profession: data?.profession || '',
        website: data?.website || '',
        phone: data?.phone || '',
        date_of_birth: data?.date_of_birth || '',
        gender: data?.gender || '',
        languages: Array.isArray(data?.languages) ? (data.languages as string[]).join(', ') : (data?.languages || ''),
        skills: Array.isArray(data?.skills) ? (data.skills as string[]).join(', ') : (data?.skills || ''),
        avatar_url: data?.avatar_url || null,
        cover_photo_url: data?.cover_photo_url || null,
      };
      setForm(initialForm);
      setOriginalForm(initialForm);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  useEffect(() => {
    if (!originalForm) return;
    const changed = JSON.stringify(form) !== JSON.stringify(originalForm);
    setHasChanges(changed);
  }, [form, originalForm]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!form.display_name.trim()) {
      newErrors.display_name = 'Display name is required';
    } else if (form.display_name.length > MAX_DISPLAY_NAME_LENGTH) {
      newErrors.display_name = `Max ${MAX_DISPLAY_NAME_LENGTH} characters`;
    }

    if (!form.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (form.username.length > MAX_USERNAME_LENGTH) {
      newErrors.username = `Max ${MAX_USERNAME_LENGTH} characters`;
    } else if (!/^[a-zA-Z0-9_]+$/.test(form.username)) {
      newErrors.username = 'Only letters, numbers, and underscores';
    }

    if (form.bio.length > MAX_BIO_LENGTH) {
      newErrors.bio = `Max ${MAX_BIO_LENGTH} characters`;
    }

    if (form.website && !/^https?:\/\/.+/.test(form.website)) {
      newErrors.website = 'Must start with http:// or https://';
    }

    if (form.phone && !/^\+?[\d\s\-()]{7,20}$/.test(form.phone)) {
      newErrors.phone = 'Invalid phone number';
    }

    if (form.date_of_birth) {
      const dob = new Date(form.date_of_birth);
      const now = new Date();
      const age = now.getFullYear() - dob.getFullYear();
      if (age < 13) newErrors.date_of_birth = 'Must be at least 13 years old';
      if (age > 120) newErrors.date_of_birth = 'Invalid date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const checkUsernameUnique = async (username: string): Promise<boolean> => {
    if (!user?.id || !username.trim()) return true;
    const { data, error } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('username', username.trim())
      .neq('user_id', user.id)
      .maybeSingle();
    if (error) { console.warn('[UsernameCheck]', error.message); return true; }
    return !data;
  };

  const handleSave = async () => {
    if (!user?.id) { Alert.alert('Error', 'Not authenticated'); return; }
    if (!validate()) {
      Alert.alert('Validation Error', 'Please fix the errors before saving');
      return;
    }

    // Check username uniqueness if changed
    if (form.username !== originalForm?.username) {
      const isUnique = await checkUsernameUnique(form.username);
      if (!isUnique) {
        setErrors(prev => ({ ...prev, username: 'Username already taken' }));
        Alert.alert('Username Taken', 'This username is already in use. Please choose another.');
        return;
      }
    }

    setSaving(true);
    try {
      const { error } = await supabase.from('profiles').update({
        display_name: form.display_name.trim(),
        username: form.username.trim().toLowerCase(),
        bio: form.bio.trim(),
        city: form.city.trim(),
        country: form.country.trim(),
        profession: form.profession.trim(),
        website: form.website.trim() || null,
        phone: form.phone.trim() || null,
        date_of_birth: form.date_of_birth || null,
        gender: form.gender || null,
        languages: form.languages ? form.languages.split(',').map(s => s.trim()).filter(Boolean) : [],
        skills: form.skills ? form.skills.split(',').map(s => s.trim()).filter(Boolean) : [],
        updated_at: new Date().toISOString(),
      }).eq('user_id', user.id);

      if (error) throw error;

      setOriginalForm({ ...form });
      setHasChanges(false);
      Alert.alert('Success', 'Profile updated successfully', [
        { text: 'Stay', style: 'cancel' },
        { text: 'View Profile', onPress: () => router.push('/(os)/profile') },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  };

  // AVATAR UPLOAD
  const handleAvatarUpload = async () => {
    if (!user?.id) return;
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') { Alert.alert('Permission Required', 'Please allow access to photos'); return; }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled || !result.assets?.[0]?.uri) return;

      setUploadingAvatar(true);
      const fileUri = result.assets[0].uri;
      const fileExt = fileUri.split('.').pop() || 'jpg';
      const fileName = `avatars/${user.id}/${Date.now()}.${fileExt}`;

      const response = await fetch(fileUri);
      const blob = await response.blob();

      const { error: uploadError } = await supabase.storage.from('profiles').upload(fileName, blob, {
        contentType: `image/${fileExt === 'png' ? 'png' : 'jpeg'}`,
        upsert: true,
      });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('profiles').getPublicUrl(fileName);

      const { error: updateError } = await supabase.from('profiles').update({
        avatar_url: publicUrl,
        updated_at: new Date().toISOString(),
      }).eq('user_id', user.id);
      if (updateError) throw updateError;

      setForm(prev => ({ ...prev, avatar_url: publicUrl }));
      Alert.alert('Success', 'Profile photo updated');
    } catch (e: any) {
      Alert.alert('Upload Error', e.message);
    } finally {
      setUploadingAvatar(false);
    }
  };

  // COVER PHOTO UPLOAD
  const handleCoverUpload = async () => {
    if (!user?.id) return;
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') { Alert.alert('Permission Required', 'Please allow access to photos'); return; }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (result.canceled || !result.assets?.[0]?.uri) return;

      setUploadingCover(true);
      const fileUri = result.assets[0].uri;
      const fileExt = fileUri.split('.').pop() || 'jpg';
      const fileName = `covers/${user.id}/${Date.now()}.${fileExt}`;

      const response = await fetch(fileUri);
      const blob = await response.blob();

      const { error: uploadError } = await supabase.storage.from('profiles').upload(fileName, blob, {
        contentType: `image/${fileExt === 'png' ? 'png' : 'jpeg'}`,
        upsert: true,
      });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('profiles').getPublicUrl(fileName);

      const { error: updateError } = await supabase.from('profiles').update({
        cover_photo_url: publicUrl,
        updated_at: new Date().toISOString(),
      }).eq('user_id', user.id);
      if (updateError) throw updateError;

      setForm(prev => ({ ...prev, cover_photo_url: publicUrl }));
      Alert.alert('Success', 'Cover photo updated');
    } catch (e: any) {
      Alert.alert('Upload Error', e.message);
    } finally {
      setUploadingCover(false);
    }
  };

  // REMOVE PHOTO
  const handleRemoveAvatar = () => {
    Alert.alert('Remove Photo', 'Remove your profile photo?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
        if (!user?.id) return;
        const { error } = await supabase.from('profiles').update({ avatar_url: null }).eq('user_id', user.id);
        if (error) { Alert.alert('Error', error.message); return; }
        setForm(prev => ({ ...prev, avatar_url: null }));
      }},
    ]);
  };

  const handleRemoveCover = () => {
    Alert.alert('Remove Cover', 'Remove your cover photo?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
        if (!user?.id) return;
        const { error } = await supabase.from('profiles').update({ cover_photo_url: null }).eq('user_id', user.id);
        if (error) { Alert.alert('Error', error.message); return; }
        setForm(prev => ({ ...prev, cover_photo_url: null }));
      }},
    ]);
  };

  // DATE PICKER
  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      const iso = selectedDate.toISOString().split('T')[0];
      setForm(prev => ({ ...prev, date_of_birth: iso }));
      setErrors(prev => { const n = { ...prev }; delete n.date_of_birth; return n; });
    }
  };

  // BACK WITH UNSAVED CHANGES CHECK
  const handleBack = () => {
    if (hasChanges) {
      Alert.alert('Unsaved Changes', 'You have unsaved changes. Discard them?', [
        { text: 'Keep Editing', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: () => router.back() },
      ]);
    } else {
      router.back();
    }
  };

  // DELETE ACCOUNT
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      Alert.alert('Confirmation Failed', 'Type DELETE to confirm');
      return;
    }
    if (!user?.id) return;
    setSaving(true);
    try {
      // Call edge function or RPC to delete user
      const { error } = await supabase.rpc('delete_user_account', { user_id: user.id });
      if (error) throw error;
      Alert.alert('Account Deleted', 'Your account has been permanently deleted');
      router.replace('/(os)/auth/sign-in');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not delete account. Contact support.');
      setSaving(false);
    }
  };

  const updateField = (field: keyof ProfileForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#00d4ff" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.headerBtn}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <TouchableOpacity
            style={[styles.saveBtn, (!hasChanges || saving) && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={!hasChanges || saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <Text style={styles.saveBtnText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
        >
          {/* COVER PHOTO */}
          <View style={styles.coverContainer}>
            {form.cover_photo_url ? (
              <Image source={{ uri: form.cover_photo_url }} style={styles.coverPhoto} />
            ) : (
              <LinearGradient colors={['#667eea', '#764ba2']} style={styles.coverPhoto} />
            )}
            <View style={styles.coverOverlay}>
              <TouchableOpacity style={styles.coverActionBtn} onPress={handleCoverUpload} disabled={uploadingCover}>
                {uploadingCover ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="camera" size={16} color="#fff" />
                    <Text style={styles.coverActionText}>Change Cover</Text>
                  </>
                )}
              </TouchableOpacity>
              {form.cover_photo_url && (
                <TouchableOpacity style={[styles.coverActionBtn, { backgroundColor: 'rgba(255,0,0,0.6)' }]} onPress={handleRemoveCover}>
                  <Ionicons name="trash" size={16} color="#fff" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* AVATAR */}
          <View style={styles.avatarSection}>
            <TouchableOpacity style={styles.avatarWrapper} onPress={handleAvatarUpload} disabled={uploadingAvatar}>
              {form.avatar_url ? (
                <Image source={{ uri: form.avatar_url }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarFallback]}>
                  <Ionicons name="person" size={40} color="#fff" />
                </View>
              )}
              <View style={styles.avatarCameraBadge}>
                {uploadingAvatar ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="camera" size={14} color="#fff" />
                )}
              </View>
            </TouchableOpacity>
            <View style={styles.avatarActions}>
              <TouchableOpacity style={styles.avatarActionBtn} onPress={handleAvatarUpload}>
                <Ionicons name="image" size={16} color="#00d4ff" />
                <Text style={styles.avatarActionText}>Change Photo</Text>
              </TouchableOpacity>
              {form.avatar_url && (
                <TouchableOpacity style={styles.avatarActionBtn} onPress={handleRemoveAvatar}>
                  <Ionicons name="trash" size={16} color="#ff4444" />
                  <Text style={[styles.avatarActionText, { color: '#ff4444' }]}>Remove</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* FORM FIELDS */}
          <View style={styles.formSection}>
            <Text style={styles.sectionLabel}>Basic Info</Text>

            <FormField
              label="Display Name *"
              value={form.display_name}
              onChangeText={v => updateField('display_name', v)}
              placeholder="Your display name"
              maxLength={MAX_DISPLAY_NAME_LENGTH}
              error={errors.display_name}
              icon="person-outline"
            />

            <FormField
              label="Username *"
              value={form.username}
              onChangeText={v => updateField('username', v.replace(/[^a-zA-Z0-9_]/g, ''))}
              placeholder="username"
              maxLength={MAX_USERNAME_LENGTH}
              error={errors.username}
              icon="at-outline"
              autoCapitalize="none"
              helper={`@${form.username || 'username'}`}
            />

            <FormField
              label="Bio"
              value={form.bio}
              onChangeText={v => updateField('bio', v)}
              placeholder="Tell us about yourself..."
              multiline
              numberOfLines={3}
              maxLength={MAX_BIO_LENGTH}
              error={errors.bio}
              icon="document-text-outline"
              helper={`${form.bio.length}/${MAX_BIO_LENGTH}`}
            />

            <Text style={styles.sectionLabel}>Location & Work</Text>

            <FormField
              label="City"
              value={form.city}
              onChangeText={v => updateField('city', v)}
              placeholder="Your city"
              icon="location-outline"
            />

            <FormField
              label="Country"
              value={form.country}
              onChangeText={v => updateField('country', v)}
              placeholder="Your country"
              icon="globe-outline"
            />

            <FormField
              label="Profession"
              value={form.profession}
              onChangeText={v => updateField('profession', v)}
              placeholder="What do you do?"
              icon="briefcase-outline"
            />

            <Text style={styles.sectionLabel}>Contact & Details</Text>

            <FormField
              label="Website"
              value={form.website}
              onChangeText={v => updateField('website', v)}
              placeholder="https://yourwebsite.com"
              autoCapitalize="none"
              keyboardType="url"
              error={errors.website}
              icon="link-outline"
            />

            <FormField
              label="Phone"
              value={form.phone}
              onChangeText={v => updateField('phone', v)}
              placeholder="+254 700 000 000"
              keyboardType="phone-pad"
              error={errors.phone}
              icon="call-outline"
            />

            {/* DATE OF BIRTH */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Date of Birth</Text>
              <TouchableOpacity
                style={[styles.inputRow, errors.date_of_birth && styles.inputError]}
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons name="calendar-outline" size={18} color="#888" style={styles.inputIcon} />
                <Text style={[styles.inputText, !form.date_of_birth && styles.inputPlaceholder]}>
                  {form.date_of_birth || 'Select date of birth'}
                </Text>
                <Ionicons name="chevron-forward" size={16} color="#888" />
              </TouchableOpacity>
              {errors.date_of_birth && <Text style={styles.errorText}>{errors.date_of_birth}</Text>}
            </View>

            {showDatePicker && (
              <DateTimePicker
                value={form.date_of_birth ? new Date(form.date_of_birth) : new Date(2000, 0, 1)}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleDateChange}
                maximumDate={new Date()}
              />
            )}

            {/* GENDER */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Gender</Text>
              <TouchableOpacity
                style={styles.inputRow}
                onPress={() => setShowGenderPicker(true)}
              >
                <Ionicons name="male-female-outline" size={18} color="#888" style={styles.inputIcon} />
                <Text style={[styles.inputText, !form.gender && styles.inputPlaceholder]}>
                  {form.gender || 'Select gender'}
                </Text>
                <Ionicons name="chevron-forward" size={16} color="#888" />
              </TouchableOpacity>
            </View>

            <Modal visible={showGenderPicker} transparent animationType="slide">
              <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>Select Gender</Text>
                  {GENDER_OPTIONS.map(g => (
                    <TouchableOpacity
                      key={g}
                      style={[styles.genderOption, form.gender === g && styles.genderOptionActive]}
                      onPress={() => { updateField('gender', g); setShowGenderPicker(false); }}
                    >
                      <Text style={[styles.genderOptionText, form.gender === g && styles.genderOptionTextActive]}>{g}</Text>
                      {form.gender === g && <Ionicons name="checkmark" size={18} color="#00d4ff" />}
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowGenderPicker(false)}>
                    <Text style={styles.modalCloseText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>

            <FormField
              label="Languages"
              value={form.languages}
              onChangeText={v => updateField('languages', v)}
              placeholder="English, Swahili, French..."
              icon="language-outline"
              helper="Comma-separated list"
            />

            <FormField
              label="Skills"
              value={form.skills}
              onChangeText={v => updateField('skills', v)}
              placeholder="Design, Programming, Writing..."
              icon="construct-outline"
              helper="Comma-separated list"
            />
          </View>

          {/* DANGER ZONE */}
          <View style={styles.dangerZone}>
            <Text style={styles.dangerTitle}>Danger Zone</Text>
            <TouchableOpacity style={styles.dangerBtn} onPress={() => setShowDeleteModal(true)}>
              <Ionicons name="trash-outline" size={18} color="#ff4444" />
              <Text style={styles.dangerBtnText}>Delete Account</Text>
            </TouchableOpacity>
            <Text style={styles.dangerHint}>This action is permanent and cannot be undone.</Text>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* DELETE ACCOUNT MODAL */}
      <Modal visible={showDeleteModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons name="warning" size={48} color="#ff4444" />
            <Text style={styles.modalTitle}>Delete Account</Text>
            <Text style={styles.modalSubtitle}>
              This will permanently delete your account, all data, posts, and transactions. This cannot be undone.
            </Text>
            <Text style={styles.modalInstruction}>
              Type <Text style={{ fontWeight: '700', color: '#ff4444' }}>DELETE</Text> to confirm:
            </Text>
            <TextInput
              style={styles.deleteInput}
              value={deleteConfirmText}
              onChangeText={setDeleteConfirmText}
              placeholder="DELETE"
              placeholderTextColor="#555"
              autoCapitalize="characters"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => { setShowDeleteModal(false); setDeleteConfirmText(''); }}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalDeleteBtn, deleteConfirmText !== 'DELETE' && styles.modalDeleteBtnDisabled]}
                onPress={handleDeleteAccount}
                disabled={deleteConfirmText !== 'DELETE' || saving}
              >
                {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.modalDeleteText}>Delete Forever</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// FORM FIELD COMPONENT
function FormField({
  label, value, onChangeText, placeholder, multiline, numberOfLines, maxLength,
  error, icon, helper, autoCapitalize, keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  multiline?: boolean;
  numberOfLines?: number;
  maxLength?: number;
  error?: string;
  icon: string;
  helper?: string;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad' | 'url';
}) {
  return (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={[styles.inputRow, multiline && styles.inputMultiline, error && styles.inputError]}>
        <Ionicons name={icon as any} size={18} color="#888" style={styles.inputIcon} />
        <TextInput
          style={[styles.input, multiline && styles.inputMultilineText]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#555"
          multiline={multiline}
          numberOfLines={numberOfLines}
          maxLength={maxLength}
          autoCapitalize={autoCapitalize}
          keyboardType={keyboardType}
          textAlignVertical={multiline ? 'top' : 'center'}
        />
      </View>
      {helper && !error && <Text style={styles.helperText}>{helper}</Text>}
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#888', marginTop: 12, fontSize: 14 },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  headerBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  saveBtn: { backgroundColor: '#00d4ff', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  saveBtnDisabled: { backgroundColor: '#333' },
  saveBtnText: { color: '#000', fontWeight: '700', fontSize: 14 },

  scrollContent: { paddingBottom: 20 },

  coverContainer: { width: SCREEN_W, height: 160, position: 'relative' },
  coverPhoto: { width: '100%', height: '100%' },
  coverOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 12, flexDirection: 'row', gap: 8, justifyContent: 'flex-end' },
  coverActionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 6 },
  coverActionText: { color: '#fff', fontSize: 12, fontWeight: '600' },

  avatarSection: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginTop: -40, marginBottom: 16 },
  avatarWrapper: { position: 'relative' },
  avatar: { width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: '#000' },
  avatarFallback: { backgroundColor: '#333', justifyContent: 'center', alignItems: 'center' },
  avatarCameraBadge: { position: 'absolute', bottom: 2, right: 2, width: 28, height: 28, borderRadius: 14, backgroundColor: '#00d4ff', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#000' },
  avatarActions: { marginLeft: 16, flex: 1 },
  avatarActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6 },
  avatarActionText: { color: '#00d4ff', fontSize: 13, fontWeight: '600' },

  formSection: { paddingHorizontal: 16 },
  sectionLabel: { color: '#888', fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginTop: 20, marginBottom: 12 },

  fieldContainer: { marginBottom: 16 },
  fieldLabel: { color: '#aaa', fontSize: 13, marginBottom: 6, fontWeight: '500' },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', borderRadius: 12, borderWidth: 1, borderColor: '#222', paddingHorizontal: 12, paddingVertical: 10 },
  inputMultiline: { alignItems: 'flex-start', paddingVertical: 12, minHeight: 80 },
  inputError: { borderColor: '#ff4444' },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, color: '#fff', fontSize: 15, padding: 0 },
  inputMultilineText: { lineHeight: 20, paddingTop: 2 },
  inputText: { flex: 1, color: '#fff', fontSize: 15 },
  inputPlaceholder: { color: '#555' },
  helperText: { color: '#555', fontSize: 11, marginTop: 4 },
  errorText: { color: '#ff4444', fontSize: 12, marginTop: 4 },

  genderOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  genderOptionActive: { backgroundColor: '#001a2e' },
  genderOptionText: { color: '#aaa', fontSize: 15 },
  genderOptionTextActive: { color: '#00d4ff', fontWeight: '600' },

  dangerZone: { marginTop: 32, paddingHorizontal: 16, paddingTop: 20, borderTopWidth: 1, borderTopColor: '#1a1a1a' },
  dangerTitle: { color: '#ff4444', fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  dangerBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#1a0000', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: '#ff444433' },
  dangerBtnText: { color: '#ff4444', fontSize: 15, fontWeight: '600' },
  dangerHint: { color: '#555', fontSize: 12, marginTop: 8 },

  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.7)' },
  modalContent: { backgroundColor: '#111', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, alignItems: 'center' },
  modalTitle: { color: '#fff', fontSize: 20, fontWeight: '700', marginTop: 12 },
  modalSubtitle: { color: '#aaa', fontSize: 14, textAlign: 'center', marginTop: 8, lineHeight: 20 },
  modalInstruction: { color: '#888', fontSize: 13, marginTop: 16 },
  deleteInput: { width: '100%', backgroundColor: '#1a1a1a', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, color: '#fff', fontSize: 16, marginTop: 12, borderWidth: 1, borderColor: '#ff4444', textAlign: 'center', fontWeight: '700' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 20, width: '100%' },
  modalCancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#222', alignItems: 'center' },
  modalCancelText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  modalDeleteBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#ff4444', alignItems: 'center' },
  modalDeleteBtnDisabled: { backgroundColor: '#331111' },
  modalDeleteText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  modalCloseBtn: { paddingVertical: 14, width: '100%', alignItems: 'center', marginTop: 8 },
  modalCloseText: { color: '#888', fontSize: 15, fontWeight: '600' },
});
