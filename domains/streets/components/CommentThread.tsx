import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, Pressable, FlatList, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuth } from '@/lib/auth/useAuth';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';

interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  text: string;
  created_at: string;
  parent_id: string | null;
  likes_count: number;
  replies_count: number;
  user?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

interface CommentThreadProps {
  postId: string;
}

export function CommentThread({ postId }: CommentThreadProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchComments = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('streets_comments')
        .select(`
          *,
          user:user_id(id, full_name, avatar_url)
        `)
        .eq('post_id', postId)
        .is('parent_id', null)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Fetch comments error:', error);
        return;
      }

      const normalized = (data || []).map((row: any) => ({
        ...row,
        user: Array.isArray(row.user) ? row.user[0] : row.user,
      }));

      setComments(normalized);
    } catch (err) {
      console.error('Comments fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleAddComment = async () => {
    if (!commentText.trim() || !user) return;

    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('streets_comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          text: commentText.trim(),
          parent_id: replyingTo,
          likes_count: 0,
          replies_count: 0,
        })
        .select(`
          *,
          user:user_id(id, full_name, avatar_url)
        `)
        .single();

      if (error) {
        console.error('Add comment error:', error);
        return;
      }

      const newComment = {
        ...data,
        user: Array.isArray(data.user) ? data.user[0] : data.user,
      };

      setComments((prev) => [newComment, ...prev]);
      setCommentText('');
      setReplyingTo(null);
    } catch (err) {
      console.error('Add comment exception:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('streets_comment_likes')
        .insert({ comment_id: commentId, user_id: user.id });

      if (error) {
        // Already liked, unlike it
        await supabase
          .from('streets_comment_likes')
          .delete()
          .eq('comment_id', commentId)
          .eq('user_id', user.id);
      }

      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId
            ? { ...c, likes_count: error ? Math.max(0, c.likes_count - 1) : c.likes_count + 1 }
            : c
        )
      );
    } catch (err) {
      console.error('Like comment error:', err);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('streets_comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', user.id);

      if (!error) {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
      }
    } catch (err) {
      console.error('Delete comment error:', err);
    }
  };

  const renderComment = ({ item }: { item: Comment }) => {
    const isOwner = item.user_id === user?.id;
    const avatarUri = item.user?.avatar_url || 
      `https://ui-avatars.com/api/?name=${encodeURIComponent(item.user?.full_name || 'U')}&background=6366f1&color=fff`;

    return (
      <View style={styles.comment}>
        <Image source={{ uri: avatarUri }} style={styles.commentAvatar} />
        <View style={styles.commentBody}>
          <Text style={styles.commentUser}>{item.user?.full_name || 'User'}</Text>
          <Text style={styles.commentText}>{item.text}</Text>
          <View style={styles.commentActions}>
            <Pressable onPress={() => handleLikeComment(item.id)} style={styles.actionBtn}>
              <Ionicons name="heart-outline" size={14} color="#888" />
              <Text style={styles.commentAction}>{item.likes_count || 0}</Text>
            </Pressable>
            <Pressable onPress={() => setReplyingTo(item.id)} style={styles.actionBtn}>
              <Text style={styles.commentAction}>Reply</Text>
            </Pressable>
            {isOwner && (
              <Pressable onPress={() => handleDeleteComment(item.id)} style={styles.actionBtn}>
                <Ionicons name="trash-outline" size={14} color="#ff4444" />
              </Pressable>
            )}
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 40 }} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={comments}
        renderItem={renderComment}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubble-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No comments yet</Text>
            <Text style={styles.emptySubtext}>Be the first to comment!</Text>
          </View>
        }
      />
      <View style={styles.inputBar}>
        {replyingTo && (
          <View style={styles.replyBar}>
            <Text style={styles.replyingTo}>Replying to comment</Text>
            <Pressable onPress={() => setReplyingTo(null)}>
              <Ionicons name="close" size={18} color="#666" />
            </Pressable>
          </View>
        )}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Add a comment..."
            value={commentText}
            onChangeText={setCommentText}
            multiline
            maxLength={500}
          />
          <Pressable
            onPress={handleAddComment}
            disabled={!commentText.trim() || submitting}
            style={[styles.sendBtn, (!commentText.trim() || submitting) && styles.disabled]}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : (
              <Ionicons name="send" size={20} color="#007AFF" />
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  listContent: { padding: 12 },
  comment: { flexDirection: 'row', padding: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  commentAvatar: { width: 36, height: 36, borderRadius: 18, marginRight: 10 },
  commentBody: { flex: 1 },
  commentUser: { fontWeight: '700', fontSize: 13, color: '#333' },
  commentText: { fontSize: 14, marginTop: 4, lineHeight: 20, color: '#333' },
  commentActions: { flexDirection: 'row', marginTop: 8, gap: 16 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  commentAction: { fontSize: 12, color: '#888' },
  inputBar: { borderTopWidth: 1, borderTopColor: '#eee', padding: 12, backgroundColor: '#fff' },
  replyBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, paddingHorizontal: 4 },
  replyingTo: { fontSize: 12, color: '#007AFF', fontWeight: '600' },
  inputRow: { flexDirection: 'row', alignItems: 'center' },
  input: { flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, maxHeight: 100 },
  sendBtn: { marginLeft: 10, padding: 8 },
  disabled: { opacity: 0.3 },
  emptyContainer: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#999', marginTop: 12 },
  emptySubtext: { fontSize: 14, color: '#bbb', marginTop: 4 },
});
