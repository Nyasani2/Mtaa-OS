import React, { memo, useCallback } from 'react';
import {
  View, Text, Image, TouchableOpacity, StyleSheet, Dimensions,
  Pressable
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { streetsService } from '@/lib/services/streets-service';

const { width: SCREEN_W } = Dimensions.get('window');
const THUMB_SIZE = Math.floor(SCREEN_W * 0.33); // Grid thumbnail size

interface FeedCardProps {
  post: {
    id: string;
    caption: string;
    media_urls?: string[];
    post_type: string;
    like_count: number;
    comment_count: number;
    creator_id: string;
    creator?: { full_name: string; avatar_url?: string };
    created_at: string;
    is_liked?: boolean;
    is_saved?: boolean;
  };
  variant?: 'feed' | 'grid' | 'detail';
  onLike?: (postId: string) => void;
  onSave?: (postId: string) => void;
  onComment?: (postId: string) => void;
  onShare?: (postId: string) => void;
}

// ─── THUMBNAIL URL BUILDER ───
// Converts full Supabase Storage URL to a smaller thumbnail via transform params
const getThumbnailUrl = (url: string, width: number, height: number): string => {
  if (!url || !url.includes('supabase.co')) return url;
  // Supabase Storage supports ?width= &height= &quality= via image transformation
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}width=${width}&height=${height}&quality=70&resize=cover`;
};

const FeedCard = memo(function FeedCard({
  post, variant = 'feed', onLike, onSave, onComment, onShare
}: FeedCardProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const isOwnPost = user?.id === post.creator_id;

  const handlePress = useCallback(() => {
    router.push(`/(os)/streets/post/${post.id}`);
  }, [router, post.id]);

  const handleCreatorPress = useCallback(() => {
    router.push(`/(os)/streets/creator/${post.creator_id}`);
  }, [router, post.creator_id]);

  const handleLike = useCallback(async () => {
    if (!user) return;
    try {
      await streetsService.toggleLike(post.id, user.id);
      onLike?.(post.id);
    } catch (err) {
      console.warn('Like failed:', err);
    }
  }, [post.id, user, onLike]);

  const handleSave = useCallback(async () => {
    if (!user) return;
    try {
      await streetsService.toggleSave(post.id, user.id);
      onSave?.(post.id);
    } catch (err) {
      console.warn('Save failed:', err);
    }
  }, [post.id, user, onSave]);

  const handleComment = useCallback(() => {
    onComment?.(post.id);
    router.push(`/(os)/streets/post/${post.id}`);
  }, [post.id, onComment, router]);

  const handleShare = useCallback(() => {
    onShare?.(post.id);
  }, [post.id, onShare]);

  const firstMedia = post.media_urls?.[0];
  const thumbUrl = firstMedia ? getThumbnailUrl(firstMedia, THUMB_SIZE, THUMB_SIZE) : null;
  const fullUrl = firstMedia ? getThumbnailUrl(firstMedia, SCREEN_W, Math.floor(SCREEN_W * 0.6)) : null;

  // ─── GRID VARIANT (creator profile) ───
  if (variant === 'grid') {
    return (
      <Pressable onPress={handlePress} style={styles.gridItem}>
        {thumbUrl ? (
          <Image
            source={{ uri: thumbUrl, cache: 'force-cache' }}
            style={styles.gridImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.gridImage, styles.gridPlaceholder]}>
            <Ionicons name="image-outline" size={24} color="#555" />
          </View>
        )}
      </Pressable>
    );
  }

  // ─── FEED / DETAIL VARIANT ───
  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCreatorPress} style={styles.creatorRow}>
          <View style={styles.avatar}>
            {post.creator?.avatar_url ? (
              <Image
                source={{ uri: getThumbnailUrl(post.creator.avatar_url, 40, 40), cache: 'force-cache' }}
                style={styles.avatarImg}
              />
            ) : (
              <Text style={styles.avatarText}>{post.creator?.full_name?.[0] || '?'}</Text>
            )}
          </View>
          <View>
            <Text style={styles.creatorName}>{post.creator?.full_name || 'Unknown'}</Text>
            <Text style={styles.timestamp}>{new Date(post.created_at).toLocaleDateString()}</Text>
          </View>
        </TouchableOpacity>
        {isOwnPost && (
          <TouchableOpacity onPress={() => router.push(`/(os)/streets/post/${post.id}/edit`)}>
            <Ionicons name="ellipsis-horizontal" size={20} color="#888" />
          </TouchableOpacity>
        )}
      </View>

      {/* Media */}
      {fullUrl && (
        <TouchableOpacity onPress={handlePress} activeOpacity={0.9}>
          <Image
            source={{ uri: fullUrl, cache: 'force-cache' }}
            style={styles.media}
            resizeMode="cover"
          />
        </TouchableOpacity>
      )}

      {/* Caption */}
      {post.caption ? (
        <Text style={styles.caption} numberOfLines={variant === 'feed' ? 3 : undefined}>
          {post.caption}
        </Text>
      ) : null}

      {/* Actions */}
      <View style={styles.actions}>
        <View style={styles.actionRow}>
          <TouchableOpacity onPress={handleLike} style={styles.actionBtn}>
            <Ionicons
              name={post.is_liked ? 'heart' : 'heart-outline'}
              size={26}
              color={post.is_liked ? '#ff4444' : '#fff'}
            />
            <Text style={styles.actionCount}>{post.like_count}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleComment} style={styles.actionBtn}>
            <Ionicons name="chatbubble-outline" size={24} color="#fff" />
            <Text style={styles.actionCount}>{post.comment_count}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleShare} style={styles.actionBtn}>
            <Ionicons name="paper-plane-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={handleSave}>
          <Ionicons
            name={post.is_saved ? 'bookmark' : 'bookmark-outline'}
            size={24}
            color={post.is_saved ? '#FFD700' : '#fff'}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: { backgroundColor: '#111', marginBottom: 12, borderRadius: 12, overflow: 'hidden' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12 },
  creatorRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#4CAF50', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  avatarImg: { width: 36, height: 36, borderRadius: 18 },
  avatarText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  creatorName: { color: '#fff', fontSize: 14, fontWeight: '600' },
  timestamp: { color: '#666', fontSize: 12, marginTop: 2 },
  media: { width: SCREEN_W, height: Math.floor(SCREEN_W * 0.6), backgroundColor: '#1a1a1a' },
  caption: { color: '#ddd', fontSize: 14, lineHeight: 20, paddingHorizontal: 12, paddingVertical: 10 },
  actions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 10 },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionCount: { color: '#fff', fontSize: 13, fontWeight: '500', marginLeft: 4 },
  gridItem: { width: THUMB_SIZE, height: THUMB_SIZE, margin: 1, backgroundColor: '#1a1a1a' },
  gridImage: { width: THUMB_SIZE, height: THUMB_SIZE },
  gridPlaceholder: { alignItems: 'center', justifyContent: 'center' },
});

export default FeedCard;
