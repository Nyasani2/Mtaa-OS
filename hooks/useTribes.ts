// hooks/useTribes.ts
// FIXED: supabase path @/lib/supabase/client → @/lib/supabase
// FIXED: auth path @/hooks/useAuthStore → @/lib/auth/useAuthStore

import { create } from 'zustand';
import { useIdentity } from '@/lib/auth/useAuthStore';
import { supabase } from '@/lib/supabase';

export interface Tribe {
  id: string;
  name: string;
  slug: string;
  description: string;
  avatar_url?: string;
  cover_url?: string;
  category: string;
  is_private: boolean;
  member_count: number;
  owner_id: string;
  rules?: string[];
  created_at: string;
}

export interface TribeMember {
  id: string;
  tribe_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'moderator' | 'member';
  joined_at: string;
}

export interface TribePost {
  id: string;
  tribe_id: string;
  user_id: string;
  content: string;
  media_urls?: string[];
  likes_count: number;
  comments_count: number;
  created_at: string;
}

interface TribesState {
  tribes: Tribe[];
  myTribes: Tribe[];
  currentTribe: Tribe | null;
  posts: TribePost[];
  members: TribeMember[];
  loading: boolean;
  error: string | null;
  fetchTribes: () => Promise<void>;
  fetchMyTribes: (userId: string) => Promise<void>;
  fetchTribeById: (id: string) => Promise<void>;
  fetchPosts: (tribeId: string) => Promise<void>;
  fetchMembers: (tribeId: string) => Promise<void>;
  createTribe: (data: Partial<Tribe>) => Promise<Tribe | null>;
  joinTribe: (tribeId: string, userId: string) => Promise<void>;
  createPost: (tribeId: string, content: string, userId: string) => Promise<void>;
}

export const useTribesStore = create<TribesState>((set, get) => ({
  tribes: [],
  myTribes: [],
  currentTribe: null,
  posts: [],
  members: [],
  loading: false,
  error: null,

  fetchTribes: async () => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('tribes')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      set({ tribes: data || [], loading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch tribes', loading: false });
    }
  },

  fetchMyTribes: async (userId: string) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('tribe_members')
        .select('tribe_id, tribes(*)')
        .eq('user_id', userId);
      if (error) throw error;
      const myTribes = (data || []).map((d: any) => d.tribes).filter(Boolean);
      set({ myTribes, loading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch my tribes', loading: false });
    }
  },

  fetchTribeById: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('tribes')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      set({ currentTribe: data, loading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch tribe', loading: false });
    }
  },

  fetchPosts: async (tribeId: string) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('tribe_posts')
        .select('*, profiles(full_name, avatar_url)')
        .eq('tribe_id', tribeId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      set({ posts: data || [], loading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch posts', loading: false });
    }
  },

  fetchMembers: async (tribeId: string) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('tribe_members')
        .select('*, profiles(full_name, avatar_url)')
        .eq('tribe_id', tribeId);
      if (error) throw error;
      set({ members: data || [], loading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch members', loading: false });
    }
  },

  createTribe: async (tribeData: Partial<Tribe>) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('tribes')
        .insert(tribeData)
        .select()
        .single();
      if (error) throw error;
      set((state) => ({ tribes: [data, ...state.tribes], loading: false }));
      return data;
    } catch (err: any) {
      set({ error: err.message || 'Failed to create tribe', loading: false });
      return null;
    }
  },

  joinTribe: async (tribeId: string, userId: string) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase
        .from('tribe_members')
        .insert({ tribe_id: tribeId, user_id: userId, role: 'member' });
      if (error) throw error;
      set({ loading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to join tribe', loading: false });
    }
  },

  createPost: async (tribeId: string, content: string, userId: string) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase
        .from('tribe_posts')
        .insert({ tribe_id: tribeId, user_id: userId, content, likes_count: 0, comments_count: 0 });
      if (error) throw error;
      // Refresh posts
      await get().fetchPosts(tribeId);
      set({ loading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to create post', loading: false });
    }
  },
}));

export default useTribesStore;
