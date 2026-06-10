// domains/pulse/hooks/usePulseHome.ts
// MTAA Pulse — Home Screen Hook

import { useState, useEffect, useCallback } from 'react';
import { pulseService } from '../services/pulseService';
import { usePulseStore } from '../state/store';

export function usePulseHome() {
  const store = usePulseStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadHome = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [trending, alerts, recommendations, topics, analytics, creators] = await Promise.all([
        pulseService.getTrends({ period: 'daily', limit: 10 }),
        pulseService.getAlerts({ limit: 5 }),
        pulseService.getRecommendations({ limit: 10 }),
        pulseService.getTopics({ featured: true, limit: 10 }),
        pulseService.getAnalytics({ period: 'daily', limit: 6 }),
        pulseService.getCreatorScores({ limit: 10 }),
      ]);

      const deliveries = await pulseService.getAlertDeliveries();
      const alertsWithStatus = alerts.map(a => {
        const d = deliveries.find(d => d.alert_id === a.id);
        return { ...a, is_read: !!d?.read_at, is_dismissed: !!d?.dismissed_at };
      });

      store.setTrending(trending);
      store.setAlerts(alertsWithStatus);
      store.setRecommendations(recommendations);
      store.setTopics(topics);
      store.setAnalytics(analytics);
      store.setCreators(creators);
      store.setUnreadCount(alertsWithStatus.filter(a => !a.is_read).length);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, [store]);

  useEffect(() => {
    loadHome();
  }, [loadHome]);

  return {
    ...store,
    isLoading,
    error,
    refresh: loadHome,
  };
}

// ============================================================================
// usePulseSearch.ts
// ============================================================================

export function usePulseSearch() {
  const store = usePulseStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (query: string) => {
    if (!query.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const results = await pulseService.search(query, { limit: 20 });
      store.setSearchResults(results);
      store.setSearchHasMore(results.length === 20);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, [store]);

  const loadMore = useCallback(async () => {
    if (!store.query || !store.hasMore) return;
    setIsLoading(true);
    try {
      const results = await pulseService.search(store.query, { limit: 20, offset: store.results.length });
      store.appendSearchResults(results);
      store.setSearchHasMore(results.length === 20);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, [store]);

  const getSuggestions = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 2) {
      store.setSearchSuggestions([]);
      return;
    }
    try {
      const suggestions = await pulseService.getSearchSuggestions(query);
      store.setSearchSuggestions(suggestions);
    } catch {
      store.setSearchSuggestions([]);
    }
  }, [store]);

  return {
    query: store.query,
    results: store.results,
    filters: store.filters,
    suggestions: store.suggestions,
    hasMore: store.hasMore,
    isLoading,
    error,
    setQuery: store.setSearchQuery,
    setFilters: store.setSearchFilters,
    search,
    loadMore,
    getSuggestions,
  };
}

// ============================================================================
// usePulseAlerts.ts
// ============================================================================

export function usePulseAlerts() {
  const store = usePulseStore();
  const [isLoading, setIsLoading] = useState(false);

  const loadAlerts = useCallback(async (params?: { type?: string; severity?: string }) => {
    setIsLoading(true);
    try {
      const alerts = await pulseService.getAlerts(params);
      const deliveries = await pulseService.getAlertDeliveries();
      const alertsWithStatus = alerts.map(a => {
        const d = deliveries.find(d => d.alert_id === a.id);
        return { ...a, is_read: !!d?.read_at, is_dismissed: !!d?.dismissed_at };
      });
      store.setAlerts(alertsWithStatus);
      store.setUnreadCount(alertsWithStatus.filter(a => !a.is_read).length);
    } catch (e: any) {
      console.error('Failed to load alerts:', e.message);
    } finally {
      setIsLoading(false);
    }
  }, [store]);

  const markRead = useCallback(async (alertId: string) => {
    try {
      await pulseService.markAlertRead(alertId);
      store.markAlertRead(alertId);
    } catch (e: any) {
      console.error('Failed to mark alert read:', e.message);
    }
  }, [store]);

  const dismiss = useCallback(async (alertId: string) => {
    try {
      await pulseService.dismissAlert(alertId);
      store.dismissAlert(alertId);
    } catch (e: any) {
      console.error('Failed to dismiss alert:', e.message);
    }
  }, [store]);

  return {
    alerts: store.alerts,
    unreadCount: store.unreadCount,
    isLoading,
    loadAlerts,
    markRead,
    dismiss,
  };
}

// ============================================================================
// usePulseTopics.ts
// ============================================================================

export function usePulseTopics() {
  const store = usePulseStore();
  const [isLoading, setIsLoading] = useState(false);

  const loadTopics = useCallback(async (params?: { category?: string }) => {
    setIsLoading(true);
    try {
      const [topics, followed] = await Promise.all([
        pulseService.getTopics(params),
        pulseService.getFollowedTopics(),
      ]);
      store.setTopics(topics.map(t => ({ ...t, is_following: followed.includes(t.id) })));
      store.setFollowedTopics(followed);
    } catch (e: any) {
      console.error('Failed to load topics:', e.message);
    } finally {
      setIsLoading(false);
    }
  }, [store]);

  const follow = useCallback(async (topicId: string) => {
    try {
      await pulseService.followTopic(topicId);
      store.followTopic(topicId);
    } catch (e: any) {
      console.error('Failed to follow topic:', e.message);
    }
  }, [store]);

  const unfollow = useCallback(async (topicId: string) => {
    try {
      await pulseService.unfollowTopic(topicId);
      store.unfollowTopic(topicId);
    } catch (e: any) {
      console.error('Failed to unfollow topic:', e.message);
    }
  }, [store]);

  return {
    topics: store.topics,
    followedTopics: store.followedTopics,
    isLoading,
    loadTopics,
    follow,
    unfollow,
  };
}

// ============================================================================
// usePulseSaved.ts
// ============================================================================

export function usePulseSaved() {
  const store = usePulseStore();
  const [isLoading, setIsLoading] = useState(false);

  const loadSaved = useCallback(async () => {
    setIsLoading(true);
    try {
      const items = await pulseService.getSavedItems();
      store.setSavedItems(items);
    } catch (e: any) {
      console.error('Failed to load saved items:', e.message);
    } finally {
      setIsLoading(false);
    }
  }, [store]);

  const saveItem = useCallback(async (item: Parameters<typeof pulseService.saveItem>[0]) => {
    try {
      const saved = await pulseService.saveItem(item);
      store.addSavedItem(saved);
    } catch (e: any) {
      console.error('Failed to save item:', e.message);
    }
  }, [store]);

  const unsaveItem = useCallback(async (itemId: string) => {
    try {
      await pulseService.unsaveItem(itemId);
      store.removeSavedItem(itemId);
    } catch (e: any) {
      console.error('Failed to unsave item:', e.message);
    }
  }, [store]);

  return {
    savedItems: store.savedItems,
    isLoading,
    loadSaved,
    saveItem,
    unsaveItem,
  };
}
