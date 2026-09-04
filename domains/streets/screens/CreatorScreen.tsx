// domains/streets/screens/CreatorScreen.tsx
// Streets content creator screen
// Imported by: app/(os)/streets/creator.tsx

import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';

export interface CreatorScreenProps {
  onPostCreated?: () => void;
}

export default function CreatorScreen({ onPostCreated }: CreatorScreenProps) {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const [content, setContent] = useState('');
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [posting, setPosting] = useState(false);
  const [privacy, setPrivacy] = useState<'public' | 'friends' | 'private'>('public');

  const addTag = () => {
    const trimmed = tagInput.trim().replace(/^#/, '');
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
    }
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const submitPost = async () => {
    if (!content.trim() && mediaUrls.length === 0) {
      Alert.alert('Empty Post', 'Please add some content or media.');
      return;
    }
    if (!user?.id) {
      Alert.alert('Not Authenticated', 'Please log in to post.');
      return;
    }

    setPosting(true);
    try {
      const { data, error } = await supabase
        .from('streets_posts')
        .insert({
          creator_id: user.id,
          content: content.trim(),
          media_urls: mediaUrls,
          tags,
          privacy,
          status: 'published',
        })
        .select()
        .single();

      if (error) throw error;

      setContent('');
      setMediaUrls([]);
      setTags([]);
      setPrivacy('public');
      onPostCreated?.();
      Alert.alert('Posted!', 'Your content has been published.');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to create post.');
    } finally {
      setPosting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="close" size={24} color="#0a0a0a" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Post</Text>
          <TouchableOpacity
            style={[styles.postBtn, (!content.trim() && mediaUrls.length === 0) && styles.postBtnDisabled]}
            onPress={submitPost}
            disabled={posting || (!content.trim() && mediaUrls.length === 0)}
          >
            {posting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.postBtnText}>Post</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* User Info */}
        <View style={styles.userRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.email?.charAt(0)?.toUpperCase() || '?'}
            </Text>
          </View>
          <Text style={styles.userName}>{user?.email || 'You'}</Text>
        </View>

        {/* Content Input */}
        <TextInput
          style={styles.contentInput}
          placeholder="What's on your mind?"
          placeholderTextColor="#9ca3af"
          multiline
          value={content}
          onChangeText={setContent}
          maxLength={2000}
        />

        {/* Media Preview */}
        {mediaUrls.length > 0 && (
          <View style={styles.mediaPreview}>
            {mediaUrls.map((url, idx) => (
              <View key={idx} style={styles.mediaItem}>
                <Image source={{ uri: url }} style={styles.mediaImage} />
                <TouchableOpacity
                  style={styles.removeMedia}
                  onPress={() => setMediaUrls(mediaUrls.filter((_, i) => i !== idx))}
                >
                  <Ionicons name="close-circle" size={22} color="#ef4444" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Tags */}
        <View style={styles.tagsSection}>
          <View style={styles.tagInputRow}>
            <TextInput
              style={styles.tagInput}
              placeholder="Add tags..."
              placeholderTextColor="#9ca3af"
              value={tagInput}
              onChangeText={setTagInput}
              onSubmitEditing={addTag}
              returnKeyType="done"
            />
            <TouchableOpacity style={styles.addTagBtn} onPress={addTag}>
              <Ionicons name="add" size={20} color="#2563eb" />
            </TouchableOpacity>
          </View>
          <View style={styles.tagsList}>
            {tags.map((tag) => (
              <View key={tag} style={styles.tagChip}>
                <Text style={styles.tagText}>#{tag}</Text>
                <TouchableOpacity onPress={() => removeTag(tag)}>
                  <Ionicons name="close" size={14} color="#6b7280" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        {/* Privacy Selector */}
        <View style={styles.privacySection}>
          <Text style={styles.sectionLabel}>Privacy</Text>
          {(['public', 'friends', 'private'] as const).map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.privacyOption, privacy === p && styles.privacyOptionActive]}
              onPress={() => setPrivacy(p)}
            >
              <Ionicons
                name={
                  p === 'public' ? 'globe-outline' : p === 'friends' ? 'people-outline' : 'lock-closed-outline'
                }
                size={20}
                color={privacy === p ? '#2563eb' : '#6b7280'}
              />
              <Text style={[styles.privacyText, privacy === p && styles.privacyTextActive]}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </Text>
              {privacy === p && <Ionicons name="checkmark" size={18} color="#2563eb" />}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scroll: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#0a0a0a' },
  postBtn: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
  },
  postBtnDisabled: { backgroundColor: '#d1d5db' },
  postBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  userRow: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  userName: { fontSize: 15, fontWeight: '600', color: '#0a0a0a' },
  contentInput: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#0a0a0a',
    minHeight: 120,
    textAlignVertical: 'top',
  },
  mediaPreview: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, marginTop: 8 },
  mediaItem: { width: 100, height: 100, borderRadius: 8, marginRight: 8, marginBottom: 8, overflow: 'hidden' },
  mediaImage: { width: '100%', height: '100%' },
  removeMedia: { position: 'absolute', top: 4, right: 4, backgroundColor: '#fff', borderRadius: 11 },
  tagsSection: { paddingHorizontal: 16, marginTop: 16 },
  tagInputRow: { flexDirection: 'row', alignItems: 'center' },
  tagInput: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0a0a0a',
  },
  addTagBtn: { padding: 10, marginLeft: 8 },
  tagsList: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: { fontSize: 13, color: '#2563eb', marginRight: 6 },
  privacySection: { paddingHorizontal: 16, marginTop: 24, marginBottom: 40 },
  sectionLabel: { fontSize: 14, fontWeight: '600', color: '#6b7280', marginBottom: 10 },
  privacyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 6,
  },
  privacyOptionActive: { backgroundColor: '#eff6ff' },
  privacyText: { flex: 1, fontSize: 15, color: '#374151', marginLeft: 12 },
  privacyTextActive: { color: '#2563eb', fontWeight: '600' },
});
