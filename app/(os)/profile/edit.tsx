// app/(os)/profile/edit.tsx
// FIXED: import path @/lib/supabase (not /client)

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth/useAuthStore';

interface ProfileData {
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  bio: string | null;
  location: string | null;
}

export default function ProfileEditScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ProfileData>({
    full_name: '',
    username: '',
    avatar_url: null,
    cover_url: null,
    bio: '',
    location: '',
  });
  const [newAvatar, setNewAvatar] = useState<string | null>(null);
  const [newCover, setNewCover] = useState<string | null>(null);

  const userId = user?.id;

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    if (!userId) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('full_name, username, avatar_url, cover_url, bio, location')
      .eq('id', userId)
      .single();

    if (error) {
      Alert.alert('Error', 'Failed to load profile');
      return;
    }

    setProfile(data || {});
    setLoading(false);
  };

  const pickImage = async (type: 'avatar' | 'cover') => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission Required', 'Please allow access to your photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: type === 'avatar' ? [1, 1] : [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      if (type === 'avatar') {
        setNewAvatar(result.assets[0].uri);
      } else {
        setNewCover(result.assets[0].uri);
      }
    }
  };

  const uploadImage = async (uri: string, path: string): Promise<string> => {
    const response = await fetch(uri);
    const blob = await response.blob();

    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(path, blob, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(data.path);

    return publicUrl;
  };

  const handleSave = async () => {
    if (!userId) return;
    setSaving(true);

    try {
      let updates: any = {
        full_name: profile.full_name || null,
        username: profile.username || null,
        bio: profile.bio || null,
        location: profile.location || null,
        updated_at: new Date().toISOString(),
      };

      if (newAvatar) {
        const avatarUrl = await uploadImage(newAvatar, `${userId}/avatar.jpg`);
        updates.avatar_url = avatarUrl;
      }

      if (newCover) {
        const coverUrl = await uploadImage(newCover, `${userId}/cover.jpg`);
        updates.cover_url = coverUrl;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId);

      if (error) throw error;

      Alert.alert('Success', 'Profile updated successfully');
      router.back();
    } catch (err: any) {
      console.error('Save error:', err);
      Alert.alert('Error', err.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  const avatarUri = newAvatar || profile.avatar_url || 
    `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.full_name || 'User')}&background=6366f1&color=fff`;
  const coverUri = newCover || profile.cover_url;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving}>
          {saving ? (
            <ActivityIndicator size="small" color="#6366f1" />
          ) : (
            <Text style={styles.saveText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.coverContainer} onPress={() => pickImage('cover')}>
        {coverUri ? (
          <Image source={{ uri: coverUri }} style={styles.coverImage} />
        ) : (
          <View style={styles.coverPlaceholder}>
            <Ionicons name="image" size={32} color="#6b7280" />
            <Text style={styles.coverText}>Add Cover Photo</Text>
          </View>
        )}
        <View style={styles.coverOverlay}>
          <Ionicons name="camera" size={20} color="#fff" />
        </View>
      </TouchableOpacity>

      <View style={styles.avatarSection}>
        <TouchableOpacity style={styles.avatarContainer} onPress={() => pickImage('avatar')}>
          <Image source={{ uri: avatarUri }} style={styles.avatar} />
          <View style={styles.avatarOverlay}>
            <Ionicons name="camera" size={16} color="#fff" />
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.form}>
        <View style={styles.field}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            value={profile.full_name || ''}
            onChangeText={(text) => setProfile(p => ({ ...p, full_name: text }))}
            placeholder="Your full name"
            placeholderTextColor="#6b7280"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Username</Text>
          <TextInput
            style={styles.input}
            value={profile.username || ''}
            onChangeText={(text) => setProfile(p => ({ ...p, username: text.replace(/\s/g, '').toLowerCase() }))}
            placeholder="username"
            placeholderTextColor="#6b7280"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Bio</Text>
          <TextInput
            style={[styles.input, styles.bioInput]}
            value={profile.bio || ''}
            onChangeText={(text) => setProfile(p => ({ ...p, bio: text }))}
            placeholder="Tell us about yourself"
            placeholderTextColor="#6b7280"
            multiline
            maxLength={160}
          />
          <Text style={styles.charCount}>{(profile.bio || '').length}/160</Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Location</Text>
          <TextInput
            style={styles.input}
            value={profile.location || ''}
            onChangeText={(text) => setProfile(p => ({ ...p, location: text }))}
            placeholder="City, Country"
            placeholderTextColor="#6b7280"
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f0f0f' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
  },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#fff' },
  saveText: { color: '#6366f1', fontWeight: '600', fontSize: 16 },

  coverContainer: {
    width: '100%',
    height: 160,
    position: 'relative',
  },
  coverImage: { width: '100%', height: '100%' },
  coverPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1f1f1f',
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverText: { color: '#6b7280', marginTop: 8, fontSize: 14 },
  coverOverlay: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 20,
    padding: 8,
  },

  avatarSection: { alignItems: 'center', marginTop: -40 },
  avatarContainer: { position: 'relative' },
  avatar: { width: 80, height: 80, borderRadius: 40, borderWidth: 4, borderColor: '#0f0f0f' },
  avatarOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    padding: 4,
  },

  form: { padding: 16, paddingTop: 24 },
  field: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#9ca3af', marginBottom: 6 },
  input: {
    backgroundColor: '#1f1f1f',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#374151',
  },
  bioInput: { minHeight: 80, textAlignVertical: 'top' },
  charCount: { color: '#6b7280', fontSize: 12, textAlign: 'right', marginTop: 4 },
});
