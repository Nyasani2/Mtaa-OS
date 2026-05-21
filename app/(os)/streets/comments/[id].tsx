import { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, Alert
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

interface Comment {
  id: string;
  content_id: string;
  author_id: string;
  author_name: string;
  author_avatar: string | null;
  text: string;
  parent_id: string | null;
  likes_count: number;
  replies_count: number;
  created_at: string;
  user_liked: boolean;
}

export default function CommentsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) loadComments();
  }, [id]);

  const loadComments = async () => {
    try {
      const { data, error } = await supabase
        .from('street_comments')
        .select(`
          *,
          street_comment_likes!left(user_id)
        `)
        .eq('content_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const processed = (data || []).map((c: any) => ({
        ...c,
        user_liked: c.street_comment_likes?.some((l: any) => l.user_id === user?.id) || false,
      }));

      setComments(processed);
    } catch (err) {
      console.error('Comments error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!newComment.trim() || !user) return;

    try {
      const { data, error } = await supabase
        .from('street_comments')
        .insert({
          content_id: id,
          author_id: user.id,
          author_name: user.user_metadata?.display_name || 'User',
          text: newComment.trim(),
          parent_id: replyTo,
        })
        .select()
        .single();

      if (error) throw error;

      // Update comment count
      await supabase.rpc('increment_comment_count', { content_id: id });

      setComments(prev => [data, ...prev]);
      setNewComment('');
      setReplyTo(null);
    } catch (err) {
      Alert.alert('Error', 'Failed to post comment');
    }
  };

  const handleLikeComment = async (commentId: string, currentlyLiked: boolean) => {
    if (!user) return;

    setComments(prev => prev.map(c =>
      c.id === commentId
        ? { ...c, user_liked: !currentlyLiked, likes_count: currentlyLiked ? c.likes_count - 1 : c.likes_count + 1 }
        : c
    ));

    if (currentlyLiked) {
      await supabase.from('street_comment_likes').delete().eq('comment_id', commentId).eq('user_id', user.id);
    } else {
      await supabase.from('street_comment_likes').insert({ comment_id: commentId, user_id: user.id });
    }
  };

  const handleReply = (commentId: string) => {
    setReplyTo(commentId);
  };

  const handleDelete = async (commentId: string) => {
    Alert.alert('Delete Comment', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('street_comments').delete().eq('id', commentId);
          setComments(prev => prev.filter(c => c.id !== commentId));
        },
      },
    ]);
  };

  const handleReport = (commentId: string) => {
    Alert.alert('Report', 'Comment reported. We will review it.');
  };

  const handlePin = async (commentId: string) => {
    await supabase.from('street_comments').update({ pinned: true }).eq('id', commentId);
    Alert.alert('Pinned', 'Comment pinned to top');
  };

  const renderComment = ({ item }: { item: Comment }) => (
    <View style={styles.commentCard}>
      <View style={styles.commentHeader}>
        <View style={styles.commentAvatar}>
          <Text style={styles.commentAvatarText}>
            {item.author_name?.charAt(0).toUpperCase() || 'U'}
          </Text>
        </View>
        <View style={styles.commentMeta}>
          <Text style={styles.commentAuthor}>{item.author_name}</Text>
          <Text style={styles.commentTime}>
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>
      </View>

      <Text style={styles.commentText}>{item.text}</Text>

      <View style={styles.commentActions}>
        <TouchableOpacity
          style={styles.commentAction}
          onPress={() => handleLikeComment(item.id, item.user_liked)}
        >
          <Ionicons
            name={item.user_liked ? 'heart' : 'heart-outline'}
            size={16}
            color={item.user_liked ? '#ef4444' : '#94a3b8'}
          />
          <Text style={styles.commentActionText}>{item.likes_count}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.commentAction} onPress={() => handleReply(item.id)}>
          <Ionicons name="chatbubble-outline" size={16} color="#94a3b8" />
          <Text style={styles.commentActionText}>Reply</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.commentAction} onPress={() => handleReport(item.id)}>
          <Ionicons name="flag-outline" size={16} color="#94a3b8" />
        </TouchableOpacity>

        {item.author_id === user?.id && (
          <>
            <TouchableOpacity style={styles.commentAction} onPress={() => handleDelete(item.id)}>
              <Ionicons name="trash-outline" size={16} color="#ef4444" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.commentAction} onPress={() => handlePin(item.id)}>
              <Ionicons name="pin-outline" size={16} color="#f59e0b" />
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-down" size={24} color="#f8fafc" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Comments ({comments.length})</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={comments}
        renderItem={renderComment}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="chatbubbles-outline" size={40} color="#334155" />
            <Text style={styles.emptyText}>No comments yet</Text>
            <Text style={styles.emptySub}>Be the first to comment</Text>
          </View>
        }
      />

      {/* Input */}
      <View style={styles.inputContainer}>
        {replyTo && (
          <View style={styles.replyBanner}>
            <Text style={styles.replyText}>Replying to comment</Text>
            <TouchableOpacity onPress={() => setReplyTo(null)}>
              <Ionicons name="close" size={16} color="#94a3b8" />
            </TouchableOpacity>
          </View>
        )}
        <View style={styles.inputRow}>
          <View style={styles.inputAvatar}>
            <Text style={styles.inputAvatarText}>
              {user?.user_metadata?.display_name?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
          <TextInput
            style={styles.input}
            placeholder="Add a comment..."
            placeholderTextColor="#475569"
            value={newComment}
            onChangeText={setNewComment}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendBtn, !newComment.trim() && styles.sendBtnDisabled]}
            onPress={handleSubmit}
            disabled={!newComment.trim()}
          >
            <Ionicons name="send" size={20} color={newComment.trim() ? '#3b82f6' : '#475569'} />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#f8fafc' },
  list: { padding: 16, paddingBottom: 100 },
  commentCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  commentHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  commentAvatarText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  commentMeta: { flex: 1 },
  commentAuthor: { fontSize: 14, fontWeight: '600', color: '#f8fafc' },
  commentTime: { fontSize: 11, color: '#64748b' },
  commentText: { fontSize: 14, color: '#e2e8f0', lineHeight: 20, marginBottom: 8 },
  commentActions: { flexDirection: 'row', gap: 16 },
  commentAction: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  commentActionText: { fontSize: 12, color: '#94a3b8' },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#94a3b8', marginTop: 12 },
  emptySub: { fontSize: 13, color: '#64748b', marginTop: 4 },
  inputContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#0f172a',
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    padding: 12,
  },
  replyBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 8,
  },
  replyText: { fontSize: 12, color: '#3b82f6' },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  inputAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputAvatarText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  input: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    color: '#f8fafc',
    fontSize: 14,
    maxHeight: 80,
    borderWidth: 1,
    borderColor: '#334155',
  },
  sendBtn: { padding: 4 },
  sendBtnDisabled: { opacity: 0.5 },
});
