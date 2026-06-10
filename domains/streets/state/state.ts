// domains/streets/state/state.ts
// Streets module shared state — FIXED to match hook expectations

import { create } from 'zustand';
import type { StreetPost, StreetUser, StreetNotification, StreetMessage } from './types';

export interface StreetFeedFilters {
  type?: 'for_you' | 'following' | 'nearby' | 'trending' | 'new' | 'live' | 'tribe';
  tribe_id?: string;
  media_type?: 'all' | 'image' | 'video' | 'audio' | 'text';
  time_range?: 'today' | 'week' | 'month' | 'all';
  location?: { lat: number; lng: number; radius: number };
  sortBy?: 'popular' | 'recent' | 'following';
  category?: string;
}

interface StreetsState {
  // Feed
  feedPosts: StreetPost[];
  feedPage: number;
  feedHasMore: boolean;
  feedFilters: StreetFeedFilters;
  isLoading: boolean;
  error: string | null;

  // Legacy (keep for compatibility)
  currentUser: StreetUser | null;
  feed: StreetPost[];
  notifications: StreetNotification[];
  messages: StreetMessage[];
  unreadCount: number;

  // Actions
  setFeedPosts: (posts: StreetPost[]) => void;
  appendFeedPosts: (posts: StreetPost[]) => void;
  setFeedPage: (page: number) => void;
  setFeedHasMore: (hasMore: boolean) => void;
  setFeedFilters: (filters: StreetFeedFilters) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Legacy actions
  setCurrentUser: (user: StreetUser | null) => void;
  setFeed: (feed: StreetPost[]) => void;
  addPost: (post: StreetPost) => void;
  removePost: (postId: string) => void;
  setNotifications: (notifications: StreetNotification[]) => void;
  markNotificationRead: (id: string) => void;
  setMessages: (messages: StreetMessage[]) => void;
  setUnreadCount: (count: number) => void;
}

export const useStreetsStore = create<StreetsState>((set) => ({
  // Feed state
  feedPosts: [],
  feedPage: 0,
  feedHasMore: true,
  feedFilters: { type: 'for_you' },
  isLoading: false,
  error: null,

  // Legacy state
  currentUser: null,
  feed: [],
  notifications: [],
  messages: [],
  unreadCount: 0,

  // Feed actions
  setFeedPosts: (posts) => set({ feedPosts: posts }),
  appendFeedPosts: (posts) => set((state) => ({ feedPosts: [...state.feedPosts, ...posts] })),
  setFeedPage: (page) => set({ feedPage: page }),
  setFeedHasMore: (hasMore) => set({ feedHasMore: hasMore }),
  setFeedFilters: (filters) => set({ feedFilters: filters }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),

  // Legacy actions
  setCurrentUser: (user) => set({ currentUser: user }),
  setFeed: (feed) => set({ feed }),
  addPost: (post) => set((state) => ({ feed: [post, ...state.feed], feedPosts: [post, ...state.feedPosts] })),
  removePost: (postId) => set((state) => ({
    feed: state.feed.filter(p => p.id !== postId),
    feedPosts: state.feedPosts.filter(p => p.id !== postId),
  })),
  setNotifications: (notifications) => set({ notifications }),
  markNotificationRead: (id) => set((state) => ({
    notifications: state.notifications.map(n => n.id === id ? { ...n, is_read: true } : n),
    unreadCount: Math.max(0, state.unreadCount - 1),
  })),
  setMessages: (messages) => set({ messages }),
  setUnreadCount: (count) => set({ unreadCount: count }),
}));
