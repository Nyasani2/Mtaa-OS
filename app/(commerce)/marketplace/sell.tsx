// @ts-nocheck
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export default function SellScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    category: '',
    condition: 'new',
  });

  const handleSubmit = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'Please sign in to list an item');
      return;
    }

    if (!form.title || !form.price || !form.category) {
      Alert.alert('Missing Fields', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('marketplace_listings').insert({
        seller_id: user.id,
        title: form.title.trim(),
        description: form.description.trim(),
        price: parseFloat(form.price),
        category: form.category,
        condition: form.condition,
        status: 'active',
      });

      if (error) throw error;

      Alert.alert('Success', 'Item listed successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to list item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>List Item for Sale</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Title *</Text>
        <TextInput
          style={styles.input}
          placeholder="What are you selling?"
          placeholderTextColor="#64748b"
          value={form.title}
          onChangeText={(text) => setForm({ ...form, title: text })}
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Describe your item..."
          placeholderTextColor="#64748b"
          multiline
          numberOfLines={4}
          value={form.description}
          onChangeText={(text) => setForm({ ...form, description: text })}
        />

        <Text style={styles.label}>Price (KES) *</Text>
        <TextInput
          style={styles.input}
          placeholder="0.00"
          placeholderTextColor="#64748b"
          keyboardType="numeric"
          value={form.price}
          onChangeText={(text) => setForm({ ...form, price: text })}
        />

        <Text style={styles.label}>Category *</Text>
        <View style={styles.categoryGrid}>
          {['Electronics', 'Fashion', 'Home', 'Vehicles', 'Services', 'Other'].map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.categoryChip,
                form.category === cat && styles.categoryChipActive,
              ]}
              onPress={() => setForm({ ...form, category: cat })}
            >
              <Text style={[
                styles.categoryText,
                form.category === cat && styles.categoryTextActive,
              ]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Condition</Text>
        <View style={styles.conditionRow}>
          {['new', 'like_new', 'good', 'fair'].map((cond) => (
            <TouchableOpacity
              key={cond}
              style={[
                styles.conditionChip,
                form.condition === cond && styles.conditionChipActive,
              ]}
              onPress={() => setForm({ ...form, condition: cond })}
            >
              <Text style={[
                styles.conditionText,
                form.condition === cond && styles.conditionTextActive,
              ]}>
                {cond.replace('_', ' ').toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.submitBtnText}>
            {loading ? 'Listing...' : 'List Item'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 50,
    backgroundColor: '#1e293b',
  },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  form: { padding: 16 },
  label: { color: '#fff', fontSize: 14, fontWeight: '600', marginTop: 16, marginBottom: 8 },
  input: {
    backgroundColor: '#1e293b',
    color: '#fff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  textArea: { height: 100, textAlignVertical: 'top' },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#1e293b',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  categoryChipActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  categoryText: { color: '#94a3b8', fontSize: 13 },
  categoryTextActive: { color: '#fff', fontWeight: '600' },
  conditionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  conditionChip: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: '#1e293b',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  conditionChipActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  conditionText: { color: '#94a3b8', fontSize: 12, fontWeight: '600' },
  conditionTextActive: { color: '#fff' },
  submitBtn: {
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  submitBtnDisabled: {
    backgroundColor: '#64748b',
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
