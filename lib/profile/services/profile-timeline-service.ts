// ============================================================================
// MTAA Profile OS — TIMELINE EXTENSION
// Cross-app content aggregation
// Import alongside your existing profile-service.ts
// ============================================================================

import { supabase } from '@/lib/supabase';

export interface TimelineItem {
  id: string;
  content_type: string;
  source_app: string;
  source_id: string;
  title: string | null;
  description: string | null;
  media_url: string | null;
  thumbnail_url: string | null;
  view_count: number;
  like_count: number;
  comment_count: number;
  created_at: string;
  metadata: Record<string, any>;
}

export interface ProfileStats {
  followers_count: number;
  following_count: number;
  content_count: number;
  total_views: number;
  total_likes: number;
}

// ─── Fetch Profile Stats (followers, following, content) ───
export async function fetchProfileStats(userId: string): Promise<ProfileStats> {
  const { data, error } = await supabase
    .rpc('get_profile_stats', { p_user_id: userId });

  if (error) {
    console.error('[ProfileTimeline] Stats error:', error.message);
    return { followers_count: 0, following_count: 0, content_count: 0, total_views: 0, total_likes: 0 };
  }

  return data?.[0] || { followers_count: 0, following_count: 0, content_count: 0, total_views: 0, total_likes: 0 };
}

// ─── Fetch Cross-App Timeline ───
export async function fetchProfileTimeline(
  userId: string,
  contentType?: string,
  limit = 20
): Promise<TimelineItem[]> {
  let query = supabase
    .from('profile_content_timeline')
    .select('*')
    .eq('user_id', userId)
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (contentType) {
    query = query.eq('content_type', contentType);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[ProfileTimeline] Error:', error.message);
    throw error;
  }

  return (data || []) as TimelineItem[];
}

// ─── Toggle Follow ───
export async function toggleFollow(targetUserId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  if (user.id === targetUserId) throw new Error('Cannot follow yourself');

  const { data: existing } = await supabase
    .from('profile_followers')
    .select('id')
    .eq('follower_id', user.id)
    .eq('following_id', targetUserId)
    .maybeSingle();

  if (existing) {
    await supabase.from('profile_followers').delete().eq('id', existing.id);
    return false;
  } else {
    await supabase.from('profile_followers').insert({
      follower_id: user.id,
      following_id: targetUserId,
    });
    return true;
  }
}

// ─── Check Follow Status ───
export async function isFollowing(targetUserId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase
    .from('profile_followers')
    .select('id')
    .eq('follower_id', user.id)
    .eq('following_id', targetUserId)
    .maybeSingle();

  return !!data;
}

// ─── Fetch Followers List ───
export async function fetchFollowers(userId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('profile_followers')
    .select('follower_id, created_at, follower:profiles!follower_id(id, full_name, avatar_url, username)')
    .eq('following_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

// ─── Fetch Following List ───
export async function fetchFollowing(userId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('profile_followers')
    .select('following_id, created_at, following:profiles!following_id(id, full_name, avatar_url, username)')
    .eq('follower_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}
