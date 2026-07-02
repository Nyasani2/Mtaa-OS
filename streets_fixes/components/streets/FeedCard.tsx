import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import type { StreetsPost } from '@/lib/types/streets';
import { streetsService } from '@/lib/services/streets-service';

const { width: SCREEN_W } = Dimensions.get('window');

interface FeedCardProps {
  post: StreetsPost;
  onLike?: (postId: string) => void;
  onUnlike?: (postId: string) => void;
  onDelete?: (postId: string) => void;
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

export default function FeedCard({ post, onLike, onUnlike, onDelete }: FeedCardProps) {
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
        onUnlike?.(post.id);
      } else {
        await streetsService.likePost(post.id);
        setLiked(true);
        setLikesCount(c => c + 1);
        onLike?.(post.id);
      }
    } catch (e) {
      // silent
    }
  }, [liked, post.id, user, onLike, onUnlike]);

  const handleComment = useCallback(() => {
    router.push(`/(os)/streets/post/${post.id}`);
  }, [router, post.id]);

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
              onDelete?.(post.id);
            } catch (e) {
              Alert.alert('Error', 'Failed to delete post.');
            }
          },
        },
      ]
    );
  }, [isOwnPost, post.id, onDelete]);

  const hasMedia = !!post.media_url && post.media_type !== 'text';

  return (
    <View style={{ paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <View style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: '#ff2d55',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 10,
        }}>
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>
            {post.creator_name?.[0]?.toUpperCase() || 'U'}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: '#fff', fontWeight: '600', fontSize: 15 }}>
            {post.creator_name || 'Unknown'}
          </Text>
          <Text style={{ color: '#666', fontSize: 12 }}>
            {timeAgo(post.created_at)}
          </Text>
        </View>
        {isOwnPost && (
          <TouchableOpacity onPress={handleDelete}>
            <Ionicons name="trash-outline" size={20} color="#ff3b30" />
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      {post.content ? (
        <Text style={{ color: '#e0e0e0', fontSize: 15, lineHeight: 21, marginBottom: hasMedia ? 10 : 0 }}>
          {post.content}
        </Text>
      ) : null}

      {/* Media — single image/video */}
      {hasMedia && !imageError && (
        <TouchableOpacity 
          onPress={() => router.push(`/(os)/streets/post/${post.id}`)}
          style={{ marginBottom: 10 }}
        >
          <Image
            source={{ 
              uri: getThumbnailUrl(post.media_url!),
              cache: 'force-cache',
            }}
            style={{ width: SCREEN_W - 32, height: (SCREEN_W - 32) * 0.56, borderRadius: 12 }}
            resizeMode="cover"
            onError={() => setImageError(true)}
          />
        </TouchableOpacity>
      )}

      {imageError && hasMedia && (
        <View style={{
          backgroundColor: '#1a1a1a',
          borderRadius: 12,
          padding: 20,
          alignItems: 'center',
          marginBottom: 10,
        }}>
          <Ionicons name="image-outline" size={32} color="#666" />
          <Text style={{ color: '#666', marginTop: 8, fontSize: 13 }}>Media unavailable</Text>
        </View>
      )}

      {/* Actions */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 24, marginTop: 4 }}>
        <TouchableOpacity onPress={handleLike} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons
            name={liked ? 'heart' : 'heart-outline'}
            size={22}
            color={liked ? '#ff2d55' : '#888'}
          />
          <Text style={{ color: liked ? '#ff2d55' : '#888', fontSize: 13, fontWeight: '500' }}>
            {likesCount > 0 ? likesCount : 'Like'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleComment} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name="chatbubble-outline" size={20} color="#888" />
          <Text style={{ color: '#888', fontSize: 13, fontWeight: '500' }}>
            {post.comments_count > 0 ? post.comments_count : 'Comment'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name="share-outline" size={20} color="#888" />
          <Text style={{ color: '#888', fontSize: 13, fontWeight: '500' }}>Share</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
