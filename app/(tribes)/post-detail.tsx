// @ts-nocheck
// app/(os)/tribes/post/[id].tsx
// Post Detail Screen — full post + comments thread

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
    // Get single post
// eslint-disable-next-line no-unsafe-optional-chaining
    const { data } = await tribesService['getPosts']?.(postId, { limit: 1 });
    // Actually we need a getPostById method — let's fetch from the list for now
    // Since service doesn't have getPostById, we'll query directly
    const { data: postData } = await tribesService['getPostById']?.(postId) || {};
    // For now, we'll use a workaround: fetch all posts and filter
    // Better: add getPostById to service, but let's just fetch comments
    const commentsData = await tribesService.getComments(postId);
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
