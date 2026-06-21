import React from 'react';
import { View, Text, TextInput, Pressable, FlatList, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { useComments } from '../hooks/useComments';
import type { StreetComment } from '../services/commentService';

interface CommentThreadProps { postId: string; }

export function CommentThread({ postId }: CommentThreadProps) {
  const { comments, commentsLoading, commentText, setCommentText, replyingTo, addComment, addReply, likeComment, deleteComment, startReply, cancelReply } = useComments(postId);

  const renderComment = ({ item }: { item: StreetComment }) => {
    const avatarUri = item.author?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.author?.display_name || 'U')}&background=6366f1&color=fff`;
    return (
      <View style={styles.comment}>
        <Image source={{ uri: avatarUri }} style={styles.commentAvatar} />
        <View style={styles.commentBody}>
          <Text style={styles.commentUser}>{item.author?.display_name || 'User'}</Text>
          <Text style={styles.commentText}>{item.content}</Text>
          <View style={styles.commentActions}>
            <Pressable onPress={() => likeComment.mutate(item.id)} style={styles.actionBtn}><Text style={styles.commentAction}>❤️ {item.likes_count || 0}</Text></Pressable>
            <Pressable onPress={() => startReply(item.id)} style={styles.actionBtn}><Text style={styles.commentAction}>Reply</Text></Pressable>
            <Pressable onPress={() => deleteComment.mutate(item.id)} style={styles.actionBtn}><Text style={styles.commentAction}>🗑️</Text></Pressable>
          </View>
          {item.replies_count ? <Text style={styles.repliesHint}>{item.replies_count} replies</Text> : null}
        </View>
      </View>
    );
  };

  if (commentsLoading) return <View style={styles.container}><ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 40 }} /></View>;

  return (
    <View style={styles.container}>
      <FlatList data={comments} renderItem={renderComment} keyExtractor={item => item.id}
        ListEmptyComponent={<View style={styles.emptyContainer}><Text style={styles.emptyText}>No comments yet</Text><Text style={styles.emptySubtext}>Be the first to comment!</Text></View>} />
      <View style={styles.inputBar}>
        {replyingTo && <View style={styles.replyBar}><Text style={styles.replyingTo}>Replying to comment</Text><Pressable onPress={cancelReply}><Text>✕</Text></Pressable></View>}
        <View style={styles.inputRow}>
          <TextInput style={styles.input} placeholder="Add a comment..." value={commentText} onChangeText={setCommentText} multiline maxLength={500} />
          <Pressable onPress={() => replyingTo ? addReply.mutate({ commentId: replyingTo, input: { text: commentText } }) : addComment.mutate({ text: commentText })} disabled={!commentText.trim() || addComment.isPending || addReply.isPending}>
            <Text style={[styles.sendBtn, (!commentText.trim() || addComment.isPending || addReply.isPending) && styles.disabled]}>➤</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  comment: { flexDirection: 'row', padding: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  commentAvatar: { width: 36, height: 36, borderRadius: 18, marginRight: 10 },
  commentBody: { flex: 1 },
  commentUser: { fontWeight: '700', fontSize: 13, color: '#333' },
  commentText: { fontSize: 14, marginTop: 4, lineHeight: 20, color: '#333' },
  commentActions: { flexDirection: 'row', marginTop: 8, gap: 16 },
  actionBtn: { padding: 4 },
  commentAction: { fontSize: 12, color: '#888' },
  repliesHint: { fontSize: 12, color: '#007AFF', marginTop: 6, fontWeight: '600' },
  inputBar: { borderTopWidth: 1, borderTopColor: '#eee', padding: 12, backgroundColor: '#fff' },
  replyBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, paddingHorizontal: 4 },
  replyingTo: { fontSize: 12, color: '#007AFF', fontWeight: '600' },
  inputRow: { flexDirection: 'row', alignItems: 'center' },
  input: { flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, maxHeight: 100 },
  sendBtn: { fontSize: 20, color: '#007AFF', marginLeft: 10 },
  disabled: { opacity: 0.3 },
  emptyContainer: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#999', marginTop: 12 },
  emptySubtext: { fontSize: 14, color: '#bbb', marginTop: 4 },
});
