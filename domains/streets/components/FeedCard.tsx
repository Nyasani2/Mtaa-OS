import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Pressable,
  Animated,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, Volume2, VolumeX } from 'lucide-react-native';
import type { StreetPostWithAuthor } from '@/lib/services/streets-service';
import { toggleLike, toggleSave, recordShare } from '@/lib/services/streets-service';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

interface FeedCardProps {
  post: StreetPostWithAuthor;
  isVisible: boolean;
}

/* ─── Generate a deterministic gradient from post ID ─── */
function getPostColor(id: string): string {
  const colors = [
    '#1a1a2e', '#16213e', '#0f3460', '#533483',
    '#1a1a40', '#312c51', '#48426d', '#5c4d7d',
    '#0d1b2a', '#1b263b', '#415a77', '#778da9',
    '#240046', '#3c096c', '#5a189a', '#7b2cbf',
    '#10002b', '#240046', '#3c096c', '#5a189a',
  ];
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

/* ─── Web Video Player ─── */
function VideoPlayer({ uri, isVisible }: { uri: string; isVisible: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web' && videoRef.current) {
      if (isVisible) {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
      }
    }
  }, [isVisible]);

  if (hasError) {
    return <MediaFallback content="" />;
  }

  if (Platform.OS === 'web') {
    return (
      <View style={styles.fullMedia}>
        <video
          ref={videoRef}
          src={uri}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          muted={isMuted}
          loop
          playsInline
          onError={() => setHasError(true)}
        />
        <TouchableOpacity style={styles.muteBtn} onPress={() => setIsMuted((m) => !m)}>
          {isMuted ? <VolumeX size={20} color="#fff" /> : <Volume2 size={20} color="#fff" />}
        </TouchableOpacity>
      </View>
    );
  }

  const { Video } = require('expo-av');
  return (
    <Video
      source={{ uri }}
      style={styles.fullMedia}
      resizeMode="cover"
      isLooping
      shouldPlay={isVisible}
      isMuted={isMuted}
    />
  );
}

/* ─── Media Fallback (when image/video fails) ─── */
function MediaFallback({ content, postId }: { content?: string; postId?: string }) {
  const bgColor = postId ? getPostColor(postId) : '#1a1a2e';

  return (
    <View style={[styles.fullMedia, styles.fallbackBg, { backgroundColor: bgColor }]}>
      <View style={styles.fallbackPattern}>
        <Text style={styles.fallbackEmoji}>🎨</Text>
        <Text style={styles.fallbackLabel}>MTAA Content</Text>
        {content ? (
          <Text style={styles.fallbackText} numberOfLines={6}>{content}</Text>
        ) : (
          <Text style={styles.fallbackSub}>Visual content unavailable</Text>
        )}
      </View>
    </View>
  );
}

/* ─── Web Image - loads without CORS, falls back gracefully ─── */
function WebImage({ uri, content, postId }: { 
  uri: string; 
  content?: string;
  postId?: string;
}) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    console.log('[WebImage] Loading:', uri.substring(0, 70));

    // Create image WITHOUT crossOrigin to avoid CORS preflight issues
    const img = new window.Image();
    // Note: NOT setting crossOrigin - let browser handle it naturally

    img.onload = () => {
      console.log('[WebImage] Loaded:', uri.substring(0, 50));
      setLoaded(true);
    };

    img.onerror = () => {
      console.error('[WebImage] Failed:', uri.substring(0, 50));
      setError(true);
    };

    img.src = uri;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [uri]);

  if (error) {
    return <MediaFallback content={content} postId={postId} />;
  }

  return (
    <View style={styles.fullMedia}>
      {!loaded && <MediaFallback content={content} postId={postId} />}
      <img
        src={uri}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: loaded ? 'block' : 'none',
          position: 'absolute',
          top: 0,
          left: 0,
        }}
        alt=""
        // No crossOrigin - prevents CORS issues
      />
    </View>
  );
}

