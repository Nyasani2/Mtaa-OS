import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image,
  Dimensions, RefreshControl, ActivityIndicator, Platform, Alert, Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';

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

interface PostItem {
  id: string;
  content: string;
  media_url: string | null;
  media_type: 'image' | 'video' | 'audio' | 'text';
  thumbnail_url: string | null;
  video_thumbnail_url: string | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
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
        .select(`
          user_id, display_name, full_name, username, avatar_url, cover_photo_url,
          bio, city, country, profession, is_verified, mtaa_id, website, social_links,
          online_status, trust_score, completion_percentage,
          follower_count, following_count
        `)
        .eq('user_id', user.id)
        .single();
      if (pErr) throw pErr;

      let realFollowers = prof.follower_count ?? 0;
      let realFollowing = prof.following_count ?? 0;

      try {
        const { count: followersCount } = await supabase
          .from('streets_follows')
          .select('*', { count: 'exact', head: true })
          .eq('following_id', user.id);
        if (followersCount !== null) realFollowers = followersCount;
      } catch { /* fallback */ }

      try {
        const { count: followingCount } = await supabase
          .from('streets_follows')
          .select('*', { count: 'exact', head: true })
          .eq('follower_id', user.id);
        if (followingCount !== null) realFollowing = followingCount;
      } catch { /* fallback */ }

      setProfile({
        ...prof,
        follower_count: realFollowers,
        following_count: realFollowing,
      });
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

  // FIXED: Social links now actually Open and Copy
  const handleSocialPress = (platform: string, url: string) => {
    if (!url) { Alert.alert(platform, 'No URL set'); return; }
    Alert.alert(platform, url, [
      { text: 'Open', onPress: () => Linking.openURL(url).catch(() => Alert.alert('Error', 'Could not open URL')) },
      { text: 'Copy', onPress: () => Clipboard.setStringAsync(url).then(() => Alert.alert('Copied', `${platform} URL copied to clipboard`)) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  // FIXED: Avatar press now routes to edit (Change Photo) and shows photo viewer (View Photo)
  const handleAvatarPress = () => {
    Alert.alert('Profile Photo', 'Choose an action', [
      { text: 'Change Photo', onPress: () => router.push('/(os)/profile/edit') },
      { text: 'View Photo', onPress: () => {
        if (profile?.avatar_url) {
          router.push({ pathname: '/(os)/profile/photo-viewer', params: { url: profile.avatar_url } } as any);
        } else {
          Alert.alert('No Photo', 'Upload a profile photo first');
        }
      }},
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview': return <OverviewTab profile={profile} onSocialPress={handleSocialPress} />;
      case 'posts': return <PostsTab userId={user?.id} />;
      case 'videos': return <VideosTab userId={user?.id} />;
      case 'photos': return <PhotosTab userId={user?.id} />;
      case 'saved': return <SavedTab userId={user?.id} />;
      case 'likes': return <LikesTab userId={user?.id} />;
      case 'activity': return <ActivityTab userId={user?.id} />;
      default: return <OverviewTab profile={profile} onSocialPress={handleSocialPress} />;
    }
  };

  if (loading) return (
    <View style={[styles.container, styles.center]}>
      <ActivityIndicator size="large" color="#2563EB" />
      <Text style={styles.loadingText}>Loading profile...</Text>
    </View>
  );

  if (error || !profile) return (
    <View style={[styles.container, styles.center]}>
      <Ionicons name="alert-circle" size={48} color="#ef4444" />
      <Text style={styles.errorText}>{error || 'Profile not found'}</Text>
      <TouchableOpacity style={styles.retryBtn} onPress={fetchProfile}>
        <Text style={styles.retryText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );

  const displayName = getDisplayName(profile);

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchProfile(); }} tintColor="#2563EB" />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.coverContainer}>
          {profile.cover_photo_url ? (
            <Image source={{ uri: profile.cover_photo_url }} style={styles.coverPhoto} />
          ) : (
            <LinearGradient colors={['#667eea', '#764ba2']} style={styles.coverPhoto} />
          )}
        </View>

        <View style={styles.headerSection}>
          <View style={styles.avatarRow}>
            <TouchableOpacity onPress={handleAvatarPress} activeOpacity={0.8}>
              <View style={styles.avatarWrapper}>
                {profile.avatar_url ? (
                  <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, styles.avatarFallback]}>
                    <Text style={styles.avatarInitial}>{displayName.charAt(0).toUpperCase()}</Text>
                  </View>
                )}
                <View style={styles.cameraBadge}>
                  <Ionicons name="camera" size={14} color="#fff" />
                </View>
              </View>
            </TouchableOpacity>
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.headerBtn} onPress={() => router.push('/(os)/profile/edit')}>
                <Ionicons name="create-outline" size={18} color="#1e293b" />
                <Text style={styles.headerBtnText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerBtn} onPress={() => router.push('/(os)/settings')}>
                <Ionicons name="settings-outline" size={18} color="#1e293b" />
              </TouchableOpacity>
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
            {profile.profession && (
              <View style={styles.metaItem}>
                <Ionicons name="briefcase-outline" size={13} color="#64748b" />
                <Text style={styles.metaText}>{profile.profession}</Text>
              </View>
            )}
            {(profile.city || profile.country) && (
              <View style={styles.metaItem}>
                <Ionicons name="location-outline" size={13} color="#64748b" />
                <Text style={styles.metaText}>{[profile.city, profile.country].filter(Boolean).join(', ')}</Text>
              </View>
            )}
            {profile.website && (
              <View style={styles.metaItem}>
                <Ionicons name="link-outline" size={13} color="#64748b" />
                <Text style={styles.metaText} numberOfLines={1}>{profile.website}</Text>
              </View>
            )}
          </View>

