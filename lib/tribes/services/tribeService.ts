import { supabase } from '@/lib/supabase';
import { Tribe, TribeMember, TribePost, TribeEvent, TribeMessage } from '../types';

export const tribeService = {
  async getTribes(filters?: { category?: string; search?: string; limit?: number; offset?: number }) {
    let query = supabase.from('tribes').select('*').eq('status', 'active').order('member_count', { ascending: false });
    if (filters?.category) query = query.eq('category', filters.category);
    if (filters?.search) query = query.ilike('name', `%${filters.search}%`);
    if (filters?.limit) query = query.limit(filters.limit);
    if (filters?.offset) query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
    const { data, error } = await query;
    if (error) throw error;
    return data as Tribe[];
  },

  async getTribeBySlug(slug: string) {
    const { data, error } = await supabase.from('tribes').select('*').eq('slug', slug).single();
    if (error) throw error;
    return data as Tribe;
  },

  async createTribe(tribe: Partial<Tribe>) {
    const { data, error } = await supabase.from('tribes').insert(tribe).select().single();
    if (error) throw error;
    return data as Tribe;
  },

  async joinTribe(tribeId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase.from('tribe_members').insert({ tribe_id: tribeId, user_id: user!.id }).select().single();
    if (error) throw error;
    return data;
  },

  async getTribeMembers(tribeId: string) {
    const { data, error } = await supabase.from('tribe_members').select('*, profile:profiles(full_name, avatar_url)').eq('tribe_id', tribeId).eq('membership_status', 'approved');
    if (error) throw error;
    return data as TribeMember[];
  },

  async getMyMembership(tribeId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data, error } = await supabase.from('tribe_members').select('*').eq('tribe_id', tribeId).eq('user_id', user.id).single();
    if (error && error.code !== 'PGRST116') throw error;
    return data as TribeMember | null;
  },

  async getTribePosts(tribeId: string, limit = 20, offset = 0) {
    const { data, error } = await supabase.from('tribe_posts').select('*, author:profiles(full_name, avatar_url)').eq('tribe_id', tribeId).eq('status', 'published').order('is_pinned', { ascending: false }).order('created_at', { ascending: false }).range(offset, offset + limit - 1);
    if (error) throw error;
    return data as TribePost[];
  },

  async createPost(post: Partial<TribePost>) {
    const { data, error } = await supabase.from('tribe_posts').insert(post).select().single();
    if (error) throw error;
    return data as TribePost;
  },

  async likePost(postId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('tribe_post_likes').insert({ post_id: postId, user_id: user!.id });
    if (error) throw error;
  },

  async unlikePost(postId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('tribe_post_likes').delete().eq('post_id', postId).eq('user_id', user!.id);
    if (error) throw error;
  },

  async getTribeEvents(tribeId: string) {
    const { data, error } = await supabase.from('tribe_events').select('*, creator:profiles(full_name, avatar_url)').eq('tribe_id', tribeId).order('start_time', { ascending: true });
    if (error) throw error;
    return data as TribeEvent[];
  },

  async rsvpEvent(eventId: string, status: 'going' | 'maybe' | 'not_going') {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('tribe_event_attendees').upsert({ event_id: eventId, user_id: user!.id, rsvp_status: status });
    if (error) throw error;
  },

  async getTribeMessages(tribeId: string, limit = 50) {
    const { data, error } = await supabase.from('tribe_messages').select('*, sender:profiles(full_name, avatar_url)').eq('tribe_id', tribeId).order('created_at', { ascending: false }).limit(limit);
    if (error) throw error;
    return data as TribeMessage[];
  },

  async sendMessage(tribeId: string, content: string, messageType = 'text') {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase.from('tribe_messages').insert({ tribe_id: tribeId, sender_id: user!.id, content, message_type: messageType }).select().single();
    if (error) throw error;
    return data as TribeMessage;
  },

  subscribeToMessages(tribeId: string, callback: (message: TribeMessage) => void) {
    return supabase.channel(`tribe-messages-${tribeId}`).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tribe_messages', filter: `tribe_id=eq.${tribeId}` }, (payload) => callback(payload.new as TribeMessage)).subscribe();
  }
};
