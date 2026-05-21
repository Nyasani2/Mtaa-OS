import { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

interface ProfileData {
  id: string;
  display_name: string;
  username: string;
  bio: string;
  avatar_url: string | null;
  verified: boolean;
  follower_count: number;
  following_count: number;
  total_likes: number;
  wallet_balance: number;
  creator_enabled: boolean;
  badges: string[];
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { userId } = useLocalSearchParams<{ userId?: string }>();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'videos' | 'likes' | 'saved' | 'live' | 'shop'>('videos');
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const targetId = userId || user?.id;
  const isOwnProfile = targetId === user?.id;

  useEffect(() => {
    if (targetId) {
      loadProfile();
      loadPosts();
      if (!isOwnProfile && user) {
        checkFollowStatus();
      }
    }
  }, [targetId, activeTab]);

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', targetId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (err) {
      console.error('Profile load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadPosts = async () => {
    let query = supabase.from('street_content').select('*').eq('user_id', targetId);

    if (activeTab === 'videos') {
      query = query.in('content_type', ['video', 'image', 'text']);
    } else if (activeTab === 'likes') {
      const { data: likes } = await supabase
        .from('street_likes')
        .select('content_id')
        .eq('user_id', targetId);
      const contentIds = likes?.map(l => l.content_id) || [];
      if (contentIds.length === 0) { setPosts([]); return; }
      query = supabase.from('street_content').select('*').in('id', contentIds);
    } else if (activeTab === 'saved') {
      const { data: saves } = await supabase
        .from('street_saves')
        .select('content_id')
        .eq('user_id', targetId);
      const contentIds = saves?.map(s => s.content_id) || [];
      if (contentIds.length === 0) { setPosts([]); return; }
      query = supabase.from('street_content').select('*').in('id', contentIds);
    } else if (activeTab === 'live') {
      query = query.eq('content_type', 'live');
    } else if (activeTab === 'shop') {
      const { data: shop } = await supabase.from('shops').select('*').eq('owner_id', targetId);
      setPosts(shop || []);
      return;
    }

    const { data } = await query.order('created_at', { ascending: false }).limit(30);
    setPosts(data || []);
  };

  const checkFollowStatus = async () => {
    const { data } = await supabase
      .from('street_follows')
      .select('*')
      .eq('follower_id', user?.id)
      .eq('following_id', targetId)
      .single();
    setIsFollowing(!!data);
  };

  const handleFollow = async () => {
    if (!user) return;
    try {
      if (isFollowing) {
        await supabase.from('street_follows').delete()
          .eq('follower_id', user.id).eq('following_id', targetId);
      } else {
        await supabase.from('street_follows').insert({
          follower_id: user.id, following_id: targetId,
        });
      }
      setIsFollowing(!isFollowing);
      loadProfile();
    } catch (err) {
      console.error('Follow error:', err);
    }
  };

  const handleTip = () => {
    router.push(`/wallet/send?to=${targetId}&type=creator_tip`);
  };

  const handleMessage = () => {
    router.push(`/chat/${targetId}`);
  };

  const handleShareProfile = async () => {
    // Use Share API
    Alert.alert('Shared', 'Profile link copied to clipboard');
  };

  const openWallet = () => router.push('/wallet');
  const openStudio = () => router.push('/studio');
  const openSettings = () => router.push('/streets/settings');
  const openAnalytics = () => router.push('/studio/analytics');

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Ionicons name="person-outline" size={48} color="#334155" />
        <Text style={styles.emptyText}>Profile not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarSection}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {profile.display_name?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
            {profile.verified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark" size={14} color="#fff" />
              </View>
            )}
          </View>

          <Text style={styles.displayName}>
            {profile.display_name}
            {profile.verified && <Text style={styles.verifiedMark}> ✓</Text>}
          </Text>
          <Text style={styles.username}>@{profile.username || profile.id.slice(0, 8)}</Text>
          <Text style={styles.bio}>{profile.bio || 'No bio yet'}</Text>

          {/* Stats */}
          <View style={styles.statsRow}>
            <TouchableOpacity style={styles.stat}>
              <Text style={styles.statNumber}>{profile.follower_count}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </TouchableOpacity>
            <View style={styles.statDivider} />
            <TouchableOpacity style={styles.stat}>
              <Text style={styles.statNumber}>{profile.following_count}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </TouchableOpacity>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{profile.total_likes}</Text>
              <Text style={styles.statLabel}>Likes</Text>
            </View>
          </View>

          {/* Badges */}
          {profile.badges && profile.badges.length > 0 && (
            <View style={styles.badgesRow}>
              {profile.badges.map((badge, i) => (
                <View key={i} style={styles.badge}>
                  <Text style={styles.badgeText}>{badge}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            {isOwnProfile ? (
              <>
                <TouchableOpacity style={styles.primaryBtn} onPress={openSettings}>
                  <Ionicons name="create-outline" size={16} color="#fff" />
                  <Text style={styles.primaryBtnText}>Edit Profile</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryBtn} onPress={openWallet}>
                  <Ionicons name="wallet-outline" size={16} color="#f8fafc" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryBtn} onPress={openStudio}>
                  <Ionicons name="analytics-outline" size={16} color="#f8fafc" />
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  style={[styles.primaryBtn, isFollowing && styles.followingBtn]}
                  onPress={handleFollow}
                >
                  <Text style={[styles.primaryBtnText, isFollowing && styles.followingText]}>
                    {isFollowing ? 'Following' : 'Follow'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryBtn} onPress={handleMessage}>
                  <Ionicons name="mail-outline" size={16} color="#f8fafc" />
                  <Text style={styles.secondaryBtnText}>Message</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryBtn} onPress={handleTip}>
                  <Ionicons name="cash-outline" size={16} color="#f59e0b" />
                  <Text style={[styles.secondaryBtnText, { color: '#f59e0b' }]}>Tip</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* Quick Links */}
          <View style={styles.quickLinks}>
            <TouchableOpacity style={styles.quickLink} onPress={openWallet}>
              <Ionicons name="wallet-outline" size={20} color="#10b981" />
              <Text style={styles.quickLinkText}>Wallet</Text>
              <Text style={styles.quickLinkValue}>KES {profile.wallet_balance || 0}</Text>
            </TouchableOpacity>
            {profile.creator_enabled && (
              <TouchableOpacity style={styles.quickLink} onPress={openStudio}>
                <Ionicons name="videocam-outline" size={20} color="#3b82f6" />
                <Text style={styles.quickLinkText}>Studio</Text>
                <Text style={styles.quickLinkValue}>Creator</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.quickLink} onPress={openAnalytics}>
              <Ionicons name="stats-chart-outline" size={20} color="#8b5cf6" />
              <Text style={styles.quickLinkText}>Analytics</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickLink} onPress={handleShareProfile}>
              <Ionicons name="share-outline" size={20} color="#f59e0b" />
              <Text style={styles.quickLinkText}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Content Tabs */}
        <View style={styles.tabBar}>
          {(['videos', 'likes', 'saved', 'live', 'shop'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Ionicons
                name={
                  tab === 'videos' ? 'videocam-outline' :
                  tab === 'likes' ? 'heart-outline' :
                  tab === 'saved' ? 'bookmark-outline' :
                  tab === 'live' ? 'radio-outline' : 'cart-outline'
                }
                size={18}
                color={activeTab === tab ? '#3b82f6' : '#64748b'}
              />
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Content Grid */}
        <FlatList
          data={posts}
          numColumns={3}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.gridItem}
              onPress={() => router.push(`/streets/feed?contentId=${item.id}`)}
            >
              <View style={styles.gridThumb}>
                <Ionicons name="videocam" size={24} color="#64748b" />
              </View>
              <View style={styles.gridOverlay}>
                <Ionicons name="play" size={14} color="#fff" />
                <Text style={styles.gridCount}>{item.views_count || 0}</Text>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContent}>
              <Ionicons name="videocam-off-outline" size={32} color="#334155" />
              <Text style={styles.emptyContentText}>No {activeTab} yet</Text>
            </View>
          }
          scrollEnabled={false}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  centered: { justifyContent: 'center', alignItems: 'center' },
  profileHeader: { alignItems: 'center', padding: 20, paddingTop: 60 },
  avatarSection: { position: 'relative', marginBottom: 12 },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#1e293b',
  },
  avatarText: { fontSize: 40, fontWeight: '800', color: '#fff' },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    padding: 4,
    borderWidth: 2,
    borderColor: '#0f172a',
  },
  displayName: { fontSize: 22, fontWeight: '800', color: '#f8fafc' },
  verifiedMark: { color: '#3b82f6' },
  username: { fontSize: 14, color: '#94a3b8', marginTop: 2 },
  bio: { fontSize: 14, color: '#cbd5e1', textAlign: 'center', marginTop: 8, paddingHorizontal: 20 },
  statsRow: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 24,
  },
  stat: { alignItems: 'center' },
  statNumber: { fontSize: 20, fontWeight: '800', color: '#f8fafc' },
  statLabel: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  statDivider: { width: 1, height: 30, backgroundColor: '#334155' },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
  },
  badge: {
    backgroundColor: '#f59e0b20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: { fontSize: 11, fontWeight: '700', color: '#f59e0b' },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
    paddingHorizontal: 20,
  },
  primaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
  },
  followingBtn: { backgroundColor: '#334155' },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  followingText: { color: '#94a3b8' },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1e293b',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 4,
    borderWidth: 1,
    borderColor: '#334155',
  },
  secondaryBtnText: { fontSize: 14, color: '#f8fafc', fontWeight: '600' },
  quickLinks: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 20,
    paddingHorizontal: 16,
  },
  quickLink: { alignItems: 'center', gap: 4 },
  quickLinkText: { fontSize: 12, color: '#94a3b8' },
  quickLinkValue: { fontSize: 12, fontWeight: '700', color: '#f8fafc' },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    paddingVertical: 10,
  },
  tabBtn: { alignItems: 'center', gap: 4 },
  tabBtnActive: { borderBottomWidth: 2, borderBottomColor: '#3b82f6', paddingBottom: 4 },
  tabText: { fontSize: 12, color: '#64748b' },
  tabTextActive: { color: '#3b82f6', fontWeight: '600' },
  gridItem: {
    width: '33.33%',
    aspectRatio: 0.75,
    padding: 1,
    position: 'relative',
  },
  gridThumb: {
    flex: 1,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridOverlay: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  gridCount: { fontSize: 11, color: '#fff', fontWeight: '600' },
  emptyContent: { alignItems: 'center', paddingVertical: 60 },
  emptyContentText: { fontSize: 14, color: '#64748b', marginTop: 8 },
  emptyText: { fontSize: 16, color: '#94a3b8', marginTop: 12 },
});
