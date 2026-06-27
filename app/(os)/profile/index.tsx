import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image,
  Dimensions, RefreshControl, ActivityIndicator, Platform, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

const { width: SCREEN_W } = Dimensions.get('window');

interface ProfileData {
  user_id: string;
  display_name: string | null;
  full_name: string | null;
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

const TAB_ITEMS = [
  { key: 'overview', label: 'Overview', icon: 'person-outline' },
  { key: 'posts', label: 'Posts', icon: 'grid-outline' },
  { key: 'videos', label: 'Videos', icon: 'videocam-outline' },
  { key: 'photos', label: 'Photos', icon: 'images-outline' },
  { key: 'marketplace', label: 'Market', icon: 'storefront-outline' },
  { key: 'jobs', label: 'Jobs', icon: 'briefcase-outline' },
  { key: 'business', label: 'Business', icon: 'business-outline' },
  { key: 'education', label: 'Edu', icon: 'school-outline' },
  { key: 'health', label: 'Health', icon: 'medical-outline' },
  { key: 'wallet', label: 'Wallet', icon: 'wallet-outline' },
  { key: 'saved', label: 'Saved', icon: 'bookmark-outline' },
  { key: 'likes', label: 'Likes', icon: 'heart-outline' },
  { key: 'achievements', label: 'Awards', icon: 'trophy-outline' },
  { key: 'activity', label: 'Activity', icon: 'pulse-outline' },
] as const;

type TabKey = typeof TAB_ITEMS[number]['key'];

export default function ProfileScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [error, setError] = useState<string | null>(null);

  const getDisplayName = (p: ProfileData | null): string => {
    if (!p) return 'MTAA User';
    return p.display_name?.trim() || p.full_name?.trim() || p.username?.trim() || 'MTAA User';
  };

  const fetchProfile = useCallback(async () => {
    if (!user?.id) { setError('Not authenticated'); setLoading(false); return; }
    setError(null);
    try {
      const { data: prof, error: pErr } = await supabase
        .from('profiles')
        .select(`user_id, display_name, full_name, username, avatar_url, cover_photo_url, bio, city, country, profession, is_verified, follower_count, following_count, completion_percentage, trust_score, online_status, mtaa_id, website, social_links`)
        .eq('user_id', user.id)
        .single();
      if (pErr) throw pErr;
      setProfile(prof);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); setRefreshing(false); }
  }, [user?.id]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const handleTabPress = (tab: TabKey) => {
    setActiveTab(tab);
    if (tab === 'marketplace') router.push('/(commerce)/marketplace');
    if (tab === 'jobs') router.push('/(work)/jobs');
    if (tab === 'business') router.push('/(os)/profile/business');
    if (tab === 'education') router.push('/(education)');
    if (tab === 'health') router.push('/(os)/health');
    if (tab === 'wallet') router.push('/(os)/wallet');
    if (tab === 'achievements') router.push('/(os)/profile/achievements');
  };

