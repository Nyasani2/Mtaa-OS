import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity, Image,
  StyleSheet, ActivityIndicator, RefreshControl, KeyboardAvoidingView,
  Platform, Alert
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { streetsService } from '@/lib/services/streets-service';
import type { Post, Comment } from '@/lib/services/streets-service';

export default function PostDetailScreen() {
  const { postId } = useLocalSearchParams<{ postId: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const commentInputRef = useRef<TextInput>(null);

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isOwnPost = user?.id === post?.creator_id;

  const loadPost = useCallback(async () => {
    if (!postId) return;
    try {
      const [postData, commentsData] = await Promise.all([
        streetsService.getPostById(postId, user?.id),
        streetsService.getComments(postId),
      ]);
      setPost(postData);
      setComments(commentsData);
    } catch (err) {
      console.error('Load post error:', err);
      Alert.alert('Error', 'Failed to load post');
    }
  }, [postId, user?.id]);

  useEffect(() => {
    loadPost().finally(() => setLoading(false));
  }, [loadPost]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadPost();
    setRefreshing(false);
  }, [loadPost]);

  // ─── FIXED: Comment button handler ───
  const handleCommentPress = useCallback(() => {
    // Scroll to comment input and focus it
    scrollRef.current?.scrollToEnd({ animated: true });
    setTimeout(() => {
      commentInputRef.current?.focus();
    }, 300);
  }, []);

  const handleSubmitComment = async () => {
    if (!commentText.trim() || !user || !postId) return;
    setSubmitting(true);
    try {
      const newComment = await streetsService.addComment(postId, user.id, commentText.trim());
      setComments(prev => [...prev, newComment]);
      setCommentText('');
      // Refresh post to update comment count
      const updatedPost = await streetsService.getPostById(postId, user.id);
      setPost(updatedPost);
    } catch (err: any) {
      Alert.alert('Comment failed', err.message || 'Could not post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async () => {
    if (!user || !post) return;
    try {
      await streetsService.toggleLike(post.id, user.id);
      const updated = await streetsService.getPostById(post.id, user.id);
      setPost(updated);
    } catch (err) {
      console.warn('Like failed:', err);
    }
  };

  const handleSave = async () => {
    if (!user || !post) return;
    try {
      await streetsService.toggleSave(post.id, user.id);
      const updated = await streetsService.getPostById(post.id, user.id);
      setPost(updated);
    } catch (err) {
      console.warn('Save failed:', err);
    }
  };

  const handleDeletePost = () => {
    Alert.alert('Delete Post?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await streetsService.deletePost(postId);
            router.back();
          } catch (err) {
            Alert.alert('Error', 'Could not delete post');
          }
        }
      },
    ]);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  if (!post) {
    return (
      <View style={[styles.container, styles.center]}>
        <Ionicons name="alert-circle-outline" size={48} color="#666" />
        <Text style={styles.emptyText}>Post not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const firstMedia = post.media_urls?.[0];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { paddingTop: insets.top }]}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Post</Text>
        {isOwnPost && (
          <TouchableOpacity onPress={handleDeletePost}>
            <Ionicons name="trash-outline" size={24} color="#ff4444" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        ref={scrollRef}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4CAF50" />}
        keyboardShouldPersistTaps="handled"
      >
        {/* Post Header */}
        <View style={styles.postHeader}>
          <TouchableOpacity
            onPress={() => router.push(`/(os)/streets/creator/${post.creator_id}`)}
            style={styles.creatorRow}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{post.creator?.full_name?.[0] || '?'}</Text>
            </View>
            <View>
              <Text style={styles.creatorName}>{post.creator?.full_name || 'Unknown'}</Text>
              <Text style={styles.timestamp}>{new Date(post.created_at).toLocaleDateString()}</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Media */}
        {firstMedia && (
          <Image
            source={{ uri: firstMedia, cache: 'force-cache' }}
            style={styles.media}
            resizeMode="cover"
          />
        )}

        {/* Caption */}
        {post.caption && <Text style={styles.caption}>{post.caption}</Text>}

        {/* Actions */}
        <View style={styles.actions}>
          <View style={styles.actionRow}>
            <TouchableOpacity onPress={handleLike} style={styles.actionBtn}>
              <Ionicons name={post.is_liked ? 'heart' : 'heart-outline'} size={26} color={post.is_liked ? '#ff4444' : '#fff'} />
              <Text style={styles.actionCount}>{post.like_count}</Text>
            </TouchableOpacity>
            {/* ─── FIXED: Comment button now has onPress ─── */}
            <TouchableOpacity onPress={handleCommentPress} style={styles.actionBtn}>
              <Ionicons name="chatbubble-outline" size={24} color="#fff" />
              <Text style={styles.actionCount}>{post.comment_count}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => {}} style={styles.actionBtn}>
              <Ionicons name="paper-plane-outline" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={handleSave}>
            <Ionicons name={post.is_saved ? 'bookmark' : 'bookmark-outline'} size={24} color={post.is_saved ? '#FFD700' : '#fff'} />
          </TouchableOpacity>
        </View>

        {/* Comments Section */}
        <View style={styles.commentsSection}>
          <Text style={styles.commentsTitle}>Comments ({comments.length})</Text>
          {comments.length === 0 ? (
            <Text style={styles.noComments}>No comments yet. Be the first!</Text>
          ) : (
            comments.map(comment => (
              <View key={comment.id} style={styles.commentItem}>
                <View style={styles.commentAvatar}>
                  <Text style={styles.commentAvatarText}>{comment.creator?.full_name?.[0] || '?'}</Text>
                </View>
                <View style={styles.commentBody}>
                  <Text style={styles.commentAuthor}>{comment.creator?.full_name || 'Unknown'}</Text>
                  <Text style={styles.commentText}>{comment.content}</Text>
                  <Text style={styles.commentTime}>{new Date(comment.created_at).toLocaleDateString()}</Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Spacer for keyboard */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Comment Input */}
      <View style={[styles.inputBar, { paddingBottom: insets.bottom || 12 }]}>
        <TextInput
          ref={commentInputRef}
          style={styles.input}
          placeholder="Add a comment..."
          placeholderTextColor="#666"
          value={commentText}
          onChangeText={setCommentText}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          onPress={handleSubmitComment}
          disabled={!commentText.trim() || submitting}
          style={[styles.sendBtn, (!commentText.trim() || submitting) && styles.sendBtnDisabled]}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="send" size={20} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#222' },
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '600', position: 'absolute', left: 0, right: 0, textAlign: 'center' },
  postHeader: { paddingHorizontal: 16, paddingVertical: 12 },
  creatorRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#4CAF50', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  creatorName: { color: '#fff', fontSize: 15, fontWeight: '600' },
  timestamp: { color: '#666', fontSize: 12, marginTop: 2 },
  media: { width: '100%', height: 300, backgroundColor: '#1a1a1a' },
  caption: { color: '#ddd', fontSize: 15, lineHeight: 22, paddingHorizontal: 16, paddingVertical: 12 },
  actions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#222' },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionCount: { color: '#fff', fontSize: 14, fontWeight: '500', marginLeft: 4 },
  commentsSection: { paddingHorizontal: 16, paddingTop: 16 },
  commentsTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 12 },
  noComments: { color: '#666', fontSize: 14, fontStyle: 'italic', marginBottom: 16 },
  commentItem: { flexDirection: 'row', marginBottom: 16 },
  commentAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#333', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  commentAvatarText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  commentBody: { flex: 1 },
  commentAuthor: { color: '#fff', fontSize: 13, fontWeight: '600', marginBottom: 2 },
  commentText: { color: '#ccc', fontSize: 14, lineHeight: 20 },
  commentTime: { color: '#555', fontSize: 11, marginTop: 4 },
  inputBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#222', backgroundColor: '#111' },
  input: { flex: 1, color: '#fff', fontSize: 15, maxHeight: 80, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#1a1a1a', borderRadius: 20, marginRight: 8 },
  sendBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#4CAF50', alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { backgroundColor: '#333' },
  emptyText: { color: '#888', fontSize: 16, marginTop: 12 },
  backBtn: { marginTop: 20, paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#333', borderRadius: 8 },
  backBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});
