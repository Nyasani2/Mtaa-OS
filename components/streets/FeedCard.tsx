import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Dimensions,
  Alert,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import type { StreetsPost } from '@/lib/types/streets';
import { streetsService } from '@/lib/services/streets-service';

const { width: SCREEN_W } = Dimensions.get('window');

interface FeedCardProps {
  post: StreetsPost;
  isVisible?: boolean;
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const then = new Date(dateStr);
  const diff = Math.floor((now.getTime() - then.getTime()) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
  return then.toLocaleDateString();
}

function getThumbnailUrl(url: string): string {
  if (url.includes('supabase.co/storage')) {
    return `${url}?width=600&height=400&resize=contain`;
  }
  return url;
}

export function FeedCard({ post, isVisible }: FeedCardProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const [liked, setLiked] = useState(post.is_liked || false);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [imageError, setImageError] = useState(false);

  const isOwnPost = user?.id === post.creator_id;

  const handleLike = useCallback(async () => {
    if (!user) {
      Alert.alert('Sign in required', 'Please sign in to like posts.');
      return;
    }
    try {
      if (liked) {
        await streetsService.unlikePost(post.id);
        setLiked(false);
        setLikesCount(c => Math.max(0, c - 1));
      } else {
        await streetsService.likePost(post.id);
        setLiked(true);
        setLikesCount(c => c + 1);
      }
    } catch (e) {
      // silent — optimistic UI already updated
    }
  }, [liked, post.id, user]);

  const handleComment = useCallback(() => {
    router.push(`/(os)/streets/post/${post.id}`);
  }, [router, post.id]);

  const handleShare = useCallback(() => {
    // TODO: implement share sheet
    Alert.alert('Share', 'Sharing coming soon!');
  }, []);

  const handleDelete = useCallback(() => {
    if (!isOwnPost) return;
    Alert.alert(
      'Delete Post',
      'Are you sure? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await streetsService.deletePost(post.id);
            } catch (e: any) {
              Alert.alert('Error', e.message || 'Failed to delete');
            }
          },
        },
      ]
    );
  }, [isOwnPost, post.id]);

  const hasMedia = !!post.media_url && post.media_type !== 'text';
  const creatorInitial = (post.creator_name || 'U')[0].toUpperCase();

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.authorRow}
          onPress={() => router.push(`/(os)/streets/creator/${post.creator_id}`)}
        >
          {post.creator_avatar ? (
            <Image source={{ uri: post.creator_avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarText}>{creatorInitial}</Text>
            </View>
          )}
          <View style={styles.authorInfo}>
            <Text style={styles.authorName}>
              {post.creator_name || 'Unknown'}
              {post.creator_verified && (
                <Ionicons name="checkmark-circle" size={14} color="#3897f0" style={{ marginLeft: 4 }} />
              )}
            </Text>
            <Text style={styles.timeAgo}>{timeAgo(post.created_at || '')}</Text>
          </View>
        </TouchableOpacity>
        {isOwnPost && (
          <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
            <Ionicons name="trash-outline" size={18} color="#ff3b30" />
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      {post.content ? (
        <Text style={styles.content}>{post.content}</Text>
      ) : null}

      {/* Media */}
      {hasMedia && !imageError && (
        <TouchableOpacity onPress={handleComment} activeOpacity={0.9}>
          <Image
            source={{ uri: getThumbnailUrl(post.media_url!), cache: 'force-cache' }}
            style={styles.media}
            resizeMode="cover"
            onError={() => setImageError(true)}
          />
        </TouchableOpacity>
      )}
      {imageError && hasMedia && (
        <View style={styles.mediaError}>
          <Ionicons name="image-outline" size={32} color="#666" />
          <Text style={styles.mediaErrorText}>Media unavailable</Text>
        </View>
      )}

      {/* Hashtags */}
      {post.hashtags && post.hashtags.length > 0 && (
        <View style={styles.hashtags}>
          {post.hashtags.map((tag, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => router.push(`/(os)/streets/hashtag/${encodeURIComponent(tag)}`)}
            >
              <Text style={styles.hashtag}>#{tag}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity onPress={handleLike} style={styles.actionBtn}>
          <Ionicons name={liked ? 'heart' : 'heart-outline'} size={24} color={liked ? '#ff2d55' : '#fff'} />
          <Text style={[styles.actionCount, liked && styles.actionCountActive]}>
            {likesCount > 0 ? likesCount : ''}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleComment} style={styles.actionBtn}>
          <Ionicons name="chatbubble-outline" size={22} color="#fff" />
          <Text style={styles.actionCount}>
            {post.comments_count || 0}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleShare} style={styles.actionBtn}>
          <Ionicons name="share-outline" size={22} color="#fff" />
          <Text style={styles.actionCount}>
            {post.shares_count || 0}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn}>
          <Ionicons name="bookmark-outline" size={22} color="#fff" />
          <Text style={styles.actionCount}>
            {post.saves_count || 0}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Stats bar */}
      <View style={styles.statsBar}>
        <Text style={styles.statsText}>
          {likesCount > 0 ? `${likesCount} likes` : ''}
          {likesCount > 0 && (post.comments_count || 0) > 0 ? ' · ' : ''}
          {(post.comments_count || 0) > 0 ? `${post.comments_count} comments` : ''}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  avatarFallback: {
    backgroundColor: '#ff2d55',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  timeAgo: {
    color: '#666',
    fontSize: 12,
    marginTop: 2,
  },
  deleteBtn: {
    padding: 4,
  },
  content: {
    color: '#e0e0e0',
    fontSize: 15,
    lineHeight: 21,
    marginBottom: 10,
  },
  media: {
    width: SCREEN_W - 32,
    height: (SCREEN_W - 32) * 0.56,
    borderRadius: 12,
    marginBottom: 10,
  },
  mediaError: {
    width: SCREEN_W - 32,
    height: 160,
    borderRadius: 12,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  mediaErrorText: {
    color: '#666',
    marginTop: 8,
    fontSize: 13,
  },
  hashtags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  hashtag: {
    color: '#3897f0',
    fontSize: 14,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    marginTop: 4,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionCount: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
  },
  actionCountActive: {
    color: '#ff2d55',
  },
  statsBar: {
    marginTop: 8,
  },
  statsText: {
    color: '#888',
    fontSize: 13,
  },
});
