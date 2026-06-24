import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStreets } from '@/lib/hooks/useStreets';
import { useAuthStore } from '@/lib/auth/useAuthStore';
import { StreetPost } from '@/lib/services/streets-service';
import { supabase } from '@/lib/supabase';

const { width } = Dimensions.get('window');

interface CreatorProfile {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
}

export default function StreetsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'feed' | 'following' | 'discover'>('feed');
  const [creatorProfiles, setCreatorProfiles] = useState<Record<string, CreatorProfile>>({});
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [imageLoading, setImageLoading] = useState<Record<string, boolean>>({});
  const LIMIT = 20;

  const {
    posts,
    loading,
    error,
    hasMore,
    loadFeed,
    loadFollowing,
    loadDiscover,
    likePost,
    reset,
  } = useStreets();

  // AUTO-LOAD on mount and when tab changes
  useEffect(() => {
    reset();
    if (activeTab === 'feed') loadFeed(0, LIMIT);
    else if (activeTab === 'following') loadFollowing(0, LIMIT);
    else loadDiscover(0, LIMIT);
  }, [activeTab]);

  // Fetch creator profiles for visible posts
  useEffect(() => {
    if (posts.length === 0) return;
    const creatorIds = [...new Set(posts.map((p) => p.creator_id))];
    const missingIds = creatorIds.filter((id) => !creatorProfiles[id]);
    if (missingIds.length === 0) return;

    supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url')
      .in('id', missingIds)
      .then(({ data, error }) => {
        if (error || !data) return;
        const map: Record<string, CreatorProfile> = {};
        data.forEach((p: any) => { map[p.id] = p; });
        setCreatorProfiles((prev) => ({ ...prev, ...map }));
      });
  }, [posts]);

  const onRefresh = useCallback(() => {
    reset();
    if (activeTab === 'feed') loadFeed(0, LIMIT);
    else if (activeTab === 'following') loadFollowing(0, LIMIT);
    else loadDiscover(0, LIMIT);
  }, [activeTab, loadFeed, loadFollowing, loadDiscover, reset]);

  const onEndReached = useCallback(() => {
    if (!loading && hasMore) {
      if (activeTab === 'feed') loadFeed(0, LIMIT);
      else if (activeTab === 'following') loadFollowing(0, LIMIT);
      else loadDiscover(0, LIMIT);
    }
  }, [loading, hasMore, activeTab, loadFeed, loadFollowing, loadDiscover]);

  const switchTab = useCallback(
    (tab: typeof activeTab) => {
      setActiveTab(tab);
    },
    []
  );

  const handleImageError = useCallback((postId: string) => {
    setImageErrors((prev) => ({ ...prev, [postId]: true }));
    setImageLoading((prev) => ({ ...prev, [postId]: false }));
  }, []);

  const handleImageLoad = useCallback((postId: string) => {
    setImageLoading((prev) => ({ ...prev, [postId]: false }));
  }, []);

  const handleImageLoadStart = useCallback((postId: string) => {
    setImageLoading((prev) => ({ ...prev, [postId]: true }));
  }, []);

  const renderPost = useCallback(
    ({ item }: { item: StreetPost }) => {
      const creator = creatorProfiles[item.creator_id];
      const displayName = creator?.username || creator?.full_name || 'User';
      const avatarUrl = creator?.avatar_url;
      const hasMedia = !!item.media_url;
      const isVideo = item.media_type === 'video';
      const imgError = imageErrors[item.id];
      const imgLoading = imageLoading[item.id];

      return (
        <View style={styles.postCard}>
          <View style={styles.postHeader}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person-circle" size={40} color="#666" />
              </View>
            )}
            <View style={styles.headerText}>
              <Text style={styles.username}>{displayName}</Text>
              <Text style={styles.timestamp}>
                {new Date(item.created_at).toLocaleDateString()}
              </Text>
            </View>
            <TouchableOpacity style={styles.moreBtn}>
              <Ionicons name="ellipsis-horizontal" size={20} color="#666" />
            </TouchableOpacity>
          </View>

          {item.caption ? <Text style={styles.caption}>{item.caption}</Text> : null}
          {item.content ? <Text style={styles.content}>{item.content}</Text> : null}

          {hasMedia && !imgError && (
            <View style={styles.mediaContainer}>
              {imgLoading && (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="large" color="#007AFF" />
                </View>
              )}
              {isVideo ? (
                <View style={[styles.media, styles.videoPlaceholder]}>
                  <Ionicons name="play-circle" size={60} color="#fff" />
                  <Text style={styles.videoText}>Video</Text>
                </View>
              ) : (
                <Image
                  source={{ uri: item.media_url! }}
                  style={styles.media}
                  resizeMode="cover"
                  onError={() => handleImageError(item.id)}
                  onLoad={() => handleImageLoad(item.id)}
                  onLoadStart={() => handleImageLoadStart(item.id)}
                />
              )}
            </View>
          )}

          {hasMedia && imgError && (
            <View style={styles.mediaError}>
              <Ionicons name="image-outline" size={40} color="#999" />
              <Text style={styles.mediaErrorText}>Image unavailable</Text>
            </View>
          )}

          <View style={styles.actions}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => likePost(item.id)}>
              <Ionicons name="heart-outline" size={24} color="#333" />
              <Text style={styles.actionText}>{item.likes_count}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn}>
              <Ionicons name="chatbubble-outline" size={22} color="#333" />
              <Text style={styles.actionText}>{item.comments_count}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn}>
              <Ionicons name="share-outline" size={22} color="#333" />
            </TouchableOpacity>
          </View>
        </View>
      );
    },
    [creatorProfiles, imageErrors, imageLoading, likePost, handleImageError, handleImageLoad, handleImageLoadStart]
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Streets</Text>
        <TouchableOpacity
          style={styles.createBtn}
          onPress={() => router.push('/(os)/streets/create')}
        >
          <Ionicons name="add-circle" size={28} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        {(['feed', 'following', 'discover'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => switchTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading && posts.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : error && posts.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={onRefresh}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={renderPost}
          refreshControl={
            <RefreshControl refreshing={loading && posts.length === 0} onRefresh={onRefresh} />
          }
          onEndReached={onEndReached}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loading && posts.length > 0 ? <ActivityIndicator style={styles.footerLoader} /> : null
          }
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: { fontSize: 24, fontWeight: '700', color: '#111' },
  createBtn: { padding: 4 },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#eee' },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#007AFF' },
  tabText: { fontSize: 14, color: '#666', fontWeight: '500' },
  tabTextActive: { color: '#007AFF', fontWeight: '600' },
  listContent: { paddingBottom: 20 },
  postCard: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  postHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
  avatarPlaceholder: { marginRight: 10 },
  headerText: { flex: 1 },
  username: { fontSize: 14, fontWeight: '600', color: '#111' },
  timestamp: { fontSize: 12, color: '#999', marginTop: 2 },
  moreBtn: { padding: 4 },
  caption: { fontSize: 15, fontWeight: '600', color: '#111', marginBottom: 4 },
  content: { fontSize: 14, color: '#333', lineHeight: 20, marginBottom: 8 },
  mediaContainer: {
    width: width - 32,
    height: width - 32,
    borderRadius: 8,
    marginBottom: 8,
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
    position: 'relative',
  },
  media: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  videoPlaceholder: {
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoText: {
    color: '#fff',
    marginTop: 8,
    fontSize: 14,
  },
  mediaError: {
    width: width - 32,
    height: 200,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaErrorText: {
    color: '#999',
    marginTop: 8,
    fontSize: 14,
  },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionText: { fontSize: 13, color: '#666' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  errorText: { fontSize: 14, color: '#e74c3c', textAlign: 'center', marginBottom: 12 },
  retryBtn: { backgroundColor: '#007AFF', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  retryText: { color: '#fff', fontWeight: '600' },
  footerLoader: { paddingVertical: 16 },
});
