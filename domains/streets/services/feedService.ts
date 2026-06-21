// lib/streets/services/feedService.ts
// MTAA Streets — Feed Service (wired to streets_posts table)

import { supabase } from '@/lib/supabase';
import { StreetPost, StreetFeedFilters } from '../types';

const PAGE_SIZE = 20;

export async function fetchFeed(
  filters: StreetFeedFilters,
  page: number = 0,
  userId?: string
): Promise<{ posts: StreetPost[]; hasMore: boolean }> {
  let query = supabase
    .from('streets_posts')
    .select(`
      *,
      author:user_profiles(id, display_name, handle, avatar_url, is_verified),
      liked_by_me:streets_likes!inner(user_id)
    `)
    .order('created_at', { ascending: false })
    .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

  if (filters.type === 'following' && userId) {
    const { data: followingIds } = await supabase
      .from('streets_follows')
      .select('following_id')
      .eq('follower_id', userId);
    const ids = followingIds?.map((f) => f.following_id) || [];
    if (ids.length > 0) {
      query = query.in('user_id', ids);
    } else {
      return { posts: [], hasMore: false };
    }
  }

  if (filters.type === 'tribe' && filters.tribe_id) {
    query = query.eq('tribe_id', filters.tribe_id);
  }

  if (filters.media_type && filters.media_type !== 'all') {
    query = query.eq('media_type', filters.media_type);
  }

  if (filters.time_range === 'today') {
    query = query.gte('created_at', new Date(Date.now() - 86400000).toISOString());
  } else if (filters.time_range === 'week') {
    query = query.gte('created_at', new Date(Date.now() - 604800000).toISOString());
  } else if (filters.time_range === 'month') {
    query = query.gte('created_at', new Date(Date.now() - 2592000000).toISOString());
  }

  if (filters.location) {
    query = query.rpc('nearby_posts', {
      lat: filters.location.lat,
      lng: filters.location.lng,
      radius: filters.location.radius,
    });
  }

  const { data, error } = await query;
  if (error) throw error;

  const posts: StreetPost[] = (data || []).map((row: any) => ({
    id: row.id,
    user_id: row.user_id,
    content: row.content,
    media_urls: row.media_urls || [],
    media_type: row.media_type || 'none',
    location: row.location,
    visibility: row.visibility,
    tribe_id: row.tribe_id,
    tags: row.tags || [],
    mentions: row.mentions || [],
    like_count: row.like_count || 0,
    comment_count: row.comment_count || 0,
    share_count: row.share_count || 0,
    view_count: row.view_count || 0,
    is_pinned: row.is_pinned || false,
    is_edited: row.is_edited || false,
    created_at: row.created_at,
    updated_at: row.updated_at,
    author: row.author,
    liked_by_me: !!row.liked_by_me?.length,
    saved_by_me: false,
  }));

  return { posts, hasMore: posts.length === PAGE_SIZE };
}

export async function likePost(postId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('streets_likes')
    .insert({ post_id: postId, user_id: userId });
  if (error) throw error;
}

export async function unlikePost(postId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('streets_likes')
    .delete()
    .eq('post_id', postId)
    .eq('creator_id', userId);
  if (error) throw error;
}

export async function savePost(postId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('streets_saves')
    .insert({ post_id: postId, user_id: userId });
  if (error) throw error;
}

export async function unsavePost(postId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('streets_saves')
    .delete()
    .eq('post_id', postId)
    .eq('creator_id', userId);
  if (error) throw error;
}

export async function deletePost(postId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('streets_posts')
    .delete()
    .eq('id', postId)
    .eq('creator_id', userId);
  if (error) throw error;
}

export async function pinPost(postId: string, userId: string, pinned: boolean): Promise<void> {
  const { error } = await supabase
    .from('streets_posts')
    .update({ is_pinned: pinned })
    .eq('id', postId)
    .eq('creator_id', userId);
  if (error) throw error;
}
