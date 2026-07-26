import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView, Switch } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';

export default function TribesCreateScreen() {
  const { user } = useAuthStore();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('general');
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!user) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Sign in to create a tribe</Text>
        <TouchableOpacity style={styles.btn} onPress={() => router.push('/auth')}>
          <Text style={styles.btnText}>Sign In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const validate = () => {
    const trimmedName = name.trim();
    const trimmedDesc = description.trim();
    if (trimmedName.length === 0) {
      Alert.alert('Error', 'Tribe name is required');
      return false;
    }
    if (trimmedName.length < 3) {
      Alert.alert('Error', 'Tribe name must be at least 3 characters');
      return false;
    }
    if (trimmedName.length > 100) {
      Alert.alert('Error', 'Tribe name too long (max 100 characters)');
      return false;
    }
    if (trimmedDesc.length === 0) {
      Alert.alert('Error', 'Description is required');
      return false;
    }
    return true;
  };

  const handleCreate = async () => {
    if (!validate()) return;
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('tribes')
        .insert({
          creator_id: user.id,
          name: name.trim(),
          description: description.trim(),
          category,
          is_private: isPrivate,
          member_count: 1,
        })
        .select()
        .single();

      if (error) throw error;

      // Auto-add creator as first member
      await supabase.from('tribes_members').insert({
        tribe_id: data.id,
        user_id: user.id,
        role: 'admin',
      });

      Alert.alert('Success', 'Tribe created!');
      router.push(`/(tribes)/${data.id}`);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create tribe');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={28} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Tribe</Text>
        <TouchableOpacity style={styles.createBtn} onPress={handleCreate} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.createText}>Create</Text>}
        </TouchableOpacity>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Tribe Name</Text>
        <TextInput
          style={styles.input}
          placeholder="My Awesome Tribe"
          placeholderTextColor="#9BA1A6"
          value={name}
          onChangeText={setName}
          maxLength={100}
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="What is this tribe about?"
          placeholderTextColor="#9BA1A6"
          multiline
          numberOfLines={4}
          value={description}
          onChangeText={setDescription}
          textAlignVertical="top"
        />

        <Text style={styles.label}>Category</Text>
        <View style={styles.categoryRow}>
          {['general', 'business', 'education', 'health', 'technology', 'sports', 'music'].map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.categoryChip, category === cat && styles.categoryChipActive]}
              onPress={() => setCategory(cat)}
            >
              <Text style={[styles.categoryText, category === cat && styles.categoryTextActive]}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.switchRow}>
          <Text style={styles.label}>Private Tribe</Text>
          <Switch value={isPrivate} onValueChange={setIsPrivate} trackColor={{ false: '#E1E3E5', true: '#0a7ea4' }} />
        </View>
        <Text style={styles.hint}>Private tribes require approval to join</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 18, fontWeight: '600', marginBottom: 16 },
  btn: { paddingHorizontal: 24, paddingVertical: 12, backgroundColor: '#0a7ea4', borderRadius: 8 },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#E1E3E5' },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  createBtn: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#0a7ea4', borderRadius: 20 },
  createText: { color: '#fff', fontWeight: '600' },
  form: { padding: 16 },
  label: { fontSize: 14, fontWeight: '600', marginTop: 16, marginBottom: 8, color: '#111' },
  input: { borderWidth: 1, borderColor: '#E1E3E5', borderRadius: 8, padding: 12, fontSize: 16, color: '#111' },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#E1E3E5', marginRight: 8, marginBottom: 8 },
  categoryChipActive: { backgroundColor: '#0a7ea4', borderColor: '#0a7ea4' },
  categoryText: { fontSize: 13, color: '#687076' },
  categoryTextActive: { color: '#fff', fontWeight: '600' },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 24 },
  hint: { fontSize: 12, color: '#9BA1A6', marginTop: 4 },
});
