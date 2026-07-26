import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';

export default function TribesPostCreateScreen() {
  const { user } = useAuthStore();
  const { tribeId } = useLocalSearchParams<{ tribeId: string }>();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  if (!user) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Sign in to post</Text>
        <TouchableOpacity style={styles.btn} onPress={() => router.push('/auth')}>
          <Text style={styles.btnText}>Sign In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const validate = () => {
    const trimmed = content.trim();
    if (trimmed.length === 0) {
      Alert.alert('Error', 'Post content cannot be empty');
      return false;
    }
    if (trimmed.length > 2000) {
      Alert.alert('Error', 'Post content too long (max 2000 characters)');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    if (!tribeId) {
      Alert.alert('Error', 'No tribe selected');
      return;
    }
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('tribes_posts')
        .insert({
          tribe_id: tribeId,
          author_id: user.id,
          content: content.trim(),
          media_urls: [],
          likes_count: 0,
          comments_count: 0,
        })
        .select()
        .single();

      if (error) throw error;

      Alert.alert('Success', 'Post published to tribe!');
      router.back();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to publish post');
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
        <Text style={styles.headerTitle}>New Tribe Post</Text>
        <TouchableOpacity style={styles.publishBtn} onPress={handleSubmit} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.publishText}>Post</Text>}
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Share something with your tribe..."
        placeholderTextColor="#9BA1A6"
        multiline
        numberOfLines={6}
        value={content}
        onChangeText={setContent}
        textAlignVertical="top"
      />

      <Text style={styles.charCount}>{content.length}/2000</Text>
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
  input: { padding: 16, fontSize: 16, minHeight: 120, color: '#111' },
  charCount: { padding: 16, fontSize: 12, color: '#9BA1A6', textAlign: 'right' },
});
