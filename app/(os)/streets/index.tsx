import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator, Dimensions, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { useStreets } from '@/lib/hooks/useStreets';
import { Ionicons } from '@expo/vector-icons';

const { height: SCREEN_H } = Dimensions.get('window');
const POST_HEIGHT = SCREEN_H - 80;

export default function StreetsFeedScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const {
    posts,
    loading,
    refreshing,
    error,
    hasMore,
    refresh,
    loadMore,
    likePost,
    unlikePost,
  } = useStreets();

  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());

  // ─── LOAD ON MOUNT ─────────────────────────────────
  useEffect(() => {
    refresh();
  }, []);

  // ─── HANDLE LIKE ─────────────────────────────────────
  const handleLike = useCallback(async (postId: string) => {
    const isLiked = likedPosts.has(postId);
    try {
      if (isLiked) {
        await unlikePost(postId);
        setLikedPosts(prev => {
          const next = new Set(prev);
          next.delete(postId);
          return next;
        });
      } else {
        await likePost(postId);
        setLikedPosts(prev => new Set(prev).add(postId));
      }
    } catch (e) {
      console.error('Like error:', e);
    }
  }, [likedPosts, likePost, unlikePost]);

  // ─── RENDER POST ────────────────────────────────────
  const renderPost = useCallback(({ item }: { item: any }) => {
    const isOwnPost = item.creator_id === user?.id;
    const creatorName = item.creator?.display_name || item.creator?.full_name || item.creator?.username || 'Unknown';
    const avatarUrl = item.creator?.avatar_url;
    const isVerified = item.creator?.verified;
    const isLiked = likedPosts.has(item.id);

    return (
      <View style={styles.postContainer}>
        {/* Media background */}
        {item.media_url ? (
          <Image
            source={{ uri: item.media_url, cache: 'force-cache' }}
            style={styles.mediaBg}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.mediaBg, styles.noMediaBg]} />
        )}

        {/* Dark overlay */}
        <View style={styles.overlay} />

        {/* Top bar */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.creatorRow}
            onPress={() => router.push(`/(os)/streets/creator/${item.creator_id}`)}
          >
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarFallbackText}>
                  {creatorName[0]?.toUpperCase() || 'U'}
                </Text>
              </View>
            )}
            <Text style={styles.creatorName}>{creatorName}</Text>
            {isVerified && <Ionicons name="checkmark-circle" size={14} color="#4CAF50" />}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              if (isOwnPost) {
                // TODO: Show action sheet with delete option
              }
            }}
          >
            <Ionicons name="ellipsis-vertical" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Center tap area */}
        <TouchableOpacity
          style={styles.centerTap}
          activeOpacity={1}
          onPress={() => router.push(`/(os)/streets/post/${item.id}`)}
        />

        {/* Right side actions */}
        <View style={styles.rightActions}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => handleLike(item.id)}>
            <Ionicons
              name={isLiked ? 'heart' : 'heart-outline'}
              size={28}
              color={isLiked ? '#ff2d55' : '#fff'}
            />
            <Text style={styles.actionCount}>{item.likes_count ?? 0}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => router.push(`/(os)/streets/post/${item.id}`)}
          >
            <Ionicons name="chatbubble-outline" size={26} color="#fff" />
            <Text style={styles.actionCount}>{item.comments_count ?? 0}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <Ionicons name="bookmark-outline" size={26} color="#fff" />
            <Text style={styles.actionCount}>{item.saves_count ?? 0}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <Ionicons name="share-outline" size={26} color="#fff" />
            <Text style={styles.actionCount}>{item.shares_count ?? 0}</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom caption */}
        <View style={styles.bottomInfo}>
          <Text style={styles.captionText}>{item.content || item.caption || ''}</Text>
          {item.hashtags && item.hashtags.length > 0 && (
            <View style={styles.hashtagRow}>
              {item.hashtags.map((tag: string, i: number) => (
                <TouchableOpacity key={i} onPress={() => router.push(`/(os)/streets/hashtag/${tag}`)}>
                  <Text style={styles.hashtag}>#{tag}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>
    );
  }, [user?.id, router, likedPosts, handleLike]);

  // ─── EMPTY STATE ────────────────────────────────────
  if (!loading && !refreshing && posts.length === 0 && !error) {
    return (
      <View style={styles.container}>
        <Header user={user} router={router} />
        <View style={styles.emptyContainer}>
          <Ionicons name="newspaper-outline" size={64} color="#333" />
          <Text style={styles.emptyTitle}>No posts yet</Text>
          <Text style={styles.emptySubtitle}>Be the first to share something!</Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/(os)/streets/create')}>
            <Text style={styles.emptyBtnText}>Create Post</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ─── ERROR STATE ────────────────────────────────────
  if (error && posts.length === 0) {
    return (
      <View style={styles.container}>
        <Header user={user} router={router} />
        <View style={styles.errorContainer}>
          <Ionicons name="warning" size={48} color="#ff4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={refresh}>
            <Text style={styles.retryBtnText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ─── MAIN FEED ──────────────────────────────────────
  return (
    <View style={styles.container}>
      <Header user={user} router={router} />

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={renderPost}
        pagingEnabled
        snapToInterval={POST_HEIGHT}
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#E91E63" />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loading && posts.length > 0 ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color="#E91E63" />
            </View>
          ) : null
        }
        getItemLayout={(_, index) => ({
          length: POST_HEIGHT,
          offset: POST_HEIGHT * index,
          index,
        })}
      />
    </View>
  );
}

// ─── HEADER COMPONENT ─────────────────────────────────
function Header({ user, router }: { user: any; router: any }) {
  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <TouchableOpacity onPress={() => router.push('/(os)/profile')}>
          {user?.user_metadata?.avatar_url ? (
            <Image source={{ uri: user.user_metadata.avatar_url }} style={styles.headerAvatar} />
          ) : (
            <View style={styles.headerAvatarFallback}>
              <Text style={styles.headerAvatarText}>
                {(user?.email?.[0] ?? 'U').toUpperCase()}
              </Text>
            </View>
          )}
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Streets</Text>
      </View>
      <View style={styles.headerRight}>
        <TouchableOpacity onPress={() => router.push('/(os)/streets/create')} style={styles.headerIcon}>
          <Ionicons name="add-circle" size={28} color="#E91E63" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/(os)/streets/search')} style={styles.headerIcon}>
          <Ionicons name="search" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8,
    borderBottomWidth: 1, borderBottomColor: '#222',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '700' },
  headerAvatar: { width: 32, height: 32, borderRadius: 16 },
  headerAvatarFallback: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: '#E91E63',
    alignItems: 'center', justifyContent: 'center',
  },
  headerAvatarText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  headerIcon: { padding: 4 },

  postContainer: {
    height: POST_HEIGHT,
    width: '100%',
    position: 'relative',
  },
  mediaBg: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  noMediaBg: { backgroundColor: '#1a1a1a' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },

  topBar: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8,
  },
  creatorRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  avatar: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: '#fff' },
  avatarFallback: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#E91E63',
    alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff',
  },
  avatarFallbackText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  creatorName: { color: '#fff', fontSize: 14, fontWeight: '600', marginRight: 4 },

  centerTap: {
    position: 'absolute', top: 60, left: 0, right: 80, bottom: 120,
  },

  rightActions: {
    position: 'absolute', right: 12, bottom: 120,
    alignItems: 'center', gap: 16,
  },
  actionBtn: { alignItems: 'center' },
  actionCount: { color: '#fff', fontSize: 12, marginTop: 2 },

  bottomInfo: {
    position: 'absolute', bottom: 20, left: 16, right: 100,
  },
  captionText: { color: '#fff', fontSize: 14, lineHeight: 20, textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  hashtagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  hashtag: { color: '#4fc3f7', fontSize: 13 },

  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyTitle: { color: '#fff', fontSize: 18, fontWeight: '600', marginTop: 16 },
  emptySubtitle: { color: '#666', fontSize: 14, marginTop: 8 },
  emptyBtn: { backgroundColor: '#E91E63', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24, marginTop: 20 },
  emptyBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },

  errorContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  errorText: { color: '#ff4444', fontSize: 14, textAlign: 'center', marginTop: 12 },
  retryBtn: { backgroundColor: '#E91E63', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24, marginTop: 20 },
  retryBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },

  footerLoader: { paddingVertical: 20, alignItems: 'center' },
});
