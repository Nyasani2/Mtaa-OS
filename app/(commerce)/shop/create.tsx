import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useUser } from '@/hooks/useUser';
import { supabase } from '@/lib/supabase/client';

export default function CreateShopScreen() {
  const router = useRouter();
  const { user } = useUser();
  const [name, setName] = useState('');
  const [type, setType] = useState('retail');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const shopTypes = [
    { id: 'retail', label: 'Retail Store', icon: '🏪' },
    { id: 'restaurant', label: 'Restaurant', icon: '🍽️' },
    { id: 'pharmacy', label: 'Pharmacy', icon: '💊' },
    { id: 'electronics', label: 'Electronics', icon: '💻' },
    { id: 'hardware', label: 'Hardware', icon: '🔧' },
    { id: 'supermarket', label: 'Supermarket', icon: '🛒' },
    { id: 'service', label: 'Service Provider', icon: '🔧' },
    { id: 'manufacturer', label: 'Manufacturer', icon: '🏭' },
    { id: 'distributor', label: 'Distributor', icon: '📦' },
    { id: 'other', label: 'Other', icon: '🏢' },
  ];

  async function handleCreate() {
    if (!name.trim()) { Alert.alert('Required', 'Business name is required'); return; }
    if (!user) { Alert.alert('Auth Required', 'Please sign in to create a business'); return; }

    setLoading(true);
    try {
      const { data, error } = await supabase.from('shops').insert({
        name: name.trim(), type, location: location.trim() || null,
        description: description.trim() || null, owner_id: user.id,
        status: 'open', verified: false,
      }).select().single();

      if (error) throw error;

      await supabase.from('shop_staff').insert({
        shop_id: data.id, user_id: user.id, role: 'owner', status: 'active',
      });

      Alert.alert('Success', `${name} created!`, [
        { text: 'Open Dashboard', onPress: () => router.replace(`/(commerce)/shop/${data.id}` as any) },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create business');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Create Business</Text>
        <Text style={styles.headerSub}>Start your MTAA Shop</Text>
      </View>
      <View style={styles.form}>
        <View style={styles.field}>
          <Text style={styles.label}>Business Name *</Text>
          <TextInput style={styles.input} placeholder="e.g. Kevin's Electronics" value={name} onChangeText={setName} autoCapitalize="words" />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Business Type</Text>
          <View style={styles.typeGrid}>
            {shopTypes.map((t) => (
              <TouchableOpacity key={t.id} style={[styles.typeCard, type === t.id && styles.typeCardActive]} onPress={() => setType(t.id)}>
                <Text style={styles.typeIcon}>{t.icon}</Text>
                <Text style={[styles.typeLabel, type === t.id && styles.typeLabelActive]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Location</Text>
          <TextInput style={styles.input} placeholder="Business address or area" value={location} onChangeText={setLocation} />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Description</Text>
          <TextInput style={[styles.input, styles.textArea]} placeholder="What does your business do?" value={description} onChangeText={setDescription} multiline numberOfLines={4} />
        </View>
        <TouchableOpacity style={[styles.createBtn, (!name.trim() || loading) && styles.createBtnDisabled]} onPress={handleCreate} disabled={!name.trim() || loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.createBtnText}>Create Business</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { padding: 20, paddingTop: 24 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#0F172A' },
  headerSub: { fontSize: 15, color: '#64748B', marginTop: 4 },
  form: { padding: 20, paddingTop: 0 },
  field: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#334155', marginBottom: 8 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 14, fontSize: 15, color: '#0F172A' },
  textArea: { height: 100, textAlignVertical: 'top' },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeCard: { width: '30%', backgroundColor: '#fff', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 12, alignItems: 'center' },
  typeCardActive: { borderColor: '#2196F3', backgroundColor: '#EFF6FF' },
  typeIcon: { fontSize: 24, marginBottom: 6 },
  typeLabel: { fontSize: 11, fontWeight: '500', color: '#64748B', textAlign: 'center' },
  typeLabelActive: { color: '#2196F3', fontWeight: '600' },
  createBtn: { backgroundColor: '#2196F3', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  createBtnDisabled: { opacity: 0.5 },
  createBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
