import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { getPostById, likePost, unlikePost, addComment, type StreetPost, type StreetComment } from '@/lib/services/streets-service';

export default function PostDetailScreen() {
  const { postId } = useLocalSearchParams<{ postId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const [post, setPost] = useState<StreetPost | null>(null);
  const [comments, setComments] = useState<StreetComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  const loadPost = useCallback(async () => {
    if (!postId) { setError('No post ID'); setLoading(false); return; }
    setLoading(true); setError(null);
    try {
      const data = await getPostById(postId);
      setPost(data);
      setLikeCount(data.likes_count || 0);
      setLiked(data.is_liked_by_user || false);
      setComments(data.comments || []);
    } catch (err: any) { setError(err.message || 'Failed to load post'); }
    finally { setLoading(false); }
  }, [postId]);

  useEffect(() => { loadPost(); }, [loadPost]);

  const handleLike = useCallback(async () => {
    if (!user || !post) return;
    const newLiked = !liked;
    setLiked(newLiked);
    setLikeCount(prev => newLiked ? prev + 1 : prev - 1);
    try {
      if (newLiked) await likePost(post.id);
      else await unlikePost(post.id);
    } catch (err) { setLiked(!newLiked); setLikeCount(prev => newLiked ? prev - 1 : prev + 1); }
  }, [user, post, liked]);

  const handleComment = useCallback(async () => {
    if (!commentText.trim() || !post || !user) return;
    setSubmittingComment(true);
    try {
      const newComment = await addComment(post.id, commentText.trim());
      setComments(prev => [newComment, ...prev]);
      setCommentText('');
    } catch (err: any) { alert(err.message || 'Failed to post comment'); }
    finally { setSubmittingComment(false); }
  }, [commentText, post, user]);

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#E91E63" />
      </View>
    );
  }

  if (error || !post) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}>
        <Ionicons name="warning" size={64} color="#666" />
        <Text style={styles.errorText}>{error || 'Post not found'}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={loadPost}><Text style={styles.retryText}>Retry</Text></TouchableOpacity>
      </View>
    );
  }

  const isVideo = post.media_type === 'video';
  const isImage = post.media_type === 'image' && post.media_url;

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={insets.top + 44}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Post</Text>
        <TouchableOpacity style={styles.backBtn}><Ionicons name="ellipsis-horizontal" size={24} color="#fff" /></TouchableOpacity>
      </View>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {isImage && <Image source={{ uri: post.media_url! }} style={styles.media} resizeMode="cover" />}
        {isVideo && (
          <View style={styles.videoPlaceholder}>
            <Ionicons name="play-circle" size={64} color="#fff" />
            <Text style={styles.videoText}>Video Player</Text>
          </View>
        )}
        <View style={styles.content}>
          <View style={styles.authorRow}>
            <TouchableOpacity onPress={() => router.push(`/(os)/streets/creator/${post.creator_id}`)}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{post.creator?.display_name?.[0]?.toUpperCase() || 'U'}</Text>
              </View>
            </TouchableOpacity>
            <View style={styles.authorInfo}>
              <Text style={styles.authorName}>{post.creator?.display_name || 'Unknown'}</Text>
              <Text style={styles.timestamp}>{new Date(post.created_at).toLocaleDateString()}</Text>
            </View>
          </View>
          <Text style={styles.caption}>{post.content || post.caption}</Text>
          <View style={styles.actions}>
            <TouchableOpacity style={styles.actionBtn} onPress={handleLike}>
              <Ionicons name={liked ? "heart" : "heart-outline"} size={26} color={liked ? "#E91E63" : "#fff"} />
              <Text style={styles.actionCount}>{likeCount}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn}>
              <Ionicons name="chatbubble-outline" size={24} color="#fff" />
              <Text style={styles.actionCount}>{comments.length}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn}>
              <Ionicons name="share-outline" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.commentsSection}>
          <Text style={styles.commentsTitle}>Comments</Text>
          {comments.map(comment => (
            <View key={comment.id} style={styles.comment}>
              <View style={styles.commentAvatar}>
                <Text style={styles.commentAvatarText}>{comment.author?.display_name?.[0]?.toUpperCase() || 'U'}</Text>
              </View>
              <View style={styles.commentBody}>
                <Text style={styles.commentAuthor}>{comment.author?.display_name || 'Unknown'}</Text>
                <Text style={styles.commentText}>{comment.content}</Text>
                <Text style={styles.commentTime}>{new Date(comment.created_at).toLocaleDateString()}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
      {user && (
        <View style={[styles.commentBar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
          <TextInput style={styles.commentInput} placeholder="Add a comment..." placeholderTextColor="#666" value={commentText} onChangeText={setCommentText} multiline />
          <TouchableOpacity style={styles.sendBtn} onPress={handleComment} disabled={!commentText.trim() || submittingComment}>
            <Ionicons name="send" size={20} color={commentText.trim() ? "#E91E63" : "#666"} />
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#222' },
  backBtn: { padding: 8 }, headerTitle: { color: '#fff', fontSize: 17, fontWeight: '600' },
  scroll: { flex: 1 }, media: { width: '100%', height: 400 },
  videoPlaceholder: { width: '100%', height: 400, backgroundColor: '#1a1a1a', justifyContent: 'center', alignItems: 'center' },
  videoText: { color: '#666', marginTop: 8 },
  content: { padding: 16 },
  authorRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E91E63', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontWeight: '700' },
  authorInfo: { marginLeft: 12 }, authorName: { color: '#fff', fontWeight: '600' },
  timestamp: { color: '#666', fontSize: 12, marginTop: 2 },
  caption: { color: '#fff', fontSize: 15, lineHeight: 22, marginBottom: 16 },
  actions: { flexDirection: 'row', gap: 24 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionCount: { color: '#fff', fontSize: 14 },
  commentsSection: { padding: 16, borderTopWidth: 1, borderTopColor: '#222' },
  commentsTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 12 },
  comment: { flexDirection: 'row', marginBottom: 16 },
  commentAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#333', justifyContent: 'center', alignItems: 'center' },
  commentAvatarText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  commentBody: { marginLeft: 12, flex: 1 },
  commentAuthor: { color: '#fff', fontWeight: '600' }, commentText: { color: '#ccc', marginTop: 2, lineHeight: 18 },
  commentTime: { color: '#666', fontSize: 11, marginTop: 4 },
  commentBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#222', backgroundColor: '#0a0a0a' },
  commentInput: { flex: 1, color: '#fff', fontSize: 14, maxHeight: 80, paddingVertical: 8 },
  sendBtn: { padding: 8 },
  errorText: { color: '#ff4444', marginTop: 12 }, retryBtn: { marginTop: 16, backgroundColor: '#E91E63', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20 },
  retryText: { color: '#fff', fontWeight: '600' },
});