          <View style={styles.statsRow}>
            {/* FIXED: Followers now routes to real screen */}
            <TouchableOpacity style={styles.statItem} onPress={() => router.push('/(os)/profile/followers')}>
              <Text style={styles.statNumber}>{profile.follower_count || 0}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </TouchableOpacity>
            {/* FIXED: Following now routes to real screen */}
            <TouchableOpacity style={styles.statItem} onPress={() => router.push('/(os)/profile/following')}>
              <Text style={styles.statNumber}>{profile.following_count || 0}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </TouchableOpacity>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{profile.trust_score || 0}</Text>
              <Text style={styles.statLabel}>Trust</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{profile.completion_percentage || 0}%</Text>
              <Text style={styles.statLabel}>Complete</Text>
            </View>
          </View>

          <View style={styles.actionRow}>
            {/* FIXED: QR routes to real screen */}
            <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/(os)/profile/qr')}>
              <Ionicons name="qr-code-outline" size={18} color="#2563EB" />
              <Text style={styles.actionBtnText}>QR</Text>
            </TouchableOpacity>
            {/* FIXED: Creator Dashboard routes to real screen */}
            <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/(os)/profile/creator/dashboard')}>
              <Ionicons name="stats-chart-outline" size={18} color="#2563EB" />
              <Text style={styles.actionBtnText}>Dashboard</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/(os)/profile/reputation')}>
              <Ionicons name="shield-checkmark-outline" size={18} color="#2563EB" />
              <Text style={styles.actionBtnText}>Rep</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/(os)/profile/assets')}>
              <Ionicons name="cube-outline" size={18} color="#2563EB" />
              <Text style={styles.actionBtnText}>Assets</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsContainer} contentContainerStyle={styles.tabsContent}>
          {TAB_ITEMS.map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              onPress={() => handleTabPress(tab.key)}
            >
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
            <View style={[styles.quickLinkIcon, { backgroundColor: link.color + '15' }]}>
              <Ionicons name={link.icon as any} size={22} color={link.color} />
            </View>
            <Text style={styles.quickLinkText}>{link.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {profile.social_links && Object.keys(profile.social_links).length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Social</Text>
          <View style={styles.socialRow}>
            {Object.entries(profile.social_links).map(([platform, url]) => (
              <TouchableOpacity key={platform} style={styles.socialChip} onPress={() => onSocialPress(platform, url as string)}>
                <Ionicons name={getSocialIcon(platform)} size={14} color="#2563EB" />
                <Text style={styles.socialText}>{platform}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}
    </View>
  );
}

function PostsTab({ userId }: { userId?: string }) {
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    supabase
      .from('streets_posts')
      .select('id, content, media_url, media_type, thumbnail_url, video_thumbnail_url, likes_count, comments_count, created_at')
      .eq('creator_id', userId)
      .order('created_at', { ascending: false })
      .limit(30)
      .then(({ data, error }) => {
        if (error) console.warn('[PostsTab]', error.message);
        setPosts(data || []);
        setLoading(false);
      });
  }, [userId]);

  if (loading) return <View style={styles.center}><ActivityIndicator color="#2563EB" /></View>;
  if (posts.length === 0) return <EmptyState icon="grid-outline" title="No posts yet" subtitle="Share your first post on Streets" action="/(os)/streets/create" />;

  return (
    <View style={styles.grid}>
      {posts.map(post => (
        <GridItem key={post.id} post={post} router={router} />
      ))}
    </View>
  );
}

function VideosTab({ userId }: { userId?: string }) {
  const [videos, setVideos] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    supabase
      .from('streets_posts')
      .select('id, content, media_url, thumbnail_url, video_thumbnail_url, likes_count, created_at')
      .eq('creator_id', userId)
      .eq('media_type', 'video')
      .order('created_at', { ascending: false })
      .limit(30)
      .then(({ data, error }) => {
        if (error) console.warn('[VideosTab]', error.message);
        setVideos(data || []);
        setLoading(false);
      });
  }, [userId]);

  if (loading) return <View style={styles.center}><ActivityIndicator color="#2563EB" /></View>;
  if (videos.length === 0) return <EmptyState icon="videocam-outline" title="No videos yet" subtitle="Upload your first video" action="/(os)/streets/create" />;

  return (
    <View style={styles.grid}>
      {videos.map(video => (
        <GridItem key={video.id} post={video} router={router} />
      ))}
    </View>
  );
}

