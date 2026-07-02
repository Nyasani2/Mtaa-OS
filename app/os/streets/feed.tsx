import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/lib/auth/useAuth';
import {
  getFeedPosts,
  toggleLike,
  deletePost,
  StreetPost,
} from '@/lib/services/streets-service';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function StreetsFeedScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [posts, setPosts] = useState<StreetPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [activeVideo, setActiveVideo] = useState<string | null>(null);

  const fetchPosts = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
        setOffset(0);
      } else if (offset === 0) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      setError(null);
      const currentOffset = isRefresh ? 0 : offset;
      const { posts: newPosts, error: fetchError } = await getFeedPosts(20, currentOffset);

      if (fetchError) {
        setError(fetchError.message || 'Failed to load posts');
        return;
      }

      if (isRefresh) {
        setPosts(newPosts);
        setOffset(20);
      } else {
        setPosts((prev) => (currentOffset === 0 ? newPosts : [...prev, ...newPosts]));
        setOffset((prev) => prev + 20);
      }

      setHasMore(newPosts.length === 20);
    } catch (err: any) {
      setError(err.message || 'Failed to load posts');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [offset]);

  useEffect(() => {
    fetchPosts(true);
  }, []);

  const handleLike = async (postId: string) => {
    try {
      const { liked, error: likeError } = await toggleLike(postId);
      if (likeError) {
        Alert.alert('Error', 'Failed to like post');
        return;
      }

      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? {
                ...post,
                is_liked: liked,
                likes_count: liked ? (post.likes_count || 0) + 1 : Math.max(0, (post.likes_count || 0) - 1),
              }
            : post
        )
      );
    } catch {
      Alert.alert('Error', 'Failed to like post');
    }
  };

  const handleDelete = async (postId: string) => {
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { success, error: deleteError } = await deletePost(postId);
              if (deleteError || !success) {
                Alert.alert('Error', 'Failed to delete post');
                return;
              }
              setPosts((prev) => prev.filter((p) => p.id !== postId));
            } catch {
              Alert.alert('Error', 'Failed to delete post');
            }
          },
        },
      ]
    );
  };

  const handleVideoPress = (mediaUrl: string) => {
    setActiveVideo(mediaUrl);
  };

  const renderPost = ({ item: post }: { item: StreetPost }) => {
    const isOwner = post.creator_id === user?.id;
    const hasMedia = post.media_url && post.media_url.length > 0;

    return (
      <View style={styles.postCard}>
        {/* Header */}
        <View style={styles.postHeader}>
          <View style={styles.userInfo}>
            {post.creator?.avatar_url ? (
              <Image source={{ uri: post.creator.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={20} color="#999" />
              </View>
            )}
            <View>
              <Text style={styles.username}>
                {post.creator?.full_name || post.creator?.username || 'Anonymous'}
              </Text>
              <Text style={styles.timestamp}>
                {new Date(post.created_at).toLocaleDateString()}
              </Text>
            </View>
          </View>
          {isOwner ? (
            <TouchableOpacity onPress={() => handleDelete(post.id)}>
              <Ionicons name="trash-outline" size={20} color="#ff4444" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Caption */}
        {post.caption ? (
          <Text style={styles.caption}>{post.caption}</Text>
        ) : null}

        {/* Media */}
        {hasMedia && post.media_type === 'image' ? (
          <Image
            source={{ uri: post.media_url! }}
            style={styles.mediaImage}
            resizeMode="cover"
          />
        ) : null}

        {hasMedia && post.media_type === 'video' ? (
          <TouchableOpacity
            style={styles.videoContainer}
            onPress={() => handleVideoPress(post.media_url!)}
          >
            <View style={styles.videoThumbnail}>
              <Ionicons name="play-circle" size={64} color="rgba(255,255,255,0.9)" />
              <Text style={styles.videoLabel}>Video</Text>
            </View>
          </TouchableOpacity>
        ) : null}

        {/* Actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleLike(post.id)}
          >
            <Ionicons
              name={post.is_liked ? 'heart' : 'heart-outline'}
              size={22}
              color={post.is_liked ? '#ff4444' : '#666'}
            />
            <Text style={[styles.actionText, post.is_liked ? styles.likedText : null]}>
              {post.likes_count || 0}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push(`/streets/comments/${post.id}`)}
          >
            <Ionicons name="chatbubble-outline" size={22} color="#666" />
            <Text style={styles.actionText}>{post.comments_count || 0}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="share-outline" size={22} color="#666" />
            <Text style={styles.actionText}>{post.shares_count || 0}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="eye-outline" size={22} color="#666" />
            <Text style={styles.actionText}>{post.views_count || 0}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading && posts.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (error && posts.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#ff4444" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => fetchPosts(true)}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchPosts(true)} />
        }
        onEndReached={() => {
          if (hasMore && !loadingMore) {
            fetchPosts(false);
          }
        }}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color="#007AFF" />
            </View>
          ) : null
        }
        ListEmptyComponent={
          !error ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="images-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>No posts yet</Text>
              <Text style={styles.emptySubtext}>Be the first to share something!</Text>
            </View>
          ) : null
        }
      />

      {/* Floating Create Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/streets/create')}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  listContent: {
    padding: 12,
    paddingBottom: 80,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  postCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  username: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  caption: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 12,
  },
  mediaImage: {
    width: '100%',
    height: SCREEN_WIDTH * 0.6,
    borderRadius: 8,
    marginBottom: 12,
  },
  videoContainer: {
    width: '100%',
    height: SCREEN_WIDTH * 0.6,
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoThumbnail: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoLabel: {
    color: '#fff',
    fontSize: 14,
    marginTop: 8,
  },
  actionsRow: {
    flexDirection: 'row',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  actionText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 4,
  },
  likedText: {
    color: '#ff4444',
  },
  errorText: {
    fontSize: 16,
    color: '#ff4444',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  footerLoader: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#999',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#bbb',
    marginTop: 8,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
});
