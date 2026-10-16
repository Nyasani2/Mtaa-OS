// @ts-nocheck
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';
export default function CreateEventScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    date: '',
    location: '',
    event_type: 'general',
  });
  const eventTypes = ['general', 'exam', 'sports', 'meeting', 'holiday', 'trip'];
  const handleChange = (field: string, value: any) => setForm(prev => ({ ...prev, [field]: value }));
  const handleSubmit = async () => {
    if (!form.title.trim() || !form.date) {
      Alert.alert('Error', 'Title and date are required');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.from('education_events').insert({
        title: form.title.trim(),
        description: form.description.trim() || null,
        start_date: form.date,
        location: form.location.trim() || null,
        event_type: form.event_type,
        created_by: user?.id,
        created_at: new Date().toISOString(),
      });
      if (error) throw error;
      Alert.alert('Success', 'Event created', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Create Event</Text>
        <View style={{ width: 24 }} />
      </View>
      <View style={styles.form}>
        <View style={styles.field}>
          <Text style={styles.label}>Event Title *</Text>
          <TextInput style={styles.input} placeholder="Event title" placeholderTextColor="#666" value={form.title} onChangeText={(v) => handleChange('title', v)} />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Description</Text>
          <TextInput style={[styles.input, styles.textarea]} placeholder="Describe the event..." placeholderTextColor="#666" value={form.description} onChangeText={(v) => handleChange('description', v)} multiline numberOfLines={4} />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Event Type</Text>
          <View style={styles.chipContainer}>
            {eventTypes.map((t) => (
              <TouchableOpacity key={t} style={[styles.chip, form.event_type === t && styles.chipActive]} onPress={() => handleChange('event_type', t)}>
                <Text style={[styles.chipText, form.event_type === t && styles.chipTextActive]}>{t.replace('_', ' ')}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Date *</Text>
          <TextInput style={styles.input} placeholder="YYYY-MM-DD" placeholderTextColor="#666" value={form.date} onChangeText={(v) => handleChange('date', v)} />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Location</Text>
          <TextInput style={styles.input} placeholder="Event location" placeholderTextColor="#666" value={form.location} onChangeText={(v) => handleChange('location', v)} />
        </View>
        <TouchableOpacity style={[styles.submitBtn, loading && styles.submitBtnDisabled]} onPress={handleSubmit} disabled={loading}>
          {loading ? <ActivityIndicator size="small" color="#000" /> : (
            <>
              <Ionicons name="calendar" size={20} color="#000" />
              <Text style={styles.submitBtnText}>Create Event</Text>
            </>
          )}
        </TouchableOpacity>
        <View style={{ height: 40 }} />
      </View>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  form: { padding: 16 },
  field: { marginBottom: 16 },
  label: { color: '#fff', fontSize: 14, fontWeight: '600', marginBottom: 8 },
  input: { backgroundColor: '#111', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, color: '#fff', fontSize: 15, borderWidth: 1, borderColor: '#1a1a1a' },
  textarea: { height: 120, textAlignVertical: 'top', paddingTop: 14 },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#111', borderWidth: 1, borderColor: '#1a1a1a' },
  chipActive: { backgroundColor: '#ec489915', borderColor: '#ec4899' },
  chipText: { color: '#888', fontSize: 12, textTransform: 'capitalize' },
  chipTextActive: { color: '#ec4899', fontWeight: '600' },
  submitBtn: { backgroundColor: '#ec4899', borderRadius: 12, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 24 },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
