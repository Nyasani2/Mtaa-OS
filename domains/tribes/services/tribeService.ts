// lib/tribes/services/tribes.service.ts
// Tribes service — discovery, membership, posts, events, donations

import { supabase } from '@/lib/supabase';
// TODO: Fix identityEngine import path
// @ts-ignore — path needs verification
import { identityEngine } from '@/lib/kernel/identity';

export interface Tribe {
  id: string;
  name: string;
  slug: string;
  description?: string;
  avatar_url?: string;
  cover_url?: string;
  category_id?: string;
  creator_id: string;
  is_paid: boolean;
  membership_fee: number;
  membership_currency: string;
  is_private: boolean;
  member_count: number;
  post_count: number;
  rules?: string;
  location?: string;
  tags?: string[];
  status: string;
  created_at: string;
  category?: { name: string; icon: string };
  creator?: { first_name: string; last_name: string };
  is_member?: boolean;
  my_role?: string;
}

export interface TribeMember {
  id: string;
  tribe_id: string;
  user_id: string;
  role: 'member' | 'moderator' | 'admin';
  status: 'pending' | 'active' | 'banned' | 'left';
  joined_at: string;
  last_active_at: string;
  payment_status: string;
  profile?: { first_name: string; last_name: string; avatar_url?: string };
}

export interface TribePost {
  id: string;
  tribe_id: string;
  author_id: string;
  type: 'text' | 'image' | 'video' | 'poll' | 'event' | 'announcement';
  title?: string;
  content: string;
  media_urls?: string[];
    caption?: string;
    hashtags?: string[];
    thumbnail_url?: string;
  poll_options?: any;
  poll_results?: any;
  is_pinned: boolean;
  is_announcement: boolean;
  like_count: number;
  comment_count: number;
  share_count: number;
  status: string;
  created_at: string;
  author?: { first_name: string; last_name: string; avatar_url?: string };
  is_liked?: boolean;
}

export interface TribeEvent {
  id: string;
  tribe_id: string;
  creator_id: string;
  title: string;
  description?: string;
  location?: string;
  start_at: string;
  end_at?: string;
  is_online: boolean;
  meeting_link?: string;
  max_attendees?: number;
  attendee_count: number;
  status: string;
  my_status?: string;
  created_at: string;
}

export interface TribeDonation {
  id: string;
  tribe_id: string;
  donor_id: string;
  amount: number;
  currency: string;
  message?: string;
  is_anonymous: boolean;
  status: string;
  created_at: string;
  donor?: { first_name: string; last_name: string };
}

class TribesService {
  private static instance: TribesService;

  static getInstance(): TribesService {
    if (!TribesService.instance) {
      TribesService.instance = new TribesService();
    }
    return TribesService.instance;
  }

  // ─── DISCOVERY ───

