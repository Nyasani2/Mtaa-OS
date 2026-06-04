// domains/streets/state/state.ts
// Streets module shared state

import { create } from 'zustand';
import { StreetPost, StreetUser, StreetNotification, StreetMessage } from './types';

interface StreetsState {
  currentUser: StreetUser | null;
  feed: StreetPost[];
  notifications: StreetNotification[];
  messages: StreetMessage[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;

  setCurrentUser: (user: StreetUser | null) => void;
  setFeed: (feed: StreetPost[]) => void;
  addPost: (post: StreetPost) => void;
  removePost: (postId: string) => void;
  setNotifications: (notifications: StreetNotification[]) => void;
  markNotificationRead: (id: string) => void;
  setMessages: (messages: StreetMessage[]) => void;
  setUnreadCount: (count: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useStreetsStore = create<StreetsState>((set) => ({
  currentUser: null,
  feed: [],
  notifications: [],
  messages: [],
  unreadCount: 0,
  isLoading: false,
  error: null,

  setCurrentUser: (user) => set({ currentUser: user }),
  setFeed: (feed) => set({ feed }),
  addPost: (post) => set((state) => ({ feed: [post, ...state.feed] })),
  removePost: (postId) => set((state) => ({ feed: state.feed.filter(p => p.id !== postId) })),
  setNotifications: (notifications) => set({ notifications }),
  markNotificationRead: (id) => set((state) => ({
    notifications: state.notifications.map(n => n.id === id ? { ...n, is_read: true } : n),
    unreadCount: Math.max(0, state.unreadCount - 1),
  })),
  setMessages: (messages) => set({ messages }),
  setUnreadCount: (count) => set({ unreadCount: count }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
}));