function PhotosTab({ userId }: { userId?: string }) {
  const [photos, setPhotos] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    supabase
      .from('streets_posts')
      .select('id, media_url, likes_count, created_at')
      .eq('creator_id', userId)
      .eq('media_type', 'image')
      .order('created_at', { ascending: false })
      .limit(30)
      .then(({ data, error }) => {
        if (error) console.warn('[PhotosTab]', error.message);
        setPhotos(data || []);
        setLoading(false);
      });
  }, [userId]);

  if (loading) return <View style={styles.center}><ActivityIndicator color="#2563EB" /></View>;
  if (photos.length === 0) return <EmptyState icon="images-outline" title="No photos yet" subtitle="Share your first photo" action="/(os)/streets/create" />;

  return (
    <View style={styles.grid}>
      {photos.map(photo => (
        <GridItem key={photo.id} post={photo} router={router} />
      ))}
    </View>
  );
}

function SavedTab({ userId }: { userId?: string }) {
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    supabase
      .from('streets_saves')
      .select('post_id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(30)
      .then(async ({ data: saves, error }) => {
        if (error || !saves?.length) { setPosts([]); setLoading(false); return; }
        const postIds = saves.map(s => s.post_id);
        const { data } = await supabase
          .from('streets_posts')
          .select('id, content, media_url, media_type, thumbnail_url, video_thumbnail_url, likes_count, comments_count, created_at')
          .in('id', postIds);
        setPosts(data || []);
        setLoading(false);
      });
  }, [userId]);

  if (loading) return <View style={styles.center}><ActivityIndicator color="#2563EB" /></View>;
  if (posts.length === 0) return <EmptyState icon="bookmark-outline" title="No saved items" subtitle="Save posts to see them here" />;

  return (
    <View style={styles.grid}>
      {posts.map(post => <GridItem key={post.id} post={post} router={router} />)}
    </View>
  );
}

function LikesTab({ userId }: { userId?: string }) {
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    supabase
      .from('streets_likes')
      .select('post_id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(30)
      .then(async ({ data: likes, error }) => {
        if (error || !likes?.length) { setPosts([]); setLoading(false); return; }
        const postIds = likes.map(l => l.post_id);
        const { data } = await supabase
          .from('streets_posts')
          .select('id, content, media_url, media_type, thumbnail_url, video_thumbnail_url, likes_count, comments_count, created_at')
          .in('id', postIds);
        setPosts(data || []);
        setLoading(false);
      });
  }, [userId]);

  if (loading) return <View style={styles.center}><ActivityIndicator color="#2563EB" /></View>;
  if (posts.length === 0) return <EmptyState icon="heart-outline" title="No liked posts" subtitle="Like posts to see them here" />;

  return (
    <View style={styles.grid}>
      {posts.map(post => <GridItem key={post.id} post={post} router={router} />)}
    </View>
  );
}

