import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StreetPost } from '@/lib/services/streets-service';

const { width } = Dimensions.get('window');

interface FeedCardProps {
  post: StreetPost;
  onLike?: (postId: string) => void;
  onSave?: (postId: string) => void;
  onFollow?: (userId: string) => void;
  onProfilePress?: (userId: string) => void;
}

export function FeedCard({ post, onLike, onSave, onFollow, onProfilePress }: FeedCardProps) {
  const router = useRouter();

  const handleCommentPress = () => {
    // FIXED: Route must match actual file path: comments/[postId].tsx
    router.push(`/streets/comments/${post.id}` as any);
  };

  const handleSharePress = () => {
    // FIXED: Route must match actual file path: share/[postId].tsx
    router.push(`/streets/share/${post.id}` as any);
  };

  const handleProfilePress = () => {
    if (post.creator?.user_id && onProfilePress) {
      onProfilePress(post.creator.user_id);
    }
  };

  const handleLikePress = () => {
    if (onLike) onLike(post.id);
  };

  const handleSavePress = () => {
    if (onSave) onSave(post.id);
  };

  const handleFollowPress = () => {
    if (post.creator?.user_id && onFollow) {
      onFollow(post.creator.user_id);
    }
  };

  const formatCount = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const isVideo = post.media_type === 'video';

  return (
    <View style={styles.container}>
      {/* Media Container */}
      <View style={styles.mediaContainer}>
        {post.media_url ? (
          isVideo ? (
            <View style={styles.videoPlaceholder}>
              <Image
                source={{ uri: post.thumbnail_url || post.video_thumbnail_url || post.media_url }}
                style={styles.mediaImage}
                resizeMode="cover"
              />
              <View style={styles.playOverlay}>
                <Ionicons name="play-circle" size={64} color="white" />
              </View>
              {post.duration && (
                <View style={styles.durationBadge}>
                  <Text style={styles.durationText}>
                    {Math.floor(post.duration / 60)}:{(post.duration % 60).toString().padStart(2, '0')}
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <Image
              source={{ uri: post.media_url }}
              style={styles.mediaImage}
              resizeMode="cover"
            />
          )
        ) : (
          <View style={styles.noMediaPlaceholder}>
            <Ionicons name="image-outline" size={48} color="#666" />
            <Text style={styles.noMediaText}>No media</Text>
          </View>
        )}
      </View>

      {/* Right Side Actions */}
      <View style={styles.actionsContainer}>
        {/* Profile Avatar */}
        <TouchableOpacity onPress={handleProfilePress} style={styles.avatarContainer}>
          <Image
            source={
              post.creator?.avatar_url
                ? { uri: post.creator.avatar_url }
                : require('@/assets/images/default-avatar.png')
            }
            style={styles.avatar}
          />
          {post.isFollowing === false && (
            <TouchableOpacity onPress={handleFollowPress} style={styles.followButton}>
              <Ionicons name="add" size={14} color="white" />
            </TouchableOpacity>
          )}
        </TouchableOpacity>

        {/* Like */}
        <TouchableOpacity onPress={handleLikePress} style={styles.actionButton}>
          <Ionicons
            name={post.isLiked ? 'heart' : 'heart-outline'}
            size={32}
            color={post.isLiked ? '#FF2D55' : 'white'}
          />
          <Text style={styles.actionCount}>{formatCount(post.likes_count)}</Text>
        </TouchableOpacity>

        {/* Comment */}
        <TouchableOpacity onPress={handleCommentPress} style={styles.actionButton}>
          <Ionicons name="chatbubble-outline" size={32} color="white" />
          <Text style={styles.actionCount}>{formatCount(post.comments_count)}</Text>
        </TouchableOpacity>

        {/* Share */}
        <TouchableOpacity onPress={handleSharePress} style={styles.actionButton}>
          <Ionicons name="arrow-redo-outline" size={32} color="white" />
          <Text style={styles.actionCount}>{formatCount(post.shares_count)}</Text>
        </TouchableOpacity>

        {/* Save */}
        <TouchableOpacity onPress={handleSavePress} style={styles.actionButton}>
          <Ionicons
            name={post.isSaved ? 'bookmark' : 'bookmark-outline'}
            size={32}
            color={post.isSaved ? '#FFD700' : 'white'}
          />
        </TouchableOpacity>
      </View>

      {/* Bottom Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.creatorName}>
          {post.creator?.display_name || post.creator?.username || 'Unknown User'}
        </Text>
        {post.caption && <Text style={styles.caption} numberOfLines={2}>{post.caption}</Text>}
        {post.content && !post.caption && (
          <Text style={styles.caption} numberOfLines={2}>{post.content}</Text>
        )}
        {post.hashtags && post.hashtags.length > 0 && (
          <Text style={styles.hashtags}>
            {post.hashtags.map((tag) => `#${tag}`).join(' ')}
          </Text>
        )}
        <Text style={styles.viewCount}>{formatCount(post.views_count)} views</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: width,
    height: width * 1.6,
    backgroundColor: '#000',
    position: 'relative',
  },
  mediaContainer: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  mediaImage: {
    width: '100%',
    height: '100%',
  },
  videoPlaceholder: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  playOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  durationText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  noMediaPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  noMediaText: {
    color: '#666',
    marginTop: 8,
    fontSize: 14,
  },
  actionsContainer: {
    position: 'absolute',
    right: 12,
    bottom: 120,
    alignItems: 'center',
    gap: 16,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'white',
  },
  followButton: {
    position: 'absolute',
    bottom: -8,
    backgroundColor: '#FF2D55',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'black',
  },
  actionButton: {
    alignItems: 'center',
    gap: 4,
  },
  actionCount: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  infoContainer: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 80,
  },
  creatorName: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  caption: {
    color: 'white',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  hashtags: {
    color: '#4A9EFF',
    fontSize: 13,
    marginBottom: 4,
  },
  viewCount: {
    color: '#999',
    fontSize: 12,
  },
});
