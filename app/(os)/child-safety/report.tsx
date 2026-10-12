// @ts-nocheck
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, Image, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '@/constants/Colors';

export default function ReportMissingChild() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [photoUri, setPhotoUri] = useState(null);
  const [form, setForm] = useState({ name: '', age: '', gender: 'Male', description: '', last_seen: '', phone: '' });

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'images', allowsEditing: true, quality: 0.8 });
    if (!result.canceled) setPhotoUri(result.assets[0].uri);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.phone || !photoUri) {
      Alert.alert('Missing Info', 'Name, phone, and photo are required.');
      return;
    }
    setLoading(true);
    try {
      // Upload photo
      const formData = new FormData();
      formData.append('file', { uri: photoUri, name: 'child.jpg', type: 'image/jpeg' } as any);
      // Note: In production, use supabase.storage.from('child-safety').upload(...)
      // For now, we'll just save the URI or a placeholder if storage isn't configured
      const photoUrl = photoUri; 

      const { error } = await supabase.from('missing_children_reports').insert({
        child_name: form.name,
        age: parseInt(form.age) || null,
        gender: form.gender,
        description: form.description,
        photo_url: photoUrl,
        last_seen_location: form.last_seen,
        reported_by_parent_id: user?.id,
        parent_contact_phone: form.phone,
        status: 'missing'
      });

      if (error) throw error;
      Alert.alert('Report Filed', 'The MTAA community has been alerted.', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0F172A' }} edges={['top']}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 }}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700', marginLeft: 16 }}>Report Missing Child</Text>
      </View>
      
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <TouchableOpacity onPress={pickImage} style={{ height: 200, backgroundColor: '#1E293B', borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: '#334155' }}>
          {photoUri ? <Image source={{ uri: photoUri }} style={{ width: '100%', height: '100%', borderRadius: 16 }} /> : (
            <>
              <Ionicons name="camera" size={40} color="#94A3B8" />
              <Text style={{ color: '#94A3B8', marginTop: 8 }}>Tap to upload child's photo</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.label}>Child's Full Name *</Text>
        <TextInput style={styles.input} value={form.name} onChangeText={v => setForm({...form, name: v})} placeholderTextColor="#64748B" />

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Age</Text>
            <TextInput style={styles.input} value={form.age} onChangeText={v => setForm({...form, age: v})} keyboardType="numeric" placeholderTextColor="#64748B" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Gender</Text>
            <TouchableOpacity onPress={() => setForm({...form, gender: form.gender === 'Male' ? 'Female' : 'Male'})} style={styles.input}>
              <Text style={{ color: '#fff' }}>{form.gender}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.label}>Last Seen Location</Text>
        <TextInput style={styles.input} value={form.last_seen} onChangeText={v => setForm({...form, last_seen: v})} placeholderTextColor="#64748B" />

        <Text style={styles.label}>Description (Clothing, distinguishing features)</Text>
        <TextInput style={[styles.input, { height: 80 }]} value={form.description} onChangeText={v => setForm({...form, description: v})} multiline placeholderTextColor="#64748B" />

        <Text style={styles.label}>Your Contact Phone *</Text>
        <TextInput style={styles.input} value={form.phone} onChangeText={v => setForm({...form, phone: v})} keyboardType="phone-pad" placeholderTextColor="#64748B" />

        <TouchableOpacity onPress={handleSubmit} disabled={loading} style={{ backgroundColor: '#EF4444', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10 }}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>🚨 Alert Community</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = { label: { color: '#94A3B8', fontSize: 12, marginBottom: 6, fontWeight: '600' }, input: { backgroundColor: '#1E293B', color: '#fff', padding: 14, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: '#334155' } };