  async discoverTribes(options?: {
    category?: string;
    search?: string;
    paid_only?: boolean;
    free_only?: boolean;
    near_me?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<Tribe[]> {
    const user = await identityEngine.getUser();
    let query = supabase
      .from('tribes')
      .select(`
        *,
        tribe_categories:category_id (name, icon),
        profiles:creator_id (first_name, last_name)
      `)
      .eq('status', 'active')
      .order('member_count', { ascending: false });

    if (options?.category) {
      query = query.eq('category_id', options.category);
    }
    if (options?.search) {
      query = query.or(`name.ilike.%${options.search}%,description.ilike.%${options.search}%`);
    }
    if (options?.paid_only) {
      query = query.eq('is_paid', true);
    }
    if (options?.free_only) {
      query = query.eq('is_paid', false);
    }

    const limit = options?.limit || 20;
    const offset = options?.offset || 0;
    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;
    if (error) {
      console.error('Discover tribes error:', error);
      return [];
    }

    // Check membership for each tribe
    const tribes = (data || []).map((t: any) => ({
      ...t,
      category: t.tribe_categories,
      creator: t.profiles,
    }));

    if (user) {
      const { data: memberships } = await supabase
        .from('tribe_members')
        .select('tribe_id, role, status')
        .eq('user_id', user.id)
        .eq('status', 'active');

      const memberMap = new Map((memberships || []).map((m: any) => [m.tribe_id, m]));

      tribes.forEach((t: any) => {
        const m = memberMap.get(t.id);
        t.is_member = !!m;
        t.my_role = m?.role;
      });
    }

    return tribes;
  }

  async getCategories() {
    const { data, error } = await supabase
      .from('tribe_categories')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) return [];
    return data || [];
  }

  // ─── TRIBE DETAIL ───

  async getTribe(tribeId: string): Promise<Tribe | null> {
    const user = await identityEngine.getUser();
    const { data, error } = await supabase
      .from('tribes')
      .select(`
        *,
        tribe_categories:category_id (name, icon),
        profiles:creator_id (first_name, last_name)
      `)
      .eq('id', tribeId)
      .single();

    if (error || !data) return null;

    const tribe = {
      ...data,
      category: data.tribe_categories,
      creator: data.profiles,
    };

    if (user) {
      const { data: membership } = await supabase
        .from('tribe_members')
        .select('role, status')
        .eq('tribe_id', tribeId)
        .eq('user_id', user.id)
        .single();

      tribe.is_member = membership?.status === 'active';
      tribe.my_role = membership?.role;
    }

    return tribe;
  }

  // ─── MEMBERSHIP ───

  async joinTribe(tribeId: string): Promise<{ success: boolean; error?: string; payment_required?: boolean }> {
    const user = await identityEngine.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    // Check if paid
    const { data: tribe } = await supabase
      .from('tribes')
      .select('is_paid, membership_fee, membership_currency')
      .eq('id', tribeId)
      .single();

    if (tribe?.is_paid && tribe.membership_fee > 0) {
      return {
        success: false,
        error: `Membership fee: ${tribe.membership_currency} ${tribe.membership_fee}`,
        payment_required: true,
      };
    }

    const { error } = await supabase
      .from('tribe_members')
      .upsert({
        tribe_id: tribeId,
        user_id: user.id,
        role: 'member',
        status: 'active',
        joined_at: new Date().toISOString(),
      }, { onConflict: 'tribe_id,user_id' });

    if (error) return { success: false, error: error.message };
    return { success: true };
  }

  async joinPaidTribe(tribeId: string): Promise<{ success: boolean; error?: string }> {
    const user = await identityEngine.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const { data: tribe } = await supabase
      .from('tribes')
      .select('membership_fee, membership_currency')
      .eq('id', tribeId)
      .single();

    if (!tribe) return { success: false, error: 'Tribe not found' };

    // Deduct from wallet via edge function
    const { data, error } = await supabase.functions.invoke('tribe-join-paid', {
      body: {
        user_id: user.id,
        tribe_id: tribeId,
        amount: tribe.membership_fee,
        currency: tribe.membership_currency,
      },
    });

    if (error) return { success: false, error: error.message };
    if (data?.error) return { success: false, error: data.error };

    return { success: true };
  }

  async leaveTribe(tribeId: string): Promise<{ success: boolean; error?: string }> {
    const user = await identityEngine.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const { error } = await supabase
      .from('tribe_members')
      .update({ status: 'left' })
      .eq('tribe_id', tribeId)
      .eq('user_id', user.id);

    if (error) return { success: false, error: error.message };
    return { success: true };
  }

  async getMembers(tribeId: string): Promise<TribeMember[]> {
    const { data, error } = await supabase
      .from('tribe_members')
      .select(`
        *,
        profiles:user_id (first_name, last_name, avatar_url)
      `)
      .eq('tribe_id', tribeId)
      .eq('status', 'active')
      .order('joined_at', { ascending: true });

    if (error) return [];
    return (data || []).map((m: any) => ({
      ...m,
      profile: m.profiles,
    }));
  }

  // ─── POSTS ───

  async getPosts(tribeId: string, options?: { pinned_only?: boolean; limit?: number; offset?: number }): Promise<TribePost[]> {
    const user = await identityEngine.getUser();
    let query = supabase
      .from('tribe_posts')
      .select(`
        *,
        profiles:author_id (first_name, last_name, avatar_url)
      `)
      .eq('tribe_id', tribeId)
      .eq('status', 'published')
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false });

    if (options?.pinned_only) {
      query = query.eq('is_pinned', true);
    }

    const limit = options?.limit || 20;
    const offset = options?.offset || 0;
    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;
    if (error) {
      console.error('Get posts error:', error);
      return [];
    }

    const posts = (data || []).map((p: any) => ({
      ...p,
      author: p.profiles,
    }));

    // Check likes
    if (user && posts.length > 0) {
      const postIds = posts.map((p: any) => p.id);
      const { data: likes } = await supabase
        .from('tribe_post_likes')
        .select('post_id')
        .eq('user_id', user.id)
        .in('post_id', postIds);

      const likedSet = new Set((likes || []).map((l: any) => l.post_id));
      posts.forEach((p: any) => {
        p.is_liked = likedSet.has(p.id);
      });
    }

