// lib/streets/hooks/useDiscover.ts
// MTAA Streets — Discover Hook

import { useCallback, useEffect } from 'react';
import { useStreetsStore } from '../state';
import { fetchDiscover, fetchTrendingTags, searchPosts, searchUsers } from '../services/discoverService';
import { StreetDiscoverFilters } from '../types';

export function useDiscover() {
  const store = useStreetsStore();

  const loadDiscover = useCallback(async (reset: boolean = false) => {
    const page = reset ? 0 : store.discoverPage;
    store.setDiscoverLoading(true);
    try {
      const { posts, hasMore } = await fetchDiscover(store.discoverFilters, page);
      if (reset) {
        store.setDiscoverPosts(posts);
        store.setDiscoverPage(1);
      } else {
        store.appendDiscoverPosts(posts);
        store.setDiscoverPage(page + 1);
      }
      store.setDiscoverHasMore(hasMore);
    } catch (err) {
      console.error('Discover load error:', err);
    } finally {
      store.setDiscoverLoading(false);
    }
  }, [store.discoverFilters, store.discoverPage]);

  const loadTrendingTags = useCallback(async () => {
    try {
      const tags = await fetchTrendingTags();
      store.setTrendingTags(tags);
    } catch (err) {
      console.error('Trending tags error:', err);
    }
  }, [store]);

  const search = useCallback(async (query: string) => {
    store.setDiscoverLoading(true);
    try {
      const { posts, hasMore } = await searchPosts(query, 0);
      store.setDiscoverPosts(posts);
      store.setDiscoverHasMore(hasMore);
      store.setDiscoverPage(1);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      store.setDiscoverLoading(false);
    }
  }, [store]);

  const searchPeople = useCallback(async (query: string) => {
    try {
      return await searchUsers(query);
    } catch (err) {
      console.error('People search error:', err);
      return [];
    }
  }, []);

  const setFilters = useCallback((filters: StreetDiscoverFilters) => {
    store.setDiscoverFilters(filters);
    loadDiscover(true);
  }, [store, loadDiscover]);

  useEffect(() => {
    if (store.discoverPosts.length === 0) {
      loadDiscover(true);
    }
    if (store.trendingTags.length === 0) {
      loadTrendingTags();
    }
  }, []);

  return {
    posts: store.discoverPosts,
    loading: store.discoverLoading,
    hasMore: store.discoverHasMore,
    filters: store.discoverFilters,
    trendingTags: store.trendingTags,
    refreshDiscover: () => loadDiscover(true),
    loadMore: () => loadDiscover(false),
    search,
    searchPeople,
    setFilters,
  };
}
