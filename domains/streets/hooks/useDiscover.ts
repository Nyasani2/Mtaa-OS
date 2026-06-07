// lib/streets/hooks/useDiscover.ts
// MTAA Streets — Discover Hook

import { useCallback, useEffect } from 'react';
import { useStreetsStore } from '../state';
import { fetchDiscover, fetchTrendingTags, searchPosts, searchUsers } from '../services/discoverService';

// Inline type since StreetDiscoverFilters may not be exported from types
export interface StreetDiscoverFilters {
  category?: string;
  sortBy?: 'popular' | 'recent' | 'nearby';
  query?: string;
  location?: { lat: number; lng: number };
}

export function useDiscover() {
  const store = useStreetsStore();

  const loadDiscover = useCallback(async (reset: boolean = false) => {
    const page = reset ? 0 : (store as any).discoverPage || 0;
    (store as any).setDiscoverLoading?.(true);
    try {
      const { posts, hasMore } = await fetchDiscover((store as any).discoverFilters || {}, page);
      if (reset) {
        (store as any).setDiscoverPosts?.(posts);
        (store as any).setDiscoverPage?.(1);
      } else {
        (store as any).appendDiscoverPosts?.(posts);
        (store as any).setDiscoverPage?.(page + 1);
      }
      (store as any).setDiscoverHasMore?.(hasMore);
    } catch (err) {
      console.error('Discover load error:', err);
    } finally {
      (store as any).setDiscoverLoading?.(false);
    }
  }, [(store as any).discoverFilters, (store as any).discoverPage]);

  const loadTrendingTags = useCallback(async () => {
    try {
      const tags = await fetchTrendingTags();
      (store as any).setTrendingTags?.(tags);
    } catch (err) {
      console.error('Trending tags error:', err);
    }
  }, [store]);

  const search = useCallback(async (query: string) => {
    (store as any).setDiscoverLoading?.(true);
    try {
      const { posts, hasMore } = await searchPosts(query, 0);
      (store as any).setDiscoverPosts?.(posts);
      (store as any).setDiscoverHasMore?.(hasMore);
      (store as any).setDiscoverPage?.(1);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      (store as any).setDiscoverLoading?.(false);
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
    (store as any).setDiscoverFilters?.(filters);
    loadDiscover(true);
  }, [store, loadDiscover]);

  useEffect(() => {
    if ((store as any).discoverPosts?.length === 0) {
      loadDiscover(true);
    }
    if ((store as any).trendingTags?.length === 0) {
      loadTrendingTags();
    }
  }, []);

  return {
    posts: (store as any).discoverPosts || [],
    loading: (store as any).discoverLoading || false,
    hasMore: (store as any).discoverHasMore || false,
    filters: (store as any).discoverFilters || {},
    trendingTags: (store as any).trendingTags || [],
    refreshDiscover: () => loadDiscover(true),
    loadMore: () => loadDiscover(false),
    search,
    searchPeople,
    setFilters,
  };
}
