import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image,
  Dimensions, RefreshControl, ActivityIndicator, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

const { width: SCREEN_W } = Dimensions.get('window');

interface ProfileData {
  user_id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  cover_photo_url: string | null;
  bio: string | null;
  city: string | null;
  country: string | null;
  profession: string | null;
  is_verified: boolean;
  follower_count: number;
  following_count: number;
  completion_percentage: number;
  trust_score: number;
  online_status: string;
  mtaa_id: string | null;
  website: string | null;
  social_links: Record<string, string> | null;
}

interface ProfileStats {
  total_views: number;
  total_tips: number;
  total_subscribers: number;
  achievements_count: number;
}

const TAB_ITEMS = [
  { key: 'overview', label: 'Overview', icon: 'person-outline' },
  { key: 'posts', label: 'Posts', icon: 'grid-outline' },
  { key: 'videos', label: 'Videos', icon: 'videocam-outline' },
  { key: 'photos', label: 'Photos', icon: 'images-outline' },
  { key: 'saved', label: 'Saved', icon: 'bookmark-outline' },
  { key: 'likes', label: 'Likes', icon: 'heart-outline' },
  { key: 'activity', label: 'Activity', icon: 'pulse-outline' },
] as const;

type TabKey = typeof TAB_ITEMS[number]['key'];

export default function ProfileScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!user?.id) { setError('Not authenticated'); setLoading(false); return; }
    setError(null);
    try {
      const { data: prof, error: pErr } = await supabase
        .from('profiles')
        .select(`
          user_id, display_name, username, avatar_url, cover_photo_url, bio,
          city, country, profession, is_verified, follower_count, following_count,
          completion_percentage, trust_score, online_status, mtaa_id, website, social_links
        `)
        .eq('user_id', user.id)
        .single();
      if (pErr) throw pErr;
      setProfile(prof);

      const { data: sData } = await supabase.rpc('get_profile_stats', { p_user_id: user.id });
      if (sData && sData.length > 0) {
        setStats({
          total_views: Number(sData[0].total_views) || 0,
          total_tips: Number(sData[0].total_tips_received) || 0,
          total_subscribers: Number(sData[0].total_subscribers) || 0,
          achievements_count: Number(sData[0].achievements_count) || 0,
        });
      }
    } catch (e: any) {
      setError(e.message || 'Failed to load profile');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const onRefresh = () => { setRefreshing(true); fetchProfile(); };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#00d4ff" />
      </View>
    );
  }

  if (error || !profile) {
    return (
      <View style={[styles.container, styles.center]}>
        <Ionicons name="alert-circle" size={48} color="#ff4444" />
        <Text style={styles.errorText}>{error || 'Profile not found'}</Text>
        <TouchableOpacity onPress={fetchProfile} style={styles.retryBtn}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const displayName = profile.display_name || profile.username || 'User';
  const location = [profile.city, profile.country].filter(Boolean).join(', ');
  const completion = profile.completion_percentage || 0;
  const trust = profile.trust_score || 50;

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00d4ff" />}
        showsVerticalScrollIndicator={false}
      >
        {/* Cover Image */}
        <View style={styles.coverContainer}>
          {profile.cover_photo_url ? (
            <Image source={{ uri: profile.cover_photo_url }} style={styles.coverImage} />
          ) : (
            <View style={[styles.coverImage, styles.coverPlaceholder]}>
              <Ionicons name="image-outline" size={40} color="#444" />
            </View>
          )}
          <View style={styles.coverOverlay} />

          <View style={styles.topActions}>
            <TouchableOpacity onPress={() => router.push('/settings/profile')} style={styles.iconBtn}>
              <Ionicons name="settings-outline" size={22} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/profile/qr')} style={styles.iconBtn}>
              <Ionicons name="qr-code-outline" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Avatar + Name Section */}
        <View style={styles.headerSection}>
          <View style={styles.avatarWrap}>
            {profile.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Ionicons name="person" size={40} color="#fff" />
              </View>
            )}
            <View style={[styles.onlineDot, { backgroundColor: profile.online_status === 'online' ? '#00ff88' : '#888' }]} />
          </View>

          <View style={styles.nameRow}>
            <Text style={styles.displayName}>{displayName}</Text>
            {profile.is_verified && <Ionicons name="checkmark-circle" size={18} color="#00d4ff" style={styles.verifiedBadge} />}
          </View>

          <Text style={styles.username}>@{profile.username || 'user'}</Text>
          {profile.mtaa_id && <Text style={styles.mtaaId}>MTAA ID: {profile.mtaa_id}</Text>}

          {profile.profession && (
            <View style={styles.professionRow}>
              <Ionicons name="briefcase-outline" size={12} color="#888" />
              <Text style={styles.professionText}>{profile.profession}</Text>
            </View>
          )}

          {location ? (
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={12} color="#888" />
              <Text style={styles.locationText}>{location}</Text>
            </View>
          ) : null}

          {profile.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}

          {profile.website ? (
            <TouchableOpacity onPress={() => {}}>
              <Text style={styles.website}>{profile.website}</Text>
            </TouchableOpacity>
          ) : null}

          {/* Trust & Completion */}
          <View style={styles.metricsRow}>
            <View style={styles.metric}>
              <View style={styles.metricBarBg}>
                <View style={[styles.metricBarFill, { width: `${trust}%`, backgroundColor: trust > 70 ? '#00ff88' : trust > 40 ? '#ffaa00' : '#ff4444' }]} />
              </View>
              <Text style={styles.metricLabel}>Trust {trust}%</Text>
            </View>
            <View style={styles.metric}>
              <View style={styles.metricBarBg}>
                <View style={[styles.metricBarFill, { width: `${completion}%`, backgroundColor: '#00d4ff' }]} />
              </View>
              <Text style={styles.metricLabel}>Complete {completion}%</Text>
            </View>
          </View>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <TouchableOpacity style={styles.stat} onPress={() => {}}>
              <Text style={styles.statNum}>{profile.follower_count || 0}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.stat} onPress={() => {}}>
              <Text style={styles.statNum}>{profile.following_count || 0}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </TouchableOpacity>
            <View style={styles.stat}>
              <Text style={styles.statNum}>{stats?.total_views || 0}</Text>
              <Text style={styles.statLabel}>Views</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statNum}>{stats?.achievements_count || 0}</Text>
              <Text style={styles.statLabel}>Badges</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push('/profile/edit')}>
              <Ionicons name="create-outline" size={14} color="#000" />
              <Text style={styles.primaryBtnText}>Edit Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.push('/profile/qr')}>
              <Ionicons name="share-outline" size={14} color="#fff" />
              <Text style={styles.secondaryBtnText}>Share</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.push('/wallet')}>
              <Ionicons name="wallet-outline" size={14} color="#fff" />
              <Text style={styles.secondaryBtnText}>Wallet</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tab Navigation */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll} contentContainerStyle={styles.tabContainer}>
          {TAB_ITEMS.map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tabBtn, activeTab === tab.key && styles.tabBtnActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Ionicons name={tab.icon as any} size={16} color={activeTab === tab.key ? '#00d4ff' : '#888'} />
              <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Tab Content */}
        <View style={styles.tabContent}>
          {activeTab === 'overview' && <OverviewTab profile={profile} stats={stats} />}
          {activeTab === 'posts' && <Text style={styles.emptyText}>Posts tab — integrate with Streets</Text>}
          {activeTab === 'videos' && <Text style={styles.emptyText}>Videos tab — integrate with Streets</Text>}
          {activeTab === 'photos' && <Text style={styles.emptyText}>Photos tab — integrate with Streets</Text>}
          {activeTab === 'saved' && <Text style={styles.emptyText}>Saved tab — integrate with Streets</Text>}
          {activeTab === 'likes' && <Text style={styles.emptyText}>Likes tab — integrate with Streets</Text>}
          {activeTab === 'activity' && <Text style={styles.emptyText}>Activity tab — achievements & milestones</Text>}
        </View>
      </ScrollView>
    </View>
  );
}

