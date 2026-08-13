// @ts-nocheck
import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useTribes } from '../hooks/useTribes';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { TribePost } from '../types';

interface TribeFeedProps {
  tribeId: string;
}

export function TribeFeed({ tribeId }: TribeFeedProps) {
  const { posts, loading, fetchPosts, createPost } = useTribes();
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (tribeId) {
      fetchPosts(tribeId);
    }
  }, [tribeId, fetchPosts]);

  const handleSubmit = useCallback(async () => {
    if (!content.trim() || !user?.id || !tribeId) return;
    setSubmitting(true);
    try {
      await createPost(tribeId, content.trim());
      setContent('');
      await fetchPosts(tribeId);
    } catch (e) {
      // error is already captured in hook state
    } finally {
      setSubmitting(false);
    }
  }, [content, tribeId, user?.id, createPost, fetchPosts]);

  const renderItem = useCallback(
    ({ item }: { item: TribePost }) => (
      <View style={styles.postCard}>
        <Text style={styles.author}>{item.author?.full_name || 'Anonymous'}</Text>
        <Text style={styles.postContent}>{item.content}</Text>
        <Text style={styles.timestamp}>
          {item.created_at ? new Date(item.created_at).toLocaleString() : ''}
        </Text>
      </View>
    ),
    []
  );

  if (loading && posts.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>No posts yet. Be the first!</Text>
        }
      />

      <View style={styles.inputBar}>
        <TextInput
          value={content}
          onChangeText={setContent}
          placeholder="Write something..."
          placeholderTextColor="#9ca3af"
          style={styles.input}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={submitting || !content.trim()}
          style={[
            styles.sendBtn,
            (submitting || !content.trim()) && styles.sendBtnDisabled,
          ]}
        >
          <Text style={styles.sendText}>
            {submitting ? '…' : 'Post'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 12 },
  postCard: {
    padding: 14,
    marginBottom: 10,
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  author: { fontWeight: '700', fontSize: 14, color: '#111827' },
  postContent: { marginTop: 6, fontSize: 14, color: '#374151', lineHeight: 20 },
  timestamp: { marginTop: 8, fontSize: 11, color: '#9ca3af' },
  empty: { textAlign: 'center', color: '#9ca3af', marginTop: 40 },
  inputBar: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    color: '#111827',
    maxHeight: 100,
  },
  sendBtn: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  sendBtnDisabled: { backgroundColor: '#93c5fd' },
  sendText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
