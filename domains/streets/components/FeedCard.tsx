// domains/streets/components/FeedCard.tsx
// MTAA Streets — Feed Card (FIXED to match feedService output)

import React, { memo } from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { useFeed } from '../hooks/useFeed';
import type { StreetPost } from '../state/state';

interface FeedCardProps {
  post: StreetPost;
  onProfilePress: (userId: string) => void;
  onCommentPress: (postId: string) => void;
}

export const FeedCard = memo(function FeedCard({ post, onProfilePress, onCommentPress }: FeedCardProps) {
  const { toggleLike, toggleSave } = useFeed();

  const author = post.author as any;
  const avatarUrl = author?.avatar_url || 'https://via.placeholder.com/40';
  const displayName = author?.display_name || author?.handle || 'Anonymous';
  const isVerified = author?.is_verified || false;

  return (
    <View style={styles.card}>
      <Pressable onPress={() => onProfilePress(post.user_id)} style={styles.header}>
        <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        <View style={styles.headerText}>
          <View style={styles.nameRow}>
            <Text style={styles.username}>{displayName}</Text>
            {isVerified && <Text style={styles.verified}>✓</Text>}
          </View>
          <Text style={styles.timestamp}>{new Date(post.created_at).toLocaleDateString()}</Text>
        </View>
      </Pressable>

      <Text style={styles.caption}>{post.content}</Text>
      {post.media_urls && post.media_urls.length > 0 && (
        <Image source={{ uri: post.media_urls[0] }} style={styles.media} resizeMode="cover" />
      )}

      <View style={styles.actions}>
        <Pressable onPress={() => toggleLike(post.id)} style={styles.actionBtn}>
          <Text style={[styles.actionText, post.liked_by_me && styles.active]}>
            {post.liked_by_me ? '❤️' : '🤍'} {post.like_count}
          </Text>
        </Pressable>
        <Pressable onPress={() => onCommentPress(post.id)} style={styles.actionBtn}>
          <Text style={styles.actionText}>💬 {post.comment_count}</Text>
        </Pressable>
        <Pressable onPress={() => {}} style={styles.actionBtn}>
          <Text style={styles.actionText}>↗️ {post.share_count}</Text>
        </Pressable>
        <Pressable onPress={() => toggleSave(post.id)} style={styles.actionBtn}>
          <Text style={[styles.actionText, post.saved_by_me && styles.active]}>
            {post.saved_by_me ? '🔖' : '🔖'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', marginBottom: 12, padding: 12, borderRadius: 12 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
  headerText: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  username: { fontWeight: '700', fontSize: 14 },
  verified: { marginLeft: 4, color: '#E91E63', fontWeight: '700' },
  timestamp: { fontSize: 12, color: '#888' },
  caption: { fontSize: 14, marginBottom: 8, lineHeight: 20 },
  media: { width: '100%', height: 300, borderRadius: 8, marginBottom: 8 },
  actions: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 8 },
  actionBtn: { paddingVertical: 4, paddingHorizontal: 8 },
  actionText: { fontSize: 14, color: '#333' },
  active: { color: '#E91E63' },
});