    return posts;
  }

  async createPost(tribeId: string, post: {
    type: string;
    title?: string;
    content: string;
    media_urls?: string[];
    caption?: string;
    hashtags?: string[];
    thumbnail_url?: string;
    poll_options?: string[];
    is_announcement?: boolean;
  }): Promise<{ success: boolean; post?: TribePost; error?: string }> {
    const user = await identityEngine.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const { data, error } = await supabase
      .from('tribe_posts')
      .insert({
        tribe_id: tribeId,
        author_id: user.id,
        type: post.type,
        title: post.title,
        content: post.content,
        media_urls: post.media_urls,
        caption: post.caption || null,
        hashtags: post.hashtags || null,
        thumbnail_url: post.thumbnail_url || null,
        poll_options: post.poll_options ? { options: post.poll_options } : null,
        is_announcement: post.is_announcement || false,
      })
      .select()
      .single();

    if (error) return { success: false, error: error.message };
    return { success: true, post: data };
  }

  async toggleLike(postId: string): Promise<{ success: boolean; liked: boolean; error?: string }> {
    const user = await identityEngine.getUser();
    if (!user) return { success: false, liked: false, error: 'Not authenticated' };

    // Check if already liked
    const { data: existing } = await supabase
      .from('tribe_post_likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .single();

    if (existing) {
      // Unlike
      const { error } = await supabase
        .from('tribe_post_likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user.id);

      if (error) return { success: false, liked: true, error: error.message };
      return { success: true, liked: false };
    } else {
      // Like
      const { error } = await supabase
        .from('tribe_post_likes')
        .insert({ post_id: postId, user_id: user.id });

      if (error) return { success: false, liked: false, error: error.message };
      return { success: true, liked: true };
    }
  }

  async getComments(postId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('tribe_post_comments')
      .select(`
        *,
        profiles:author_id (first_name, last_name, avatar_url)
      `)
      .eq('post_id', postId)
      .eq('status', 'active')
      .is('parent_id', null)
      .order('created_at', { ascending: true });

    if (error) return [];
    return (data || []).map((c: any) => ({
      ...c,
      author: c.profiles,
    }));
  }

  async addComment(postId: string, content: string, parentId?: string): Promise<{ success: boolean; error?: string }> {
    const user = await identityEngine.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const { error } = await supabase
      .from('tribe_post_comments')
      .insert({
        post_id: postId,
        author_id: user.id,
        parent_id: parentId || null,
        content,
      });

    if (error) return { success: false, error: error.message };
    return { success: true };
  }

  // ─── EVENTS ───

  async getEvents(tribeId: string): Promise<TribeEvent[]> {
    const user = await identityEngine.getUser();
    const { data, error } = await supabase
      .from('tribe_events')
      .select('*')
      .eq('tribe_id', tribeId)
      .order('start_at', { ascending: true });

    if (error) return [];

    const events = data || [];

    if (user) {
      const eventIds = events.map((e: any) => e.id);
      const { data: attendance } = await supabase
        .from('tribe_event_attendees')
        .select('event_id, status')
        .eq('user_id', user.id)
        .in('event_id', eventIds);

      const statusMap = new Map((attendance || []).map((a: any) => [a.event_id, a.status]));
      events.forEach((e: any) => {
        e.my_status = statusMap.get(e.id);
      });
    }

    return events;
  }

  async createEvent(tribeId: string, event: {
    title: string;
    description?: string;
    location?: string;
    start_at: string;
    end_at?: string;
    is_online?: boolean;
    meeting_link?: string;
    max_attendees?: number;
  }): Promise<{ success: boolean; error?: string }> {
    const user = await identityEngine.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const { error } = await supabase
      .from('tribe_events')
      .insert({
        tribe_id: tribeId,
        creator_id: user.id,
        ...event,
      });

    if (error) return { success: false, error: error.message };
    return { success: true };
  }

  async setAttendance(eventId: string, status: 'going' | 'maybe' | 'not_going'): Promise<{ success: boolean; error?: string }> {
    const user = await identityEngine.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const { error } = await supabase
      .from('tribe_event_attendees')
      .upsert({
        event_id: eventId,
        user_id: user.id,
        status,
      }, { onConflict: 'event_id,user_id' });

    if (error) return { success: false, error: error.message };
    return { success: true };
  }

  // ─── DONATIONS ───

  async getDonations(tribeId: string): Promise<TribeDonation[]> {
    const { data, error } = await supabase
      .from('tribe_donations')
      .select(`
        *,
        profiles:donor_id (first_name, last_name)
      `)
      .eq('tribe_id', tribeId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) return [];
    return (data || []).map((d: any) => ({
      ...d,
      donor: d.profiles,
    }));
  }

  async donate(tribeId: string, amount: number, currency: string, message?: string, isAnonymous?: boolean): Promise<{ success: boolean; error?: string }> {
    const user = await identityEngine.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const { data, error } = await supabase.functions.invoke('tribe-donate', {
      body: {
        donor_id: user.id,
        tribe_id: tribeId,
        amount,
        currency,
        message,
        is_anonymous: isAnonymous,
      },
    });

    if (error) return { success: false, error: error.message };
    if (data?.error) return { success: false, error: data.error };

    return { success: true };
  }

  // ─── CREATE TRIBE ───

  async createTribe(tribe: {
    name: string;
    description?: string;
    category_id?: string;
    is_paid?: boolean;
    membership_fee?: number;
    membership_currency?: string;
    is_private?: boolean;
    rules?: string;
    location?: string;
    tags?: string[];
  }): Promise<{ success: boolean; tribe?: Tribe; error?: string }> {
    const user = await identityEngine.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const slug = tribe.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    const { data, error } = await supabase
      .from('tribes')
      .insert({
        ...tribe,
        slug: `${slug}-${Date.now().toString(36)}`,
        creator_id: user.id,
      })
      .select()
      .single();

    if (error) return { success: false, error: error.message };

    // Auto-add creator as admin
    await supabase.from('tribe_members').insert({
      tribe_id: data.id,
      user_id: user.id,
      role: 'admin',
      status: 'active',
    });

    return { success: true, tribe: data };
  }
}

export const tribesService = TribesService.getInstance();
