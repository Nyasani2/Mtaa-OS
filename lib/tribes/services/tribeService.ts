import { supabase } from '@/lib/supabase';
import { Tribe, TribeMember, TribePost, TribeEvent, TribeMessage } from '../types';

// Helper: fetch profiles for a list of user IDs
async function fetchProfiles(userIds: string[]) {
  if (userIds.length === 0) return new Map();
  const { data } = await supabase
    .from('user_profiles')
    .select('id, full_name, avatar_url')
    .in('id', [...new Set(userIds)]);
  return new Map((data || []).map((p: any) => [p.id, p]));
}

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
    const { data, error } = await supabase.from('tribes').select('*').eq('slug', slug).maybeSingle();
    if (error) throw error;
    return data as Tribe;
  },

  async createTribe(tribe: Partial<Tribe>) {
    const { data, error } = await supabase.from('tribes').insert(tribe).select().maybeSingle();
    if (error) throw error;
    return data as Tribe;
  },

  async joinTribe(tribeId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase.from('tribe_members').insert({ tribe_id: tribeId, user_id: user!.id }).select().maybeSingle();
    if (error) throw error;
    return data;
  },

  async getTribeMembers(tribeId: string) {
    const { data: members, error } = await supabase
      .from('tribe_members')
      .select('*')
      .eq('tribe_id', tribeId)
      .eq('membership_status', 'approved');
    if (error) throw error;

    // Fetch profiles separately
    const profileMap = await fetchProfiles((members || []).map((m: any) => m.user_id));
    return (members || []).map((m: any) => ({
      ...m,
      profile: profileMap.get(m.user_id) || null,
    })) as TribeMember[];
  },

  async getMyMembership(tribeId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data, error } = await supabase.from('tribe_members').select('*').eq('tribe_id', tribeId).eq('user_id', user.id).maybeSingle();
    if (error && error.code !== 'PGRST116') throw error;
    return data as TribeMember | null;
  },

  async getTribePosts(tribeId: string, limit = 20, offset = 0) {
    const { data: posts, error } = await supabase
      .from('tribe_posts')
      .select('*')
      .eq('tribe_id', tribeId)
      .eq('status', 'published')
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) throw error;

    // Fetch author profiles separately
    const authorMap = await fetchProfiles((posts || []).map((p: any) => p.author_id));
    return (posts || []).map((p: any) => ({
      ...p,
      author: authorMap.get(p.author_id) || null,
    })) as TribePost[];
  },

  async createPost(post: Partial<TribePost>) {
    const { data, error } = await supabase.from('tribe_posts').insert(post).select().maybeSingle();
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
    const { data: events, error } = await supabase
      .from('tribe_events')
      .select('*')
      .eq('tribe_id', tribeId)
      .order('start_time', { ascending: true });
    if (error) throw error;

    // Fetch creator profiles separately
    const creatorMap = await fetchProfiles((events || []).map((e: any) => e.creator_id));
    return (events || []).map((e: any) => ({
      ...e,
      creator: creatorMap.get(e.creator_id) || null,
    })) as TribeEvent[];
  },

  async rsvpEvent(eventId: string, status: 'going' | 'maybe' | 'not_going') {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('tribe_event_attendees').upsert({ event_id: eventId, user_id: user!.id, rsvp_status: status });
    if (error) throw error;
  },

  async getTribeMessages(tribeId: string, limit = 50) {
    const { data: messages, error } = await supabase
      .from('tribe_messages')
      .select('*')
      .eq('tribe_id', tribeId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;

    // Fetch sender profiles separately
    const senderMap = await fetchProfiles((messages || []).map((m: any) => m.sender_id));
    return (messages || []).map((m: any) => ({
      ...m,
      sender: senderMap.get(m.sender_id) || null,
    })) as TribeMessage[];
  },

  async sendMessage(tribeId: string, content: string, messageType = 'text') {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase.from('tribe_messages').insert({ tribe_id: tribeId, sender_id: user!.id, content, message_type: messageType }).select().maybeSingle();
    if (error) throw error;
    return data as TribeMessage;
  },

  subscribeToMessages(tribeId: string, callback: (message: TribeMessage) => void) {
    return supabase.channel(`tribe-messages-${tribeId}`).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tribe_messages', filter: `tribe_id=eq.${tribeId}` }, (payload) => callback(payload.new as TribeMessage)).subscribe();
  }
};
