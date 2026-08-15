import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, useWindowDimensions, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Heart, MessageCircle, Bookmark, Share2, Zap, Flag, Music } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface PostCardProps {
  post: any;
  onLike: (id: string) => void;
  onSave: (id: string) => void;
  onBoost: (post: any) => void;
  onReport: (post: any) => void;
  onShare: (post: any) => void;
}

export default function PostCard({ post, onLike, onSave, onBoost, onReport, onShare }: PostCardProps) {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isDesktop = isWeb && width > 900;

  const maxVideoHeight = isWeb ? Math.min(height * 0.78, 720) : width * 1.15;
  const videoWidth = isWeb ? maxVideoHeight * (9 / 16) : width;

  const creator = post.creator || {};
  const isLiked = post.isLiked || false;
  const isSaved = post.isSaved || false;

  return (
    <View style={[
      styles.container,
      { height: isWeb ? height - (isDesktop ? 0 : 60) : width * 1.35 },
      isWeb && styles.containerWeb
    ]}>
      <View style={[
        styles.contentRow,
        isWeb && { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center' }
      ]}>
        <View style={[
          styles.mediaWrap,
          isWeb && { width: videoWidth, height: maxVideoHeight, borderRadius: 12, overflow: 'hidden' }
        ]}>
          <Image
            source={{ uri: post.thumbnail_url || post.media_url || 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==' }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.85)']}
            style={styles.gradient}
          />
          <View style={styles.creatorOverlay}>
            <TouchableOpacity
              style={styles.creatorRow}
              onPress={() => router.push(`/streets/user/${post.creator_id}` as any)}
            >
              <Image
                source={{ uri: creator.avatar_url || 'https://i.pravatar.cc/150?u=' + post.creator_id }}
                style={styles.avatar}
              />
              <View style={styles.creatorText}>
                <Text style={styles.username}>@{creator.username || creator.display_name || 'user'}</Text>
                {creator.verified && <Text style={styles.verifiedBadge}>✓</Text>}
              </View>
            </TouchableOpacity>
            <Text style={styles.caption} numberOfLines={3}>{post.caption || post.content}</Text>
            <View style={styles.hashtagRow}>
              {(post.hashtags || []).slice(0, 4).map((tag: string) => (
                <TouchableOpacity key={tag} onPress={() => router.push(`/streets/explore?tag=${tag}` as any)}>
                  <Text style={styles.hashtag}>#{tag}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.musicRow}>
              <Music size={12} color="#fff" />
              <Text style={styles.musicText}>Original Sound — {creator.username || 'Unknown'}</Text>
            </View>
          </View>
        </View>

        <View style={[
          styles.actions,
          isWeb ? { marginLeft: 20, marginBottom: 24 } : { position: 'absolute', right: 12, bottom: 120 }
        ]}>
          <ActionBtn
            icon={<Heart size={28} color={isLiked ? '#ff2d55' : '#fff'} fill={isLiked ? '#ff2d55' : 'none'} />}
            count={post.likes_count || 0}
            onPress={() => onLike(post.id)}
          />
          <ActionBtn
            icon={<MessageCircle size={28} color="#fff" />}
            count={post.comments_count || 0}
            onPress={() => router.push(`/streets/post/${post.id}` as any)}
          />
          <ActionBtn
            icon={<Bookmark size={28} color={isSaved ? '#ffd700' : '#fff'} fill={isSaved ? '#ffd700' : 'none'} />}
            count={post.saves_count || 0}
            onPress={() => onSave(post.id)}
          />
          <ActionBtn
            icon={<Share2 size={28} color="#fff" />}
            count={post.shares_count || 0}
            onPress={() => onShare(post)}
          />
          <ActionBtn
            icon={<Zap size={28} color="#ffd700" />}
            label="Boost"
            onPress={() => onBoost(post)}
          />
          <ActionBtn
            icon={<Flag size={24} color="#fff" />}
            label="Report"
            onPress={() => onReport(post)}
          />
        </View>
      </View>
    </View>
  );
}

function ActionBtn({ icon, count, label, onPress }: { icon: any; count?: number; label?: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.actionBtn} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.actionIconCircle}>{icon}</View>
      {count !== undefined && <Text style={styles.actionCount}>{formatCount(count)}</Text>}
      {label && <Text style={styles.actionLabel}>{label}</Text>}
    </TouchableOpacity>
  );
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return String(n);
}

const styles = StyleSheet.create({
  container: { width: '100%', justifyContent: 'center', backgroundColor: '#000' },
  containerWeb: { alignItems: 'center' },
  contentRow: { flexDirection: 'row', alignItems: 'flex-end' },
  mediaWrap: { flex: 1, backgroundColor: '#111', position: 'relative' },
  gradient: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 180 },
  creatorOverlay: { position: 'absolute', left: 12, right: 80, bottom: 16 },
  creatorRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  avatar: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: '#fff', marginRight: 8 },
  creatorText: { flexDirection: 'row', alignItems: 'center' },
  username: { color: '#fff', fontSize: 14, fontWeight: '700' },
  verifiedBadge: { color: '#3897f0', fontSize: 12, fontWeight: '700', marginLeft: 4 },
  caption: { color: '#fff', fontSize: 13, lineHeight: 18, marginBottom: 6 },
  hashtagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 6 },
  hashtag: { color: '#3897f0', fontSize: 13, fontWeight: '600' },
  musicRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  musicText: { color: '#fff', fontSize: 12, opacity: 0.9 },
  actions: { alignItems: 'center', gap: 16 },
  actionBtn: { alignItems: 'center', gap: 4 },
  actionIconCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.12)', justifyContent: 'center', alignItems: 'center' },
  actionCount: { color: '#fff', fontSize: 12, fontWeight: '600', marginTop: 2 },
  actionLabel: { color: '#fff', fontSize: 11, opacity: 0.8, marginTop: 2 },
});