/* ─── Main FeedCard ─── */
export default function FeedCard({ post, isVisible }: FeedCardProps) {
  const router = useRouter();
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes_count || 0);
  const [saveCount, setSaveCount] = useState(post.saves_count || 0);
  const [shareCount] = useState(post.shares_count || 0);
  const [commentCount] = useState(post.comments_count || 0);
  const [showHeart, setShowHeart] = useState(false);
  const heartAnim = useRef(new Animated.Value(0)).current;

  const creator = post.creator;
  const authorName = creator?.display_name || 'User';
  const avatarUrl = creator?.avatar_url;
  const hasMedia = !!post.media_url;
  const isVideo = post.media_type === 'video' || (post.media_url?.endsWith('.mp4'));

  useEffect(() => {
    console.log('[FeedCard] Post:', {
      id: post.id?.slice(0, 8),
      author: authorName,
      hasMedia,
      isVideo,
      mediaType: post.media_type,
      url: post.media_url?.substring(0, 60),
    });
  }, [post.id]);

  const triggerHeart = useCallback(() => {
    setShowHeart(true);
    heartAnim.setValue(0);
    Animated.sequence([
      Animated.timing(heartAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(heartAnim, { toValue: 0, duration: 300, delay: 400, useNativeDriver: true }),
    ]).start(() => setShowHeart(false));
  }, [heartAnim]);

  const handleLike = useCallback(async () => {
    try {
      const result = await toggleLike(post.id);
      setLiked(result);
      setLikeCount((c) => (result ? c + 1 : Math.max(0, c - 1)));
    } catch (err) {
      console.error('[FeedCard] Like error:', err);
    }
  }, [post.id]);

  const handleDoubleTap = useCallback(() => {
    triggerHeart();
    if (!liked) handleLike();
  }, [liked, handleLike, triggerHeart]);

  const handleSave = useCallback(async () => {
    try {
      const result = await toggleSave(post.id);
      setSaved(result);
      setSaveCount((c) => (result ? c + 1 : Math.max(0, c - 1)));
    } catch (err) {
      console.error('[FeedCard] Save error:', err);
    }
  }, [post.id]);

  const handleShare = useCallback(async () => {
    try {
      await recordShare(post.id);
    } catch (err) {
      console.error('[FeedCard] Share error:', err);
    }
  }, [post.id]);

  const handleComment = useCallback(() => {
    router.push(`/streets/comments/${post.id}`);
  }, [router, post.id]);

  const handleProfile = useCallback(() => {
    if (post.creator_id) {
      router.push(`/streets/profile/${post.creator_id}`);
    }
  }, [router, post.creator_id]);

  return (
    <View style={styles.container}>
      {/* Media Layer */}
      <Pressable style={styles.mediaWrapper} onPress={handleDoubleTap}>
        {hasMedia ? (
          isVideo ? (
            <VideoPlayer uri={post.media_url!} isVisible={isVisible} />
          ) : Platform.OS === 'web' ? (
            <WebImage uri={post.media_url!} content={post.content} postId={post.id} />
          ) : (
            <Image source={{ uri: post.media_url! }} style={styles.fullMedia} resizeMode="cover" />
          )
        ) : (
          <MediaFallback content={post.content} postId={post.id} />
        )}
      </Pressable>

      {/* Bottom gradient for text readability */}
      <View style={styles.bottomGradient} pointerEvents="none" />

      {/* Bottom-left: author + caption */}
      <View style={styles.bottomLeft} pointerEvents="box-none">
        <TouchableOpacity style={styles.authorRow} onPress={handleProfile}>
          <View style={styles.avatar}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImg} />
            ) : (
              <Text style={styles.avatarLetter}>{authorName.charAt(0).toUpperCase()}</Text>
            )}
          </View>
          <Text style={styles.authorName}>{authorName}</Text>
          <View style={styles.followBadge}>
            <Text style={styles.followText}>Follow</Text>
          </View>
        </TouchableOpacity>

        {post.content ? (
          <Text style={styles.caption} numberOfLines={3}>{post.content}</Text>
        ) : null}

        <View style={styles.musicRow}>
          <Text style={styles.musicIcon}>🎵</Text>
          <Text style={styles.musicText}>Original Sound — {authorName}</Text>
        </View>
      </View>

      {/* Right-side actions */}
      <View style={styles.rightActions} pointerEvents="box-none">
        <View style={styles.profilePicWrap}>
          <View style={styles.profilePic}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.profilePicImg} />
            ) : (
              <Text style={styles.profilePicLetter}>{authorName.charAt(0).toUpperCase()}</Text>
            )}
          </View>
          <View style={styles.plusBadge}>
            <Text style={styles.plusText}>+</Text>
          </View>
        </View>

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
          <MoreHorizontal size={32} color="#fff" />
        </TouchableOpacity>

        <View style={styles.disc}>
          <View style={styles.discInner}>
            <Text style={styles.discLetter}>{authorName.charAt(0).toUpperCase()}</Text>
          </View>
        </View>
      </View>

      {/* Double-tap heart animation */}
      {showHeart && (
        <Animated.View
          style={[
            styles.heartOverlay,
            {
              opacity: heartAnim,
              transform: [
                { scale: heartAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.5, 1.5, 1] }) },
              ],
            },
          ]}
          pointerEvents="none"
        >
          <Heart size={120} color="#FF2D55" fill="#FF2D55" />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: SCREEN_W,
    height: SCREEN_H,
    backgroundColor: '#000',
    position: 'relative',
    overflow: 'hidden',
  },
  mediaWrapper: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  fullMedia: {
    width: '100%',
    height: '100%',
  },
  fallbackBg: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackPattern: {
    alignItems: 'center',
    padding: 30,
  },
  fallbackEmoji: {
    fontSize: 60,
    marginBottom: 12,
    opacity: 0.8,
  },
  fallbackLabel: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    opacity: 0.9,
    marginBottom: 16,
  },
  fallbackText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
  fallbackSub: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
  },
  bottomGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 300,
    backgroundColor: 'rgba(0,0,0,0.4)',
    zIndex: 1,
  },
  bottomLeft: {
    position: 'absolute',
    left: 12,
    bottom: 80,
    right: 80,
    zIndex: 2,
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
    backgroundColor: '#FF2D55',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  avatarImg: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  avatarLetter: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  authorName: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  followBadge: {
    backgroundColor: '#FF2D55',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  followText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  caption: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  musicRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  musicIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  musicText: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.8,
  },
  rightActions: {
    position: 'absolute',
    right: 8,
    bottom: 100,
    alignItems: 'center',
    width: 64,
    zIndex: 2,
  },
  profilePicWrap: {
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  profilePic: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fff',
  },
  profilePicImg: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  profilePicLetter: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  plusBadge: {
    position: 'absolute',
    bottom: -8,
    backgroundColor: '#FF2D55',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000',
  },
  plusText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    lineHeight: 16,
  },
  actionBtn: {
    alignItems: 'center',
    marginBottom: 12,
    width: 50,
    height: 50,
    justifyContent: 'center',
  },
  actionCount: {
    color: '#fff',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  disc: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#222',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 4,
    borderColor: '#111',
  },
  discInner: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FF2D55',
    justifyContent: 'center',
    alignItems: 'center',
  },
  discLetter: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  heartOverlay: {
    position: 'absolute',
    top: '40%',
    left: '35%',
    zIndex: 10,
  },
  muteBtn: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 8,
    zIndex: 5,
  },
});
