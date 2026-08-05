// lib/tribes/services/tribes.service.ts
// Tribes service — tribes, posts, membership, discovery
// FIXED: All implicit joins replaced with explicit two-query pattern

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
      .select('*')
      .eq('is_private', false)
      .order('member_count', { ascending: false });

    if (category) query = query.eq('category', category);
    if (search) query = query.ilike('name', `%${search}%`);

    const { data: tribes, error } = await query.limit(50);
    if (error) {
      console.error('[TribesService] discoverTribes error:', error);
      return [];
    }

    // Fetch creator profiles separately to avoid implicit join crash
    const creatorIds = [...new Set((tribes || []).map((t: any) => t.creator_id).filter(Boolean))];
    const { data: creators } = creatorIds.length > 0
      ? await supabase.from('user_profiles').select('id, display_name').in('id', creatorIds)
      : { data: [] };
    const creatorMap = new Map((creators || []).map((c: any) => [c.id, c.display_name]));

    return (tribes || []).map((t: any) => ({
      ...t,
      creator_name: creatorMap.get(t.creator_id) || 'Unknown',
    })) as Tribe[];
  }

  // ─── Get Tribe ───────────────────────────────────────────────────

  async getTribe(tribeId: string): Promise<Tribe | null> {
    const { data: tribe, error } = await supabase
      .from('tribes')
      .select('*')
      .eq('id', tribeId)
      .maybeSingle();

    if (error) {
      console.error('[TribesService] getTribe error:', error);
      return null;
    }

    if (!tribe) return null;

    // Fetch creator profile separately
    const { data: creator } = tribe.creator_id
      ? await supabase.from('user_profiles').select('display_name').eq('id', tribe.creator_id).maybeSingle()
      : { data: null };

    return { ...tribe, creator_name: creator?.display_name || 'Unknown' } as Tribe;
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
      .maybeSingle();

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
    const { data: posts, error } = await supabase
      .from('tribe_posts')
      .select('*')
      .eq('tribe_id', tribeId)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[TribesService] getPosts error:', error);
      return [];
    }

    // Fetch author profiles separately
    const authorIds = [...new Set((posts || []).map((p: any) => p.author_id).filter(Boolean))];
    const { data: authors } = authorIds.length > 0
      ? await supabase.from('user_profiles').select('id, display_name, avatar_url').in('id', authorIds)
      : { data: [] };
    const authorMap = new Map((authors || []).map((a: any) => [a.id, a]));

    return (posts || []).map((p: any) => {
      const author = authorMap.get(p.author_id);
      return {
        ...p,
        author_name: author?.display_name || 'Unknown',
        author_avatar: author?.avatar_url || null,
      };
    }) as TribePost[];
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
      .maybeSingle();

    if (error) {
      console.error('[TribesService] createPost error:', error);
      return { success: false, error: error.message };
    }

    // Increment tribe post count
    await supabase.rpc('increment_tribe_post_count', { tribe_id: post.tribe_id });

    return { success: true, post: data as TribePost };
  }

  async getPost(postId: string): Promise<TribePost | null> {
    const { data: post, error } = await supabase
      .from('tribe_posts')
      .select('*')
      .eq('id', postId)
      .maybeSingle();

    if (error || !post) return null;

    // Fetch author profile separately
    const { data: author } = post.author_id
      ? await supabase.from('user_profiles').select('display_name, avatar_url').eq('id', post.author_id).maybeSingle()
      : { data: null };

    return {
      ...post,
      author_name: author?.display_name || 'Unknown',
      author_avatar: author?.avatar_url || null,
    } as TribePost;
  }

  // ─── Membership ──────────────────────────────────────────────────

  async joinTribe(userId: string, tribeId: string): Promise<{ success: boolean; error?: string }> {
    const { data: tribe } = await supabase
      .from('tribes')
      .select('is_private')
      .eq('id', tribeId)
      .maybeSingle();

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
    // Step 1: Get memberships
    const { data: memberships, error: mError } = await supabase
      .from('tribe_members')
      .select('tribe_id')
      .eq('user_id', userId);

    if (mError) {
      console.error('[TribesService] getMyTribes error:', mError);
      return [];
    }

    const tribeIds = (memberships || []).map((m: any) => m.tribe_id);
    if (tribeIds.length === 0) return [];

    // Step 2: Get tribes
    const { data: tribes, error: tError } = await supabase
      .from('tribes')
      .select('*')
      .in('id', tribeIds);

    if (tError) {
      console.error('[TribesService] getMyTribes tribes error:', tError);
      return [];
    }

    // Step 3: Get creator profiles
    const creatorIds = [...new Set((tribes || []).map((t: any) => t.creator_id).filter(Boolean))];
    const { data: creators } = creatorIds.length > 0
      ? await supabase.from('user_profiles').select('id, display_name').in('id', creatorIds)
      : { data: [] };
    const creatorMap = new Map((creators || []).map((c: any) => [c.id, c.display_name]));

    return (tribes || []).map((t: any) => ({
      ...t,
      creator_name: creatorMap.get(t.creator_id) || 'Unknown',
    })) as Tribe[];
  }

  async isMember(userId: string, tribeId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('tribe_members')
      .select('id')
      .eq('tribe_id', tribeId)
      .eq('user_id', userId)
      .maybeSingle();

    return !error && !!data;
  }
}

export const tribesService = TribesService.getInstance();
