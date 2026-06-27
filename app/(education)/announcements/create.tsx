import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  ActivityIndicator, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

export default function CreateAnnouncementScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    content: '',
    priority: 'normal',
    target_audience: 'all',
    expires_at: '',
  });

  const priorities = ['low', 'normal', 'high', 'urgent'];
  const audiences = ['all', 'students', 'parents', 'teachers', 'staff', 'grade_1', 'grade_2', 'grade_3', 'grade_4', 'grade_5', 'grade_6', 'grade_7', 'grade_8', 'grade_9', 'grade_10', 'grade_11', 'grade_12'];

  const handleChange = (field: string, value: any) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async () => {
    if (!user?.id) { Alert.alert('Error', 'Please sign in'); return; }
    if (!form.title.trim()) { Alert.alert('Missing', 'Title is required'); return; }
    if (!form.content.trim()) { Alert.alert('Missing', 'Content is required'); return; }

    setLoading(true);
    try {
      const { error } = await supabase.from('education_announcements').insert({
        title: form.title.trim(),
        content: form.content.trim(),
        priority: form.priority,
        target_audience: form.target_audience,
        expires_at: form.expires_at || null,
        posted_by: user.id,
        school_id: null, // Will be set from context
        status: 'active',
        created_at: new Date().toISOString(),
      });
      if (error) throw error;
      Alert.alert('Posted', 'Announcement published successfully');
      router.back();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Post Announcement</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
        <View style={styles.field}>
          <Text style={styles.label}>Title <Text style={styles.required}>*</Text></Text>
          <TextInput style={styles.input} placeholder="Announcement title" placeholderTextColor="#666" value={form.title} onChangeText={(v) => handleChange('title', v)} />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Content <Text style={styles.required}>*</Text></Text>
          <TextInput style={[styles.input, styles.textarea]} placeholder="Write your announcement..." placeholderTextColor="#666" value={form.content} onChangeText={(v) => handleChange('content', v)} multiline numberOfLines={6} />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Priority</Text>
          <View style={styles.chipContainer}>
            {priorities.map(p => (
              <TouchableOpacity key={p} style={[styles.chip, form.priority === p && styles.chipActive]} onPress={() => handleChange('priority', p)}>
                <Ionicons name={p === 'urgent' ? 'alert-circle' : p === 'high' ? 'arrow-up-circle' : p === 'low' ? 'arrow-down-circle' : 'remove-circle'} size={14} color={form.priority === p ? '#00d4ff' : '#888'} />
                <Text style={[styles.chipText, form.priority === p && styles.chipTextActive]}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Target Audience</Text>
          <View style={styles.chipContainer}>
            {audiences.slice(0, 6).map(a => (
              <TouchableOpacity key={a} style={[styles.chip, form.target_audience === a && styles.chipActive]} onPress={() => handleChange('target_audience', a)}>
                <Text style={[styles.chipText, form.target_audience === a && styles.chipTextActive]}>{a.replace('_', ' ')}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Expires At (optional)</Text>
          <TextInput style={styles.input} placeholder="YYYY-MM-DD" placeholderTextColor="#666" value={form.expires_at} onChangeText={(v) => handleChange('expires_at', v)} />
        </View>
        <TouchableOpacity style={[styles.submitBtn, loading && styles.submitBtnDisabled]} onPress={handleSubmit} disabled={loading}>
          {loading ? <ActivityIndicator size="small" color="#000" /> : <><Ionicons name="megaphone" size={20} color="#000" /><Text style={styles.submitBtnText}>Post Announcement</Text></>}
        </TouchableOpacity>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  form: { padding: 16 },
  field: { marginBottom: 16 },
  label: { color: '#fff', fontSize: 14, fontWeight: '600', marginBottom: 8 },
  required: { color: '#ff4444' },
  input: { backgroundColor: '#111', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, color: '#fff', fontSize: 15, borderWidth: 1, borderColor: '#1a1a1a' },
  textarea: { height: 150, textAlignVertical: 'top', paddingTop: 14 },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#111', borderWidth: 1, borderColor: '#1a1a1a', gap: 6 },
  chipActive: { backgroundColor: '#00d4ff15', borderColor: '#00d4ff' },
  chipText: { color: '#888', fontSize: 12, textTransform: 'capitalize' },
  chipTextActive: { color: '#00d4ff', fontWeight: '600' },
  submitBtn: { backgroundColor: '#00d4ff', borderRadius: 12, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 24 },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { color: '#000', fontSize: 16, fontWeight: '700' },
});
