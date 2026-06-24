import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Image,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Video, ResizeMode } from 'expo-av';
import { useStreets } from '@/lib/hooks/useStreets';
import type { StreetPost, CreatorProfile } from '@/lib/services/streets-service';

const { height: SCREEN_H, width: SCREEN_W } = Dimensions.get('window');
const POST_HEIGHT = SCREEN_H;

function formatCount(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return String(n);
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return new Date(dateStr).toLocaleDateString();
}

// ============================================
// SINGLE POST (full screen like TikTok)
// ============================================
interface PostItemProps {
  post: StreetPost;
  profile: CreatorProfile | undefined;
  isLiked: boolean;
  isActive: boolean;
  isOwner: boolean;
  onLike: (id: string) => void;
  onDelete: (id: string) => void;
  onProfileTap: (creatorId: string) => void;
}

function PostItem({ post, profile, isLiked, isActive, isOwner, onLike, onDelete, onProfileTap }: PostItemProps) {
  const videoRef = useRef<Video>(null);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    if (post.media_type === 'video' && videoRef.current) {
      if (isActive) {
        videoRef.current.playAsync();
      } else {
        videoRef.current.pauseAsync();
      }
    }
  }, [isActive, post.media_type]);

  const handleDelete = useCallback(() => {
    Alert.alert('Delete Post?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => onDelete(post.id) },
    ]);
  }, [post.id, onDelete]);

  const displayName = profile?.full_name || profile?.username || 'User';
  const avatarUrl = profile?.avatar_url;

  return (
    <View style={styles.postContainer}>
      {/* Full-screen background media */}
      <View style={styles.mediaBg}>
        {post.media_type === 'video' && post.media_url ? (
          <Video
            ref={videoRef}
            source={{ uri: post.media_url }}
            style={styles.fullMedia}
            resizeMode={ResizeMode.COVER}
            isLooping
            shouldPlay={isActive}
            isMuted={false}
            useNativeControls={false}
          />
        ) : post.media_type === 'image' && post.media_url ? (
          <Image source={{ uri: post.media_url }} style={styles.fullMedia} resizeMode="cover" />
        ) : (
          <View style={[styles.fullMedia, { backgroundColor: '#1a1a1a', justifyContent: 'center', alignItems: 'center' }]}>
            <Ionicons name="musical-note" size={60} color="#444" />
          </View>
        )}
        <View style={styles.mediaOverlay} />
      </View>

      {/* Right-side action buttons */}
      <View style={styles.rightActions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => onLike(post.id)}>
          <Ionicons name={isLiked ? 'heart' : 'heart-outline'} size={34} color={isLiked ? '#ff2d55' : '#fff'} />
          <Text style={styles.actionCount}>{formatCount(post.likes_count)}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn}>
          <Ionicons name="chatbubble-ellipses" size={30} color="#fff" />
          <Text style={styles.actionCount}>{formatCount(post.comments_count)}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn}>
          <Ionicons name="share-social" size={28} color="#fff" />
          <Text style={styles.actionCount}>{formatCount(post.shares_count)}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn}>
          <Ionicons name="bookmark-outline" size={28} color="#fff" />
          <Text style={styles.actionCount}>{formatCount(post.saves_count)}</Text>
        </TouchableOpacity>

        {isOwner && (
          <TouchableOpacity style={styles.actionBtn} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={28} color="#ff3b30" />
            <Text style={[styles.actionCount, { color: '#ff3b30' }]}>Delete</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Bottom info */}
      <View style={styles.bottomInfo}>
        <TouchableOpacity style={styles.creatorRow} onPress={() => onProfileTap(post.creator_id)}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, { backgroundColor: '#444', justifyContent: 'center', alignItems: 'center' }]}>
              <Ionicons name="person" size={16} color="#888" />
            </View>
          )}
          <Text style={styles.creatorName}>{displayName}</Text>
          <Text style={styles.timeAgo}> · {timeAgo(post.created_at)}</Text>
        </TouchableOpacity>

        {post.content ? (
          <Text style={styles.postContent} numberOfLines={3}>{post.content}</Text>
        ) : null}

        {post.caption ? (
          <Text style={styles.postCaption} numberOfLines={2}>{post.caption}</Text>
        ) : null}

        {post.music_title ? (
          <View style={styles.musicRow}>
            <Ionicons name="musical-note" size={14} color="#fff" />
            <Text style={styles.musicText} numberOfLines={1}>{post.music_title}</Text>
          </View>
        ) : null}

        {post.hashtags && post.hashtags.length > 0 ? (
          <Text style={styles.hashtags} numberOfLines={1}>{post.hashtags.join(' ')}</Text>
        ) : null}
      </View>
    </View>
  );
}

