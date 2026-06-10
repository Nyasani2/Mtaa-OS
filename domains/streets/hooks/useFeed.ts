// domains/streets/hooks/useFeed.ts
// MTAA Streets — Feed Hook (FIXED)

import { useCallback, useEffect, useState } from 'react';
import { useStreetsStore } from '../state';
import { fetchFeed, likePost, unlikePost, savePost, unsavePost, deletePost, pinPost } from '../services/feedService';
import type { StreetFeedFilters } from '../state/state';

export function useFeed(userId?: string) {
  const store = useStreetsStore();
  const [activeTab, setActiveTab] = useState<string>('For You');

  // Map tab names to filter types
  const tabToFilter: Record<string, StreetFeedFilters['type']> = {
    'For You': 'for_you',
    'Following': 'following',
    'Nearby': 'nearby',
    'Trending': 'trending',
    'New': 'new',
    'Live': 'live',
  };

  // Update filters when tab changes
  useEffect(() => {
    const filterType = tabToFilter[activeTab] || 'for_you';
    store.setFeedFilters({ ...store.feedFilters, type: filterType });
  }, [activeTab]);

  const loadFeed = useCallback(async (reset: boolean = false) => {
    const page = reset ? 0 : store.feedPage;
    store.setLoading(true);
    try {
      const { posts, hasMore } = await fetchFeed(store.feedFilters, page, userId);
      if (reset) {
        store.setFeedPosts(posts);
        store.setFeedPage(1);
      } else {
        store.appendFeedPosts(posts);
        store.setFeedPage(page + 1);
      }
      store.setFeedHasMore(hasMore);
    } catch (err: any) {
      console.error('Feed load error:', err);
      store.setError(err.message || 'Failed to load feed');
    } finally {
      store.setLoading(false);
    }
  }, [store.feedFilters, store.feedPage, userId]);

  const refreshFeed = useCallback(() => loadFeed(true), [loadFeed]);
  const loadMore = useCallback(() => {
    if (!store.isLoading && store.feedHasMore) {
      loadFeed(false);
    }
  }, [store.isLoading, store.feedHasMore, loadFeed]);

  // Auto-load on mount
  useEffect(() => {
    if (store.feedPosts.length === 0) {
      loadFeed(true);
    }
  }, []);

  const toggleLike = useCallback(async (postId: string) => {
    if (!userId) return;
    const post = store.feedPosts.find((p) => p.id === postId);
    if (!post) return;
    try {
      if (post.liked_by_me) {
        await unlikePost(postId, userId);
      } else {
        await likePost(postId, userId);
      }
      // Optimistic update
      store.setFeedPosts(
        store.feedPosts.map((p) =>
          p.id === postId
            ? { ...p, liked_by_me: !p.liked_by_me, like_count: p.liked_by_me ? p.like_count - 1 : p.like_count + 1 }
            : p
        )
      );
    } catch (err) {
      console.error('Like toggle error:', err);
    }
  }, [store.feedPosts, userId]);

  const toggleSave = useCallback(async (postId: string) => {
    if (!userId) return;
    try {
      const post = store.feedPosts.find((p) => p.id === postId);
      if (post?.saved_by_me) {
        await unsavePost(postId, userId);
      } else {
        await savePost(postId, userId);
      }
      // Optimistic update
      store.setFeedPosts(
        store.feedPosts.map((p) =>
          p.id === postId ? { ...p, saved_by_me: !p.saved_by_me } : p
        )
      );
    } catch (err) {
      console.error('Save toggle error:', err);
    }
  }, [store.feedPosts, userId]);

  const removePost = useCallback(async (postId: string) => {
    if (!userId) return;
    try {
      await deletePost(postId, userId);
      store.setFeedPosts(store.feedPosts.filter((p) => p.id !== postId));
    } catch (err) {
      console.error('Delete post error:', err);
    }
  }, [store.feedPosts, userId]);

  return {
    posts: store.feedPosts,
    isLoading: store.isLoading,
    activeTab,
    setActiveTab,
    refreshFeed,
    loadMore,
    toggleLike,
    toggleSave,
    removePost,
    error: store.error,
  };
}
