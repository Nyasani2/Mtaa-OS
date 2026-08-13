// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, FlatList, Image, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getPostsByHashtag, type StreetsPost } from '@/lib/services/streets-service';

function formatCount(n: number): string {
  if (!n || n <= 0) return '0';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toString();
}

export default function HashtagScreen() {
  const { tag } = useLocalSearchParams<{ tag: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [posts, setPosts] = useState<StreetsPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const decodedTag = decodeURIComponent(tag || '');

  const loadPosts = useCallback(async () => {
    if (!decodedTag) return;
    setLoading(true); setError(null);
    try { const data = await getPostsByHashtag(decodedTag); setPosts(data); }
    catch (err: any) { setError(err.message || 'Failed to load posts'); }
    finally { setLoading(false); }
  }, [decodedTag]);

  useEffect(() => { loadPosts(); }, [loadPosts]);

  const handleFollow = useCallback(async () => {
    setFollowLoading(true);
    try { setIsFollowing(prev => !prev); }
    finally { setFollowLoading(false); }
  }, []);

  const renderPostItem = useCallback(({ item }: { item: StreetsPost }) => {
    const isVideo = item.media_type === 'video';
    return (
      <Pressable style={styles.gridItem} onPress={() => router.push(`/(os)/streets/post/${item.id}` as any)}>
        {item.media_url && item.media_type !== 'text' ? (
          <Image source={{ uri: item.media_url }} style={styles.gridImage} />
        ) : (
          <View style={[styles.gridImage, styles.textGridItem]}>
            <Text style={styles.textGridContent} numberOfLines={4}>{item.content || item.caption}</Text>
          </View>
        )}
        {isVideo && <View style={styles.videoBadge}><Ionicons name="videocam" size={14} color="#fff" /></View>}
        <View style={styles.gridOverlay}>
          <Ionicons name="heart" size={14} color="#fff" />
          <Text style={styles.gridStat}>{formatCount(item.likes_count || 0)}</Text>
        </View>
      </Pressable>
    );
  }, [router]);

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#FF2D55" />
        <Text style={styles.loadingText}>Loading #{decodedTag}...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}>
        <Ionicons name="warning" size={64} color="#666" />
        <Text style={styles.errorTitle}>Failed to load</Text>
        <Text style={styles.errorSubtitle}>{error}</Text>
        <Pressable style={styles.retryButton} onPress={loadPosts}><Text style={styles.retryButtonText}>Try Again</Text></Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}><Ionicons name="arrow-back" size={24} color="#fff" /></Pressable>
        <Text style={styles.headerTitle}>#{decodedTag}</Text>
        <View style={{ width: 32 }} />
      </View>
      <View style={styles.hashtagInfo}>
        <View style={styles.hashtagIcon}><Text style={styles.hashtagIconText}>#</Text></View>
        <View style={styles.hashtagDetails}>
          <Text style={styles.hashtagName}>#{decodedTag}</Text>
          <View style={styles.hashtagStats}>
            <Text style={styles.hashtagStat}>{formatCount(posts.length)} posts</Text>
            <Text style={styles.hashtagStatDot}>·</Text>
            <Text style={styles.hashtagStat}>{formatCount(posts.reduce((sum, p) => sum + (p.views_count || 0), 0))} views</Text>
          </View>
        </View>
        <Pressable style={[styles.followButton, isFollowing && styles.followingButton, followLoading && styles.followButtonLoading]} onPress={handleFollow} disabled={followLoading}>
          {followLoading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={[styles.followButtonText, isFollowing && styles.followingButtonText]}>{isFollowing ? 'Following' : 'Follow'}</Text>}
        </Pressable>
      </View>
      {posts.length > 0 ? (
        <FlatList data={posts} keyExtractor={(item) => item.id} renderItem={renderPostItem} numColumns={3} contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false} />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="search" size={64} color="#333" />
          <Text style={styles.emptyTitle}>No posts yet</Text>
          <Text style={styles.emptySubtitle}>Be the first to post with #{decodedTag}</Text>
          <Pressable style={styles.createButton} onPress={() => router.push('/(os)/streets/create' as any)}><Text style={styles.createButtonText}>Create Post</Text></Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  loadingText: { color: '#888', marginTop: 16, fontSize: 16 },
  errorTitle: { color: '#fff', fontSize: 20, fontWeight: '700', marginTop: 16 },
  errorSubtitle: { color: '#888', fontSize: 14, textAlign: 'center', marginTop: 8, paddingHorizontal: 40 },
  retryButton: { marginTop: 24, backgroundColor: '#FF2D55', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  retryButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#222' },
  backButton: { padding: 4 }, headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  hashtagInfo: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 16, paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: '#222' },
  hashtagIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#1a1a2e', justifyContent: 'center', alignItems: 'center' },
  hashtagIconText: { color: '#3897F0', fontSize: 28, fontWeight: '800' },
  hashtagDetails: { flex: 1 }, hashtagName: { color: '#fff', fontSize: 20, fontWeight: '700' },
  hashtagStats: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  hashtagStat: { color: '#888', fontSize: 14 }, hashtagStatDot: { color: '#666', fontSize: 14 },
  followButton: { backgroundColor: '#FF2D55', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 8, minWidth: 90, alignItems: 'center' },
  followingButton: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#666' },
  followButtonLoading: { backgroundColor: '#333' }, followButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  followingButtonText: { color: '#888' }, grid: { padding: 1 },
  gridItem: { flex: 1 / 3, aspectRatio: 1, margin: 1, position: 'relative' },
  gridImage: { width: '100%', height: '100%', backgroundColor: '#111' },
  textGridItem: { justifyContent: 'center', padding: 8 }, textGridContent: { color: '#fff', fontSize: 10, lineHeight: 14 },
  videoBadge: { position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 4, padding: 2 },
  gridOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', gap: 4, padding: 4, backgroundColor: 'rgba(0,0,0,0.5)' },
  gridStat: { color: '#fff', fontSize: 11 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyTitle: { color: '#fff', fontSize: 20, fontWeight: '700', marginTop: 16 },
  emptySubtitle: { color: '#888', fontSize: 14, textAlign: 'center', marginTop: 8 },
  createButton: { marginTop: 24, backgroundColor: '#FF2D55', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  createButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
