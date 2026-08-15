// @ts-nocheck
// app/(os)/tribes/post/[id].tsx
// Post Detail Screen — full post + comments thread
// FIXED 2026-08-06:
//   • Now uses getPostById() to load the actual post body
//   • Renders post header, content, media, likes
//   • Comments load via getComments() (tribe_comments table)

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { tribesService, TribePost } from '@/lib/tribes/services/tribes.service';

export default function PostDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const postId = id as string;

  const [post, setPost] = useState<TribePost | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadPost = useCallback(async () => {
    setLoading(true);
    const [postData, commentsData] = await Promise.all([
      tribesService.getPostById(postId),
      tribesService.getComments(postId),
    ]);
    setPost(postData);
    setComments(commentsData);
    setLoading(false);
  }, [postId]);

  useEffect(() => {
    loadPost();
  }, [loadPost]);

  const handleComment = async () => {
    if (!commentText.trim()) return;
    setSubmitting(true);
    const res = await tribesService.addComment(postId, commentText.trim());
    setSubmitting(false);
    if (res.success) {
      setCommentText('');
      loadPost();
    }
  };

  const renderComment = (comment: any, depth = 0) => (
    <View key={comment.id} style={[styles.commentCard, { marginLeft: depth * 20 }]}>
      <View style={styles.commentHeader}>
        <Image source={{ uri: comment.author?.avatar_url || 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==' }} style={styles.commentAvatar} />
        <Text style={styles.commentAuthor}>{comment.author?.first_name} {comment.author?.last_name}</Text>
        <Text style={styles.commentTime}>{new Date(comment.created_at).toLocaleDateString()}</Text>
      </View>
      <Text style={styles.commentContent}>{comment.content}</Text>
      <TouchableOpacity style={styles.replyBtn}>
        <Text style={styles.replyBtnText}>Reply</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.backBtn}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Post</Text>
            <View style={{ width: 30 }} />
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 40 }} />
          ) : (
            <>
              {/* Post Body */}
              {post && (
                <View style={styles.postCard}>
                  <View style={styles.postHeader}>
                    <Image
                      source={{ uri: post.author?.avatar_url || 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==' }}
                      style={styles.postAvatar}
                    />
                    <View>
                      <Text style={styles.postAuthor}>
                        {post.author?.first_name} {post.author?.last_name}
                      </Text>
                      <Text style={styles.postTime}>
                        {new Date(post.created_at).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                  {post.title ? <Text style={styles.postTitle}>{post.title}</Text> : null}
                  <Text style={styles.postContent}>{post.content}</Text>
                  {post.media_urls && post.media_urls.length > 0 && (
                    <Image source={{ uri: post.media_urls[0] }} style={styles.postMedia} resizeMode="cover" />
                  )}
                  <View style={styles.postActions}>
                    <TouchableOpacity onPress={() => tribesService.toggleLike(post.id)}>
                      <Text style={[styles.actionText, post.is_liked && styles.actionTextActive]}>
                        {post.is_liked ? '❤️' : '🤍'} {post.like_count}
                      </Text>
                    </TouchableOpacity>
                    <Text style={styles.actionText}>💬 {post.comment_count}</Text>
                    <Text style={styles.actionText}>🔄 {post.share_count}</Text>
                  </View>
                </View>
              )}

              {/* Comments */}
              <Text style={styles.commentsTitle}>{comments.length} Comments</Text>
              {comments.length === 0 ? (
                <Text style={styles.noComments}>No comments yet. Start the conversation!</Text>
              ) : (
                comments.map((c) => renderComment(c))
              )}
            </>
          )}
        </ScrollView>

        {/* Comment Input */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.commentInput}
            placeholder="Add a comment..."
            placeholderTextColor="#666"
            value={commentText}
            onChangeText={setCommentText}
            multiline
          />
          <TouchableOpacity style={styles.sendBtn} onPress={handleComment} disabled={submitting || !commentText.trim()}>
            <Text style={styles.sendBtnText}>{submitting ? '...' : '➤'}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f' },
  scroll: { padding: 16, paddingBottom: 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  backBtn: { fontSize: 24, color: '#fff' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  postCard: { backgroundColor: '#1a1a2e', borderRadius: 16, padding: 16, marginBottom: 20 },
  postHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  postAvatar: { width: 36, height: 36, borderRadius: 18, marginRight: 10 },
  postAuthor: { fontSize: 14, fontWeight: '700', color: '#fff' },
  postTime: { fontSize: 11, color: '#666', marginTop: 2 },
  postTitle: { fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 8 },
  postContent: { fontSize: 14, color: '#ccc', lineHeight: 20, marginBottom: 12 },
  postMedia: { width: '100%', height: 220, borderRadius: 12, marginBottom: 12 },
  postActions: { flexDirection: 'row', gap: 20, marginTop: 4 },
  actionText: { fontSize: 13, color: '#888' },
  actionTextActive: { color: '#ff4444' },
  commentsTitle: { fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 16 },
  noComments: { fontSize: 14, color: '#666', textAlign: 'center', marginVertical: 20 },
  commentCard: { backgroundColor: '#1a1a2e', borderRadius: 12, padding: 12, marginBottom: 10 },
  commentHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  commentAvatar: { width: 28, height: 28, borderRadius: 14, marginRight: 8 },
  commentAuthor: { fontSize: 13, fontWeight: '600', color: '#fff' },
  commentTime: { fontSize: 11, color: '#666', marginLeft: 'auto' },
  commentContent: { fontSize: 14, color: '#ccc', lineHeight: 20 },
  replyBtn: { marginTop: 8 },
  replyBtnText: { fontSize: 12, color: '#007AFF', fontWeight: '600' },
  inputBar: { flexDirection: 'row', alignItems: 'center', padding: 12, borderTopWidth: 1, borderTopColor: '#1a1a2e', backgroundColor: '#0a0a0f' },
  commentInput: { flex: 1, backgroundColor: '#1a1a2e', borderRadius: 20, padding: 12, fontSize: 14, color: '#fff', maxHeight: 100 },
  sendBtn: { marginLeft: 10, width: 40, height: 40, borderRadius: 20, backgroundColor: '#007AFF', justifyContent: 'center', alignItems: 'center' },
  sendBtnText: { color: '#fff', fontSize: 18 },
});
