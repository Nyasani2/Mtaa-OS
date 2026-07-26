import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';

export default function StudioPublishScreen() {
  const { user } = useAuthStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('general');
  const [loading, setLoading] = useState(false);

  if (!user) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Sign in to publish</Text>
        <TouchableOpacity style={styles.btn} onPress={() => router.push('/auth')}>
          <Text style={styles.btnText}>Sign In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const validate = () => {
    const trimmedTitle = title.trim();
    const trimmedDesc = description.trim();
    if (trimmedTitle.length === 0) {
      Alert.alert('Error', 'Title is required');
      return false;
    }
    if (trimmedTitle.length > 200) {
      Alert.alert('Error', 'Title too long (max 200 characters)');
      return false;
    }
    if (trimmedDesc.length === 0) {
      Alert.alert('Error', 'Description is required');
      return false;
    }
    return true;
  };

  const handlePublish = async () => {
    if (!validate()) return;
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('studio_content')
        .insert({
          creator_id: user.id,
          title: title.trim(),
          description: description.trim(),
          category,
          status: 'published',
          media_urls: [],
          views_count: 0,
          likes_count: 0,
        })
        .select()
        .single();

      if (error) throw error;

      Alert.alert('Success', 'Content published to Studio!');
      router.push('/(os)/studio');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to publish');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Publish</Text>
        <TouchableOpacity style={styles.publishBtn} onPress={handlePublish} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.publishText}>Publish</Text>}
        </TouchableOpacity>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Title</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter title..."
          placeholderTextColor="#9BA1A6"
          value={title}
          onChangeText={setTitle}
          maxLength={200}
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Describe your content..."
          placeholderTextColor="#9BA1A6"
          multiline
          numberOfLines={4}
          value={description}
          onChangeText={setDescription}
          textAlignVertical="top"
        />

        <Text style={styles.label}>Category</Text>
        <View style={styles.categoryRow}>
          {['general', 'music', 'education', 'news', 'comedy'].map((cat) => (
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
  publishBtn: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#0a7ea4', borderRadius: 20 },
  publishText: { color: '#fff', fontWeight: '600' },
  form: { padding: 16 },
  label: { fontSize: 14, fontWeight: '600', marginTop: 16, marginBottom: 8, color: '#111' },
  input: { borderWidth: 1, borderColor: '#E1E3E5', borderRadius: 8, padding: 12, fontSize: 16, color: '#111' },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#E1E3E5', marginRight: 8, marginBottom: 8 },
  categoryChipActive: { backgroundColor: '#0a7ea4', borderColor: '#0a7ea4' },
  categoryText: { fontSize: 13, color: '#687076' },
  categoryTextActive: { color: '#fff', fontWeight: '600' },
});
