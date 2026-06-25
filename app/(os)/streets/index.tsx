import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, RefreshControl, Pressable,
  Dimensions, Platform, Animated, TouchableOpacity, Image, StatusBar,
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
  creator: { id: string; full_name: string | null; username: string | null; avatar_url: string | null; verified: boolean; } | null;
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
  const { user } = useAuthStore();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [visibleIndex, setVisibleIndex] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('For You');
  const dropdownAnim = useRef(new Animated.Value(0)).current;

  const fetchPosts = useCallback(async (page = 0, refresh = false) => {
    if (refresh) setRefreshing(true);
    const { data, error } = await supabase
      .from('streets_posts')
      .select('id, creator_id, content, media_url, media_type, likes_count, comments_count, shares_count, views_count, creator:profiles(id, full_name, username, avatar_url, verified)')
      .order('created_at', { ascending: false })
      .range(page * 10, (page + 1) * 10 - 1);
    if (!error && data) {
      const mapped = (data as any[]).map(p => ({ ...p, creator: Array.isArray(p.creator) ? p.creator[0] : p.creator }));
      if (refresh) { setPosts(mapped); } else { setPosts(prev => [...prev, ...mapped]); }
      setHasMore(data.length === 10);
    } else if (error) { console.error('Feed error:', error); }
    setLoading(false); setRefreshing(false);
  }, []);

  useEffect(() => { fetchPosts(0, true); }, [fetchPosts]);

  const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    if (viewableItems.length > 0) setVisibleIndex(viewableItems[0].index || 0);
  }, []);
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;

  const toggleDropdown = useCallback(() => {
    if (dropdownOpen) {
      Animated.timing(dropdownAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => setDropdownOpen(false));
    } else { setDropdownOpen(true); Animated.timing(dropdownAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start(); }
  }, [dropdownOpen, dropdownAnim]);

  const navigateFeature = useCallback((route: string | null, label: string) => {
    setActiveTab(label); toggleDropdown(); if (route) router.push(route as any);
  }, [router, toggleDropdown]);

  const openProfile = useCallback((userId: string) => { router.push(`/(os)/profile/${userId}`); }, [router]);
  const openComments = useCallback((postId: string) => { router.push(`/streets/comments/${postId}`); }, [router]);
  const openShare = useCallback((postId: string, content: string) => { router.push({ pathname: '/streets/share', params: { postId, content } }); }, [router]);
  const openAds = useCallback((postId: string) => { router.push({ pathname: '/streets/ads', params: { postId } }); }, [router]);
  const likePost = useCallback(async (postId: string) => { await supabase.from('streets_posts').update({ likes_count: supabase.rpc('increment', { x: 1 }) }).eq('id', postId); }, []);

  const renderPost = useCallback(({ item, index }: { item: Post; index: number }) => {
    const creatorName = item.creator?.full_name || item.creator?.username || 'User';
    return (
      <View style={styles.postContainer}>
        <View style={styles.mediaBox}>
          {item.media_url ? (
            <Image source={{ uri: item.media_url }} style={styles.mediaImage} resizeMode="cover" />
          ) : (
            <View style={styles.mediaFallback}><Text style={styles.mediaFallbackEmoji}>📝</Text></View>
          )}
        </View>
        <View style={styles.sidebar}>
          <TouchableOpacity style={styles.sideBtn} onPress={() => likePost(item.id)}>
            <Ionicons name="heart" size={32} color="#fff" /><Text style={styles.sideCount}>{item.likes_count || 0}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.sideBtn} onPress={() => openComments(item.id)}>
            <Ionicons name="chatbubble" size={30} color="#fff" /><Text style={styles.sideCount}>{item.comments_count || 0}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.sideBtn} onPress={() => openShare(item.id, item.content || '')}>
            <Ionicons name="share-social" size={30} color="#fff" /><Text style={styles.sideCount}>{item.shares_count || 0}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.sideBtn} onPress={() => openAds(item.id)}>
            <Ionicons name="megaphone" size={28} color="#fff" /><Text style={styles.sideCount}>Promote</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.infoOverlay}>
          <TouchableOpacity style={styles.creatorRow} onPress={() => openProfile(item.creator_id)}>
            {item.creator?.avatar_url ? (
              <Image source={{ uri: item.creator.avatar_url }} style={styles.creatorAvatar} />
            ) : (
              <View style={styles.creatorAvatar}><Text style={styles.creatorAvatarText}>{creatorName.charAt(0)}</Text></View>
            )}
            <Text style={styles.creatorName}>{creatorName}</Text>
            {item.creator?.verified && <Ionicons name="checkmark-circle" size={14} color="#2196F3" style={{ marginLeft: 4 }} />}
            <TouchableOpacity style={styles.followChip} onPress={() => openProfile(item.creator_id)}><Text style={styles.followChipText}>Follow</Text></TouchableOpacity>
          </TouchableOpacity>
          <Text style={styles.postContent} numberOfLines={3}>{item.content || ''}</Text>
        </View>
      </View>
    );
  }, [visibleIndex, likePost, openComments, openShare, openAds, openProfile]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <View style={styles.topBar}>
        <TouchableOpacity onPress={toggleDropdown} style={styles.tabSelector}>
          <Text style={styles.tabText}>{activeTab}</Text>
          <Ionicons name={dropdownOpen ? 'chevron-up' : 'chevron-down'} size={18} color="#fff" style={{ marginLeft: 4 }} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.searchBtn} onPress={() => router.push('/streets/search')}><Ionicons name="search" size={22} color="#fff" /></TouchableOpacity>
      </View>
      {dropdownOpen && (
        <Animated.View style={[styles.dropdown, { opacity: dropdownAnim, transform: [{ translateY: dropdownAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }]}>
          {FEATURES.map((feat, idx) => (
            <TouchableOpacity key={idx} style={[styles.dropdownItem, activeTab === feat.label && styles.dropdownItemActive]} onPress={() => navigateFeature(feat.route, feat.label)}>
              <Ionicons name={feat.icon as any} size={20} color={activeTab === feat.label ? '#2196F3' : '#fff'} />
              <Text style={[styles.dropdownLabel, activeTab === feat.label && styles.dropdownLabelActive]}>{feat.label}</Text>
            </TouchableOpacity>
          ))}
        </Animated.View>
      )}
      <FlatList
        data={posts} renderItem={renderPost} keyExtractor={item => item.id} pagingEnabled snapToInterval={SCREEN_H} snapToAlignment="start" decelerationRate="fast" showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchPosts(0, true)} tintColor="#fff" />}
        onEndReached={() => hasMore && fetchPosts(Math.floor(posts.length / 10))} onEndReachedThreshold={0.5}
        onViewableItemsChanged={onViewableItemsChanged} viewabilityConfig={viewabilityConfig}
        getItemLayout={(data, index) => ({ length: SCREEN_H, offset: SCREEN_H * index, index })}
        ListEmptyComponent={<View style={[styles.empty, { height: SCREEN_H }]}><Text style={styles.emptyText}>{loading ? 'Loading feed...' : 'No posts yet. Create one!'}</Text></View>}
        initialNumToRender={2} maxToRenderPerBatch={3} windowSize={5} removeClippedSubviews={Platform.OS !== 'web'}
      />
      {dropdownOpen && <TouchableOpacity style={styles.dropdownOverlay} onPress={toggleDropdown} activeOpacity={1} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  topBar: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingTop: Platform.OS === 'ios' ? 48 : 24, paddingBottom: 12, paddingHorizontal: 16 },
  tabSelector: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.4)' },
  tabText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  searchBtn: { position: 'absolute', right: 16, top: Platform.OS === 'ios' ? 48 : 24, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  dropdown: { position: 'absolute', top: Platform.OS === 'ios' ? 88 : 64, left: '50%', marginLeft: -100, width: 200, backgroundColor: 'rgba(20,20,20,0.95)', borderRadius: 16, paddingVertical: 8, zIndex: 60, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  dropdownOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 55 },
  dropdownItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  dropdownItemActive: { backgroundColor: 'rgba(33,150,243,0.15)' },
  dropdownLabel: { color: '#fff', fontSize: 15, fontWeight: '500' },
  dropdownLabelActive: { color: '#2196F3', fontWeight: '700' },
  postContainer: { width: SCREEN_W, height: SCREEN_H, backgroundColor: '#000', position: 'relative' },
  mediaBox: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#111' },
  mediaImage: { width: '100%', height: '100%' },
  mediaFallback: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  mediaFallbackEmoji: { fontSize: 80 },
  sidebar: { position: 'absolute', right: 8, bottom: 120, alignItems: 'center', gap: 16, zIndex: 10 },
  sideBtn: { alignItems: 'center' },
  sideCount: { color: '#fff', fontSize: 12, marginTop: 4, fontWeight: '500' },
  infoOverlay: { position: 'absolute', bottom: 40, left: 16, right: 80, zIndex: 10 },
  creatorRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  creatorAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#333', justifyContent: 'center', alignItems: 'center', marginRight: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  creatorAvatarText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  creatorName: { color: '#fff', fontSize: 15, fontWeight: '700' },
  followChip: { backgroundColor: '#ff4444', borderRadius: 4, paddingHorizontal: 10, paddingVertical: 4, marginLeft: 10 },
  followChipText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  postContent: { color: '#fff', fontSize: 14, lineHeight: 20, opacity: 0.9 },
  empty: { justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#fff', fontSize: 16 },
});
