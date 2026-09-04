import React, { useState, useEffect } from 'react';
import { Alert, View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';
import { Alert, Ionicons } from '@expo/vector-icons';

const BUSINESS_TYPES = ['Retail', 'Food & Beverage', 'Services', 'Technology', 'Agriculture', 'Manufacturing', 'Healthcare', 'Education', 'Transport', 'Other'];

export default function BusinessEditScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [isPublic, setIsPublic] = useState(true);

  useEffect(() => { loadExisting(); }, []);

  const loadExisting = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data } = await supabase.from('business_profiles').select('*').eq('user_id', user.id).maybeSingle();
      if (data) {
        setName(data.name || ''); setType(data.business_type || ''); setDescription(data.description || '');
        setLocation(data.location || ''); setPhone(data.phone || ''); setEmail(data.email || '');
        setWebsite(data.website || ''); setIsPublic(data.is_public !== false);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const saveBusiness = async () => {
    if (!name.trim()) { Alert.alert('Error', 'Business name is required'); return; }
    if (!user?.id) return;
    setSaving(true);
    try {
      const payload = {
        user_id: user.id, name: name.trim(), business_type: type || null, description: description.trim() || null,
        location: location.trim() || null, phone: phone.trim() || null, email: email.trim() || null,
        website: website.trim() || null, is_public: isPublic, updated_at: new Date().toISOString(),
      };
      const { error } = await supabase.from('business_profiles').upsert(payload, { onConflict: 'user_id' });
      if (error) throw error;
      Alert.alert('Success', 'Business profile saved');
      router.back();
    } catch (err: any) { Alert.alert('Error', err.message || 'Failed to save'); }
    finally { setSaving(false); }
  };

  if (loading) return <View style={styles.container}><ActivityIndicator size="large" color="#3b82f6" /></View>;

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#f1f5f9" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Business Profile</Text>
        <TouchableOpacity onPress={saveBusiness} disabled={saving}>{saving ? <ActivityIndicator color="#3b82f6" /> : <Text style={styles.saveText}>Save</Text>}</TouchableOpacity>
      </View>
      <View style={styles.form}>
        <Text style={styles.label}>Business Name *</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Your business name" placeholderTextColor="#64748b" />
        <Text style={styles.label}>Business Type</Text>
        <View style={styles.chipContainer}>
          {BUSINESS_TYPES.map((t) => <TouchableOpacity key={t} style={[styles.chip, type === t && styles.chipActive]} onPress={() => setType(t)}><Text style={[styles.chipText, type === t && styles.chipTextActive]}>{t}</Text></TouchableOpacity>)}
        </View>
        <Text style={styles.label}>Description</Text>
        <TextInput style={[styles.input, styles.textArea]} value={description} onChangeText={setDescription} placeholder="What does your business do?" placeholderTextColor="#64748b" multiline numberOfLines={3} />
        <Text style={styles.label}>Location</Text>
        <TextInput style={styles.input} value={location} onChangeText={setLocation} placeholder="City, Country" placeholderTextColor="#64748b" />
        <Text style={styles.label}>Phone</Text>
        <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="+254 7XX XXX XXX" placeholderTextColor="#64748b" keyboardType="phone-pad" />
        <Text style={styles.label}>Email</Text>
        <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="business@example.com" placeholderTextColor="#64748b" keyboardType="email-address" autoCapitalize="none" />
        <Text style={styles.label}>Website</Text>
        <TextInput style={styles.input} value={website} onChangeText={setWebsite} placeholder="https://..." placeholderTextColor="#64748b" autoCapitalize="none" />
        <View style={styles.toggleRow}><Text style={styles.label}>Public Profile</Text><Switch value={isPublic} onValueChange={setIsPublic} trackColor={{ false: '#334155', true: '#3b82f6' }} /></View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 50, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#f1f5f9' },
  saveText: { color: '#3b82f6', fontWeight: '700', fontSize: 16 },
  form: { padding: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#94a3b8', marginTop: 16, marginBottom: 8 },
  input: { backgroundColor: '#1e293b', borderRadius: 8, padding: 14, color: '#f1f5f9', fontSize: 15, borderWidth: 1, borderColor: '#334155' },
  textArea: { height: 80, textAlignVertical: 'top' },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: '#1e293b', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#334155', marginBottom: 8 },
  chipActive: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  chipText: { color: '#94a3b8', fontSize: 13 },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 20, paddingVertical: 8 },
});