function ActivityTab({ userId }: { userId?: string }) {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    Promise.all([
      supabase.from('streets_likes').select('post_id, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(10),
      supabase.from('streets_comments').select('post_id, content, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(10),
      supabase.from('streets_follows').select('following_id, created_at').eq('follower_id', userId).order('created_at', { ascending: false }).limit(10),
    ]).then(([likes, comments, follows]) => {
      const acts = [
        ...(likes.data || []).map(l => ({ type: 'like', ...l, time: l.created_at })),
        ...(comments.data || []).map(c => ({ type: 'comment', ...c, time: c.created_at })),
        ...(follows.data || []).map(f => ({ type: 'follow', ...f, time: f.created_at })),
      ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
      setActivities(acts);
      setLoading(false);
    });
  }, [userId]);

  if (loading) return <View style={styles.center}><ActivityIndicator color="#2563EB" /></View>;

  return (
    <View style={{ paddingVertical: 8 }}>
      {activities.map((act, i) => (
        <View key={i} style={styles.activityRow}>
          <Ionicons
            name={act.type === 'like' ? 'heart' : act.type === 'comment' ? 'chatbubble' : 'person-add'}
            size={18}
            color={act.type === 'like' ? '#ff2d55' : act.type === 'comment' ? '#2563EB' : '#059669'}
          />
          <Text style={styles.activityText}>
            {act.type === 'like' ? 'Liked a post' : act.type === 'comment' ? `Commented: "${act.content}"` : 'Followed a user'}
          </Text>
        </View>
      ))}
    </View>
  );
}

function GridItem({ post, router }: { post: PostItem; router: any }) {
  const getBestThumbnail = (): string | null => {
    if (post.media_type === 'image') return post.media_url;
    if (post.media_type === 'video') {
      return post.video_thumbnail_url || post.thumbnail_url || post.media_url;
    }
    return null;
  };

  const thumbnail = getBestThumbnail();
  const isVideo = post.media_type === 'video';
  const isText = post.media_type === 'text' || (!post.media_url && post.content);

  return (
    <TouchableOpacity
      style={styles.gridItem}
      onPress={() => router.push(`/(os)/streets/post/${post.id}` as any)}
      activeOpacity={0.8}
    >
      {isText ? (
        <LinearGradient colors={getGradientColors(post.id)} style={styles.gridImage}>
          <Text style={styles.gridTextContent} numberOfLines={4}>{post.content}</Text>
        </LinearGradient>
      ) : thumbnail ? (
        <Image source={{ uri: thumbnail }} style={styles.gridImage} resizeMode="cover" />
      ) : (
        <View style={[styles.gridImage, { backgroundColor: '#1e293b', justifyContent: 'center', alignItems: 'center' }]}>
          <Ionicons name={isVideo ? 'videocam' : 'image'} size={24} color="#475569" />
        </View>
      )}

      {isVideo && (
        <View style={styles.gridPlayOverlay}>
          <Ionicons name="play" size={20} color="#fff" />
        </View>
      )}

      <View style={styles.gridBadge}>
        <Ionicons name="heart" size={10} color="#fff" />
        <Text style={styles.gridBadgeText}>{post.likes_count || 0}</Text>
      </View>
    </TouchableOpacity>
  );
}

function EmptyState({ icon, title, subtitle, action }: { icon: string; title: string; subtitle: string; action?: string }) {
  const router = useRouter();
  return (
    <View style={styles.emptyContainer}>
      <Ionicons name={icon as any} size={48} color="#cbd5e1" />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptySubtitle}>{subtitle}</Text>
      {action && (
        <TouchableOpacity style={styles.emptyButton} onPress={() => router.push(action as any)}>
          <Text style={styles.emptyButtonText}>Create</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = { online: '#22c55e', away: '#f59e0b', offline: '#94a3b8', invisible: '#cbd5e1' };
  return colors[status] || '#94a3b8';
}

function getSocialIcon(platform: string): string {
  const icons: Record<string, string> = {
    twitter: 'logo-twitter', x: 'logo-twitter', facebook: 'logo-facebook',
    instagram: 'logo-instagram', linkedin: 'logo-linkedin', youtube: 'logo-youtube',
    tiktok: 'musical-notes', github: 'logo-github', website: 'globe-outline',
  };
  return icons[platform.toLowerCase()] || 'link-outline';
}

function getGradientColors(postId: string): [string, string] {
  const gradients: [string, string][] = [
    ['#667eea', '#764ba2'], ['#f093fb', '#f5576c'], ['#4facfe', '#00f2fe'],
    ['#43e97b', '#38f9d7'], ['#fa709a', '#fee140'], ['#30cfd0', '#330867'],
    ['#ff9a9e', '#fecfef'], ['#fbc2eb', '#a6c1ee'],
  ];
  let hash = 0;
  for (let i = 0; i < postId.length; i++) hash = postId.charCodeAt(i) + ((hash << 5) - hash);
  return gradients[Math.abs(hash) % gradients.length];
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
  avatarFallback: { justifyContent: 'center', alignItems: 'center', backgroundColor: '#2563EB' },
  avatarInitial: { color: '#fff', fontSize: 32, fontWeight: '700' },
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
  gridImage: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', padding: 6 },
  gridTextContent: { color: '#fff', fontSize: 11, fontWeight: '600', textAlign: 'center', lineHeight: 16 },
  gridPlayOverlay: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.5)', width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  gridBadge: { position: 'absolute', bottom: 6, left: 6, flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 },
  gridBadgeText: { color: '#fff', fontSize: 10, fontWeight: '600' },

  activityRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  activityText: { color: '#334155', fontSize: 13, flex: 1 },

  emptyContainer: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { color: '#64748b', fontSize: 16, marginTop: 16, fontWeight: '600' },
  emptySubtitle: { color: '#94a3b8', fontSize: 13, marginTop: 6 },
  emptyButton: { marginTop: 16, backgroundColor: '#2563EB', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20 },
  emptyButtonText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