function OverviewTab({ profile, stats }: { profile: ProfileData; stats: ProfileStats | null }) {
  const router = useRouter();
  const quickLinks = [
    { label: 'Business', icon: 'business-outline', route: '/profile/business', color: '#00d4ff' },
    { label: 'Creator', icon: 'sparkles-outline', route: '/profile/creator', color: '#ff00ff' },
    { label: 'Professional', icon: 'briefcase-outline', route: '/profile/professional', color: '#00ff88' },
    { label: 'Education', icon: 'school-outline', route: '/education', color: '#ffaa00' },
    { label: 'Health', icon: 'medical-outline', route: '/health', color: '#ff4444' },
    { label: 'Wallet', icon: 'wallet-outline', route: '/wallet', color: '#00d4ff' },
    { label: 'Assets', icon: 'cube-outline', route: '/profile/assets', color: '#aa66ff' },
    { label: 'Family', icon: 'people-outline', route: '/profile/family', color: '#ff8800' },
  ];

  return (
    <View style={styles.overview}>
      <View style={styles.quickLinksGrid}>
        {quickLinks.map(link => (
          <TouchableOpacity key={link.label} style={styles.quickLink} onPress={() => router.push(link.route as any)}>
            <View style={[styles.quickLinkIcon, { backgroundColor: link.color + '22', borderColor: link.color + '44' }]}>
              <Ionicons name={link.icon as any} size={20} color={link.color} />
            </View>
            <Text style={styles.quickLinkText}>{link.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {profile.social_links && Object.keys(profile.social_links).length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Social</Text>
          <View style={styles.socialRow}>
            {Object.entries(profile.social_links).map(([platform, url]) => (
              <TouchableOpacity key={platform} style={styles.socialChip} onPress={() => {}}>
                <Ionicons name="link-outline" size={12} color="#00d4ff" />
                <Text style={styles.socialChipText}>{platform}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {stats && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Creator Stats</Text>
          <View style={styles.creatorStats}>
            <View style={styles.creatorStat}>
              <Text style={styles.creatorStatNum}>{stats.total_tips.toFixed(2)}</Text>
              <Text style={styles.creatorStatLabel}>Tips (KES)</Text>
            </View>
            <View style={styles.creatorStat}>
              <Text style={styles.creatorStatNum}>{stats.total_subscribers}</Text>
              <Text style={styles.creatorStatLabel}>Subscribers</Text>
            </View>
            <View style={styles.creatorStat}>
              <Text style={styles.creatorStatNum}>{stats.total_views}</Text>
              <Text style={styles.creatorStatLabel}>Total Views</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { justifyContent: 'center', alignItems: 'center', padding: 24 },
  errorText: { color: '#ff4444', fontSize: 14, marginTop: 12, textAlign: 'center' },
  retryBtn: { marginTop: 16, backgroundColor: '#222', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  retryText: { color: '#00d4ff', fontWeight: '700' },

  coverContainer: { width: SCREEN_W, height: 180, position: 'relative' },
  coverImage: { width: '100%', height: '100%' },
  coverPlaceholder: { backgroundColor: '#111', justifyContent: 'center', alignItems: 'center' },
  coverOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.3)' },
  topActions: { position: 'absolute', top: Platform.OS === 'ios' ? 50 : 16, right: 16, flexDirection: 'row', gap: 12 },
  iconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },

  headerSection: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 },
  avatarWrap: { position: 'relative', alignSelf: 'flex-start', marginTop: -40 },
  avatar: { width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: '#000' },
  avatarPlaceholder: { backgroundColor: '#333', justifyContent: 'center', alignItems: 'center' },
  onlineDot: { position: 'absolute', bottom: 4, right: 4, width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: '#000' },

  nameRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 6 },
  displayName: { color: '#fff', fontSize: 20, fontWeight: '700' },
  verifiedBadge: { marginTop: 2 },
  username: { color: '#888', fontSize: 14, marginTop: 2 },
  mtaaId: { color: '#666', fontSize: 11, marginTop: 2, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  professionRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 4 },
  professionText: { color: '#aaa', fontSize: 12 },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 },
  locationText: { color: '#888', fontSize: 12 },
  bio: { color: '#aaa', fontSize: 13, marginTop: 8, lineHeight: 18 },
  website: { color: '#00d4ff', fontSize: 12, marginTop: 6 },

  metricsRow: { flexDirection: 'row', gap: 12, marginTop: 12 },
  metric: { flex: 1 },
  metricBarBg: { height: 4, backgroundColor: '#222', borderRadius: 2, overflow: 'hidden' },
  metricBarFill: { height: '100%', borderRadius: 2 },
  metricLabel: { color: '#888', fontSize: 10, marginTop: 4 },

  statsRow: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 16, borderTopWidth: 1, borderTopColor: '#1a1a1a', borderBottomWidth: 1, borderBottomColor: '#1a1a1a', marginTop: 12 },
  stat: { alignItems: 'center' },
  statNum: { color: '#fff', fontSize: 18, fontWeight: '700' },
  statLabel: { color: '#888', fontSize: 11, marginTop: 2 },

  actionRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  primaryBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#00d4ff', paddingVertical: 10, borderRadius: 20, gap: 6 },
  primaryBtnText: { color: '#000', fontWeight: '700', fontSize: 13 },
  secondaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#222', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, gap: 6, borderWidth: 1, borderColor: '#333' },
  secondaryBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },

  tabScroll: { maxHeight: 50, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  tabContainer: { paddingHorizontal: 8, gap: 4 },
  tabBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, gap: 4 },
  tabBtnActive: { backgroundColor: '#00d4ff22' },
  tabText: { color: '#888', fontSize: 12, fontWeight: '500' },
  tabTextActive: { color: '#00d4ff', fontWeight: '700' },

  tabContent: { padding: 16, minHeight: 200 },
  emptyText: { color: '#666', fontSize: 14, textAlign: 'center', marginTop: 40 },

  overview: { gap: 16 },
  quickLinksGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  quickLink: { width: (SCREEN_W - 48) / 4, alignItems: 'center', paddingVertical: 12 },
  quickLinkIcon: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  quickLinkText: { color: '#aaa', fontSize: 10, marginTop: 6, textAlign: 'center' },

  section: { marginTop: 8 },
  sectionTitle: { color: '#fff', fontSize: 14, fontWeight: '700', marginBottom: 8 },
  socialRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  socialChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, gap: 4, borderWidth: 1, borderColor: '#222' },
  socialChipText: { color: '#aaa', fontSize: 11 },

  creatorStats: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#111', borderRadius: 12, paddingVertical: 16, borderWidth: 1, borderColor: '#1a1a1a' },
  creatorStat: { alignItems: 'center' },
  creatorStatNum: { color: '#00d4ff', fontSize: 18, fontWeight: '700' },
  creatorStatLabel: { color: '#888', fontSize: 11, marginTop: 2 },
});
