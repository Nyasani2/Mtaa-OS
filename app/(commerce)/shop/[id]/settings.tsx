import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Switch, Alert,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useShop } from '@/domains/shop/hooks/useShop';
import { supabase } from '@/lib/supabase/client';

export default function ShopSettingsScreen() {
  const { id: shopId } = useLocalSearchParams<{ id: string }>();
  const { shop, refresh } = useShop(shopId);
  const [name, setName] = useState(shop?.name || '');
  const [location, setLocation] = useState(shop?.location || '');
  const [description, setDescription] = useState(shop?.description || '');
  const [status, setStatus] = useState(shop?.status === 'open');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!shopId) return;
    setSaving(true);
    const { error } = await supabase.from('shops').update({
      name: name.trim(), location: location.trim() || null,
      description: description.trim() || null, status: status ? 'open' : 'closed',
    }).eq('id', shopId);
    setSaving(false);
    if (error) Alert.alert('Error', error.message);
    else { Alert.alert('Saved', 'Business settings updated'); refresh(); }
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Business Settings</Text>
      </View>
      <View style={styles.form}>
        <View style={styles.field}>
          <Text style={styles.label}>Business Name</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Location</Text>
          <TextInput style={styles.input} value={location} onChangeText={setLocation} />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Description</Text>
          <TextInput style={[styles.input, styles.textArea]} value={description} onChangeText={setDescription} multiline numberOfLines={4} />
        </View>
        <View style={styles.field}>
          <View style={styles.switchRow}>
            <Text style={styles.label}>Store Status</Text>
            <Switch value={status} onValueChange={setStatus} />
          </View>
          <Text style={styles.hint}>{status ? 'Your store is open for business' : 'Your store is closed'}</Text>
        </View>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
          <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save Changes'}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { padding: 20, paddingTop: 24 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#0F172A' },
  form: { padding: 20, paddingTop: 0 },
  field: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#334155', marginBottom: 8 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 14, fontSize: 15, color: '#0F172A' },
  textArea: { height: 100, textAlignVertical: 'top' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  hint: { fontSize: 13, color: '#94A3B8', marginTop: 4 },
  saveBtn: { backgroundColor: '#2196F3', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
