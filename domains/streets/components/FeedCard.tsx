import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Share as RNShare,
  Pressable,
  Platform,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, Volume2, VolumeX } from 'lucide-react-native';
import { StreetPostWithAuthor } from '@/lib/services/streets-service';
import { toggleLike, toggleSave, recordShare, isLiked } from '@/lib/services/streets-service';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

interface FeedCardProps {
  post: StreetPostWithAuthor;
  isVisible: boolean;
  onRefresh?: () => void;
}

// Web-safe video component
function VideoPlayer({ uri, isPlaying, isMuted, onToggleMute }: { 
  uri: string; 
  isPlaying: boolean; 
  isMuted: boolean;
  onToggleMute: () => void;
}) {
  const videoRef = useRef<any>(null);

  useEffect(() => {
    if (Platform.OS === 'web' && videoRef.current) {
      if (isPlaying) {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying]);

  if (Platform.OS === 'web') {
    return (
      <View style={styles.videoContainer}>
        <video
          ref={videoRef}
          src={uri}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          loop
          muted={isMuted}
          playsInline
          autoPlay={isPlaying}
        />
        <TouchableOpacity style={styles.muteButton} onPress={onToggleMute}>
          {isMuted ? <VolumeX size={20} color="#fff" /> : <Volume2 size={20} color="#fff" />}
        </TouchableOpacity>
      </View>
    );
  }

  // Native
  const { Video } = require('expo-av');
  return (
    <View style={styles.videoContainer}>
      <Video
        source={{ uri }}
        style={styles.fullMedia}
        resizeMode="cover"
        isLooping
        shouldPlay={isPlaying}
        isMuted={isMuted}
        useNativeControls={false}
      />
      <TouchableOpacity style={styles.muteButton} onPress={onToggleMute}>
        {isMuted ? <VolumeX size={20} color="#fff" /> : <Volume2 size={20} color="#fff" />}
      </TouchableOpacity>
    </View>
  );
}

export default function FeedCard({ post, isVisible, onRefresh }: FeedCardProps) {
  const router = useRouter();
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes_count || 0);
  const [commentCount] = useState(post.comments_count || 0);
  const [shareCount] = useState(post.shares_count || 0);
  const [saveCount] = useState(post.saves_count || 0);
  const [isMuted, setIsMuted] = useState(true);
  const [showHeart, setShowHeart] = useState(false);
  const heartAnim = useRef(new Animated.Value(0)).current;

  // Check initial like state
  useEffect(() => {
    isLiked(post.id).then(setLiked).catch(() => {});
  }, [post.id]);

  const authorName = post.creator?.display_name || 'User';
  const avatarUrl = post.creator?.avatar_url;
  const postId = post.id;

  const isVideo = post.media_type === 'video' || (post.media_url && post.media_url.match(/\.(mp4|mov|avi|webm)$/i));
  const hasMedia = !!post.media_url;

  const handleLike = useCallback(async () => {
    try {
      const newLiked = await toggleLike(postId);
      setLiked(newLiked);
      setLikeCount(prev => newLiked ? prev + 1 : Math.max(0, prev - 1));
    } catch (err) {
      console.error('Like error:', err);
    }
  }, [postId]);

  const handleDoubleTap = useCallback(() => {
    setShowHeart(true);
    Animated.sequence([
      Animated.timing(heartAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(heartAnim, { toValue: 0, duration: 300, delay: 400, useNativeDriver: true }),
    ]).start(() => setShowHeart(false));
    if (!liked) handleLike();
  }, [liked, handleLike, heartAnim]);

  const handleComment = useCallback(() => {
    if (!postId) return;
    router.push({ pathname: '/streets/comments/[id]', params: { id: postId } });
  }, [router, postId]);

  const handleShare = useCallback(async () => {
    try {
      await recordShare(postId);
      await RNShare.share({
        message: `Check out this post on MTAA Streets: ${post.caption || post.content || ''}`,
        url: post.media_url || undefined,
      });
    } catch (err) {
      console.error('Share error:', err);
    }
  }, [postId, post.caption, post.content, post.media_url]);

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
    router.push({ pathname: '/streets/profile/[id]', params: { id: post.creator_id } });
  }, [router, post.creator_id]);

  const heartScale = heartAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1.5] });
  const heartOpacity = heartAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 1, 0] });

  return (
    <View style={styles.container}>
      {/* Full Screen Media */}
      <Pressable style={styles.mediaWrapper} onPress={handleDoubleTap}>
        {hasMedia ? (
          isVideo ? (
            <VideoPlayer
              uri={post.media_url!}
              isPlaying={isVisible}
              isMuted={isMuted}
              onToggleMute={() => setIsMuted(!isMuted)}
            />
          ) : (
            <Image
              source={{ uri: post.media_url! }}
              style={styles.fullMedia}
              resizeMode="cover"
            />
          )
        ) : (
          <View style={[styles.fullMedia, styles.noMedia]}>
            <Text style={styles.noMediaText}>📄</Text>
          </View>
        )}

        {/* Double-tap heart animation */}
        {showHeart && (
          <Animated.View style={[styles.heartOverlay, { opacity: heartOpacity, transform: [{ scale: heartScale }] }]}>
            <Heart size={120} color="#FF2D55" fill="#FF2D55" />
          </Animated.View>
        )}
      </Pressable>

      {/* Gradient overlay for text readability */}
      <View style={styles.gradientOverlay} pointerEvents="none" />

      {/* Bottom-left: Author info + Caption */}
      <View style={styles.bottomLeft} pointerEvents="box-none">
        <TouchableOpacity style={styles.authorRow} onPress={handleProfile}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarFallbackText}>{authorName.charAt(0).toUpperCase()}</Text>
            </View>
          )}
          <Text style={styles.authorName}>{authorName}</Text>
          <View style={styles.followBadge}>
            <Text style={styles.followText}>Follow</Text>
          </View>
        </TouchableOpacity>

        <Text style={styles.caption} numberOfLines={3}>
          {post.caption || post.content || ''}
        </Text>

        <Text style={styles.musicRow}>
          🎵 Original Sound — {authorName}
        </Text>
      </View>

      {/* Right side: Action buttons */}
      <View style={styles.rightActions} pointerEvents="box-none">
        <TouchableOpacity style={styles.actionBtn} onPress={handleProfile}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.actionAvatar} />
          ) : (
            <View style={[styles.actionAvatar, styles.actionAvatarFallback]}>
              <Text style={styles.actionAvatarText}>{authorName.charAt(0)}</Text>
            </View>
          )}
          <View style={styles.plusBadge}>
            <Text style={styles.plusText}>+</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={handleLike}>
          <Heart size={32} color={liked ? '#FF2D55' : '#fff'} fill={liked ? '#FF2D55' : 'none'} />
          <Text style={styles.actionCount}>{likeCount > 0 ? String(likeCount) : 'Like'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={handleComment}>
          <MessageCircle size={32} color="#fff" />
          <Text style={styles.actionCount}>{commentCount > 0 ? String(commentCount) : 'Comment'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={handleSave}>
          <Bookmark size={32} color={saved ? '#FFD700' : '#fff'} fill={saved ? '#FFD700' : 'none'} />
          <Text style={styles.actionCount}>{saveCount > 0 ? String(saveCount) : 'Save'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
          <Share2 size={32} color="#fff" />
          <Text style={styles.actionCount}>{shareCount > 0 ? String(shareCount) : 'Share'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn}>
          <MoreHorizontal size={28} color="#fff" />
        </TouchableOpacity>

        {/* Spinning disc at bottom */}
        <View style={styles.disc}>
          <View style={styles.discInner}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.discImage} />
            ) : (
              <View style={[styles.discImage, styles.discFallback]}>
                <Text style={styles.discText}>{authorName.charAt(0)}</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: SCREEN_W,
    height: SCREEN_H,
    backgroundColor: '#000',
  },
  mediaWrapper: {
    ...StyleSheet.absoluteFillObject,
  },
  fullMedia: {
    width: '100%',
    height: '100%',
  },
  videoContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  noMedia: {
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noMediaText: {
    fontSize: 64,
  },
  muteButton: {
    position: 'absolute',
    bottom: 120,
    right: 80,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heartOverlay: {
    position: 'absolute',
    top: '40%',
    left: '35%',
    zIndex: 10,
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  bottomLeft: {
    position: 'absolute',
    bottom: 20,
    left: 12,
    right: 90,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 8,
  },
  avatarFallback: {
    backgroundColor: '#FF2D55',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarFallbackText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  authorName: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  followBadge: {
    marginLeft: 8,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 4,
    backgroundColor: '#FF2D55',
  },
  followText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  caption: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  musicRow: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.9,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  rightActions: {
    position: 'absolute',
    right: 8,
    bottom: 20,
    alignItems: 'center',
    width: 64,
  },
  actionBtn: {
    alignItems: 'center',
    marginBottom: 16,
  },
  actionAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#fff',
  },
  actionAvatarFallback: {
    backgroundColor: '#FF2D55',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionAvatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  plusBadge: {
    position: 'absolute',
    bottom: -6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FF2D55',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#000',
  },
  plusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    lineHeight: 16,
  },
  actionCount: {
    color: '#fff',
    fontSize: 11,
    marginTop: 3,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  disc: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#222',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  discInner: {
    width: 28,
    height: 28,
    borderRadius: 14,
    overflow: 'hidden',
  },
  discImage: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  discFallback: {
    backgroundColor: '#FF2D55',
    justifyContent: 'center',
    alignItems: 'center',
  },
  discText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
