import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useProfile } from '@/lib/profile/hooks/useProfile';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export default function EditProfileScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { profile, updateProfile, uploadAvatar, loading } = useProfile();

  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [website, setWebsite] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.full_name || '');
      setUsername(profile.username || '');
      setBio(profile.bio || '');
      setLocation(profile.location || '');
      setWebsite(profile.website || '');
    }
  }, [profile]);

  const pickAvatar = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setAvatarUri(result.assets[0].uri);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const takeAvatarPhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Camera permission is required');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setAvatarUri(result.assets[0].uri);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to capture photo');
    }
  };

  const handleSave = async () => {
    if (!user?.id) return;
    setSaving(true);

    try {
      // Upload avatar if changed
      let avatarUrl = profile?.avatar_url;
      if (avatarUri) {
        const uploaded = await uploadAvatar(avatarUri);
        if (uploaded) avatarUrl = uploaded;
      }

      // Update profile
      await updateProfile({
        full_name: displayName.trim(),
        username: username.trim(),
        bio: bio.trim(),
        location: location.trim(),
        website: website.trim(),
        avatar_url: avatarUrl,
      });

      Alert.alert('Success', 'Profile updated successfully');
      router.back();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const avatarInitial = (displayName || user?.email || 'U').charAt(0).toUpperCase();
  const currentAvatar = avatarUri || profile?.avatar_url;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={pickAvatar} style={styles.avatarWrapper}>
            {currentAvatar ? (
              <Image source={{ uri: currentAvatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarText}>{avatarInitial}</Text>
              </View>
            )}
            <View style={styles.avatarOverlay}>
              <Ionicons name="camera" size={24} color="#fff" />
            </View>
          </TouchableOpacity>

          <View style={styles.avatarActions}>
            <TouchableOpacity style={styles.avatarActionBtn} onPress={pickAvatar}>
              <Ionicons name="image-outline" size={18} color="#0ea5e9" />
              <Text style={styles.avatarActionText}>Choose Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.avatarActionBtn} onPress={takeAvatarPhoto}>
              <Ionicons name="camera-outline" size={18} color="#0ea5e9" />
              <Text style={styles.avatarActionText}>Take Photo</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Form Fields */}
        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>Display Name</Text>
            <TextInput
              style={styles.input}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Your display name"
              placeholderTextColor="#666"
              maxLength={50}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Username</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="@username"
              placeholderTextColor="#666"
              autoCapitalize="none"
              maxLength={30}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Bio</Text>
            <TextInput
              style={[styles.input, styles.bioInput]}
              value={bio}
              onChangeText={setBio}
              placeholder="Tell us about yourself"
              placeholderTextColor="#666"
              multiline
              maxLength={160}
              numberOfLines={4}
            />
            <Text style={styles.charCount}>{bio.length}/160</Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Location</Text>
            <TextInput
              style={styles.input}
              value={location}
              onChangeText={setLocation}
              placeholder="City, Country"
              placeholderTextColor="#666"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Website</Text>
            <TextInput
              style={styles.input}
              value={website}
              onChangeText={setWebsite}
              placeholder="https://your-website.com"
              placeholderTextColor="#666"
              autoCapitalize="none"
              keyboardType="url"
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '600' },
  saveBtn: {
    backgroundColor: '#0ea5e9',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  saveBtnDisabled: { backgroundColor: '#333' },
  saveBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  scroll: { flex: 1 },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  avatarWrapper: { position: 'relative' },
  avatar: { width: 100, height: 100, borderRadius: 50 },
  avatarPlaceholder: {
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: '#fff', fontSize: 36, fontWeight: '700' },
  avatarOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#0ea5e9',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#000',
  },
  avatarActions: {
    flexDirection: 'row',
    gap: 24,
    marginTop: 16,
  },
  avatarActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  avatarActionText: { color: '#0ea5e9', fontSize: 14 },
  form: { padding: 16, gap: 16 },
  field: { gap: 6 },
  label: { color: '#999', fontSize: 13, fontWeight: '500', textTransform: 'uppercase' },
  input: {
    backgroundColor: '#111',
    color: '#fff',
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#222',
  },
  bioInput: {
    minHeight: 80,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  charCount: {
    color: '#666',
    fontSize: 12,
    textAlign: 'right',
    marginTop: 2,
  },
});
