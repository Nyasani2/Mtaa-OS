import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

interface Comment {
  id: string;
  content: string;
  user_id: string;
  post_id: string;
  parent_id: string | null;
  is_pinned: boolean;
  created_at: string;
  likes_count: number;
  user_profiles: {
    user_id: string;
    full_name: string | null;
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
  } | null;
  replies?: Comment[];
}

export default function CommentsScreen() {
  const router = useRouter();
  const { postId } = useLocalSearchParams<{ postId: string }>();
  const { user, isAuthenticated } = useAuthStore();
  const isGuest = !isAuthenticated || !user;
  const [comments, setComments] = useState<Comment[]>([]);
  const [inputText, setInputText] = useState('');
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const fetchComments = useCallback(async () => {
    if (!postId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('streets_comments')
      .select(`
        id, content, user_id, post_id, parent_id, is_pinned, created_at, likes_count,
        user_profiles:user_id (user_id, full_name, display_name, username, avatar_url)
      `)
      .eq('post_id', postId)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Comments fetch error:', error);
    } else {
      const topLevel = (data || []).filter((c: any) => !c.parent_id);
      const replies = (data || []).filter((c: any) => c.parent_id);
      const nested = topLevel.map((c: any) => ({
        ...c,
        replies: replies.filter((r: any) => r.parent_id === c.id),
      }));
      setComments(nested);
    }
    setLoading(false);
  }, [postId]);

  useEffect(() => { fetchComments(); }, [fetchComments]);

  const handleSend = useCallback(async () => {
    if (isGuest) {
      Alert.alert('Sign In Required', 'Please sign in to post comments.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign In', onPress: () => router.push('/(os)/auth/login') }
      ]);
      return;
    }
    if (!inputText.trim() || !user || !postId) return;
    setSending(true);
    const { error } = await supabase.from('streets_comments').insert({
      post_id: postId,
      user_id: user.id,
      content: inputText.trim(),
      parent_id: replyTo?.id || null,
    });
    setSending(false);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setInputText('');
      setReplyTo(null);
      fetchComments();
    }
  }, [inputText, user, postId, replyTo, fetchComments, isGuest, router]);

  const handlePin = useCallback(async (commentId: string) => {
    if (isGuest) return;
    const { error } = await supabase
      .from('streets_comments')
      .update({ is_pinned: true })
      .eq('id', commentId);
    if (!error) fetchComments();
  }, [fetchComments, isGuest]);

  const handleReport = useCallback((commentId: string) => {
    if (isGuest) {
      Alert.alert('Sign In Required', 'Please sign in to report comments.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign In', onPress: () => router.push('/(os)/auth/login') }
      ]);
      return;
    }
    Alert.alert('Report Comment', 'Are you sure you want to report this comment?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Report', style: 'destructive', onPress: async () => {
        await supabase.from('streets_reports').insert({ target_id: commentId, target_type: 'comment', reporter_id: user?.id });
        Alert.alert('Reported', 'Thank you. We will review this comment.');
      }},
    ]);
  }, [user?.id, isGuest, router]);

  const openProfile = useCallback((userId: string) => {
    router.push(`/(os)/profile/${userId}`);
  }, [router]);

  const renderReply = (reply: Comment) => (
    <View key={reply.id} style={styles.replyItem}>
      <TouchableOpacity onPress={() => openProfile(reply.user_id)}>
        <View style={[styles.avatar, styles.replyAvatar]}>
          <Text style={styles.avatarText}>
            {(reply.user_profiles?.full_name || reply.user_profiles?.display_name || reply.user_profiles?.username || 'U').charAt(0)}
          </Text>
        </View>
      </TouchableOpacity>
      <View style={styles.replyContent}>
        <TouchableOpacity onPress={() => openProfile(reply.user_id)}>
          <Text style={styles.replyName}>
            {reply.user_profiles?.full_name || reply.user_profiles?.display_name || reply.user_profiles?.username || 'User'}
          </Text>
        </TouchableOpacity>
        <Text style={styles.replyText}>{reply.content}</Text>
        <View style={styles.replyActions}>
          <Text style={styles.replyTime}>{new Date(reply.created_at).toLocaleDateString()}</Text>
          {!isGuest && (
            <TouchableOpacity onPress={() => setReplyTo(reply)}>
              <Text style={styles.replyActionText}>Reply</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );

  const renderComment = useCallback(({ item }: { item: Comment }) => (
    <View style={styles.commentItem}>
      {item.is_pinned && (
        <View style={styles.pinnedBadge}>
          <Ionicons name="pin" size={12} color="#FFD700" />
          <Text style={styles.pinnedText}>Pinned by creator</Text>
        </View>
      )}
      <View style={styles.commentRow}>
        <TouchableOpacity onPress={() => openProfile(item.user_id)}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(item.user_profiles?.full_name || item.user_profiles?.display_name || item.user_profiles?.username || 'U').charAt(0)}
            </Text>
          </View>
        </TouchableOpacity>
        <View style={styles.commentBody}>
          <TouchableOpacity onPress={() => openProfile(item.user_id)}>
            <Text style={styles.commentName}>
              {item.user_profiles?.full_name || item.user_profiles?.display_name || item.user_profiles?.username || 'User'}
            </Text>
          </TouchableOpacity>
          <Text style={styles.commentText}>{item.content}</Text>
          <View style={styles.commentMeta}>
            <Text style={styles.commentTime}>{new Date(item.created_at).toLocaleDateString()}</Text>
            {!isGuest && (
              <TouchableOpacity onPress={() => setReplyTo(item)}>
                <Text style={styles.metaAction}>Reply</Text>
              </TouchableOpacity>
            )}
            {!isGuest && (
              <TouchableOpacity onPress={() => handleReport(item.id)}>
                <Text style={styles.metaAction}>Report</Text>
              </TouchableOpacity>
            )}
            {user?.id && item.user_id === user.id && !isGuest && (
              <TouchableOpacity onPress={() => handlePin(item.id)}>
                <Text style={styles.metaAction}>Pin</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        <View style={styles.likeCol}>
          <Ionicons name="heart-outline" size={18} color="#888" />
          <Text style={styles.likeCount}>{item.likes_count || 0}</Text>
        </View>
      </View>
      {item.replies && item.replies.length > 0 && (
        <View style={styles.repliesContainer}>
          {item.replies.map(renderReply)}
        </View>
      )}
    </View>
  ), [user, openProfile, handlePin, handleReport, isGuest]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.push('/streets')} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Comments</Text>
        <View style={styles.backBtn} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#2196F3" />
        </View>
      ) : (
        <FlatList
          data={comments}
          renderItem={renderComment}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>{loading ? 'Loading comments...' : 'No comments yet. Be the first!'}</Text>
            </View>
          }
        />
      )}

      {replyTo && (
        <View style={styles.replyBar}>
          <Text style={styles.replyBarText}>Replying to {replyTo.user_profiles?.username || 'User'}</Text>
          <TouchableOpacity onPress={() => setReplyTo(null)}>
            <Ionicons name="close" size={18} color="#888" />
          </TouchableOpacity>
        </View>
      )}

      {!isGuest ? (
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder={replyTo ? 'Write a reply...' : 'Add a comment...'}
            placeholderTextColor="#666"
            value={inputText}
            onChangeText={setInputText}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!inputText.trim() || sending) && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!inputText.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="send" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={styles.guestSignInBar} onPress={() => router.push('/(os)/auth/login')}>
          <Text style={styles.guestSignInText}>Sign in to comment</Text>
          <Ionicons name="arrow-forward" size={16} color="#2196F3" />
        </TouchableOpacity>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '700' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { paddingVertical: 8 },
  commentItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  pinnedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  pinnedText: { color: '#FFD700', fontSize: 11, fontWeight: '600' },
  commentRow: { flexDirection: 'row', gap: 10 },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  replyAvatar: { width: 28, height: 28, borderRadius: 14 },
  avatarText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  commentBody: { flex: 1 },
  commentName: { color: '#fff', fontSize: 14, fontWeight: '600', marginBottom: 2 },
  commentText: { color: '#ccc', fontSize: 14, lineHeight: 20 },
  commentMeta: { flexDirection: 'row', gap: 12, marginTop: 6, alignItems: 'center' },
  commentTime: { color: '#666', fontSize: 12 },
  metaAction: { color: '#888', fontSize: 12, fontWeight: '500' },
  likeCol: { alignItems: 'center', paddingTop: 4 },
  likeCount: { color: '#888', fontSize: 11, marginTop: 2 },
  repliesContainer: { marginLeft: 46, marginTop: 10 },
  replyItem: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  replyContent: { flex: 1 },
  replyName: { color: '#fff', fontSize: 13, fontWeight: '600', marginBottom: 1 },
  replyText: { color: '#aaa', fontSize: 13, lineHeight: 18 },
  replyActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  replyTime: { color: '#666', fontSize: 11 },
  replyActionText: { color: '#888', fontSize: 11, fontWeight: '500' },
  empty: { padding: 40, alignItems: 'center' },
  emptyText: { color: '#666', fontSize: 15 },
  replyBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  replyBarText: { color: '#888', fontSize: 13 },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#1a1a1a',
    backgroundColor: '#0a0a0a',
  },
  input: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#fff',
    fontSize: 14,
    maxHeight: 100,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  sendBtnDisabled: { backgroundColor: '#333' },
  guestSignInBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#222',
    backgroundColor: '#0a0a0a',
  },
  guestSignInText: { color: '#2196F3', fontSize: 14, fontWeight: '600' },
});
