import React from 'react';
import { View, Text, Pressable, StyleSheet, TextInput } from 'react-native';
import { useLive } from '../hooks/useLive';

interface LivePlayerProps {
  streamId?: string;
  isHost?: boolean;
}

export function LivePlayer({ streamId, isHost = false }: LivePlayerProps) {
  const { stream, isLive, viewerCount, comments, commentText, setCommentText, startStream, endStream, sendComment } = useLive(streamId);

  if (!isLive && !isHost) {
    return (
      <View style={styles.offline}>
        <Text style={styles.offlineText}>🔴 Livestream ended</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.videoArea}>
        <Text style={styles.placeholder}>📹 Video Player Placeholder</Text>
        {isLive && (
          <View style={styles.liveBadge}>
            <Text style={styles.liveText}>LIVE</Text>
            <Text style={styles.viewerText}>👁 {viewerCount}</Text>
          </View>
        )}
      </View>

      <View style={styles.commentsArea}>
        {comments.map(c => (
          <View key={c.id} style={styles.liveComment}>
            <Text style={styles.commentUser}>{c.username}:</Text>
            <Text style={styles.commentMsg}>{c.text}</Text>
          </View>
        ))}
      </View>

      <View style={styles.controls}>
        {isHost ? (
          isLive ? (
            <Pressable style={styles.endBtn} onPress={() => endStream.mutate()}>
              <Text style={styles.endText}>⏹ End Stream</Text>
            </Pressable>
          ) : (
            <Pressable style={styles.startBtn} onPress={() => startStream.mutate('My Live Stream')}>
              <Text style={styles.startText}>🔴 Go Live</Text>
            </Pressable>
          )
        ) : (
          <View style={styles.commentBar}>
            <TextInput
              style={styles.commentInput}
              placeholder="Say something..."
              value={commentText}
              onChangeText={setCommentText}
            />
            <Pressable onPress={() => sendComment.mutate(commentText)} disabled={!commentText.trim()}>
              <Text style={[styles.sendText, !commentText.trim() && styles.disabled]}>Send</Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  videoArea: { flex: 1, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  placeholder: { color: '#fff', fontSize: 18 },
  liveBadge: { position: 'absolute', top: 16, left: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  liveText: { color: '#fff', backgroundColor: '#E91E63', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, fontWeight: '700' },
  viewerText: { color: '#fff', fontSize: 14 },
  commentsArea: { maxHeight: 150, padding: 12 },
  liveComment: { flexDirection: 'row', marginBottom: 6 },
  commentUser: { color: '#E91E63', fontWeight: '700', marginRight: 6 },
  commentMsg: { color: '#fff' },
  controls: { padding: 12, borderTopWidth: 1, borderTopColor: '#333' },
  startBtn: { backgroundColor: '#E91E63', padding: 14, borderRadius: 8, alignItems: 'center' },
  startText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  endBtn: { backgroundColor: '#333', padding: 14, borderRadius: 8, alignItems: 'center' },
  endText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  commentBar: { flexDirection: 'row', alignItems: 'center' },
  commentInput: { flex: 1, backgroundColor: '#222', color: '#fff', padding: 10, borderRadius: 20, marginRight: 10 },
  sendText: { color: '#E91E63', fontWeight: '700' },
  disabled: { opacity: 0.3 },
  offline: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  offlineText: { color: '#fff', fontSize: 18 },
});
