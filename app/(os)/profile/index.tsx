import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image,
  RefreshControl, ActivityIndicator, Alert, Dimensions,
  FlatList, Animated
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';
import {
  User, Settings, ChevronRight, Shield, Award, Briefcase,
  Users, QrCode, TrendingUp, Edit3, LogOut, CreditCard,
  MessageCircle, Bell, MapPin, Link as LinkIcon, Star, Copy,
  Menu, X, Play, Heart
} from 'lucide-react-native';

let Clipboard: any = null;
try { Clipboard = require('expo-clipboard'); } catch { Clipboard = null; }

const { width: SCREEN_W } = Dimensions.get('window');
const SIDEBAR_W = Math.min(300, SCREEN_W * 0.82);
const COLS = 3;
const GAP = 1;
const THUMB = (SCREEN_W - (COLS - 1) * GAP) / COLS;

interface ProfileData {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
  website: string | null;
  verified: boolean;
  followers_count: number;
  following_count: number;
  posts_count: number;
  reputation_score: number;
}

interface PostItem {
  id: string;
  caption: string | null;
  media_url: string | null;
  created_at: string;
  like_count: number;
  view_count: number;
  is_video: boolean;
  source: 'streets' | 'studio' | 'mstudio' | 'unknown';
}

function getFallbackProfile(user: any): ProfileData {
  return {
    user_id: user?.id || '',
    full_name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Your Name',
    avatar_url: null, bio: null, location: null, website: null,
    verified: false, followers_count: 0, following_count: 0,
    posts_count: 0, reputation_score: 0,
  };
}

type TabKey = 'videos' | 'reposts' | 'favourites' | 'liked';

function normalizeStreetsPosts(data: any[]): PostItem[] {
  return data.map((p) => {
    const media = p.media_urls;
    const firstMedia = Array.isArray(media) ? media[0] : (typeof media === 'string' ? media : null);
    return {
      id: p.id,
      caption: p.caption || p.title || null,
      media_url: firstMedia,
      created_at: p.created_at,
      like_count: p.like_count || p.likes || 0,
      view_count: p.view_count || p.views || 0,
      is_video: !!(firstMedia || '').match(/\.(mp4|mov|avi|mkv|webm|m3u8)$/i) || !!p.is_video,
      source: 'streets',
    };
  });
}

function normalizeStudioVideos(data: any[], sourceName: 'studio' | 'mstudio'): PostItem[] {
  return data.map((p) => {
    const thumb = p.thumbnail_url || p.cover_url || p.thumb_url || p.poster_url ||
                  (Array.isArray(p.media_urls) ? p.media_urls[0] : null) ||
                  p.video_url || p.url || null;
    return {
      id: p.id,
      caption: p.title || p.caption || p.name || 'Video',
      media_url: thumb,
      created_at: p.created_at || p.uploaded_at || p.published_at || new Date().toISOString(),
      like_count: p.like_count || p.likes || 0,
      view_count: p.view_count || p.views || p.play_count || 0,
      is_video: true,
      source: sourceName,
    };
  });
}

