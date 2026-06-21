import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Share as RNShare,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Video } from 'expo-av';
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal } from 'lucide-react-native';
import { StreetPostWithAuthor } from '@/lib/services/streets-service';
import { toggleLike, toggleSave, recordShare, isLiked } from '@/lib/services/streets-service';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface FeedCardProps {
  post: StreetPostWithAuthor;
  onRefresh?: () => void;
}

export default function FeedCard({ post, onRefresh }: FeedCardProps) {
  const router = useRouter();
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes_count || 0);
  const [commentCount] = useState(post.comments_count || 0);
  const [shareCount] = useState(post.shares_count || 0);
  const [saveCount] = useState(post.saves_count || 0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  // Check initial like state
  React.useEffect(() => {
    isLiked(post.id).then(setLiked).catch(() => {});
  }, [post.id]);

  const authorName = post.author?.display_name || 'User';
  const avatarUrl = post.author?.avatar_url;
  const postId = post.id;

  const handleLike = useCallback(async () => {
    try {
      const newLiked = await toggleLike(postId);
      setLiked(newLiked);
      setLikeCount(prev => newLiked ? prev + 1 : Math.max(0, prev - 1));
    } catch (err) {
      console.error('Like error:', err);
    }
  }, [postId]);

  const handleComment = useCallback(() => {
    if (!postId) return;
    router.push({
      pathname: '/streets/comments/[id]',
      params: { id: postId },
    });
  }, [router, postId]);

  const handleShare = useCallback(async () => {
    try {
      await recordShare(postId);
      await RNShare.share({
        message: `Check out this post on MTAA Streets: ${post.caption || ''}`,
        url: post.media_url || undefined,
      });
    } catch (err) {
      console.error('Share error:', err);
    }
  }, [postId, post.caption, post.media_url]);

  const handleSave = useCallback(async () => {
    try {
      const newSaved = await toggleSave(postId);
      setSaved(newSaved);
    } catch (err) {
      console.error('Save error:', err);
    }
  }, [postId]);

  const handleProfile = useCallback(() => {
    if (!post.creator_id) return;
    router.push({
      pathname: '/streets/profile/[id]',
      params: { id: post.creator_id },
    });
  }, [router, post.creator_id]);

  const isVideo = post.media_type === 'video' || (post.media_url && post.media_url.match(/\.(mp4|mov|avi|webm)$/i));
  const hasMedia = !!post.media_url;

  return (
    <View style={styles.container}>
      {/* Author Header */}
      <TouchableOpacity style={styles.header} onPress={handleProfile}>
        <View style={styles.avatarContainer}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarFallbackText}>
                {authorName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.authorName}>{authorName}</Text>
          <Text style={styles.timestamp}>
            {post.created_at ? new Date(post.created_at).toLocaleDateString() : ''}
          </Text>
        </View>
        <TouchableOpacity style={styles.moreButton}>
          <MoreHorizontal size={20} color="#666" />
        </TouchableOpacity>
      </TouchableOpacity>

      {/* Media Content */}
      {hasMedia && (
        <Pressable
          style={styles.mediaContainer}
          onPress={() => isVideo && setIsVideoPlaying(!isVideoPlaying)}
        >
          {isVideo ? (
            <Video
              source={{ uri: post.media_url! }}
              style={styles.media}
              resizeMode="cover"
              isLooping
              shouldPlay={isVideoPlaying}
              isMuted={!isVideoPlaying}
              useNativeControls={isVideoPlaying}
            />
          ) : (
            <Image
              source={{ uri: post.media_url! }}
              style={styles.media}
              resizeMode="cover"
            />
          )}
          {!isVideoPlaying && isVideo && (
            <View style={styles.playOverlay}>
              <View style={styles.playButton}>
                <Text style={styles.playText}>▶</Text>
              </View>
            </View>
          )}
        </Pressable>
      )}

      {/* Caption */}
      {(post.caption || post.content) && (
        <View style={styles.captionContainer}>
          <Text style={styles.caption}>
            <Text style={styles.captionAuthor}>{authorName} </Text>
            {post.caption || post.content}
          </Text>
        </View>
      )}

      {/* Action Bar */}
      <View style={styles.actionBar}>
        <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
          <Heart
            size={24}
            color={liked ? '#FF2D55' : '#333'}
            fill={liked ? '#FF2D55' : 'none'}
          />
          <Text style={[styles.actionCount, liked && styles.actionCountActive]}>
            {likeCount > 0 ? likeCount : 'Like'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleComment}>
          <MessageCircle size={24} color="#333" />
          <Text style={styles.actionCount}>
            {commentCount > 0 ? commentCount : 'Comment'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
          <Share2 size={24} color="#333" />
          <Text style={styles.actionCount}>
            {shareCount > 0 ? shareCount : 'Share'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleSave}>
          <Bookmark
            size={24}
            color={saved ? '#007AFF' : '#333'}
            fill={saved ? '#007AFF' : 'none'}
          />
          <Text style={[styles.actionCount, saved && styles.actionCountActive]}>
            {saveCount > 0 ? saveCount : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    marginBottom: 8,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  avatarContainer: {
    marginRight: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarFallback: {
    backgroundColor: '#FF2D55',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarFallbackText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  moreButton: {
    padding: 4,
  },
  mediaContainer: {
    width: SCREEN_WIDTH - 24,
    height: SCREEN_WIDTH - 24,
    alignSelf: 'center',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  media: {
    width: '100%',
    height: '100%',
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playText: {
    fontSize: 24,
    color: '#333',
    marginLeft: 4,
  },
  captionContainer: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  caption: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333',
  },
  captionAuthor: {
    fontWeight: '600',
  },
  actionBar: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  actionCount: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  actionCountActive: {
    color: '#FF2D55',
    fontWeight: '600',
  },
});
