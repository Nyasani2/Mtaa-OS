// domains/pulse/state/store.ts
// MTAA Pulse — Zustand Store

import { create } from 'zustand';
import type {
  PulseEvent, PulseTopic, PulseTrend, PulseAlert, PulseRecommendation,
  PulseSavedItem, PulseAnalytics, PulseCreatorScore, PulseSearchResult,
  PulseHomeState, PulseSearchState, PulseNotificationState
} from '../types';

interface PulseStore extends PulseHomeState, PulseSearchState, PulseNotificationState {
  setTrending: (trending: PulseTrend[]) => void;
  setAlerts: (alerts: PulseAlert[]) => void;
  setRecommendations: (recommendations: PulseRecommendation[]) => void;
  setTopics: (topics: PulseTopic[]) => void;
  setEvents: (events: PulseEvent[]) => void;
  setAnalytics: (analytics: PulseAnalytics[]) => void;
  setCreators: (creators: PulseCreatorScore[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setActiveTab: (tab: PulseHomeState['activeTab']) => void;
  setSearchQuery: (query: string) => void;
  setSearchResults: (results: PulseSearchResult[]) => void;
  setSearchFilters: (filters: Partial<PulseSearchState['filters']>) => void;
  setSearchSuggestions: (suggestions: string[]) => void;
  setSearchLoading: (loading: boolean) => void;
  setSearchHasMore: (hasMore: boolean) => void;
  appendSearchResults: (results: PulseSearchResult[]) => void;
  setNotifications: (alerts: PulseAlert[]) => void;
  setUnreadCount: (count: number) => void;
  markAlertRead: (alertId: string) => void;
  dismissAlert: (alertId: string) => void;
  savedItems: PulseSavedItem[];
  setSavedItems: (items: PulseSavedItem[]) => void;
  addSavedItem: (item: PulseSavedItem) => void;
  removeSavedItem: (itemId: string) => void;
  followedTopics: string[];
  setFollowedTopics: (topics: string[]) => void;
  followTopic: (topicId: string) => void;
  unfollowTopic: (topicId: string) => void;
}

export const usePulseStore = create<PulseStore>((set, get) => ({
  trending: [], alerts: [], recommendations: [], topics: [],
  events: [], analytics: [], creators: [],
  loading: false, error: null, activeTab: 'for_you',
  query: '', results: [], filters: {}, suggestions: [], hasMore: false,
  unreadCount: 0, savedItems: [], followedTopics: [],

  setTrending: (trending) => set({ trending }),
  setAlerts: (alerts) => set({ alerts }),
  setRecommendations: (recommendations) => set({ recommendations }),
  setTopics: (topics) => set({ topics }),
  setEvents: (events) => set({ events }),
  setAnalytics: (analytics) => set({ analytics }),
  setCreators: (creators) => set({ creators }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setActiveTab: (activeTab) => set({ activeTab }),
  setSearchQuery: (query) => set({ query }),
  setSearchResults: (results) => set({ results }),
  setSearchFilters: (filters) => set({ filters: { ...get().filters, ...filters } }),
  setSearchSuggestions: (suggestions) => set({ suggestions }),
  setSearchLoading: (loading) => set({ loading }),
  setSearchHasMore: (hasMore) => set({ hasMore }),
  appendSearchResults: (results) => set({ results: [...get().results, ...results] }),
  setNotifications: (alerts) => set({ alerts }),
  setUnreadCount: (unreadCount) => set({ unreadCount }),
  markAlertRead: (alertId) => set({
    alerts: get().alerts.map(a => a.id === alertId ? { ...a, is_read: true } : a),
    unreadCount: Math.max(0, get().unreadCount - 1)
  }),
  dismissAlert: (alertId) => set({ alerts: get().alerts.filter(a => a.id !== alertId) }),
  setSavedItems: (savedItems) => set({ savedItems }),
  addSavedItem: (item) => set({ savedItems: [item, ...get().savedItems] }),
  removeSavedItem: (itemId) => set({ savedItems: get().savedItems.filter(i => i.id !== itemId) }),
  setFollowedTopics: (followedTopics) => set({ followedTopics }),
  followTopic: (topicId) => set({
    followedTopics: [...get().followedTopics, topicId],
    topics: get().topics.map(t => t.id === topicId ? { ...t, is_following: true, follower_count: t.follower_count + 1 } : t)
  }),
  unfollowTopic: (topicId) => set({
    followedTopics: get().followedTopics.filter(id => id !== topicId),
    topics: get().topics.map(t => t.id === topicId ? { ...t, is_following: false, follower_count: Math.max(0, t.follower_count - 1) } : t)
  }),
}));
