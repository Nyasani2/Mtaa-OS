import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Send } from 'lucide-react-native';
import { getComments, createComment } from '@/lib/services/streets-service';
import type { StreetComment } from '@/lib/services/streets-service';

export default function CommentsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [comments, setComments] = useState<StreetComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Validate post ID
  const hasValidId = !!id && typeof id === 'string' && id.length > 0 && id !== 'undefined';

  const loadComments = useCallback(async () => {
    if (!hasValidId) {
      setError('No post ID provided');
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      setError(null);
      console.log('[CommentsScreen] Loading comments for:', id);

      const data = await getComments(id as string);
      console.log('[CommentsScreen] Loaded:', data.length, 'comments');
      setComments(data);
    } catch (err: any) {
      console.error('[CommentsScreen] Load error:', err);
      setError(err.message || 'Failed to load comments');
    } finally {
      setIsLoading(false);
    }
  }, [id, hasValidId]);

  useEffect(() => {
    console.log('[CommentsScreen] Mounting with id:', id, 'hasValidId:', hasValidId);
    loadComments();
  }, [loadComments]);

  const handleSubmit = useCallback(async () => {
    if (!hasValidId) {
      Alert.alert('Error', 'No post ID provided');
      return;
    }
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      console.log('[CommentsScreen] Submitting comment:', newComment.trim());
      await createComment(id as string, newComment.trim());
      console.log('[CommentsScreen] Comment submitted successfully');
      setNewComment('');
      await loadComments();
    } catch (err: any) {
      console.error('[CommentsScreen] Submit error:', err);
      setError(err.message || 'Failed to post comment');
      Alert.alert('Error', err.message || 'Failed to post comment');
    } finally {
      setIsSubmitting(false);
    }
  }, [newComment, id, hasValidId, loadComments]);

  const renderComment = useCallback(({ item }: { item: StreetComment }) => (
    <View style={styles.commentItem}>
      <View style={styles.commentAvatar}>
        <Text style={styles.commentAvatarText}>
          {(item.user?.display_name || 'U').charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.commentContent}>
        <Text style={styles.commentAuthor}>{item.user?.display_name || 'User'}</Text>
        <Text style={styles.commentText}>{item.content}</Text>
        <Text style={styles.commentTime}>
          {new Date(item.created_at).toLocaleDateString()}
        </Text>
      </View>
    </View>
  ), []);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Comments</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Error Banner */}
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          {hasValidId && (
            <TouchableOpacity onPress={loadComments}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Comments List */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2196F3" />
        </View>
      ) : !hasValidId ? (
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>Invalid Post</Text>
          <Text style={styles.emptySub}>No post ID was provided</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => router.back()}>
            <Text style={styles.retryText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      ) : comments.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>No comments yet</Text>
          <Text style={styles.emptySub}>Be the first to comment!</Text>
        </View>
      ) : (
        <FlatList
          data={comments}
          keyExtractor={(item) => item.id}
          renderItem={renderComment}
          contentContainerStyle={styles.list}
        />
      )}

      {/* Input */}
      <View style={styles.inputWrap}>
        <TextInput
          style={styles.input}
          placeholder="Add a comment..."
          placeholderTextColor="#999"
          value={newComment}
          onChangeText={setNewComment}
          multiline
          maxLength={500}
          editable={!isSubmitting && hasValidId}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!newComment.trim() || isSubmitting || !hasValidId) && styles.sendBtnDisabled]}
          onPress={handleSubmit}
          disabled={!newComment.trim() || isSubmitting || !hasValidId}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Send size={18} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  errorBanner: {
    backgroundColor: '#ffebee',
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorText: {
    color: '#c62828',
    fontSize: 13,
    flex: 1,
  },
  retryText: {
    color: '#2196F3',
    fontSize: 13,
    fontWeight: '600',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  emptySub: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  retryBtn: {
    marginTop: 16,
    backgroundColor: '#2196F3',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
  },
  list: {
    padding: 16,
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  commentAvatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  commentContent: {
    flex: 1,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  commentText: {
    fontSize: 14,
    color: '#333',
    marginTop: 2,
    lineHeight: 20,
  },
  commentTime: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: '#333',
    maxHeight: 100,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
});