  const handleSocialPress = (platform: string, url: string) => {
    if (!url) { Alert.alert(platform, 'No URL set'); return; }
    Alert.alert(platform, url, [
      { text: 'Open', onPress: () => {} },
      { text: 'Copy', onPress: () => {} },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleAvatarPress = () => {
    Alert.alert('Profile Photo', 'Choose an action', [
      { text: 'Change Photo', onPress: () => router.push('/(os)/profile/edit') },
      { text: 'View Photo', onPress: () => {} },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview': return <OverviewTab profile={profile} onSocialPress={handleSocialPress} />;
      case 'posts': return <PostsTab userId={user?.id} />;
      case 'videos': return <VideosTab userId={user?.id} />;
      case 'photos': return <PhotosTab userId={user?.id} />;
      case 'saved': return <SavedTab />;
      case 'likes': return <LikesTab />;
      case 'activity': return <ActivityTab />;
      default: return <OverviewTab profile={profile} onSocialPress={handleSocialPress} />;
    }
  };

  if (loading) return <View style={[styles.container, styles.center]}><ActivityIndicator size="large" color="#2563EB" /><Text style={styles.loadingText}>Loading profile...</Text></View>;
  if (error || !profile) return <View style={[styles.container, styles.center]}><Ionicons name="alert-circle" size={48} color="#ef4444" /><Text style={styles.errorText}>{error || 'Profile not found'}</Text><TouchableOpacity style={styles.retryBtn} onPress={fetchProfile}><Text style={styles.retryText}>Retry</Text></TouchableOpacity></View>;

  const displayName = getDisplayName(profile);

  return (
    <View style={styles.container}>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchProfile(); }} tintColor="#2563EB" />} showsVerticalScrollIndicator={false}>
        <View style={styles.coverContainer}>
          {profile.cover_photo_url ? <Image source={{ uri: profile.cover_photo_url }} style={styles.coverPhoto} /> : <View style={[styles.coverPhoto, { backgroundColor: '#e2e8f0' }]} />}
        </View>
        <View style={styles.headerSection}>
          <View style={styles.avatarRow}>
            <TouchableOpacity onPress={handleAvatarPress} activeOpacity={0.8}>
              <View style={styles.avatarWrapper}>
                {profile.avatar_url ? <Image source={{ uri: profile.avatar_url }} style={styles.avatar} /> : <View style={[styles.avatar, styles.avatarFallback]}><Ionicons name="person" size={40} color="#94a3b8" /></View>}
                <View style={styles.cameraBadge}><Ionicons name="camera" size={14} color="#fff" /></View>
              </View>
            </TouchableOpacity>
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.headerBtn} onPress={() => router.push('/(os)/profile/edit')}><Ionicons name="create-outline" size={18} color="#1e293b" /><Text style={styles.headerBtnText}>Edit</Text></TouchableOpacity>
              <TouchableOpacity style={styles.headerBtn} onPress={() => router.push('/(os)/settings')}><Ionicons name="settings-outline" size={18} color="#1e293b" /></TouchableOpacity>
            </View>
          </View>
          <View style={styles.nameRow}>
            <Text style={styles.displayName}>{displayName}</Text>
            {profile.is_verified && <Ionicons name="checkmark-circle" size={18} color="#2563EB" style={{ marginLeft: 6 }} />}
            <View style={[styles.statusDot, { backgroundColor: getStatusColor(profile.online_status) }]} />
          </View>
          <Text style={styles.username}>@{profile.username || 'username'}</Text>
          {profile.mtaa_id && <Text style={styles.mtaaId}>MTAA ID: {profile.mtaa_id}</Text>}
          {profile.bio && <Text style={styles.bio}>{profile.bio}</Text>}
          <View style={styles.metaRow}>
            {profile.profession && <View style={styles.metaItem}><Ionicons name="briefcase-outline" size={13} color="#64748b" /><Text style={styles.metaText}>{profile.profession}</Text></View>}
            {(profile.city || profile.country) && <View style={styles.metaItem}><Ionicons name="location-outline" size={13} color="#64748b" /><Text style={styles.metaText}>{[profile.city, profile.country].filter(Boolean).join(', ')}</Text></View>}
            {profile.website && <View style={styles.metaItem}><Ionicons name="link-outline" size={13} color="#64748b" /><Text style={styles.metaText}>{profile.website}</Text></View>}
          </View>
          <View style={styles.statsRow}>
            <TouchableOpacity style={styles.statItem} onPress={() => router.push('/(os)/profile/followers')}><Text style={styles.statNumber}>{profile.follower_count || 0}</Text><Text style={styles.statLabel}>Followers</Text></TouchableOpacity>
            <TouchableOpacity style={styles.statItem} onPress={() => router.push('/(os)/profile/following')}><Text style={styles.statNumber}>{profile.following_count || 0}</Text><Text style={styles.statLabel}>Following</Text></TouchableOpacity>
            <View style={styles.statItem}><Text style={styles.statNumber}>{profile.trust_score || 0}</Text><Text style={styles.statLabel}>Trust</Text></View>
            <View style={styles.statItem}><Text style={styles.statNumber}>{profile.completion_percentage || 0}%</Text><Text style={styles.statLabel}>Complete</Text></View>
          </View>
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/(os)/profile/qr')}><Ionicons name="qr-code-outline" size={18} color="#2563EB" /><Text style={styles.actionBtnText}>QR</Text></TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/(os)/profile/creator/dashboard')}><Ionicons name="stats-chart-outline" size={18} color="#2563EB" /><Text style={styles.actionBtnText}>Dashboard</Text></TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/(os)/profile/reputation')}><Ionicons name="shield-checkmark-outline" size={18} color="#2563EB" /><Text style={styles.actionBtnText}>Rep</Text></TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/(os)/profile/assets')}><Ionicons name="cube-outline" size={18} color="#2563EB" /><Text style={styles.actionBtnText}>Assets</Text></TouchableOpacity>
          </View>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsContainer} contentContainerStyle={styles.tabsContent}>
          {TAB_ITEMS.map(tab => (
            <TouchableOpacity key={tab.key} style={[styles.tab, activeTab === tab.key && styles.tabActive]} onPress={() => handleTabPress(tab.key)}>
              <Ionicons name={tab.icon as any} size={16} color={activeTab === tab.key ? '#2563EB' : '#64748b'} />
              <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <View style={styles.tabContent}>{renderTabContent()}</View>
      </ScrollView>
    </View>
  );
}

function OverviewTab({ profile, onSocialPress }: { profile: ProfileData | null; onSocialPress: (p: string, u: string) => void }) {
  const router = useRouter();
  if (!profile) return null;
  const quickLinks = [
    { label: 'Creator', icon: 'videocam-outline', route: '/(os)/profile/creator', color: '#7c3aed' },
    { label: 'Business', icon: 'business-outline', route: '/(os)/profile/business', color: '#2563EB' },
    { label: 'Professional', icon: 'briefcase-outline', route: '/(os)/profile/professional', color: '#d97706' },
    { label: 'Documents', icon: 'document-text-outline', route: '/(os)/profile/documents', color: '#059669' },
    { label: 'Family', icon: 'people-outline', route: '/(os)/profile/family', color: '#dc2626' },
    { label: 'Analytics', icon: 'analytics-outline', route: '/(os)/profile/analytics', color: '#7c3aed' },
  ];
  return (
    <View style={styles.overviewContainer}>
      <Text style={styles.sectionTitle}>Quick Links</Text>
      <View style={styles.quickLinksGrid}>
        {quickLinks.map(link => (
          <TouchableOpacity key={link.label} style={styles.quickLink} onPress={() => router.push(link.route as any)}>
            <View style={[styles.quickLinkIcon, { backgroundColor: link.color + '15' }]}><Ionicons name={link.icon as any} size={22} color={link.color} /></View>
            <Text style={styles.quickLinkText}>{link.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {profile.social_links && Object.keys(profile.social_links).length > 0 && (
        <><Text style={styles.sectionTitle}>Social</Text><View style={styles.socialRow}>
          {Object.entries(profile.social_links).map(([platform, url]) => (
            <TouchableOpacity key={platform} style={styles.socialChip} onPress={() => onSocialPress(platform, url as string)}>
              <Ionicons name={getSocialIcon(platform)} size={14} color="#2563EB" /><Text style={styles.socialText}>{platform}</Text>
            </TouchableOpacity>
          ))}
        </View></>
      )}
    </View>
  );
}

function PostsTab({ userId }: { userId?: string }) {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    supabase.from('streets_posts').select('id, content, media_url, media_type, thumbnail_url, created_at').eq('creator_id', userId).order('created_at', { ascending: false }).limit(20)
      .then(({ data, error }) => { if (error) console.warn('[PostsTab]', error.message); setPosts(data || []); setLoading(false); });
  }, [userId]);
  if (loading) return <View style={styles.center}><ActivityIndicator color="#2563EB" /></View>;
  if (posts.length === 0) return <EmptyState icon="grid-outline" title="No posts yet" subtitle="Share your first post on Streets" action="/streets/create" />;
  return (
    <View style={styles.grid}>
      {posts.map(post => (
        <TouchableOpacity key={post.id} style={styles.gridItem} onPress={() => router.push(`/streets/post/${post.id}` as any)}>
          {post.media_url && post.media_type === 'image' ? (
            <Image source={{ uri: post.media_url }} style={styles.gridImage} resizeMode="cover" />
          ) : post.media_type === 'video' ? (
            <View style={[styles.gridImage, { backgroundColor: '#1e293b', justifyContent: 'center', alignItems: 'center' }]}>
              {post.thumbnail_url ? <Image source={{ uri: post.thumbnail_url }} style={StyleSheet.absoluteFill} resizeMode="cover" /> : null}
              <View style={styles.playOverlay}><Ionicons name="play-circle" size={32} color="#fff" /></View>
            </View>
          ) : (
            <View style={[styles.gridImage, { backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center', padding: 8 }]}>
              <Text style={{ color: '#64748b', fontSize: 11 }} numberOfLines={3}>{post.content}</Text>
            </View>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
}

function VideosTab({ userId }: { userId?: string }) {
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    supabase.from('streets_posts').select('id, content, media_url, thumbnail_url, created_at').eq('creator_id', userId).eq('media_type', 'video').order('created_at', { ascending: false }).limit(20)
      .then(({ data, error }) => { if (error) console.warn('[VideosTab]', error.message); setVideos(data || []); setLoading(false); });
  }, [userId]);
  if (loading) return <View style={styles.center}><ActivityIndicator color="#2563EB" /></View>;
  if (videos.length === 0) return <EmptyState icon="videocam-outline" title="No videos yet" subtitle="Upload your first video" action="/streets/create" />;
  return (
    <View style={styles.grid}>
      {videos.map(video => (
        <View key={video.id} style={styles.gridItem}>
          <Image source={{ uri: video.thumbnail_url || video.media_url || 'https://via.placeholder.com/300' }} style={styles.gridImage} resizeMode="cover" />
          <View style={styles.playOverlay}><Ionicons name="play-circle" size={32} color="#fff" /></View>
        </View>
      ))}
    </View>
  );
}

function PhotosTab({ userId }: { userId?: string }) {
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    supabase.from('streets_posts').select('id, media_url, created_at').eq('creator_id', userId).eq('media_type', 'image').order('created_at', { ascending: false }).limit(20)
      .then(({ data, error }) => { if (error) console.warn('[PhotosTab]', error.message); setPhotos(data || []); setLoading(false); });
  }, [userId]);
  if (loading) return <View style={styles.center}><ActivityIndicator color="#2563EB" /></View>;
  if (photos.length === 0) return <EmptyState icon="images-outline" title="No photos yet" subtitle="Share your first photo" action="/streets/create" />;
  return (
    <View style={styles.grid}>
      {photos.map(photo => <View key={photo.id} style={styles.gridItem}><Image source={{ uri: photo.media_url }} style={styles.gridImage} resizeMode="cover" /></View>)}
    </View>
  );
}

function SavedTab() { return <EmptyState icon="bookmark-outline" title="No saved items" subtitle="Save posts to see them here" />; }
function LikesTab() { return <EmptyState icon="heart-outline" title="No liked posts" subtitle="Like posts to see them here" />; }
function ActivityTab() { return <EmptyState icon="pulse-outline" title="No recent activity" subtitle="Your activity will appear here" />; }

function EmptyState({ icon, title, subtitle, action }: { icon: string; title: string; subtitle: string; action?: string }) {
  const router = useRouter();
  return (
    <View style={styles.emptyContainer}>
      <Ionicons name={icon as any} size={48} color="#cbd5e1" />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptySubtitle}>{subtitle}</Text>
      {action && <TouchableOpacity style={styles.emptyButton} onPress={() => router.push(action as any)}><Text style={styles.emptyButtonText}>Create</Text></TouchableOpacity>}
    </View>
  );
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = { online: '#22c55e', away: '#f59e0b', offline: '#94a3b8', invisible: '#cbd5e1' };
  return colors[status] || '#94a3b8';
}

function getSocialIcon(platform: string): string {
  const icons: Record<string, string> = { twitter: 'logo-twitter', x: 'logo-twitter', facebook: 'logo-facebook', instagram: 'logo-instagram', linkedin: 'logo-linkedin', youtube: 'logo-youtube', tiktok: 'musical-notes', github: 'logo-github', website: 'globe-outline' };
  return icons[platform.toLowerCase()] || 'link-outline';
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  center: { justifyContent: 'center', alignItems: 'center', paddingVertical: 40 },
  loadingText: { color: '#64748b', marginTop: 12, fontSize: 14 },
  errorText: { color: '#ef4444', marginTop: 12, fontSize: 14 },
  retryBtn: { marginTop: 16, backgroundColor: '#2563EB', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20 },
  retryText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  coverContainer: { width: SCREEN_W, height: 180, position: 'relative' },
  coverPhoto: { width: '100%', height: '100%' },
  headerSection: { paddingHorizontal: 16, paddingTop: 8, marginTop: -40 },
  avatarRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  avatarWrapper: { position: 'relative' },
  avatar: { width: 90, height: 90, borderRadius: 45, borderWidth: 4, borderColor: '#fff', backgroundColor: '#f1f5f9' },
  avatarFallback: { justifyContent: 'center', alignItems: 'center' },
  cameraBadge: { position: 'absolute', bottom: 2, right: 2, backgroundColor: '#2563EB', width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
  headerActions: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  headerBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, gap: 6, borderWidth: 1, borderColor: '#e2e8f0' },
  headerBtnText: { color: '#1e293b', fontSize: 13, fontWeight: '600' },
  nameRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  displayName: { color: '#0f172a', fontSize: 22, fontWeight: '800' },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginLeft: 8, borderWidth: 2, borderColor: '#fff' },
  username: { color: '#64748b', fontSize: 14, marginTop: 2 },
  mtaaId: { color: '#2563EB', fontSize: 11, marginTop: 2, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  bio: { color: '#334155', fontSize: 14, marginTop: 10, lineHeight: 20 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 10 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { color: '#64748b', fontSize: 12 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 16, paddingVertical: 12, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#e2e8f0' },
  statItem: { alignItems: 'center' },
  statNumber: { color: '#0f172a', fontSize: 18, fontWeight: '700' },
  statLabel: { color: '#64748b', fontSize: 12, marginTop: 2 },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', paddingVertical: 10, borderRadius: 10, gap: 6, borderWidth: 1, borderColor: '#e2e8f0' },
  actionBtnText: { color: '#1e293b', fontSize: 12, fontWeight: '600' },
  tabsContainer: { marginTop: 16, maxHeight: 50 },
  tabsContent: { paddingHorizontal: 12, gap: 6 },
  tab: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f8fafc', gap: 6, borderWidth: 1, borderColor: '#e2e8f0' },
  tabActive: { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' },
  tabText: { color: '#64748b', fontSize: 12, fontWeight: '500' },
  tabTextActive: { color: '#2563EB', fontWeight: '600' },
  tabContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 },
  overviewContainer: { paddingBottom: 20 },
  sectionTitle: { color: '#0f172a', fontSize: 16, fontWeight: '700', marginBottom: 12, marginTop: 8 },
  quickLinksGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  quickLink: { width: (SCREEN_W - 52) / 3, alignItems: 'center', paddingVertical: 14, backgroundColor: '#f8fafc', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  quickLinkIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  quickLinkText: { color: '#0f172a', fontSize: 12, fontWeight: '500' },
  socialRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  socialChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, gap: 6, borderWidth: 1, borderColor: '#e2e8f0' },
  socialText: { color: '#334155', fontSize: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 2 },
  gridItem: { width: (SCREEN_W - 36) / 3, height: (SCREEN_W - 36) / 3, backgroundColor: '#f1f5f9', borderRadius: 4, overflow: 'hidden', position: 'relative' },
  gridImage: { width: '100%', height: '100%' },
  playOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { color: '#64748b', fontSize: 16, marginTop: 16, fontWeight: '600' },
  emptySubtitle: { color: '#94a3b8', fontSize: 13, marginTop: 6 },
  emptyButton: { marginTop: 16, backgroundColor: '#2563EB', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20 },
  emptyButtonText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
