import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, RefreshControl,
  Dimensions, Platform, Animated, TouchableOpacity, Image, StatusBar, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

const { height: SCREEN_H, width: SCREEN_W } = Dimensions.get('window');

interface Post {
  id: string; creator_id: string; content: string | null;
  media_url: string | null; media_type: string;
  likes_count: number; comments_count: number; shares_count: number; views_count: number;
  creator: { user_id: string; full_name: string | null; display_name: string | null; username: string | null; avatar_url: string | null; verified: boolean; } | null;
}

const FEATURES = [
  { label: 'For You', icon: 'home', route: null },
  { label: 'Live', icon: 'videocam', route: '/streets/live' },
  { label: 'Creator', icon: 'person', route: '/streets/creator' },
  { label: 'Shop', icon: 'cart', route: '/streets/shop' },
  { label: 'Jobs', icon: 'briefcase', route: '/streets/jobs' },
  { label: 'Ads', icon: 'megaphone', route: '/streets/ads' },
  { label: 'Wallet', icon: 'wallet', route: '/streets/wallet' },
  { label: 'Settings', icon: 'settings', route: '/streets/settings' },
];

export default function StreetsScreen() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [visibleIndex, setVisibleIndex] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('For You');
  const [feedError, setFeedError] = useState<string | null>(null);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const dropdownAnim = useRef(new Animated.Value(0)).current;

  const isGuest = !isAuthenticated || !user;

  // Fetch current user's avatar from user_profiles
  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from('user_profiles')
      .select('avatar_url')
      .eq('user_id', user.id)
      .single()
      .then(({ data }) => {
        if (data?.avatar_url) setUserAvatar(data.avatar_url);
      });
  }, [user?.id]);

  const fetchPosts = useCallback(async (page = 0, refresh = false) => {
    if (refresh) setRefreshing(true);
    setFeedError(null);
    try {
      const { data, error } = await supabase
        .from('streets_posts')
        .select('id, creator_id, content, media_url, media_type, likes_count, comments_count, shares_count, views_count, creator:user_profiles(user_id, full_name, display_name, username, avatar_url, verified)')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .range(page * 10, (page + 1) * 10 - 1);

      if (error) {
        console.error('Feed error:', error.message);
        setFeedError(error.message);
        setHasMore(false);
        return;
      }

      const mapped = (data || []).map((p: any) => ({
        id: p.id,
        creator_id: p.creator_id,
        content: p.content,
        media_url: p.media_url,
        media_type: p.media_type || 'text',
        likes_count: p.likes_count || 0,
        comments_count: p.comments_count || 0,
        shares_count: p.shares_count || 0,
        views_count: p.views_count || 0,
        creator: p.creator ? {
          user_id: p.creator.user_id,
          full_name: p.creator.full_name,
          display_name: p.creator.display_name,
          username: p.creator.username,
          avatar_url: p.creator.avatar_url,
          verified: !!p.creator.verified,
        } : null,
      }));

      if (refresh || page === 0) {
        setPosts(mapped);
      } else {
        setPosts(prev => [...prev, ...mapped]);
      }
      setHasMore(mapped.length === 10);
    } catch (e: any) {
      setFeedError(e.message || 'Unknown error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchPosts(0, true); }, [fetchPosts]);

  const onRefresh = () => fetchPosts(0, true);
  const onLoadMore = () => { if (!loading && hasMore) fetchPosts(Math.floor(posts.length / 10)); };

  const toggleLike = async (postId: string) => {
    if (isGuest) { Alert.alert('Sign In Required', 'Please sign in to like posts.'); return; }
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes_count: p.likes_count + 1 } : p));
    await supabase.from('streets_likes').insert({ post_id: postId, user_id: user!.id });
  };

  const toggleSave = async (postId: string) => {
    if (isGuest) { Alert.alert('Sign In Required', 'Please sign in to save posts.'); return; }
    await supabase.from('streets_saves').insert({ post_id: postId, user_id: user!.id });
    Alert.alert('Saved', 'Post saved to your collection.');
  };

  const sharePost = async (post: Post) => {
    if (isGuest) { Alert.alert('Sign In Required', 'Please sign in to share posts.'); return; }
    await supabase.from('streets_shares').insert({ post_id: post.id, user_id: user!.id });
    Alert.alert('Shared', 'Post shared to your timeline.');
  };

  const goToComments = (postId: string) => router.push(`/streets/comments?postId=${postId}`);
  const goToCreator = (creatorId: string) => router.push(`/streets/creator?userId=${creatorId}`);
  const goToCreate = () => {
    if (isGuest) { Alert.alert('Sign In Required', 'Please sign in to create posts.'); return; }
    router.push('/streets/create');
  };
  const goToMyProfile = () => {
    if (isGuest) { Alert.alert('Sign In Required', 'Please sign in to view your profile.'); return; }
    router.push(`/streets/creator?userId=${user!.id}`);
  };

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
    Animated.timing(dropdownAnim, { toValue: dropdownOpen ? 0 : 1, duration: 200, useNativeDriver: true }).start();
  };

  // STABLE onViewableItemsChanged — useRef so it never changes between renders
  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems[0]) setVisibleIndex(viewableItems[0].index || 0);
  }).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const renderPost = ({ item, index }: { item: Post; index: number }) => {
    const creatorName = item.creator?.full_name || item.creator?.display_name || item.creator?.username || 'Unknown';
    const isOwnPost = user?.id === item.creator_id;

    return (
      <View style={styles.postCard}>
        {item.media_url && item.media_type !== 'text' ? (
          <Image source={{ uri: item.media_url }} style={styles.media} resizeMode="cover" />
        ) : (
          <View style={[styles.media, styles.textOnly]}>
            <Text style={styles.textContent}>{item.content || ''}</Text>
          </View>
        )}

        <View style={styles.overlay}>
          <TouchableOpacity style={styles.creatorRow} onPress={() => goToCreator(item.creator_id)}>
            {item.creator?.avatar_url ? (
              <Image source={{ uri: item.creator.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Ionicons name="person" size={18} color="#fff" />
              </View>
            )}
            <View style={styles.creatorInfo}>
              <Text style={styles.creatorName}>{creatorName}</Text>
              {item.creator?.verified && <Ionicons name="checkmark-circle" size={14} color="#00d4ff" style={{ marginLeft: 4 }} />}
            </View>
          </TouchableOpacity>

          <Text style={styles.caption} numberOfLines={3}>{item.content}</Text>

          <View style={styles.actionsRow}>
            <TouchableOpacity onPress={() => toggleLike(item.id)} style={styles.actionBtn}>
              <Ionicons name="heart-outline" size={26} color="#fff" />
              <Text style={styles.actionText}>{item.likes_count}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => goToComments(item.id)} style={styles.actionBtn}>
              <Ionicons name="chatbubble-outline" size={24} color="#fff" />
              <Text style={styles.actionText}>{item.comments_count}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => sharePost(item)} style={styles.actionBtn}>
              <Ionicons name="share-outline" size={24} color="#fff" />
              <Text style={styles.actionText}>{item.shares_count}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => toggleSave(item.id)} style={styles.actionBtn}>
              <Ionicons name="bookmark-outline" size={24} color="#fff" />
            </TouchableOpacity>
            {isOwnPost && (
              <TouchableOpacity onPress={() => router.push(`/streets/create?editPostId=${item.id}`)} style={styles.actionBtn}>
                <Ionicons name="create-outline" size={22} color="#00d4ff" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={toggleDropdown}>
          <Text style={styles.headerTitle}>{activeTab} <Ionicons name="chevron-down" size={14} color="#fff" /></Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={goToMyProfile}>
          {userAvatar ? (
            <Image source={{ uri: userAvatar }} style={styles.headerAvatar} />
          ) : (
            <View style={[styles.headerAvatar, styles.avatarPlaceholder]}>
              <Ionicons name="person" size={16} color="#fff" />
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Dropdown */}
      {dropdownOpen && (
        <Animated.View style={[styles.dropdown, { opacity: dropdownAnim }]}>
          {FEATURES.map(f => (
            <TouchableOpacity key={f.label} style={styles.dropdownItem} onPress={() => {
              setActiveTab(f.label);
              setDropdownOpen(false);
              if (f.route) router.push(f.route as any);
            }}>
              <Ionicons name={f.icon as any} size={18} color="#fff" />
              <Text style={styles.dropdownText}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </Animated.View>
      )}

      {/* Guest Banner */}
      {isGuest && (
        <View style={styles.guestBanner}>
          <Text style={styles.guestText}>You\'re browsing as a guest. Sign in to like, comment, and create.</Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
            <Text style={styles.guestSignIn}>Sign In</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Feed Error */}
      {feedError && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>Feed error: {feedError}</Text>
          <TouchableOpacity onPress={onRefresh}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Feed */}
      <FlatList
        data={posts}
        keyExtractor={item => item.id}
        renderItem={renderPost}
        pagingEnabled
        snapToInterval={SCREEN_H * 0.75}
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
        onEndReached={onLoadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          loading ? (
            <View style={styles.empty}><Text style={styles.emptyText}>Loading...</Text></View>
          ) : (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No posts yet. Be the first to create!</Text>
              {!isGuest && (
                <TouchableOpacity onPress={goToCreate} style={styles.createEmptyBtn}>
                  <Text style={styles.createEmptyText}>Create Post</Text>
                </TouchableOpacity>
              )}
            </View>
          )
        }
      />

      {/* Floating Action Button — Create */}
      <TouchableOpacity style={styles.fab} onPress={goToCreate} activeOpacity={0.8}>
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 50 : 16,
    paddingBottom: 12, backgroundColor: 'rgba(0,0,0,0.4)',
  },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  headerAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#333' },
  dropdown: {
    position: 'absolute', top: Platform.OS === 'ios' ? 90 : 56, left: 12, right: 12, zIndex: 25,
    backgroundColor: '#1a1a1a', borderRadius: 12, padding: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 8, elevation: 10,
  },
  dropdownItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12 },
  dropdownText: { color: '#fff', marginLeft: 12, fontSize: 14 },
  guestBanner: {
    position: 'absolute', top: Platform.OS === 'ios' ? 90 : 56, left: 0, right: 0, zIndex: 15,
    backgroundColor: 'rgba(0,100,200,0.9)', padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  guestText: { color: '#fff', fontSize: 12, flex: 1 },
  guestSignIn: { color: '#00d4ff', fontWeight: '700', fontSize: 12, marginLeft: 12 },
  errorBanner: {
    position: 'absolute', top: Platform.OS === 'ios' ? 90 : 56, left: 0, right: 0, zIndex: 15,
    backgroundColor: 'rgba(200,0,0,0.9)', padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  errorText: { color: '#fff', fontSize: 12, flex: 1 },
  retryText: { color: '#00d4ff', fontWeight: '700', fontSize: 12, marginLeft: 12 },
  postCard: { height: SCREEN_H * 0.75, width: SCREEN_W, position: 'relative' },
  media: { width: '100%', height: '100%' },
  textOnly: { backgroundColor: '#111', justifyContent: 'center', alignItems: 'center', padding: 24 },
  textContent: { color: '#fff', fontSize: 18, textAlign: 'center' },
  overlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 16, paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  creatorRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  avatar: { width: 36, height: 36, borderRadius: 18, marginRight: 10 },
  avatarPlaceholder: { backgroundColor: '#444', justifyContent: 'center', alignItems: 'center' },
  creatorInfo: { flexDirection: 'row', alignItems: 'center' },
  creatorName: { color: '#fff', fontWeight: '700', fontSize: 14 },
  caption: { color: '#ddd', fontSize: 13, marginBottom: 12, lineHeight: 18 },
  actionsRow: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  actionBtn: { alignItems: 'center' },
  actionText: { color: '#fff', fontSize: 11, marginTop: 2 },
  empty: { height: SCREEN_H * 0.6, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emptyText: { color: '#888', fontSize: 14, textAlign: 'center', marginBottom: 16 },
  createEmptyBtn: { backgroundColor: '#00d4ff', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24 },
  createEmptyText: { color: '#000', fontWeight: '700', fontSize: 14 },
  fab: {
    position: 'absolute', right: 20, bottom: Platform.OS === 'ios' ? 100 : 80, zIndex: 30,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#00d4ff',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#00d4ff', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 10,
  },
});
