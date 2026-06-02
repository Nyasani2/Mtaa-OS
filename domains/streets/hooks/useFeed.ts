// lib/streets/hooks/useFeed.ts
// MTAA Streets — Feed Hook

import { useCallback, useEffect } from 'react';
import { useStreetsStore } from '../state';
import { fetchFeed, likePost, unlikePost, savePost, unsavePost, deletePost, pinPost } from '../services/feedService';
import { StreetFeedFilters } from '../types';

export function useFeed(userId?: string) {
  const store = useStreetsStore();

  const loadFeed = useCallback(async (reset: boolean = false) => {
    const page = reset ? 0 : store.feedPage;
    store.setFeedLoading(true);
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
    } catch (err) {
      console.error('Feed load error:', err);
    } finally {
      store.setFeedLoading(false);
    }
  }, [store.feedFilters, store.feedPage, userId]);

  const refreshFeed = useCallback(() => loadFeed(true), [loadFeed]);
  const loadMore = useCallback(() => loadFeed(false), [loadFeed]);

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
      await refreshFeed();
    } catch (err) {
      console.error('Like toggle error:', err);
    }
  }, [store.feedPosts, userId, refreshFeed]);

  const toggleSave = useCallback(async (postId: string) => {
    if (!userId) return;
    try {
      const post = store.feedPosts.find((p) => p.id === postId);
      if (post?.saved_by_me) {
        await unsavePost(postId, userId);
      } else {
        await savePost(postId, userId);
      }
      await refreshFeed();
    } catch (err) {
      console.error('Save toggle error:', err);
    }
  }, [store.feedPosts, userId, refreshFeed]);

  const removePost = useCallback(async (postId: string) => {
    if (!userId) return;
    try {
      await deletePost(postId, userId);
      store.setFeedPosts(store.feedPosts.filter((p) => p.id !== postId));
    } catch (err) {
      console.error('Delete post error:', err);
    }
  }, [store.feedPosts, userId]);

  const setFilters = useCallback((filters: StreetFeedFilters) => {
    store.setFeedFilters(filters);
    loadFeed(true);
  }, [store, loadFeed]);

  useEffect(() => {
    if (store.feedPosts.length === 0) {
      loadFeed(true);
    }
  }, []);

  return {
    posts: store.feedPosts,
    loading: store.feedLoading,
    hasMore: store.feedHasMore,
    filters: store.feedFilters,
    refreshFeed,
    loadMore,
    toggleLike,
    toggleSave,
    removePost,
    setFilters,
  };
}
