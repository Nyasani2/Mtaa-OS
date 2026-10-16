import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

export default function CreateLiveClassScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [streamUrl, setStreamUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!title.trim() || !scheduledAt.trim()) { Alert.alert('Error', 'Title and scheduled time are required'); return; }
    setLoading(true);
    try {
      const { error } = await supabase.from('education_live_streams').insert({
        title: title.trim(), description: description.trim() || null,
        scheduled_at: scheduledAt.trim(), stream_url: streamUrl.trim() || null,
        host_id: user?.id, status: 'scheduled', institution_id: (user as any)?.institution_id
      });
      if (error) throw error;
      Alert.alert('Success', 'Live class scheduled');
      router.back();
    } catch (e: any) { Alert.alert('Error', e.message); }
    finally { setLoading(false); }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Schedule Live Class</Text>
        <View style={{ width: 24 }} />
      </View>
      <View style={styles.form}>
        <Text style={styles.label}>Class Title *</Text>
        <TextInput style={styles.input} placeholder="e.g., Form 4 Physics Revision" placeholderTextColor="#666" value={title} onChangeText={setTitle} />
        <Text style={styles.label}>Description</Text>
        <TextInput style={[styles.input, styles.textarea]} placeholder="What will be covered..." placeholderTextColor="#666" multiline numberOfLines={4} value={description} onChangeText={setDescription} />
        <Text style={styles.label}>Scheduled At (ISO) *</Text>
        <TextInput style={styles.input} placeholder="2026-10-20T14:00:00" placeholderTextColor="#666" value={scheduledAt} onChangeText={setScheduledAt} />
        <Text style={styles.label}>Meeting Link (Zoom/Meet)</Text>
        <TextInput style={styles.input} placeholder="https://..." placeholderTextColor="#666" value={streamUrl} onChangeText={setStreamUrl} />
        <TouchableOpacity style={[styles.submitBtn, loading && styles.submitBtnDisabled]} onPress={handleCreate} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Schedule Class</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12, backgroundColor: '#1e293b' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  form: { padding: 16 },
  label: { color: '#94a3b8', fontSize: 12, fontWeight: '600', marginBottom: 8, marginTop: 16, textTransform: 'uppercase' },
  input: { backgroundColor: '#1e293b', borderRadius: 10, padding: 14, color: '#fff', fontSize: 15, borderWidth: 1, borderColor: '#334155' },
  textarea: { minHeight: 100, textAlignVertical: 'top' },
  submitBtn: { backgroundColor: '#ef4444', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 24 },
  submitBtnDisabled: { opacity: 0.6 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
