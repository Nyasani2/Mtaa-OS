// domains/streets/screens/CommentsScreen.tsx
// Streets comments screen component
// Imported by: app/(os)/streets/comments/[postId].tsx

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

export interface StreetComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at?: string;
  likes_count: number;
  replies_count: number;
  parent_id?: string | null;
  author?: {
    full_name: string;
    avatar_url?: string;
  };
}

interface CommentsScreenProps {
  postId: string;
  onBack?: () => void;
}

export default function CommentsScreen({ postId, onBack }: CommentsScreenProps) {
  const user = useAuthStore((s) => s.user);
  const [comments, setComments] = useState<StreetComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchComments = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('streets_comments')
        .select(`
          *,
          author:user_profiles(full_name, avatar_url)
        `)
        .eq('post_id', postId)
        .is('parent_id', null)
        .order('created_at', { ascending: false });

      if (err) throw err;
      setComments((data || []) as StreetComment[]);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const postComment = async () => {
    if (!newComment.trim() || !user?.id) return;
    setPosting(true);
    try {
      const { data, error: err } = await supabase
        .from('streets_comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          content: newComment.trim(),
          parent_id: null,
        })
        .select(`*, author:user_profiles(full_name, avatar_url)`)
        .single();

      if (err) throw err;
      setComments((prev) => [data as StreetComment, ...prev]);
      setNewComment('');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setPosting(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const renderComment = ({ item }: { item: StreetComment }) => (
    <View style={styles.commentCard}>
      <View style={styles.commentHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {item.author?.full_name?.charAt(0)?.toUpperCase() || '?'}
          </Text>
        </View>
        <View style={styles.commentMeta}>
          <Text style={styles.authorName}>{item.author?.full_name || 'Unknown'}</Text>
          <Text style={styles.timestamp}>
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>
      </View>
      <Text style={styles.commentText}>{item.content}</Text>
      <View style={styles.commentActions}>
        <TouchableOpacity style={styles.actionBtn}>
          <Ionicons name="heart-outline" size={16} color="#6b7280" />
          <Text style={styles.actionText}>{item.likes_count}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn}>
          <Ionicons name="chatbubble-outline" size={16} color="#6b7280" />
          <Text style={styles.actionText}>{item.replies_count}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#0a0a0a" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Comments</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Comments List */}
        {loading ? (
          <ActivityIndicator size="large" color="#2563eb" style={styles.loader} />
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : (
          <FlatList
            data={comments}
            keyExtractor={(item) => item.id}
            renderItem={renderComment}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Ionicons name="chatbubbles-outline" size={48} color="#d1d5db" />
                <Text style={styles.emptyText}>No comments yet</Text>
                <Text style={styles.emptySub}>Be the first to comment</Text>
              </View>
            }
          />
        )}

        {/* Input */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder="Add a comment..."
            placeholderTextColor="#9ca3af"
            value={newComment}
            onChangeText={setNewComment}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!newComment.trim() || posting) && styles.sendBtnDisabled]}
            onPress={postComment}
            disabled={!newComment.trim() || posting}
          >
            {posting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="send" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  flex: { flex: 1 },
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
  placeholder: { width: 32 },
  loader: { marginTop: 40 },
  listContent: { padding: 16 },
  commentCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  commentHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  commentMeta: { flex: 1 },
  authorName: { fontSize: 14, fontWeight: '600', color: '#0a0a0a' },
  timestamp: { fontSize: 12, color: '#9ca3af', marginTop: 1 },
  commentText: { fontSize: 14, color: '#374151', lineHeight: 20 },
  commentActions: { flexDirection: 'row', marginTop: 10 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', marginRight: 20 },
  actionText: { fontSize: 12, color: '#6b7280', marginLeft: 4 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#6b7280', marginTop: 12 },
  emptySub: { fontSize: 13, color: '#9ca3af', marginTop: 4 },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0a0a0a',
    maxHeight: 100,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  sendBtnDisabled: { backgroundColor: '#d1d5db' },
  errorText: { color: '#ef4444', textAlign: 'center', marginTop: 40 },
});
