import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Image } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/stores/auth-store';
import * as ImagePicker from 'expo-image-picker';

export default function ProfileScreen() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    full_name: '',
    username: '',
    bio: '',
    avatar_url: '',
    phone: '',
    location: '',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    if (!user?.id) return;
    setLoading(true);
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    setLoading(false);

    if (error && error.code !== 'PGRST116') {
      Alert.alert('Error', error.message);
      return;
    }

    if (data) {
      setProfile({
        full_name: data.full_name || '',
        username: data.username || '',
        bio: data.bio || '',
        avatar_url: data.avatar_url || '',
        phone: data.phone || '',
        location: data.location || '',
      });
    }
  };

  const pickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setSaving(true);
      
      const fileName = `avatar_${user?.id}_${Date.now()}.jpg`;
      const formData = new FormData();
      formData.append('file', {
        uri,
        name: fileName,
        type: 'image/jpeg',
      } as any);

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, formData);

      if (uploadError) {
        Alert.alert('Upload Failed', uploadError.message);
        setSaving(false);
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      setProfile(p => ({ ...p, avatar_url: publicUrl }));
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!user?.id) return;
    setSaving(true);

    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        full_name: profile.full_name.trim(),
        username: profile.username.trim(),
        bio: profile.bio.trim(),
        avatar_url: profile.avatar_url,
        phone: profile.phone.trim(),
        location: profile.location.trim(),
        updated_at: new Date().toISOString(),
      });

    setSaving(false);

    if (error) {
      Alert.alert('Save Failed', error.message);
      return;
    }

    Alert.alert('Saved', 'Profile updated successfully');
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#6366f1" style={{ marginTop: 100 }} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Edit Profile</Text>

      <TouchableOpacity style={styles.avatarContainer} onPress={pickAvatar}>
        {profile.avatar_url ? (
          <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>📷</Text>
          </View>
        )}
        <Text style={styles.changePhoto}>Change Photo</Text>
      </TouchableOpacity>

      <TextInput
        style={styles.input}
        placeholder="Full Name"
        placeholderTextColor="#888"
        value={profile.full_name}
        onChange={(text) => setProfile(p => ({ ...p, full_name: text }))}
      />

      <TextInput
        style={styles.input}
        placeholder="Username"
        placeholderTextColor="#888"
        autoCapitalize="none"
        value={profile.username}
        onChange={(text) => setProfile(p => ({ ...p, username: text }))}
      />

      <TextInput
        style={[styles.input, styles.bioInput]}
        placeholder="Bio"
        placeholderTextColor="#888"
        multiline
        numberOfLines={4}
        textAlignVertical="top"
        value={profile.bio}
        onChange={(text) => setProfile(p => ({ ...p, bio: text }))}
      />

      <TextInput
        style={styles.input}
        placeholder="Phone"
        placeholderTextColor="#888"
        keyboardType="phone-pad"
        value={profile.phone}
        onChange={(text) => setProfile(p => ({ ...p, phone: text }))}
      />

      <TextInput
        style={styles.input}
        placeholder="Location"
        placeholderTextColor="#888"
        value={profile.location}
        onChange={(text) => setProfile(p => ({ ...p, location: text }))}
      />

      <TouchableOpacity style={[styles.button, saving && styles.buttonDisabled]} onPress={handleSave} disabled={saving}>
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Save Profile</Text>}
      </TouchableOpacity>

      <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
        <Text style={styles.cancelText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', padding: 16, paddingTop: 48 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 24 },
  avatarContainer: { alignItems: 'center', marginBottom: 24 },
  avatar: { width: 100, height: 100, borderRadius: 50 },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#333',
  },
  avatarText: { fontSize: 32 },
  changePhoto: { color: '#6366f1', marginTop: 8, fontSize: 14 },
  input: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  bioInput: { minHeight: 100 },
  button: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  cancelButton: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  cancelText: { color: '#888', fontSize: 16 },
});
