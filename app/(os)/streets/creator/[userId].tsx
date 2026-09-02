// @ts-nocheck
import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Image, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { getUserPosts, getUserProfile, getFollowerCounts, type StreetPost } from '@/lib/services/streets-service';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_W } = Dimensions.get('window');
const GRID_SIZE = SCREEN_W / 3;
type TabType = 'all' | 'pics' | 'videos';

export default function CreatorProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const [posts, setPosts] = useState<StreetPost[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [followerCounts, setFollowerCounts] = useState({ followers: 0, following: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabType>('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const isOwnProfile = user?.id === userId;

  const loadData = useCallback(async (pageNum: number = 1, append: boolean = false) => {
    if (!userId) { setError('No user ID provided'); setLoading(false); return; }
    if (pageNum === 1) setLoading(true); else setLoadingMore(true);
    setError(null);
    try {
      const [postsData, profileData, countsData] = await Promise.all([
        getUserPosts(userId, { page: pageNum, limit: 30 }),
        getUserProfile(userId),
        getFollowerCounts(userId),
      ]);
      const safeData = postsData ?? [];
      if (append) {
        setPosts((prev) => {
          const existingIds = new Set(prev.map((p) => p.id));
          return [...prev, ...safeData.filter((p) => !existingIds.has(p.id))];
        });
      } else { setPosts(safeData); }
      setProfile(profileData);
      setFollowerCounts(countsData);
      setHasMore(safeData.length === 30);
      setPage(pageNum);
    } catch (err: any) { console.error('Creator profile error:', err); setError(err.message || 'Failed to load profile'); if (!append) setPosts([]); }
    finally { setLoading(false); setLoadingMore(false); }
  }, [userId]);

  useEffect(() => { loadData(1); }, [loadData]);

  const filtered = (posts ?? []).filter((p) => {
    if (tab === 'all') return true;
    if (tab === 'pics') return p.media_type === 'image' || (p.media_type === 'text' && !p.media_url);
    if (tab === 'videos') return p.media_type === 'video';
    return true;
  });

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore || error) return;
    loadData(page + 1, true);
  }, [loadData, loadingMore, hasMore, error, page]);

  const renderItem = useCallback(({ item }: { item: StreetPost }) => {
    const hasImage = item.media_url && item.media_type === 'image';
    const hasVideo = item.media_url && item.media_type === 'video';
    const displayText = item.content || item.caption || '';
    return (
      <TouchableOpacity style={styles.gridItem} onPress={() => router.push(`/(os)/streets/post/${item.id}`)}>
        {hasImage ? (
          <Image source={{ uri: item.media_url! }} style={styles.gridImage} resizeMode="cover" />
        ) : hasVideo ? (
          <View style={styles.gridVideo}>
            {item.thumbnail_url ? (
              <Image source={{ uri: item.thumbnail_url }} style={styles.gridImage} resizeMode="cover" />
            ) : (
              <View style={styles.gridVideoFallback}><Ionicons name="play-circle" size={32} color="#fff" /></View>
            )}
            <View style={styles.videoOverlay}><Ionicons name="play" size={16} color="#fff" /></View>
          </View>
        ) : (
          <View style={styles.gridText}>
            <Text style={styles.gridTextContent} numberOfLines={4}>{displayText}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }, [router]);

  const displayName = profile?.display_name || profile?.full_name || profile?.username || 'Unknown';
  const avatarUrl = profile?.avatar_url;
  const bio = profile?.bio || '';
  const isVerified = profile?.verified;

  if (loading && posts.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
          <Text style={styles.headerTitle}>Creator</Text>
          <View style={styles.backBtn} />
        </View>
        <View style={styles.center}><ActivityIndicator size="large" color="#E91E63" /></View>
      </View>
    );
  }

  if (error && posts.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
          <Text style={styles.headerTitle}>Creator</Text>
          <View style={styles.backBtn} />
        </View>
        <View style={styles.center}>
          <Ionicons name="warning" size={48} color="#ff4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => loadData(1)}><Text style={styles.retryBtnText}>Try Again</Text></TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{displayName}</Text>
        <TouchableOpacity style={styles.backBtn}><Ionicons name="ellipsis-vertical" size={24} color="#fff" /></TouchableOpacity>
      </View>
      <View style={styles.profileSection}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.profileAvatar} onError={(e) => console.warn('Avatar load error:', e.nativeEvent.error)} />
        ) : (
          <View style={[styles.profileAvatar, styles.avatarFallback]}><Text style={styles.profileAvatarText}>{displayName[0]?.toUpperCase() || 'U'}</Text></View>
        )}
        <Text style={styles.profileName}>{displayName}{isVerified && <Text style={{ color: '#3897f0' }}> ✓</Text>}</Text>
        {profile?.username && <Text style={styles.profileHandle}>@{profile.username}</Text>}
        {bio ? <Text style={styles.profileBio} numberOfLines={2}>{bio}</Text> : null}
        <View style={styles.statsRow}>
          <View style={styles.stat}><Text style={styles.statNumber}>{posts.length}</Text><Text style={styles.statLabel}>Posts</Text></View>
          <View style={styles.stat}><Text style={styles.statNumber}>{followerCounts.followers}</Text><Text style={styles.statLabel}>Followers</Text></View>
          <View style={styles.stat}><Text style={styles.statNumber}>{followerCounts.following}</Text><Text style={styles.statLabel}>Following</Text></View>
        </View>
      </View>
      <View style={styles.tabs}>
        {(['all', 'pics', 'videos'] as TabType[]).map((t) => (
          <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t === 'all' ? 'All' : t === 'pics' ? 'Photos' : 'Videos'}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {filtered.length === 0 ? (
        <View style={styles.emptyGrid}>
          <Ionicons name="grid-outline" size={48} color="#333" />
          <Text style={styles.emptyText}>{tab === 'all' ? 'No posts yet' : `No ${tab} posts yet`}</Text>
        </View>
      ) : (
        <FlatList data={filtered} keyExtractor={(item) => item.id} renderItem={renderItem} numColumns={3}
          onEndReached={loadMore} onEndReachedThreshold={0.5}
          ListFooterComponent={loadingMore ? <View style={styles.footerLoader}><ActivityIndicator size="small" color="#E91E63" /></View> : null}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#222' },
  backBtn: { padding: 8, width: 40 }, headerTitle: { color: '#fff', fontSize: 17, fontWeight: '600', flex: 1, textAlign: 'center', marginHorizontal: 8 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }, errorText: { color: '#ff4444', fontSize: 14, textAlign: 'center', marginTop: 12 },
  retryBtn: { backgroundColor: '#E91E63', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24, marginTop: 20 }, retryBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  profileSection: { alignItems: 'center', paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: '#222' },
  profileAvatar: { width: 80, height: 80, borderRadius: 40 }, avatarFallback: { backgroundColor: '#E91E63', alignItems: 'center', justifyContent: 'center' },
  profileAvatarText: { color: '#fff', fontSize: 32, fontWeight: '700' }, profileName: { color: '#fff', fontSize: 18, fontWeight: '600', marginTop: 12 },
  profileHandle: { color: '#666', fontSize: 14, marginTop: 4 }, profileBio: { color: '#888', fontSize: 13, marginTop: 8, textAlign: 'center', paddingHorizontal: 32 },
  statsRow: { flexDirection: 'row', gap: 32, marginTop: 16 }, stat: { alignItems: 'center' }, statNumber: { color: '#fff', fontSize: 16, fontWeight: '700' }, statLabel: { color: '#666', fontSize: 12, marginTop: 2 },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#222' }, tab: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#E91E63' }, tabText: { color: '#666', fontSize: 14, fontWeight: '500' }, tabTextActive: { color: '#E91E63' },
  gridItem: { width: GRID_SIZE, height: GRID_SIZE, backgroundColor: '#1a1a1a', borderWidth: 0.5, borderColor: '#0a0a0a' },
  gridImage: { width: '100%', height: '100%' }, gridVideo: { width: '100%', height: '100%', position: 'relative' },
  gridVideoFallback: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1a1a1a' },
  videoOverlay: { position: 'absolute', bottom: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 10, width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
  gridText: { width: '100%', height: '100%', padding: 8, justifyContent: 'center', backgroundColor: '#1a1a1a' }, gridTextContent: { color: '#fff', fontSize: 11, lineHeight: 15 },
  emptyGrid: { flex: 1, alignItems: 'center', justifyContent: 'center' }, emptyText: { color: '#666', fontSize: 14, marginTop: 12 },
  footerLoader: { paddingVertical: 20, alignItems: 'center', width: SCREEN_W },
});
