import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

const { width } = Dimensions.get('window');
const COL_COUNT = 3;
const ITEM_W = (width - 32 - (COL_COUNT - 1) * 2) / COL_COUNT;

interface Post {
  id: string;
  media_url: string | null;
  media_type: string;
  views_count: number;
}

export default function CreatorScreen() {
  const router = useRouter();
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { user: currentUser } = useAuthStore();
  const [creator, setCreator] = useState<any>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [stats, setStats] = useState({ followers: 0, following: 0, totalViews: 0, totalLikes: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'posts' | 'analytics'>('posts');
  const [isFollowing, setIsFollowing] = useState(false);

  const targetId = userId || currentUser?.id;

  const fetchCreator = useCallback(async () => {
    if (!targetId) return;
    setLoading(true);

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, full_name, username, avatar_url, bio, verified')
      .eq('id', targetId)
      .single();

    const { data: userPosts } = await supabase
      .from('streets_posts')
      .select('id, media_url, media_type, views_count, likes_count')
      .eq('creator_id', targetId)
      .order('created_at', { ascending: false });

    const { count: followers } = await supabase
      .from('streets_follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', targetId);

    const { count: following } = await supabase
      .from('streets_follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', targetId);

    const totalViews = (userPosts || []).reduce((sum: number, p: any) => sum + (p.views_count || 0), 0);
    const totalLikes = (userPosts || []).reduce((sum: number, p: any) => sum + (p.likes_count || 0), 0);

    setCreator(profile);
    setPosts(userPosts || []);
    setStats({ followers: followers || 0, following: following || 0, totalViews, totalLikes });

    if (currentUser?.id && currentUser.id !== targetId) {
      const { data: followData } = await supabase
        .from('streets_follows')
        .select('id')
        .eq('follower_id', currentUser.id)
        .eq('following_id', targetId)
        .maybeSingle();
      setIsFollowing(!!followData);
    }

    setLoading(false);
  }, [targetId, currentUser]);

  useEffect(() => { fetchCreator(); }, [fetchCreator]);

  const handleFollow = useCallback(async () => {
    if (!currentUser?.id || !targetId || currentUser.id === targetId) return;
    if (isFollowing) {
      await supabase
        .from('streets_follows')
        .delete()
        .eq('follower_id', currentUser.id)
        .eq('following_id', targetId);
      setIsFollowing(false);
      setStats(s => ({ ...s, followers: s.followers - 1 }));
    } else {
      await supabase.from('streets_follows').insert({
        follower_id: currentUser.id,
        following_id: targetId,
      });
      setIsFollowing(true);
      setStats(s => ({ ...s, followers: s.followers + 1 }));
    }
  }, [currentUser, targetId, isFollowing]);

  const openProfile = useCallback(() => {
    if (targetId) router.push(`/(os)/profile/${targetId}`);
  }, [router, targetId]);

  const shareQR = useCallback(() => {
    router.push({
      pathname: '/streets/share',
      params: { userId: targetId, mode: 'qr' },
    });
  }, [router, targetId]);

  const renderPost = useCallback(({ item }: { item: Post }) => (
    <TouchableOpacity
      style={[styles.gridItem, { width: ITEM_W, height: ITEM_W }]}
      onPress={() => router.push(`/streets/post/${item.id}`)}
    >
      {item.media_url ? (
        <Image source={{ uri: item.media_url }} style={styles.gridImage} />
      ) : (
        <View style={[styles.gridImage, styles.gridFallback]}>
          <Ionicons name="image" size={24} color="#555" />
        </View>
      )}
      <View style={styles.gridOverlay}>
        <Ionicons name="eye" size={12} color="#fff" />
        <Text style={styles.gridViews}>{item.views_count || 0}</Text>
      </View>
    </TouchableOpacity>
  ), [router]);

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color="#2196F3" />
      </View>
    );
  }

  const displayName = creator?.full_name || creator?.username || 'Creator';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{displayName}</Text>
        <TouchableOpacity onPress={shareQR} style={styles.backBtn}>
          <Ionicons name="qr-code" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <TouchableOpacity onPress={openProfile}>
            {creator?.avatar_url ? (
              <Image source={{ uri: creator.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{displayName.charAt(0)}</Text>
              </View>
            )}
          </TouchableOpacity>
          <View style={styles.nameRow}>
            <TouchableOpacity onPress={openProfile}>
              <Text style={styles.displayName}>{displayName}</Text>
            </TouchableOpacity>
            {creator?.verified && <Ionicons name="checkmark-circle" size={16} color="#2196F3" />}
          </View>
          {creator?.username && <Text style={styles.username}>@{creator.username}</Text>}
          {creator?.bio && <Text style={styles.bio} numberOfLines={2}>{creator.bio}</Text>}

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{posts.length}</Text>
              <Text style={styles.statLabel}>Posts</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{stats.followers.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{stats.following.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </View>
          </View>

          {currentUser?.id && currentUser.id !== targetId && (
            <TouchableOpacity
              style={[styles.followBtn, isFollowing && styles.followingBtn]}
              onPress={handleFollow}
            >
              <Text style={[styles.followBtnText, isFollowing && styles.followingBtnText]}>
                {isFollowing ? 'Following' : 'Follow'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Tabs */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'posts' && styles.tabActive]}
            onPress={() => setActiveTab('posts')}
          >
            <Ionicons name="grid" size={18} color={activeTab === 'posts' ? '#fff' : '#666'} />
            <Text style={[styles.tabText, activeTab === 'posts' && styles.tabTextActive]}>Posts</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'analytics' && styles.tabActive]}
            onPress={() => setActiveTab('analytics')}
          >
            <Ionicons name="stats-chart" size={18} color={activeTab === 'analytics' ? '#fff' : '#666'} />
            <Text style={[styles.tabText, activeTab === 'analytics' && styles.tabTextActive]}>Analytics</Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'posts' ? (
          <View style={styles.grid}>
            {posts.map((item, index) => (
              <View key={item.id} style={{ marginRight: (index + 1) % COL_COUNT !== 0 ? 2 : 0, marginBottom: 2 }}>
                {renderPost({ item })}
              </View>
            ))}
            {posts.length === 0 && (
              <View style={styles.emptyGrid}>
                <Text style={styles.emptyText}>No posts yet</Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.analyticsSection}>
            <View style={styles.analyticsCard}>
              <Text style={styles.analyticsTitle}>30-Day Summary</Text>
              <View style={styles.analyticsRow}>
                <View style={styles.analyticBox}>
                  <Text style={styles.analyticValue}>{stats.totalViews.toLocaleString()}</Text>
                  <Text style={styles.analyticLabel}>Total Views</Text>
                </View>
                <View style={styles.analyticBox}>
                  <Text style={styles.analyticValue}>{stats.totalLikes.toLocaleString()}</Text>
                  <Text style={styles.analyticLabel}>Total Likes</Text>
                </View>
              </View>
              <View style={styles.analyticsRow}>
                <View style={styles.analyticBox}>
                  <Text style={styles.analyticValue}>{stats.followers.toLocaleString()}</Text>
                  <Text style={styles.analyticLabel}>Followers</Text>
                </View>
                <View style={styles.analyticBox}>
                  <Text style={styles.analyticValue}>{posts.length}</Text>
                  <Text style={styles.analyticLabel}>Posts</Text>
                </View>
              </View>
            </View>

            <View style={styles.analyticsCard}>
              <Text style={styles.analyticsTitle}>Verification</Text>
              <View style={styles.verificationRow}>
                <Ionicons
                  name={creator?.verified ? 'checkmark-circle' : 'ellipse-outline'}
                  size={28}
                  color={creator?.verified ? '#4CAF50' : '#666'}
                />
                <View style={{ marginLeft: 12 }}>
                  <Text style={styles.verificationStatus}>
                    {creator?.verified ? 'Verified Creator' : 'Not Verified'}
                  </Text>
                  <Text style={styles.verificationSub}>
                    {creator?.verified
                      ? 'Your account has been verified.'
                      : 'Apply for verification to unlock creator features.'}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '700', maxWidth: 200, textAlign: 'center' },
  profileHeader: { alignItems: 'center', paddingVertical: 24, paddingHorizontal: 16 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: { color: '#fff', fontSize: 28, fontWeight: '700' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  displayName: { color: '#fff', fontSize: 20, fontWeight: '700' },
  username: { color: '#888', fontSize: 14, marginTop: 2 },
  bio: { color: '#aaa', fontSize: 14, textAlign: 'center', marginTop: 8, lineHeight: 20 },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 20,
  },
  statBox: { alignItems: 'center', minWidth: 60 },
  statValue: { color: '#fff', fontSize: 18, fontWeight: '700' },
  statLabel: { color: '#888', fontSize: 12, marginTop: 2 },
  statDivider: { width: 1, height: 30, backgroundColor: '#333' },
  followBtn: {
    backgroundColor: '#2196F3',
    borderRadius: 20,
    paddingHorizontal: 32,
    paddingVertical: 10,
    marginTop: 16,
  },
  followingBtn: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#444' },
  followBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  followingBtnText: { color: '#ccc' },
  tabRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#fff' },
  tabText: { color: '#666', fontSize: 14, fontWeight: '600' },
  tabTextActive: { color: '#fff' },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingTop: 2,
  },
  gridItem: { backgroundColor: '#1a1a1a', borderRadius: 4, overflow: 'hidden' },
  gridImage: { width: '100%', height: '100%' },
  gridFallback: { justifyContent: 'center', alignItems: 'center' },
  gridOverlay: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  gridViews: { color: '#fff', fontSize: 10 },
  emptyGrid: { width: '100%', alignItems: 'center', paddingVertical: 60 },
  emptyText: { color: '#666', fontSize: 15 },
  analyticsSection: { paddingHorizontal: 16, paddingTop: 16 },
  analyticsCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  analyticsTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 12 },
  analyticsRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  analyticBox: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
  },
  analyticValue: { color: '#2196F3', fontSize: 20, fontWeight: '700' },
  analyticLabel: { color: '#888', fontSize: 12, marginTop: 4 },
  verificationRow: { flexDirection: 'row', alignItems: 'center' },
  verificationStatus: { color: '#fff', fontSize: 15, fontWeight: '600' },
  verificationSub: { color: '#888', fontSize: 13, marginTop: 2 },
});
