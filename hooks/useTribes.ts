// hooks/useTribes.ts
import { create } from 'zustand';
import { useIdentity } from '@/hooks/useAuthStore';
import { supabase } from '@/lib/supabase/client';

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
  author_id: string;
  author_name: string;
  content: string;
  media_urls?: string[];
  likes_count: number;
  comments_count: number;
  is_pinned: boolean;
  created_at: string;
}

export interface TribesState {
  tribes: Tribe[];
  myTribes: Tribe[];
  activeTribe: Tribe | null;
  activePosts: TribePost[];
  isLoading: boolean;
  error: string | null;

  loadTribes: () => Promise<void>;
  loadMyTribes: () => Promise<void>;
  loadTribePosts: (tribeId: string) => Promise<void>;
  createTribe: (tribe: Partial<Tribe>) => Promise<boolean>;
  joinTribe: (tribeId: string) => Promise<boolean>;
  leaveTribe: (tribeId: string) => Promise<boolean>;
  createPost: (tribeId: string, content: string, mediaUrls?: string[]) => Promise<boolean>;
  getTribeById: (id: string) => Tribe | undefined;
  clearActiveTribe: () => void;
  clearError: () => void;
}

export const useTribes = create<TribesState>((set, get) => ({
  tribes: [],
  myTribes: [],
  activeTribe: null,
  activePosts: [],
  isLoading: false,
  error: null,

  loadTribes: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('tribes')
        .select('*')
        .eq('is_private', false)
        .order('member_count', { ascending: false });

      if (error) throw error;
      set({ tribes: (data || []) as Tribe[] });
    } catch (err: any) {
      set({ error: err.message });
    } finally {
      set({ isLoading: false });
    }
  },

  loadMyTribes: async () => {
    const { user, isAuthenticated } = useIdentity.getState();
    if (!isAuthenticated || !user) {
      set({ myTribes: [] });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('tribe_members')
        .select('tribe_id, tribes(*)')
        .eq('user_id', user.id);

      if (error) throw error;
      const myTribeData = (data || []).map((d: any) => d.tribes as Tribe);
      set({ myTribes: myTribeData });
    } catch (err: any) {
      set({ error: err.message });
    } finally {
      set({ isLoading: false });
    }
  },

  loadTribePosts: async (tribeId: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('tribe_posts')
        .select('*')
        .eq('tribe_id', tribeId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      set({ activePosts: (data || []) as TribePost[] });
    } catch (err: any) {
      set({ error: err.message });
    } finally {
      set({ isLoading: false });
    }
  },

  createTribe: async (tribe: Partial<Tribe>) => {
    const { user, isAuthenticated } = useIdentity.getState();
    if (!isAuthenticated || !user) {
      set({ error: 'Not authenticated' });
      return false;
    }

    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('tribes')
        .insert({
          ...tribe,
          owner_id: user.id,
          member_count: 1,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // Add creator as owner member
      await supabase.from('tribe_members').insert({
        tribe_id: data.id,
        user_id: user.id,
        role: 'owner',
        joined_at: new Date().toISOString(),
      });

      set((state) => ({
        tribes: [data as Tribe, ...state.tribes],
        myTribes: [data as Tribe, ...state.myTribes],
      }));
      return true;
    } catch (err: any) {
      set({ error: err.message });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  joinTribe: async (tribeId: string) => {
    const { user, isAuthenticated } = useIdentity.getState();
    if (!isAuthenticated || !user) return false;

    try {
      const { error } = await supabase.from('tribe_members').insert({
        tribe_id: tribeId,
        user_id: user.id,
        role: 'member',
        joined_at: new Date().toISOString(),
      });

      if (error) throw error;

      // Increment member count
      await supabase.rpc('increment_tribe_member_count', { p_tribe_id: tribeId });

      const tribe = get().tribes.find(t => t.id === tribeId);
      if (tribe) {
        set((state) => ({
          myTribes: [...state.myTribes, { ...tribe, member_count: tribe.member_count + 1 }],
          tribes: state.tribes.map(t =>
            t.id === tribeId ? { ...t, member_count: t.member_count + 1 } : t
          ),
        }));
      }
      return true;
    } catch (err: any) {
      set({ error: err.message });
      return false;
    }
  },

  leaveTribe: async (tribeId: string) => {
    const { user, isAuthenticated } = useIdentity.getState();
    if (!isAuthenticated || !user) return false;

    try {
      const { error } = await supabase
        .from('tribe_members')
        .delete()
        .eq('tribe_id', tribeId)
        .eq('user_id', user.id);

      if (error) throw error;

      await supabase.rpc('decrement_tribe_member_count', { p_tribe_id: tribeId });

      set((state) => ({
        myTribes: state.myTribes.filter(t => t.id !== tribeId),
        tribes: state.tribes.map(t =>
          t.id === tribeId ? { ...t, member_count: Math.max(0, t.member_count - 1) } : t
        ),
      }));
      return true;
    } catch (err: any) {
      set({ error: err.message });
      return false;
    }
  },

  createPost: async (tribeId: string, content: string, mediaUrls?: string[]) => {
    const { user, isAuthenticated } = useIdentity.getState();
    if (!isAuthenticated || !user) return false;

    try {
      const { data, error } = await supabase
        .from('tribe_posts')
        .insert({
          tribe_id: tribeId,
          author_id: user.id,
          author_name: user.user_metadata?.full_name || user.email || 'User',
          content,
          media_urls: mediaUrls || [],
          likes_count: 0,
          comments_count: 0,
          is_pinned: false,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        activePosts: [data as TribePost, ...state.activePosts],
      }));
      return true;
    } catch (err: any) {
      set({ error: err.message });
      return false;
    }
  },

  getTribeById: (id: string) => get().tribes.find(t => t.id === id),
  clearActiveTribe: () => set({ activeTribe: null, activePosts: [] }),
  clearError: () => set({ error: null }),
}));

export default useTribes;
