import React, { memo } from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { useFeed } from '../hooks/useFeed';
import { useShare } from '../hooks/useShare';
import type { Post } from '../types';

interface FeedCardProps {
  post: Post;
  onProfilePress: (userId: string) => void;
  onCommentPress: (postId: string) => void;
}

export const FeedCard = memo(function FeedCard({ post, onProfilePress, onCommentPress }: FeedCardProps) {
  const { likePost, unlikePost, savePost, unsavePost } = useFeed();
  const { setShowShareSheet } = useShare(post.id);

  return (
    <View style={styles.card}>
      <Pressable onPress={() => onProfilePress(post.userId)} style={styles.header}>
        <Image source={{ uri: post.userAvatar }} style={styles.avatar} />
        <View>
          <Text style={styles.username}>{post.username}</Text>
          <Text style={styles.timestamp}>{post.createdAt}</Text>
        </View>
      </Pressable>

      <Text style={styles.caption}>{post.caption}</Text>
      {post.mediaUrl && (
        <Image source={{ uri: post.mediaUrl }} style={styles.media} resizeMode="cover" />
      )}

      <View style={styles.actions}>
        <Pressable onPress={() => post.isLiked ? unlikePost.mutate(post.id) : likePost.mutate(post.id)}>
          <Text style={[styles.actionText, post.isLiked && styles.active]}>
            {post.isLiked ? '❤️' : '🤍'} {post.likeCount}
          </Text>
        </Pressable>
        <Pressable onPress={() => onCommentPress(post.id)}>
          <Text style={styles.actionText}>💬 {post.commentCount}</Text>
        </Pressable>
        <Pressable onPress={() => setShowShareSheet(true)}>
          <Text style={styles.actionText}>↗️ Share</Text>
        </Pressable>
        <Pressable onPress={() => post.isSaved ? unsavePost.mutate(post.id) : savePost.mutate(post.id)}>
          <Text style={[styles.actionText, post.isSaved && styles.active]}>
            {post.isSaved ? '🔖' : '🔖'}
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
  username: { fontWeight: '700', fontSize: 14 },
  timestamp: { fontSize: 12, color: '#888' },
  caption: { fontSize: 14, marginBottom: 8, lineHeight: 20 },
  media: { width: '100%', height: 300, borderRadius: 8, marginBottom: 8 },
  actions: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 8 },
  actionText: { fontSize: 14, color: '#333' },
  active: { color: '#E91E63' },
});
