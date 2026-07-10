// lib/tribes/services/tribes.service.ts
// Tribes service — tribes, posts, membership, discovery

import { supabase } from '@/lib/supabase';

// ─── Types ─────────────────────────────────────────────────────────

export interface Tribe {
  id: string;
  name: string;
  slug: string;
  description: string;
  avatar_url: string | null;
  cover_url: string | null;
  category: string;
  is_private: boolean;
  member_count: number;
  post_count: number;
  creator_id: string;
  creator_name: string;
  created_at: string;
  updated_at: string;
}

export interface TribePost {
  id: string;
  tribe_id: string;
  author_id: string;
  author_name: string;
  author_avatar: string | null;
  title: string;
  content: string;
  media_urls: string[];
  likes_count: number;
  comments_count: number;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

export interface TribeMember {
  id: string;
  tribe_id: string;
  user_id: string;
  user_name: string;
  user_avatar: string | null;
  role: 'admin' | 'moderator' | 'member';
  joined_at: string;
}

export interface TribeJoinRequest {
  id: string;
  tribe_id: string;
  user_id: string;
  user_name: string;
  message: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

// ─── Service ───────────────────────────────────────────────────────

class TribesService {
  private static instance: TribesService;

  static getInstance(): TribesService {
    if (!TribesService.instance) {
      TribesService.instance = new TribesService();
    }
    return TribesService.instance;
  }

  // ─── Discovery ───────────────────────────────────────────────────

  async discoverTribes(category?: string, search?: string): Promise<Tribe[]> {
    let query = supabase
      .from('tribes')
      .select(`
        *,
        profiles:creator_id (display_name)
      `)
      .eq('is_private', false)
      .order('member_count', { ascending: false });

    if (category) query = query.eq('category', category);
    if (search) query = query.ilike('name', `%${search}%`);

    const { data, error } = await query.limit(50);
    if (error) {
      console.error('[TribesService] discoverTribes error:', error);
      return [];
    }

    return (data || []).map((t: any) => ({
      ...t,
      creator_name: t.profiles?.display_name || 'Unknown',
    })) as Tribe[];
  }

  // ─── Get Tribe ───────────────────────────────────────────────────

  async getTribe(tribeId: string): Promise<Tribe | null> {
    const { data, error } = await supabase
      .from('tribes')
      .select(`*, profiles:creator_id (display_name)`)
      .eq('id', tribeId)
      .single();

    if (error) {
      console.error('[TribesService] getTribe error:', error);
      return null;
    }

    return data ? { ...data, creator_name: data.profiles?.display_name || 'Unknown' } as Tribe : null;
  }

  // ─── Create Tribe ────────────────────────────────────────────────

  async createTribe(userId: string, tribe: Omit<Tribe, 'id' | 'creator_id' | 'creator_name' | 'member_count' | 'post_count' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; tribe?: Tribe; error?: string }> {
    const { data, error } = await supabase
      .from('tribes')
      .insert({
        ...tribe,
        creator_id: userId,
        member_count: 1,
        post_count: 0,
      })
      .select()
      .single();

    if (error) {
      console.error('[TribesService] createTribe error:', error);
      return { success: false, error: error.message };
    }

    // Auto-join creator as admin
    await supabase.from('tribe_members').insert({
      tribe_id: data.id,
      user_id: userId,
      role: 'admin',
    });

    return { success: true, tribe: data as Tribe };
  }

  // ─── Posts ───────────────────────────────────────────────────────

  async getPosts(tribeId: string, limit: number = 20): Promise<TribePost[]> {
    const { data, error } = await supabase
      .from('tribe_posts')
      .select(`
        *,
        profiles:author_id (display_name, avatar_url)
      `)
      .eq('tribe_id', tribeId)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[TribesService] getPosts error:', error);
      return [];
    }

    return (data || []).map((p: any) => ({
      ...p,
      author_name: p.profiles?.display_name || 'Unknown',
      author_avatar: p.profiles?.avatar_url || null,
    })) as TribePost[];
  }

  async createPost(userId: string, post: Omit<TribePost, 'id' | 'author_id' | 'author_name' | 'author_avatar' | 'likes_count' | 'comments_count' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; post?: TribePost; error?: string }> {
    const { data, error } = await supabase
      .from('tribe_posts')
      .insert({
        ...post,
        author_id: userId,
        likes_count: 0,
        comments_count: 0,
      })
      .select()
      .single();

    if (error) {
      console.error('[TribesService] createPost error:', error);
      return { success: false, error: error.message };
    }

    // Increment tribe post count
    await supabase.rpc('increment_tribe_post_count', { tribe_id: post.tribe_id });

    return { success: true, post: data as TribePost };
  }

  async getPost(postId: string): Promise<TribePost | null> {
    const { data, error } = await supabase
      .from('tribe_posts')
      .select(`*, profiles:author_id (display_name, avatar_url)`)
      .eq('id', postId)
      .single();

    if (error) return null;
    return data ? {
      ...data,
      author_name: data.profiles?.display_name || 'Unknown',
      author_avatar: data.profiles?.avatar_url || null,
    } as TribePost : null;
  }

  // ─── Membership ──────────────────────────────────────────────────

  async joinTribe(userId: string, tribeId: string): Promise<{ success: boolean; error?: string }> {
    const { data: tribe } = await supabase
      .from('tribes')
      .select('is_private')
      .eq('id', tribeId)
      .single();

    if (!tribe) return { success: false, error: 'Tribe not found' };

    if (tribe.is_private) {
      // Create join request
      const { error } = await supabase
        .from('tribe_join_requests')
        .insert({ tribe_id: tribeId, user_id: userId });
      if (error) return { success: false, error: error.message };
      return { success: true };
    }

    // Direct join
    const { error } = await supabase
      .from('tribe_members')
      .insert({ tribe_id: tribeId, user_id: userId, role: 'member' });

    if (error) return { success: false, error: error.message };

    // Increment member count
    await supabase.rpc('increment_tribe_member_count', { tribe_id: tribeId });
    return { success: true };
  }

  async leaveTribe(userId: string, tribeId: string): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase
      .from('tribe_members')
      .delete()
      .eq('tribe_id', tribeId)
      .eq('user_id', userId);

    if (error) return { success: false, error: error.message };
    await supabase.rpc('decrement_tribe_member_count', { tribe_id: tribeId });
    return { success: true };
  }

  async getMyTribes(userId: string): Promise<Tribe[]> {
    const { data, error } = await supabase
      .from('tribe_members')
      .select(`
        tribe_id,
        tribes:tribe_id (*, profiles:creator_id (display_name))
      `)
      .eq('user_id', userId);

    if (error) {
      console.error('[TribesService] getMyTribes error:', error);
      return [];
    }

    return (data || []).map((m: any) => ({
      ...m.tribes,
      creator_name: m.tribes?.profiles?.display_name || 'Unknown',
    })) as Tribe[];
  }

  async isMember(userId: string, tribeId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('tribe_members')
      .select('id')
      .eq('tribe_id', tribeId)
      .eq('user_id', userId)
      .single();

    return !error && !!data;
  }
}

export const tribesService = TribesService.getInstance();
