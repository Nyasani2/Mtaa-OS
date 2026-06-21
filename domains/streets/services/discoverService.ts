// lib/streets/services/discoverService.ts
// MTAA Streets — Discover Service (wired to streets_posts + streets_trending)

import { supabase } from '@/lib/supabase';
import { StreetPost, StreetDiscoverFilters } from '../types';

const PAGE_SIZE = 20;

export async function fetchDiscover(
  filters: StreetDiscoverFilters,
  page: number = 0
): Promise<{ posts: StreetPost[]; hasMore: boolean }> {
  let query = supabase
    .from('streets_posts')
    .select(`
      *,
      author:user_profiles(id, display_name, handle, avatar_url, is_verified)
    `)
    .eq('visibility', 'public')
    .order('like_count', { ascending: false })
    .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

  if (filters.category) {
    query = query.eq('category', filters.category);
  }

  if (filters.tags && filters.tags.length > 0) {
    query = query.overlaps('tags', filters.tags);
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
    liked_by_me: false,
    saved_by_me: false,
  }));

  return { posts, hasMore: posts.length === PAGE_SIZE };
}

export async function fetchTrendingTags(): Promise<string[]> {
  const { data, error } = await supabase
    .from('streets_trending')
    .select('tag')
    .order('count', { ascending: false })
    .limit(20);
  if (error) throw error;
  return (data || []).map((t) => t.tag);
}

export async function searchPosts(queryText: string, page: number = 0): Promise<{ posts: StreetPost[]; hasMore: boolean }> {
  const { data, error } = await supabase
    .from('streets_posts')
    .select(`
      *,
      author:user_profiles(id, display_name, handle, avatar_url, is_verified)
    `)
    .textSearch('content', queryText)
    .eq('visibility', 'public')
    .order('created_at', { ascending: false })
    .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
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
    liked_by_me: false,
    saved_by_me: false,
  }));

  return { posts, hasMore: posts.length === PAGE_SIZE };
}

export async function searchUsers(queryText: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('id, display_name, handle, avatar_url, is_verified, follower_count')
    .or(`display_name.ilike.%${queryText}%,handle.ilike.%${queryText}%`)
    .limit(20);
  if (error) throw error;
  return data || [];
}