// ============================================
// MAIN SCREEN
// ============================================
export default function StreetsFeedScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    posts, profiles, loading, refreshing, hasMore, activeTab, likedPosts, userId,
    refresh, loadMore, switchTab, handleDelete, handleLike,
  } = useStreets();

  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index || 0);
    }
  }).current;

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 }).current;

  const renderItem = useCallback(({ item, index }: { item: StreetPost; index: number }) => (
    <PostItem
      post={item}
      profile={profiles[item.creator_id]}
      isLiked={likedPosts.has(item.id)}
      isActive={index === activeIndex}
      isOwner={item.creator_id === userId}
      onLike={handleLike}
      onDelete={handleDelete}
      onProfileTap={(id) => router.push(`/(os)/profile/${id}` as any)}
    />
  ), [profiles, likedPosts, activeIndex, userId, handleLike, handleDelete, router]);

  const keyExtractor = useCallback((item: StreetPost) => item.id, []);

  const getItemLayout = useCallback((_: any, index: number) => ({
    length: POST_HEIGHT,
    offset: POST_HEIGHT * index,
    index,
  }), []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Floating header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Streets</Text>
        <View style={styles.tabRow}>
          {(['following', 'feed', 'discover'] as const).map((tab) => (
            <TouchableOpacity key={tab} onPress={() => switchTab(tab)} style={styles.tabBtn}>
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab === 'feed' ? 'For You' : tab === 'following' ? 'Following' : 'Discover'}
              </Text>
              {activeTab === tab && <View style={styles.tabIndicator} />}
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={styles.createBtn} onPress={() => router.push('/(os)/streets/create' as any)}>
          <Ionicons name="add-circle" size={32} color="#fff" />
        </TouchableOpacity>
      </View>

      {posts.length === 0 && !loading ? (
        <View style={styles.emptyState}>
          <Ionicons name="videocam-off" size={48} color="#ccc" />
          <Text style={styles.emptyText}>
            {activeTab === 'following' ? 'Follow users to see their posts' : 'No posts yet'}
          </Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/(os)/streets/create' as any)}>
            <Text style={styles.emptyBtnText}>Create First Post</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={posts}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          pagingEnabled
          snapToInterval={POST_HEIGHT}
          decelerationRate="fast"
          showsVerticalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          getItemLayout={getItemLayout}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          refreshing={refreshing}
          onRefresh={refresh}
          maxToRenderPerBatch={3}
          windowSize={5}
          removeClippedSubviews={Platform.OS !== 'web'}
        />
      )}

      {loading && posts.length === 0 && (
        <View style={styles.loaderOverlay}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  headerTitle: {
    position: 'absolute',
    left: 16,
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  tabRow: { flexDirection: 'row', gap: 20, alignItems: 'center' },
  tabBtn: { alignItems: 'center', paddingVertical: 4 },
  tabText: { fontSize: 15, fontWeight: '600', color: 'rgba(255,255,255,0.6)' },
  tabTextActive: { color: '#fff' },
  tabIndicator: { marginTop: 4, width: 20, height: 3, borderRadius: 2, backgroundColor: '#fff' },
  createBtn: { position: 'absolute', right: 16 },
  postContainer: {
    height: POST_HEIGHT,
    width: SCREEN_W,
    position: 'relative',
  },
  mediaBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#111',
  },
  fullMedia: {
    width: SCREEN_W,
    height: POST_HEIGHT,
  },
  mediaOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  rightActions: {
    position: 'absolute',
    right: 10,
    bottom: 100,
    alignItems: 'center',
    gap: 18,
    zIndex: 10,
  },
  actionBtn: {
    alignItems: 'center',
    gap: 2,
  },
  actionCount: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  bottomInfo: {
    position: 'absolute',
    left: 16,
    right: 80,
    bottom: 80,
    zIndex: 10,
  },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#fff',
  },
  creatorName: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  timeAgo: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
  },
  postContent: {
    color: '#fff',
    fontSize: 15,
    lineHeight: 20,
    marginBottom: 6,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  postCaption: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    marginBottom: 6,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  musicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  musicText: {
    color: '#fff',
    fontSize: 13,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  hashtags: {
    color: '#4dabf7',
    fontSize: 13,
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#000',
  },
  emptyText: {
    color: '#888',
    fontSize: 16,
    textAlign: 'center',
  },
  emptyBtn: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  emptyBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
});
