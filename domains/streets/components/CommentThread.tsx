import React from 'react';
import { View, Text, TextInput, Pressable, FlatList, Image, StyleSheet } from 'react-native';
import { useComments } from '../hooks/useComments';
import type { Comment } from '../types';

interface CommentThreadProps {
  postId: string;
}

export function CommentThread({ postId }: CommentThreadProps) {
  const {
    commentText,
    setCommentText,
    replyingTo,
    addComment,
    addReply,
    likeComment,
    deleteComment,
    startReply,
    cancelReply,
  } = useComments(postId);

  const renderComment = ({ item }: { item: Comment }) => (
    <View style={styles.comment}>
      <Image source={{ uri: item.userAvatar }} style={styles.commentAvatar} />
      <View style={styles.commentBody}>
        <Text style={styles.commentUser}>{item.username}</Text>
        <Text style={styles.commentText}>{item.text}</Text>
        <View style={styles.commentActions}>
          <Pressable onPress={() => likeComment.mutate(item.id)}>
            <Text style={styles.commentAction}>❤️ {item.likeCount}</Text>
          </Pressable>
          <Pressable onPress={() => startReply(item.id)}>
            <Text style={styles.commentAction}>Reply</Text>
          </Pressable>
          <Pressable onPress={() => deleteComment.mutate(item.id)}>
            <Text style={styles.commentAction}>🗑️</Text>
          </Pressable>
        </View>
        {item.replies?.map(reply => (
          <View key={reply.id} style={styles.reply}>
            <Text style={styles.replyUser}>{reply.username}</Text>
            <Text style={styles.replyText}>{reply.text}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={[]} // comments data from hook
        renderItem={renderComment}
        keyExtractor={item => item.id}
      />
      <View style={styles.inputBar}>
        {replyingTo && (
          <View style={styles.replyBar}>
            <Text style={styles.replyingTo}>Replying to comment</Text>
            <Pressable onPress={cancelReply}><Text>✕</Text></Pressable>
          </View>
        )}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Add a comment..."
            value={commentText}
            onChangeText={setCommentText}
          />
          <Pressable
            onPress={() => replyingTo
              ? addReply.mutate({ commentId: replyingTo, input: { text: commentText } })
              : addComment.mutate({ text: commentText })
            }
            disabled={!commentText.trim()}
          >
            <Text style={[styles.sendBtn, !commentText.trim() && styles.disabled]}>➤</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  comment: { flexDirection: 'row', padding: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  commentAvatar: { width: 32, height: 32, borderRadius: 16, marginRight: 10 },
  commentBody: { flex: 1 },
  commentUser: { fontWeight: '700', fontSize: 13 },
  commentText: { fontSize: 14, marginTop: 2, lineHeight: 20 },
  commentActions: { flexDirection: 'row', marginTop: 6, gap: 16 },
  commentAction: { fontSize: 12, color: '#888' },
  reply: { marginLeft: 16, marginTop: 8, paddingLeft: 8, borderLeftWidth: 2, borderLeftColor: '#eee' },
  replyUser: { fontWeight: '600', fontSize: 12 },
  replyText: { fontSize: 13, color: '#555' },
  inputBar: { borderTopWidth: 1, borderTopColor: '#eee', padding: 12 },
  replyBar: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  replyingTo: { fontSize: 12, color: '#E91E63' },
  inputRow: { flexDirection: 'row', alignItems: 'center' },
  input: { flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, fontSize: 14 },
  sendBtn: { marginLeft: 10, fontSize: 20, color: '#E91E63' },
  disabled: { opacity: 0.3 },
});
