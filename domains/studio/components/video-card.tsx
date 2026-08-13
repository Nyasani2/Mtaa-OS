import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Image, Pressable, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Play } from 'lucide-react-native';

interface VideoCardProps {
  id: string;
  title: string;
  thumbnail_url?: string | null;
  video_url?: string | null;
  creator_name?: string;
  creator_avatar?: string;
  view_count?: number;
  duration_seconds?: number | null;
  created_at?: string;
  is_streets?: boolean;
  size?: 'compact' | 'small' | 'medium' | 'large';
}

function timeAgo(dateStr?: string): string {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  if (days > 30) return `${Math.floor(days / 30)}mo ago`;
  if (days > 0) return `${days}d ago`;
  if (hrs > 0) return `${hrs}h ago`;
  if (mins > 0) return `${mins}m ago`;
  return 'just now';
}

function formatViews(n?: number): string {
  if (!n) return '0 views';
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M views`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K views`;
  return `${n} views`;
}

function formatDuration(sec?: number | null): string {
  if (!sec) return '';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function gradientFromTitle(title: string): string {
  let hash = 0;
  for (let i = 0; i < title.length; i++) hash = title.charCodeAt(i) + ((hash << 5) - hash);
  const h = Math.abs(hash % 360);
  return `hsl(${h}, 50%, 18%)`;
}

const SIZES = {
  compact: { width: 140, height: 78, titleSize: 11, metaSize: 10, avatar: 24 },
  small: { width: 160, height: 90, titleSize: 12, metaSize: 10, avatar: 28 },
  medium: { width: 280, height: 158, titleSize: 13, metaSize: 11, avatar: 32 },
  large: { width: 320, height: 180, titleSize: 14, metaSize: 12, avatar: 36 },
};

// Web-only video thumbnail component
function VideoFrameThumbnail({ src, width, height }: { src: string; width: number; height: number }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [frameReady, setFrameReady] = useState(false);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = 0.5;
    const onLoaded = () => setFrameReady(true);
    v.addEventListener('loadeddata', onLoaded);
    return () => v.removeEventListener('loadeddata', onLoaded);
  }, [src]);

  return (
    <video
      ref={videoRef}
      src={src}
      muted
      preload="metadata"
      style={{
        width,
        height,
        objectFit: 'cover',
        borderRadius: 8,
        opacity: frameReady ? 1 : 0,
        transition: 'opacity 0.3s',
      }}
    />
  );
}

export default function VideoCard({
  id,
  title,
  thumbnail_url,
  video_url,
  creator_name,
  creator_avatar,
  view_count,
  duration_seconds,
  created_at,
  is_streets,
  size = 'medium',
}: VideoCardProps) {
  const router = useRouter();
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const handlePress = () => {
    router.push(`/(os)/studio/video-player?id=${id}` as any);
  };

  const dim = SIZES[size];
  const bg = gradientFromTitle(title || 'V');
  const initial = (title || 'V').charAt(0).toUpperCase();
  const displayName = creator_name && creator_name !== 'Unknown' ? creator_name : (creator_name || 'Unknown');

  // Determine if we can show a video frame as thumbnail
  const hasVideoUrl = !!video_url && video_url.length > 0;
  const hasThumbnail = !!thumbnail_url && thumbnail_url.length > 0 && !imgError;
  const showVideoFrame = Platform.OS === 'web' && !hasThumbnail && hasVideoUrl;
  const showFallback = !hasThumbnail && !showVideoFrame;

  return (
    <Pressable onPress={handlePress} style={[styles.card, { width: dim.width }]}>
      <View style={[styles.thumbContainer, { width: dim.width, height: dim.height, backgroundColor: bg }]}>
        {/* Real thumbnail image */}
        {hasThumbnail ? (
          <Image
            source={{ uri: thumbnail_url }}
            style={[styles.thumb, { width: dim.width, height: dim.height }]}
            resizeMode="cover"
            onError={() => setImgError(true)}
            onLoad={() => setImgLoaded(true)}
          />
        ) : null}

        {/* Video frame as thumbnail (web only) */}
        {showVideoFrame ? (
          <View style={{ position: 'absolute', top: 0, left: 0 }}>
            <VideoFrameThumbnail src={video_url!} width={dim.width} height={dim.height} />
          </View>
        ) : null}

        {/* Gradient fallback */}
        {showFallback ? (
          <View style={[styles.fallback, { width: dim.width, height: dim.height }]}>
            <Text style={[styles.fallbackText, size === 'compact' && { fontSize: 32 }]}>{initial}</Text>
            <View style={styles.playIcon}>
              <Play size={size === 'compact' ? 18 : 24} color="#fff" fill="#fff" />
            </View>
          </View>
        ) : null}

        {/* Play overlay when real thumbnail loaded */}
        {hasThumbnail && imgLoaded && (
          <View style={styles.playOverlay}>
            <Play size={size === 'compact' ? 18 : 24} color="#fff" fill="#fff" />
          </View>
        )}

        {/* Duration badge */}
        {duration_seconds ? (
          <View style={styles.durationBadge}>
            <Text style={styles.durationText}>{formatDuration(duration_seconds)}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.info}>
        <View style={styles.avatarRow}>
          {creator_avatar ? (
            <Image source={{ uri: creator_avatar }} style={[styles.avatar, { width: dim.avatar, height: dim.avatar, borderRadius: dim.avatar / 2 }]} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback, { width: dim.avatar, height: dim.avatar, borderRadius: dim.avatar / 2 }]}>
              <Text style={[styles.avatarText, size === 'compact' && { fontSize: 10 }]}>
                {displayName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View style={styles.textCol}>
            <Text style={[styles.title, { fontSize: dim.titleSize }]} numberOfLines={2}>{title || 'Untitled'}</Text>
            <Text style={[styles.meta, { fontSize: dim.metaSize }]}>
              {displayName} • {formatViews(view_count)} • {timeAgo(created_at)}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { marginRight: 10, marginBottom: 10 },
  thumbContainer: { borderRadius: 8, overflow: 'hidden', position: 'relative' },
  thumb: { borderRadius: 8 },
  fallback: {
    position: 'absolute',
    top: 0,
    left: 0,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  fallbackText: { fontSize: 44, fontWeight: '800', color: 'rgba(255,255,255,0.2)' },
  playIcon: { position: 'absolute', opacity: 0.85 },
  playOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.12)',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
    zIndex: 10,
  },
  durationText: { color: '#fff', fontSize: 10, fontWeight: '600' },
  info: { marginTop: 6, paddingHorizontal: 1 },
  avatarRow: { flexDirection: 'row', alignItems: 'flex-start' },
  avatar: { marginRight: 6 },
  avatarFallback: { backgroundColor: '#2a2a2a', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  textCol: { flex: 1 },
  title: { color: '#fff', fontWeight: '600', lineHeight: 16 },
  meta: { color: '#999', marginTop: 2 },
});
