// lib/streets/services/profileService.ts
// MTAA Streets — Profile Service (wired to profiles + streets_posts + streets_follows)

import { supabase } from '@/lib/supabase';
import { StreetProfile, StreetPost } from '../types';

const PAGE_SIZE = 20;

export async function fetchProfile(userId: string, viewerId?: string): Promise<StreetProfile | null> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select(`
      id, user_id, display_name, handle, avatar_url, cover_url, bio, location, website,
      follower_count, following_count, post_count, is_verified, is_business, created_at,
      is_following:streets_follows!inner(follower_id)
    `)
    .eq('user_id', userId)
    .single();

  if (error) return null;
  if (!data) return null;

  return {
    id: data.id,
    user_id: data.user_id,
    display_name: data.display_name,
    handle: data.handle,
    avatar_url: data.avatar_url,
    cover_url: data.cover_url,
    bio: data.bio || '',
    location: data.location,
    website: data.website,
    follower_count: data.follower_count || 0,
    following_count: data.following_count || 0,
    post_count: data.post_count || 0,
    is_verified: data.is_verified || false,
    is_business: data.is_business || false,
    created_at: data.created_at,
    is_following: viewerId ? !!data.is_following?.length : false,
  };
}

export async function fetchProfilePosts(
  userId: string,
  page: number = 0
): Promise<{ posts: StreetPost[]; hasMore: boolean }> {
  const { data, error } = await supabase
    .from('streets_posts')
    .select(`
      *,
      author:user_profiles(id, display_name, handle, avatar_url, is_verified)
    `)
    .eq('user_id', userId)
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

export async function followUser(followerId: string, followingId: string): Promise<void> {
  const { error } = await supabase
    .from('streets_follows')
    .insert({ follower_id: followerId, following_id: followingId });
  if (error) throw error;
}

export async function unfollowUser(followerId: string, followingId: string): Promise<void> {
  const { error } = await supabase
    .from('streets_follows')
    .delete()
    .eq('follower_id', followerId)
    .eq('following_id', followingId);
  if (error) throw error;
}

export async function updateProfile(
  userId: string,
  updates: Partial<Pick<StreetProfile, 'display_name' | 'bio' | 'location' | 'website' | 'avatar_url' | 'cover_url'>>
): Promise<void> {
  const { error } = await supabase
    .from('user_profiles')
    .update(updates)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function fetchFollowers(userId: string): Promise<StreetProfile[]> {
  const { data, error } = await supabase
    .from('streets_follows')
    .select(`
      follower:profiles!follower_id(id, user_id, display_name, handle, avatar_url, is_verified, follower_count)
    `)
    .eq('following_id', userId);

  if (error) throw error;
  return (data || []).map((row: any) => row.follower);
}

export async function fetchFollowing(userId: string): Promise<StreetProfile[]> {
  const { data, error } = await supabase
    .from('streets_follows')
    .select(`
      following:profiles!following_id(id, user_id, display_name, handle, avatar_url, is_verified, follower_count)
    `)
    .eq('follower_id', userId);

  if (error) throw error;
  return (data || []).map((row: any) => row.following);
}
