import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Animated,
  ActivityIndicator,
  Platform,
  Pressable,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

interface Creator {
  user_id: string;
  full_name: string | null;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  verified: boolean | null;
}

interface StreetPost {
  id: string;
  creator_id: string;
  title: string;
  content: string;
  media_type: 'image' | 'video' | 'audio' | 'text';
  media_url: string | null;
  thumbnail_url: string | null;
  video_thumbnail_url: string | null;
  hashtags: string[] | null;
  location: string | null;
  music_title: string | null;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  views_count: number;
  saves_count: number;
  caption: string | null;
  created_at: string;
  creator?: Creator;
}

interface FeedCardProps {
  post: StreetPost;
  isVisible: boolean;
  onLike?: (postId: string) => void;
  onComment?: (postId: string) => void;
  onShare?: (postId: string) => void;
  onSave?: (postId: string) => void;
}

export default function FeedCard({
  post,
  isVisible,
  onLike,
  onComment,
  onShare,
  onSave,
}: FeedCardProps) {
  const router = useRouter();
  const videoRef = useRef<Video>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showHeartAnimation, setShowHeartAnimation] = useState(false);
  const heartScale = useRef(new Animated.Value(0)).current;
  const heartOpacity = useRef(new Animated.Value(0)).current;

  // Auto-play/pause based on visibility
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (post.media_type === 'video' && isVisible) {
      video.playAsync().catch(() => {});
      setIsPlaying(true);
    } else {
      video.pauseAsync?.().catch(() => {});
      setIsPlaying(false);
    }
  }, [isVisible, post.media_type]);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video || post.media_type !== 'video') return;

    if (isPlaying) {
      video.pauseAsync().catch(() => {});
      setIsPlaying(false);
    } else {
      video.playAsync().catch(() => {});
      setIsPlaying(true);
    }
  }, [isPlaying, post.media_type]);

  const handleDoubleTap = useCallback(() => {
    if (!isLiked) {
      setIsLiked(true);
      onLike?.(post.id);
      heartScale.setValue(0);
      heartOpacity.setValue(1);
      Animated.sequence([
        Animated.timing(heartScale, {
          toValue: 1.5,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(heartOpacity, {
          toValue: 0,
          duration: 300,
          delay: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
    setShowHeartAnimation(true);
    setTimeout(() => setShowHeartAnimation(false), 600);
  }, [isLiked, post.id, onLike, heartScale, heartOpacity]);

  const handleLike = useCallback(() => {
    setIsLiked(!isLiked);
    onLike?.(post.id);
  }, [isLiked, post.id, onLike]);

  const handleSave = useCallback(() => {
    setIsSaved(!isSaved);
    onSave?.(post.id);
  }, [isSaved, post.id, onSave]);

  const getThumbnailUrl = (): string | null => {
    if (post.media_type === 'image') return post.media_url;
    return post.video_thumbnail_url || post.thumbnail_url || post.media_url;
  };

  const getDisplayName = (): string => {
    const c = post.creator;
    if (!c) return 'MTAA User';
    return c.display_name?.trim() || c.full_name?.trim() || c.username?.trim() || 'MTAA User';
  };

  const getUsername = (): string => {
    return post.creator?.username ? `@${post.creator.username}` : '@user';
  };

  // NULL-SAFE count formatter
  const formatCount = (n: number | null | undefined): string => {
    const num = n ?? 0;
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  // Text post — styled card (not black void)
  if (post.media_type === 'text' || (!post.media_url && post.content)) {
    return (
      <View style={[styles.container, styles.textContainer]}>
        <LinearGradient
          colors={getGradientColors(post.id)}
          style={styles.textGradient}
        >
          <View style={styles.textContentWrapper}>
            <Text style={styles.textPostContent}>{post.content}</Text>
            {post.caption && (
              <Text style={styles.textPostCaption}>{post.caption}</Text>
            )}
          </View>
        </LinearGradient>

        {/* Bottom info overlay */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.bottomGradient}
        >
          <TouchableOpacity
            style={styles.creatorRow}
            onPress={() => router.push(`/streets/creator/${post.creator_id}` as any)}
          >
            {post.creator?.avatar_url ? (
              <Image source={{ uri: post.creator.avatar_url }} style={styles.avatarSmall} />
            ) : (
              <View style={[styles.avatarSmall, styles.avatarFallback]}>
                <Ionicons name="person" size={16} color="#fff" />
              </View>
            )}
            <View style={styles.creatorInfo}>
              <Text style={styles.creatorName}>{getDisplayName()}</Text>
              <Text style={styles.creatorUsername}>{getUsername()}</Text>
            </View>
            {post.creator?.verified && (
              <Ionicons name="checkmark-circle" size={14} color="#00d4ff" />
            )}
          </TouchableOpacity>

          {post.content && post.media_type !== 'text' && (
            <Text style={styles.captionText} numberOfLines={3}>
              {post.content}
            </Text>
          )}

          {post.hashtags && post.hashtags.length > 0 && (
            <Text style={styles.hashtagsText}>
              {post.hashtags.map((h) => `#${h}`).join(' ')}
            </Text>
          )}

          {post.music_title && (
            <View style={styles.musicRow}>
              <Ionicons name="musical-notes" size={12} color="#fff" />
              <Text style={styles.musicText} numberOfLines={1}>
                {post.music_title}
              </Text>
            </View>
          )}
        </LinearGradient>

        {/* Right side actions */}
        <View style={styles.actionsColumn}>
          <ActionButton
            icon={isLiked ? 'heart' : 'heart-outline'}
            color={isLiked ? '#ff2d55' : '#fff'}
            count={post.likes_count}
            onPress={handleLike}
          />
          <ActionButton
            icon="chatbubble-outline"
            color="#fff"
            count={post.comments_count}
            onPress={() => onComment?.(post.id)}
          />
          <ActionButton
            icon="bookmark-outline"
            color={isSaved ? '#ffd700' : '#fff'}
            count={post.saves_count}
            onPress={handleSave}
          />
          <ActionButton
            icon="arrow-redo-outline"
            color="#fff"
            count={post.shares_count}
            onPress={() => onShare?.(post.id)}
          />
        </View>
      </View>
    );
  }

  // Image post
  if (post.media_type === 'image') {
    return (
      <View style={styles.container}>
        <Image
          source={{ uri: post.media_url || '' }}
          style={styles.media}
          resizeMode="cover"
        />

        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)']}
          style={styles.bottomGradient}
        >
          <TouchableOpacity
            style={styles.creatorRow}
            onPress={() => router.push(`/streets/creator/${post.creator_id}` as any)}
          >
            {post.creator?.avatar_url ? (
              <Image source={{ uri: post.creator.avatar_url }} style={styles.avatarSmall} />
            ) : (
              <View style={[styles.avatarSmall, styles.avatarFallback]}>
                <Ionicons name="person" size={16} color="#fff" />
              </View>
            )}
            <View style={styles.creatorInfo}>
              <Text style={styles.creatorName}>{getDisplayName()}</Text>
              <Text style={styles.creatorUsername}>{getUsername()}</Text>
            </View>
            {post.creator?.verified && (
              <Ionicons name="checkmark-circle" size={14} color="#00d4ff" />
            )}
          </TouchableOpacity>

          {post.caption && (
            <Text style={styles.captionText} numberOfLines={3}>
              {post.caption}
            </Text>
          )}

          {post.hashtags && post.hashtags.length > 0 && (
            <Text style={styles.hashtagsText}>
              {post.hashtags.map((h) => `#${h}`).join(' ')}
            </Text>
          )}
        </LinearGradient>

        <View style={styles.actionsColumn}>
          <ActionButton
            icon={isLiked ? 'heart' : 'heart-outline'}
            color={isLiked ? '#ff2d55' : '#fff'}
            count={post.likes_count}
            onPress={handleLike}
          />
          <ActionButton
            icon="chatbubble-outline"
            color="#fff"
            count={post.comments_count}
            onPress={() => onComment?.(post.id)}
          />
          <ActionButton
            icon="bookmark-outline"
            color={isSaved ? '#ffd700' : '#fff'}
            count={post.saves_count}
            onPress={handleSave}
          />
          <ActionButton
            icon="arrow-redo-outline"
            color="#fff"
            count={post.shares_count}
            onPress={() => onShare?.(post.id)}
          />
        </View>
      </View>
    );
  }

  // Video post — TikTok style
  return (
    <Pressable style={styles.container} onPress={togglePlay}>
      <Video
        ref={videoRef}
        source={{ uri: post.media_url || '' }}
        style={styles.media}
        resizeMode={ResizeMode.COVER}
        isLooping
        shouldPlay={isVisible && isPlaying}
        isMuted={false}
        onLoadStart={() => setIsLoading(true)}
        onLoad={() => setIsLoading(false)}
        onError={() => setIsLoading(false)}
      />

      {isLoading && (
        <View style={styles.loadingOverlay}>
          {getThumbnailUrl() ? (
            <Image
              source={{ uri: getThumbnailUrl()! }}
              style={styles.media}
              resizeMode="cover"
              blurRadius={10}
            />
          ) : (
            <View style={[styles.media, { backgroundColor: '#1a1a2e' }]} />
          )}
          <ActivityIndicator size="large" color="#fff" style={styles.loader} />
        </View>
      )}

      {!isPlaying && !isLoading && (
        <View style={styles.playPauseOverlay}>
          <Ionicons name="play-circle" size={64} color="rgba(255,255,255,0.9)" />
        </View>
      )}

      {showHeartAnimation && (
        <Animated.View
          style={[
            styles.heartAnimation,
            {
              transform: [{ scale: heartScale }],
              opacity: heartOpacity,
            },
          ]}
        >
          <Ionicons name="heart" size={120} color="#ff2d55" />
        </Animated.View>
      )}

      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.8)']}
        style={styles.bottomGradient}
      >
        <TouchableOpacity
          style={styles.creatorRow}
          onPress={() => router.push(`/streets/creator/${post.creator_id}` as any)}
        >
          {post.creator?.avatar_url ? (
            <Image source={{ uri: post.creator.avatar_url }} style={styles.avatarSmall} />
          ) : (
            <View style={[styles.avatarSmall, styles.avatarFallback]}>
              <Ionicons name="person" size={16} color="#fff" />
            </View>
          )}
          <View style={styles.creatorInfo}>
            <Text style={styles.creatorName}>{getDisplayName()}</Text>
            <Text style={styles.creatorUsername}>{getUsername()}</Text>
          </View>
          {post.creator?.verified && (
            <Ionicons name="checkmark-circle" size={14} color="#00d4ff" />
          )}
        </TouchableOpacity>

        {post.caption && (
          <Text style={styles.captionText} numberOfLines={3}>
            {post.caption}
          </Text>
        )}

        {post.content && !post.caption && (
          <Text style={styles.captionText} numberOfLines={3}>
            {post.content}
          </Text>
        )}

        {post.hashtags && post.hashtags.length > 0 && (
          <Text style={styles.hashtagsText}>
            {post.hashtags.map((h) => `#${h}`).join(' ')}
          </Text>
        )}

        {post.music_title && (
          <View style={styles.musicRow}>
            <Ionicons name="musical-notes" size={12} color="#fff" />
            <Text style={styles.musicText} numberOfLines={1}>
              {post.music_title}
            </Text>
          </View>
        )}

        {post.location && (
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={12} color="#fff" />
            <Text style={styles.locationText}>{post.location}</Text>
          </View>
        )}
      </LinearGradient>

      <View style={styles.actionsColumn}>
        <TouchableOpacity
          style={styles.actionAvatarBtn}
          onPress={() => router.push(`/streets/creator/${post.creator_id}` as any)}
        >
          {post.creator?.avatar_url ? (
            <Image source={{ uri: post.creator.avatar_url }} style={styles.actionAvatar} />
          ) : (
            <View style={[styles.actionAvatar, styles.avatarFallback]}>
              <Ionicons name="person" size={20} color="#fff" />
            </View>
          )}
          <View style={styles.followBadge}>
            <Ionicons name="add" size={10} color="#fff" />
          </View>
        </TouchableOpacity>

        <ActionButton
          icon={isLiked ? 'heart' : 'heart-outline'}
          color={isLiked ? '#ff2d55' : '#fff'}
          count={post.likes_count}
          onPress={handleLike}
          large
        />
        <ActionButton
          icon="chatbubble-outline"
          color="#fff"
          count={post.comments_count}
          onPress={() => onComment?.(post.id)}
          large
        />
        <ActionButton
          icon="bookmark-outline"
          color={isSaved ? '#ffd700' : '#fff'}
          count={post.saves_count}
          onPress={handleSave}
          large
        />
        <ActionButton
          icon="arrow-redo-outline"
          color="#fff"
          count={post.shares_count}
          onPress={() => onShare?.(post.id)}
          large
        />
      </View>
    </Pressable>
  );
}

// Action button component — NULL-SAFE
function ActionButton({
  icon,
  color,
  count,
  onPress,
  large = false,
}: {
  icon: string;
  color: string;
  count: number | null | undefined;
  onPress: () => void;
  large?: boolean;
}) {
  const safeCount = count ?? 0;
  const display = safeCount >= 1000 ? `${(safeCount / 1000).toFixed(1)}K` : safeCount.toString();
  return (
    <TouchableOpacity style={styles.actionBtn} onPress={onPress} activeOpacity={0.7}>
      <Ionicons name={icon as any} size={large ? 32 : 28} color={color} />
      <Text style={[styles.actionCount, large && styles.actionCountLarge]}>
        {display}
      </Text>
    </TouchableOpacity>
  );
}

function getGradientColors(postId: string): [string, string] {
  const gradients: [string, string][] = [
    ['#667eea', '#764ba2'],
    ['#f093fb', '#f5576c'],
    ['#4facfe', '#00f2fe'],
    ['#43e97b', '#38f9d7'],
    ['#fa709a', '#fee140'],
    ['#30cfd0', '#330867'],
    ['#a8edea', '#fed6e3'],
    ['#ff9a9e', '#fecfef'],
    ['#fbc2eb', '#a6c1ee'],
    ['#fdcbf1', '#e6dee9'],
  ];
  let hash = 0;
  for (let i = 0; i < postId.length; i++) {
    hash = postId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % gradients.length;
  return gradients[index];
}

const styles = StyleSheet.create({
  container: {
    width: SCREEN_W,
    height: SCREEN_H,
    backgroundColor: '#000',
    position: 'relative',
    overflow: 'hidden',
  },
  media: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  textContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  textGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  textContentWrapper: {
    alignItems: 'center',
  },
  textPostContent: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 34,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  textPostCaption: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 24,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  loader: {
    zIndex: 6,
  },
  playPauseOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 4,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  heartAnimation: {
    position: 'absolute',
    top: SCREEN_H / 2 - 60,
    left: SCREEN_W / 2 - 60,
    zIndex: 10,
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    paddingTop: 80,
    zIndex: 3,
  },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatarSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#fff',
  },
  avatarFallback: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  creatorInfo: {
    marginLeft: 10,
    flex: 1,
  },
  creatorName: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  creatorUsername: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },
  captionText: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 6,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  hashtagsText: {
    color: '#00d4ff',
    fontSize: 13,
    marginBottom: 6,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  musicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  musicText: {
    color: '#fff',
    fontSize: 12,
    marginLeft: 6,
    flex: 1,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  locationText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginLeft: 4,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  actionsColumn: {
    position: 'absolute',
    right: 8,
    bottom: Platform.OS === 'ios' ? 100 : 80,
    alignItems: 'center',
    zIndex: 4,
    gap: 16,
  },
  actionAvatarBtn: {
    alignItems: 'center',
    marginBottom: 8,
  },
  actionAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#fff',
  },
  followBadge: {
    position: 'absolute',
    bottom: -8,
    backgroundColor: '#ff2d55',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000',
  },
  actionBtn: {
    alignItems: 'center',
    gap: 2,
  },
  actionCount: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  actionCountLarge: {
    fontSize: 12,
  },
});
