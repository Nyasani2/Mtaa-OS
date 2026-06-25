import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { FeedCard } from '@/domains/streets/components/FeedCard';
import {
  getFeedPosts,
  likePost,
  unlikePost,
  savePost,
  unsavePost,
  followUser,
  StreetPost,
} from '@/lib/services/streets-service';

const { width } = Dimensions.get('window');

export default function FeedScreen() {
  const router = useRouter();
  const [posts, setPosts] = useState<StreetPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFeed = useCallback(async (pageNum: number = 1, isRefresh: boolean = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else if (pageNum === 1) setLoading(true);

      const { posts: newPosts, error: feedError, hasMore: more } = await getFeedPosts(pageNum, 10);

      if (feedError) {
        setError(feedError);
        return;
      }

      setError(null);

      if (isRefresh || pageNum === 1) {
        setPosts(newPosts);
      } else {
        setPosts((prev) => [...prev, ...newPosts]);
      }

      setHasMore(more);
    } catch (err: any) {
      setError(err.message || 'Failed to load feed');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadFeed(1);
  }, [loadFeed]);

  const handleRefresh = () => {
    setPage(1);
    loadFeed(1, true);
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadFeed(nextPage);
    }
  };

  const handleLike = async (postId: string) => {
    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    // Optimistic update
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, isLiked: !p.isLiked, likes_count: p.isLiked ? p.likes_count - 1 : p.likes_count + 1 }
          : p
      )
    );

    const result = post.isLiked ? await unlikePost(postId) : await likePost(postId);
    if (!result.success) {
      // Revert on error
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, isLiked: post.isLiked, likes_count: post.likes_count }
            : p
        )
      );
    }
  };

  const handleSave = async (postId: string) => {
    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, isSaved: !p.isSaved } : p
      )
    );

    const result = post.isSaved ? await unsavePost(postId) : await savePost(postId);
    if (!result.success) {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, isSaved: post.isSaved } : p
        )
      );
    }
  };

  const handleFollow = async (userId: string) => {
    const result = await followUser(userId);
    if (result.success) {
      setPosts((prev) =>
        prev.map((p) =>
          p.creator?.user_id === userId ? { ...p, isFollowing: true } : p
        )
      );
    }
  };

  const handleProfilePress = (userId: string) => {
    router.push(`/streets/profile/${userId}` as any);
  };

  const renderItem = useCallback(
    ({ item }: { item: StreetPost }) => (
      <FeedCard
        post={item}
        onLike={handleLike}
        onSave={handleSave}
        onFollow={handleFollow}
        onProfilePress={handleProfilePress}
      />
    ),
    []
  );

  const keyExtractor = (item: StreetPost) => item.id;

  if (loading && posts.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#FF2D55" />
          <Text style={styles.loadingText}>Loading Streets...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && posts.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.centered}>
          <Text style={styles.errorText}>Failed to load feed</Text>
          <Text style={styles.errorSubtext}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!loading && posts.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>No posts yet</Text>
          <Text style={styles.emptySubtext}>Be the first to create content on Streets!</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" />
      <FlatList
        data={posts}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        pagingEnabled
        snapToInterval={width * 1.6}
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#FF2D55" />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          hasMore ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color="#FF2D55" />
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    color: '#999',
    marginTop: 16,
    fontSize: 16,
  },
  errorText: {
    color: '#FF2D55',
    fontSize: 18,
    fontWeight: '600',
  },
  errorSubtext: {
    color: '#999',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  emptyTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
  },
  emptySubtext: {
    color: '#999',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  footerLoader: {
    padding: 24,
    alignItems: 'center',
  },
});