export default function ProfileIndex() {
  const router = useRouter();
  const { user, signOut } = useAuthStore();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('videos');
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const slideAnim = useRef(new Animated.Value(-SIDEBAR_W)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const displayProfile = profile || (user ? getFallbackProfile(user) : null);

  /* Fetch profile */
  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    setSyncing(true);
    const t = setTimeout(async () => {
      try {
        const { data, error } = await supabase
          .from('user_profiles').select('*')
          .eq('user_id', user.id).single();
        if (cancelled) return;
        if (data) {
          setProfile(data as ProfileData);
        } else if (error && error.code === 'PGRST116') {
          const fallback = getFallbackProfile(user);
          await supabase.from('user_profiles').upsert({
            user_id: user.id, full_name: fallback.full_name,
            avatar_url: null, bio: null, location: null, website: null,
            verified: false, followers_count: 0, following_count: 0,
            posts_count: 0, reputation_score: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id' });
          setProfile(fallback);
        }
      } catch (err) { console.error('Profile sync error:', err); }
      finally { if (!cancelled) setSyncing(false); }
    }, 100);
    return () => { cancelled = true; clearTimeout(t); };
  }, []);

  /* Fetch ALL content from multiple tables */
  const fetchPosts = useCallback(async () => {
    if (!user?.id) return;
    setPostsLoading(true);
    setDebugInfo('');
    const allPosts: PostItem[] = [];
    const logs: string[] = [];

    const uid = user.id;

    // ── streets_posts via creator_id ──
    try {
      const { data, error } = await supabase
        .from('streets_posts')
        .select('id, caption, media_urls, created_at, like_count, view_count, is_video')
        .eq('creator_id', uid)
        .order('created_at', { ascending: false })
        .limit(100);
      if (!error && data && data.length > 0) {
        allPosts.push(...normalizeStreetsPosts(data));
        logs.push(`streets_posts.creator_id: ${data.length} items`);
      } else if (error) {
        logs.push(`streets_posts.creator_id ERROR: ${error.message}`);
      } else {
        logs.push(`streets_posts.creator_id: 0 items`);
      }
    } catch (e: any) {
      logs.push(`streets_posts.creator_id EXCEPTION: ${e.message}`);
    }

    // ── streets_posts via user_id ──
    try {
      const { data, error } = await supabase
        .from('streets_posts')
        .select('id, caption, media_urls, created_at, like_count, view_count, is_video')
        .eq('user_id', uid)
        .order('created_at', { ascending: false })
        .limit(100);
      if (!error && data && data.length > 0) {
        allPosts.push(...normalizeStreetsPosts(data));
        logs.push(`streets_posts.user_id: ${data.length} items`);
      } else if (error) {
        logs.push(`streets_posts.user_id ERROR: ${error.message}`);
      } else {
        logs.push(`streets_posts.user_id: 0 items`);
      }
    } catch (e: any) {
      logs.push(`streets_posts.user_id EXCEPTION: ${e.message}`);
    }

    // ── studio_videos via creator_id ──
    try {
      const { data, error } = await supabase
        .from('studio_videos')
        .select('id, title, caption, thumbnail_url, cover_url, media_urls, video_url, url, created_at, uploaded_at, published_at, view_count, views, play_count, like_count, likes')
        .eq('creator_id', uid)
        .order('created_at', { ascending: false })
        .limit(100);
      if (!error && data && data.length > 0) {
        allPosts.push(...normalizeStudioVideos(data, 'studio'));
        logs.push(`studio_videos.creator_id: ${data.length} items`);
      } else if (error) {
        logs.push(`studio_videos.creator_id ERROR: ${error.message}`);
      } else {
        logs.push(`studio_videos.creator_id: 0 items`);
      }
    } catch (e: any) {
      logs.push(`studio_videos.creator_id EXCEPTION: ${e.message}`);
    }

    // ── studio_videos via user_id ──
    try {
      const { data, error } = await supabase
        .from('studio_videos')
        .select('id, title, caption, thumbnail_url, cover_url, media_urls, video_url, url, created_at, uploaded_at, published_at, view_count, views, play_count, like_count, likes')
        .eq('user_id', uid)
        .order('created_at', { ascending: false })
        .limit(100);
      if (!error && data && data.length > 0) {
        allPosts.push(...normalizeStudioVideos(data, 'studio'));
        logs.push(`studio_videos.user_id: ${data.length} items`);
      } else if (error) {
        logs.push(`studio_videos.user_id ERROR: ${error.message}`);
      } else {
        logs.push(`studio_videos.user_id: 0 items`);
      }
    } catch (e: any) {
      logs.push(`studio_videos.user_id EXCEPTION: ${e.message}`);
    }

    // ── mstudio_videos via creator_id ──
    try {
      const { data, error } = await supabase
        .from('mstudio_videos')
        .select('id, title, caption, thumbnail_url, cover_url, media_urls, video_url, url, created_at, uploaded_at, published_at, view_count, views, play_count, like_count, likes')
        .eq('creator_id', uid)
        .order('created_at', { ascending: false })
        .limit(100);
      if (!error && data && data.length > 0) {
        allPosts.push(...normalizeStudioVideos(data, 'mstudio'));
        logs.push(`mstudio_videos.creator_id: ${data.length} items`);
      } else if (error) {
        logs.push(`mstudio_videos.creator_id ERROR: ${error.message}`);
      } else {
        logs.push(`mstudio_videos.creator_id: 0 items`);
      }
    } catch (e: any) {
      logs.push(`mstudio_videos.creator_id EXCEPTION: ${e.message}`);
    }

    // ── mstudio_videos via user_id ──
    try {
      const { data, error } = await supabase
        .from('mstudio_videos')
        .select('id, title, caption, thumbnail_url, cover_url, media_urls, video_url, url, created_at, uploaded_at, published_at, view_count, views, play_count, like_count, likes')
        .eq('user_id', uid)
        .order('created_at', { ascending: false })
        .limit(100);
      if (!error && data && data.length > 0) {
        allPosts.push(...normalizeStudioVideos(data, 'mstudio'));
        logs.push(`mstudio_videos.user_id: ${data.length} items`);
      } else if (error) {
        logs.push(`mstudio_videos.user_id ERROR: ${error.message}`);
      } else {
        logs.push(`mstudio_videos.user_id: 0 items`);
      }
    } catch (e: any) {
      logs.push(`mstudio_videos.user_id EXCEPTION: ${e.message}`);
    }

    // ── videos table (generic) via creator_id ──
    try {
      const { data, error } = await supabase
        .from('videos')
        .select('id, title, caption, thumbnail_url, cover_url, media_urls, video_url, url, created_at, uploaded_at, published_at, view_count, views, play_count, like_count, likes')
        .eq('creator_id', uid)
        .order('created_at', { ascending: false })
        .limit(100);
      if (!error && data && data.length > 0) {
        allPosts.push(...normalizeStudioVideos(data, 'studio'));
        logs.push(`videos.creator_id: ${data.length} items`);
      } else if (error) {
        logs.push(`videos.creator_id ERROR: ${error.message}`);
      } else {
        logs.push(`videos.creator_id: 0 items`);
      }
    } catch (e: any) {
      logs.push(`videos.creator_id EXCEPTION: ${e.message}`);
    }

    // ── videos table (generic) via user_id ──
    try {
      const { data, error } = await supabase
        .from('videos')
        .select('id, title, caption, thumbnail_url, cover_url, media_urls, video_url, url, created_at, uploaded_at, published_at, view_count, views, play_count, like_count, likes')
        .eq('user_id', uid)
        .order('created_at', { ascending: false })
        .limit(100);
      if (!error && data && data.length > 0) {
        allPosts.push(...normalizeStudioVideos(data, 'studio'));
        logs.push(`videos.user_id: ${data.length} items`);
      } else if (error) {
        logs.push(`videos.user_id ERROR: ${error.message}`);
      } else {
        logs.push(`videos.user_id: 0 items`);
      }
    } catch (e: any) {
      logs.push(`videos.user_id EXCEPTION: ${e.message}`);
    }

    // Deduplicate by id
    const seen = new Set<string>();
    const unique = allPosts.filter((p) => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });

    // Sort by created_at desc
    unique.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    logs.push(`TOTAL UNIQUE: ${unique.length}`);
    setDebugInfo(logs.join('\n'));
    setPosts(unique);
    setPostsLoading(false);
  }, [user?.id]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  /* Sidebar animation */
  useEffect(() => {
    if (sidebarOpen) {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: -SIDEBAR_W, duration: 200, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [sidebarOpen]);

  const onRefresh = async () => {
    if (!user?.id) return;
    setRefreshing(true);
    try {
      const { data } = await supabase.from('user_profiles').select('*').eq('user_id', user.id).single();
      if (data) setProfile(data as ProfileData);
      await fetchPosts();
    } catch (err) { console.error('Refresh error:', err); }
    finally { setRefreshing(false); }
  };

  const handleCopyLink = async () => {
    const link = `https://mtaa.app/u/${user?.id}`;
    if (Clipboard?.setStringAsync) await Clipboard.setStringAsync(link);
    else Alert.alert('Copy Link', link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: () => { signOut(); router.replace('/(auth)/login'); } }
    ]);
  };

  const menuItems = [
    { icon: Edit3, label: 'Edit Profile', route: '/(os)/profile/edit', color: '#38bdf8' },
    { icon: Shield, label: 'Privacy & Security', route: '/(os)/profile/privacy', color: '#a78bfa' },
    { icon: Award, label: 'Achievements', route: '/(os)/profile/achievements', color: '#fbbf24' },
    { icon: Briefcase, label: 'Professional', route: '/(os)/profile/professional', color: '#34d399' },
    { icon: Users, label: 'Family', route: '/(os)/profile/family', color: '#fb923c' },
    { icon: QrCode, label: 'My QR Code', route: '/(os)/profile/qr', color: '#f472b6' },
    { icon: TrendingUp, label: 'Analytics', route: '/(os)/profile/analytics', color: '#60a5fa' },
    { icon: CreditCard, label: 'Creator Earnings', route: '/(os)/profile/earnings', color: '#10b981' },
    { icon: MessageCircle, label: 'Messages', route: '/(os)/messages', color: '#818cf8' },
    { icon: Bell, label: 'Notifications', route: '/(os)/notifications', color: '#f87171' },
    { icon: Settings, label: 'Settings', route: '/(os)/settings', color: '#94a3b8' },
  ];

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'videos', label: 'Videos' },
    { key: 'reposts', label: 'Reposts' },
    { key: 'favourites', label: 'Favourites' },
    { key: 'liked', label: 'Liked' },
  ];

  const renderPost = ({ item }: { item: PostItem }) => (
    <TouchableOpacity
      style={styles.gridItem}
      onPress={() => {
        if (item.source === 'streets') {
          router.push(`/(os)/streets/post/${item.id}`);
        } else {
          router.push(`/(os)/studio/video/${item.id}`);
        }
      }}
      activeOpacity={0.8}
    >
      {item.media_url ? (
        <Image source={{ uri: item.media_url }} style={styles.gridImage} resizeMode="cover" />
      ) : (
        <View style={[styles.gridImage, styles.gridPlaceholder]}>
          <Play size={22} color="#555" />
        </View>
      )}
      {item.is_video && (
        <View style={styles.videoBadge}>
          <Play size={10} color="#fff" fill="#fff" />
        </View>
      )}
      <View style={styles.gridOverlay}>
        <View style={styles.gridStatRow}>
          <Heart size={11} color="#fff" fill="#fff" />
          <Text style={styles.gridStatText}>{item.like_count || 0}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <Play size={40} color="#334155" />
      <Text style={styles.emptyTitle}>No {activeTab} yet</Text>
      <Text style={styles.emptySub}>
        {activeTab === 'videos'
          ? 'Share your first post to see it here'
          : 'Content you interact with will appear here'}
      </Text>
      {activeTab === 'videos' && (
        <TouchableOpacity style={styles.createBtn} onPress={() => router.push('/(os)/streets')}>
          <Text style={styles.createBtnText}>Create Post</Text>
        </TouchableOpacity>
      )}
      {__DEV__ && debugInfo ? (
        <View style={styles.debugBox}>
          <Text style={styles.debugText}>{debugInfo}</Text>
        </View>
      ) : null}
    </View>
  );

  if (!displayProfile) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#38bdf8" />
        <Text style={{ color: '#64748b', marginTop: 12 }}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Backdrop */}
      {sidebarOpen && (
        <TouchableOpacity
          style={styles.backdropTouch}
          activeOpacity={1}
          onPress={() => setSidebarOpen(false)}
        >
          <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]} />
        </TouchableOpacity>
      )}

      {/* Slide-out Sidebar */}
      <Animated.View style={[styles.sidebar, { transform: [{ translateX: slideAnim }] }]}>
        <View style={styles.sidebarHeader}>
          <View style={styles.sidebarAvatarWrap}>
            {displayProfile.avatar_url ? (
              <Image source={{ uri: displayProfile.avatar_url }} style={styles.sidebarAvatar} />
            ) : (
              <User size={20} color="#94a3b8" />
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.sidebarTitle} numberOfLines={1}>{displayProfile.full_name || 'Your Name'}</Text>
            <Text style={styles.sidebarSubtitle}>@{user?.email?.split('@')[0] || 'user'}</Text>
          </View>
          <TouchableOpacity onPress={() => setSidebarOpen(false)} style={{ padding: 6 }}>
            <X size={20} color="#94a3b8" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.sidebarScroll} showsVerticalScrollIndicator={false}>
          {menuItems.map((item, i) => (
            <TouchableOpacity
              key={i}
              style={styles.sidebarItem}
              onPress={() => { setSidebarOpen(false); router.push(item.route as any); }}
            >
              <View style={[styles.sidebarIconWrap, { backgroundColor: item.color + '18' }]}>
                <item.icon size={18} color={item.color} />
              </View>
              <Text style={styles.sidebarItemLabel}>{item.label}</Text>
              <ChevronRight size={16} color="#475569" />
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.sidebarFooter}>
          <TouchableOpacity style={styles.sidebarLogout} onPress={handleLogout}>
            <LogOut size={16} color="#ef4444" />
            <Text style={styles.sidebarLogoutText}>Log Out</Text>
          </TouchableOpacity>
          <Text style={styles.sidebarVersion}>MTAA OS v10</Text>
        </View>
      </Animated.View>

      {/* Main Content */}
      <ScrollView
        style={styles.main}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#38bdf8" />}
      >
        {/* Top Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => setSidebarOpen(true)} style={styles.iconBtn}>
            <Menu size={24} color="#f8fafc" />
          </TouchableOpacity>
          <Text style={styles.topBarTitle} numberOfLines={1}>{displayProfile.full_name || 'Profile'}</Text>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/(os)/settings')}>
            <Settings size={22} color="#f8fafc" />
          </TouchableOpacity>
        </View>

        {/* Profile Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.avatarBox}>
              {displayProfile.avatar_url ? (
                <Image source={{ uri: displayProfile.avatar_url }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <User size={36} color="#94a3b8" />
                </View>
              )}
              {displayProfile.verified && (
                <View style={styles.verifiedBadge}>
                  <Star size={11} color="#0f172a" fill="#fbbf24" />
                </View>
              )}
            </View>

            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={styles.statNum}>{posts.length || displayProfile.posts_count || 0}</Text>
                <Text style={styles.statLabel}>Posts</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statNum}>{displayProfile.followers_count || 0}</Text>
                <Text style={styles.statLabel}>Followers</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statNum}>{displayProfile.following_count || 0}</Text>
                <Text style={styles.statLabel}>Following</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statNum}>{displayProfile.reputation_score || 0}</Text>
                <Text style={styles.statLabel}>Rep</Text>
              </View>
            </View>
          </View>

          <View style={styles.nameSection}>
            <Text style={styles.name}>{displayProfile.full_name || 'Your Name'}</Text>
            <Text style={styles.handle}>@{user?.email?.split('@')[0] || 'user'}</Text>
            {displayProfile.bio ? <Text style={styles.bio}>{displayProfile.bio}</Text> : null}
            <View style={styles.metaRow}>
              {displayProfile.location && (
                <View style={styles.metaItem}>
                  <MapPin size={11} color="#64748b" />
                  <Text style={styles.metaText}>{displayProfile.location}</Text>
                </View>
              )}
              {displayProfile.website && (
                <View style={styles.metaItem}>
                  <LinkIcon size={11} color="#64748b" />
                  <Text style={styles.metaText}>{displayProfile.website}</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.btnPrimary} onPress={() => router.push('/(os)/profile/edit')}>
              <Edit3 size={13} color="#0f172a" />
              <Text style={styles.btnPrimaryText}>Edit Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnSecondary} onPress={handleCopyLink}>
              <Copy size={13} color="#f8fafc" />
              <Text style={styles.btnSecondaryText}>{copied ? 'Copied!' : 'Copy Link'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabBar}>
          {tabs.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <TouchableOpacity key={tab.key} style={styles.tab} onPress={() => setActiveTab(tab.key)}>
                <Text style={[styles.tabText, active && styles.tabTextActive]}>{tab.label}</Text>
                {active && <View style={styles.tabIndicator} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Grid */}
        {postsLoading ? (
          <View style={styles.loadingGrid}>
            <ActivityIndicator size="large" color="#38bdf8" />
          </View>
        ) : posts.length === 0 ? (
          renderEmpty()
        ) : (
          <FlatList
            data={posts}
            keyExtractor={(item) => item.id + '_' + item.source}
            numColumns={COLS}
            columnWrapperStyle={styles.gridRow}
            renderItem={renderPost}
            scrollEnabled={false}
            contentContainerStyle={styles.gridWrap}
          />
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  center: { justifyContent: 'center', alignItems: 'center' },

  /* Backdrop */
  backdropTouch: { ...StyleSheet.absoluteFillObject, zIndex: 10 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },

  /* Sidebar */
  sidebar: {
    position: 'absolute', left: 0, top: 0, bottom: 0,
    width: SIDEBAR_W, backgroundColor: '#111827',
    zIndex: 20, borderRightWidth: 1, borderRightColor: '#1e293b',
  },
  sidebarHeader: {
    flexDirection: 'row', alignItems: 'center',
    padding: 18, gap: 12,
    borderBottomWidth: 1, borderBottomColor: '#1e293b',
  },
  sidebarAvatarWrap: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: '#1e293b', alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  sidebarAvatar: { width: 42, height: 42, borderRadius: 21 },
  sidebarTitle: { fontSize: 15, fontWeight: '700', color: '#f8fafc' },
  sidebarSubtitle: { fontSize: 12, color: '#64748b', marginTop: 1 },
  sidebarScroll: { flex: 1, paddingTop: 6 },
  sidebarItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 11, gap: 12,
  },
  sidebarIconWrap: {
    width: 34, height: 34, borderRadius: 9,
    justifyContent: 'center', alignItems: 'center',
  },
  sidebarItemLabel: { flex: 1, fontSize: 14, color: '#e2e8f0', fontWeight: '500' },
  sidebarFooter: {
    padding: 14, borderTopWidth: 1, borderTopColor: '#1e293b', gap: 10,
  },
  sidebarLogout: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 10, backgroundColor: '#1e293b',
    borderRadius: 10, borderWidth: 1, borderColor: '#ef444430',
  },
  sidebarLogoutText: { fontSize: 14, color: '#ef4444', fontWeight: '600' },
  sidebarVersion: { fontSize: 11, color: '#475569', textAlign: 'center' },

  /* Main */
  main: { flex: 1 },
  topBar: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12,
  },
  iconBtn: { padding: 8 },
  topBarTitle: { fontSize: 17, fontWeight: '700', color: '#f8fafc', flex: 1, textAlign: 'center', marginHorizontal: 8 },

  /* Header */
  header: { paddingHorizontal: 16, paddingBottom: 14 },
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: 18 },
  avatarBox: { position: 'relative' },
  avatar: { width: 80, height: 80, borderRadius: 40, borderWidth: 2, borderColor: '#38bdf8' },
  avatarPlaceholder: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#1e293b',
    justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#334155',
  },
  verifiedBadge: {
    position: 'absolute', bottom: 0, right: 0,
    backgroundColor: '#fbbf24', borderRadius: 10, padding: 3,
    borderWidth: 2, borderColor: '#0f172a',
  },
  statsRow: { flexDirection: 'row', flex: 1, justifyContent: 'space-around' },
  stat: { alignItems: 'center' },
  statNum: { fontSize: 18, fontWeight: '700', color: '#f8fafc' },
  statLabel: { fontSize: 11, color: '#64748b', marginTop: 2 },

  nameSection: { marginTop: 12 },
  name: { fontSize: 19, fontWeight: '700', color: '#f8fafc' },
  handle: { fontSize: 13, color: '#64748b', marginTop: 2 },
  bio: { fontSize: 13, color: '#94a3b8', marginTop: 6, lineHeight: 18 },
  metaRow: { flexDirection: 'row', gap: 12, marginTop: 8, flexWrap: 'wrap' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 11, color: '#64748b' },

  actionRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  btnPrimary: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, backgroundColor: '#38bdf8', borderRadius: 8, paddingVertical: 10,
  },
  btnPrimaryText: { fontSize: 13, fontWeight: '600', color: '#0f172a' },
  btnSecondary: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, backgroundColor: '#1e293b', borderRadius: 8, paddingVertical: 10,
    borderWidth: 1, borderColor: '#334155',
  },
  btnSecondaryText: { fontSize: 13, fontWeight: '600', color: '#f8fafc' },

  /* Tabs */
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1, borderTopColor: '#1e293b',
    borderBottomWidth: 1, borderBottomColor: '#1e293b',
    marginTop: 4,
  },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  tabText: { fontSize: 13, color: '#64748b', fontWeight: '500' },
  tabTextActive: { color: '#f8fafc', fontWeight: '700' },
  tabIndicator: {
    position: 'absolute', bottom: 0, width: '50%', height: 2,
    backgroundColor: '#38bdf8', borderRadius: 1,
  },

  /* Grid */
  gridWrap: { padding: GAP },
  gridRow: { gap: GAP, marginBottom: GAP },
  gridItem: {
    width: THUMB, height: THUMB, backgroundColor: '#1e293b',
    borderRadius: 2, overflow: 'hidden', position: 'relative',
  },
  gridImage: { width: '100%', height: '100%' },
  gridPlaceholder: { justifyContent: 'center', alignItems: 'center', backgroundColor: '#1e293b' },
  videoBadge: {
    position: 'absolute', top: 6, right: 6,
    backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: 10, padding: 4,
  },
  gridOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 6, backgroundColor: 'rgba(0,0,0,0.4)',
  },
  gridStatRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  gridStatText: { fontSize: 10, color: '#fff', fontWeight: '600' },

  /* Empty */
  emptyState: { alignItems: 'center', paddingVertical: 80, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#94a3b8', marginTop: 16 },
  emptySub: { fontSize: 13, color: '#64748b', marginTop: 6, textAlign: 'center' },
  createBtn: {
    marginTop: 20, backgroundColor: '#38bdf8',
    borderRadius: 20, paddingHorizontal: 24, paddingVertical: 10,
  },
  createBtnText: { color: '#0f172a', fontWeight: '700', fontSize: 14 },
  loadingGrid: { paddingVertical: 80, alignItems: 'center' },

  /* Debug */
  debugBox: {
    marginTop: 20, padding: 12, backgroundColor: '#1e293b',
    borderRadius: 8, borderWidth: 1, borderColor: '#334155',
    width: '100%',
  },
  debugText: { fontSize: 10, color: '#94a3b8', fontFamily: 'monospace' },
});
