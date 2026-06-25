import { supabase } from '@/lib/supabase';

export interface CreatePostPayload {
  title?: string;
  content?: string;
  media_type?: 'image' | 'video' | 'audio' | 'text';
  media_url?: string | null;
  thumbnail_url?: string | null;
  hashtags?: string[] | null;
  location?: string | null;
  music_id?: string | null;
  music_title?: string | null;
  duration?: number | null;
  is_public?: boolean;
  allow_comments?: boolean;
  allow_duet?: boolean;
  product_id?: string | null;
  job_id?: string | null;
  shop_id?: string | null;
  caption?: string | null;
  video_duration?: number | null;
  video_thumbnail_url?: string | null;
}

export interface StreetPost {
  id: string;
  creator_id: string;
  title: string;
  content: string;
  media_type: 'image' | 'video' | 'audio' | 'text';
  media_url: string | null;
  thumbnail_url: string | null;
  hashtags: string[] | null;
  location: string | null;
  music_id: string | null;
  music_title: string | null;
  duration: number | null;
  is_public: boolean;
  allow_comments: boolean;
  allow_duet: boolean;
  is_live: boolean;
  is_sponsored: boolean;
  product_id: string | null;
  job_id: string | null;
  shop_id: string | null;
  views_count: number;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  saves_count: number;
  view_count: number;
  video_duration: number | null;
  video_thumbnail_url: string | null;
  caption: string | null;
  created_at: string;
  updated_at: string;
  scheduled_at: string | null;
  published_at: string | null;
  creator?: {
    user_id: string;
    full_name: string | null;
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
    verified: boolean | null;
  };
}

export interface StreetComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user?: {
    user_id: string;
    full_name: string | null;
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
  };
}

// ===================== FEED =====================
export async function getFeedPosts(page = 0, limit = 10) {
  const { data, error } = await supabase
    .from('streets_posts')
    .select('id, creator_id, content, media_url, media_type, likes_count, comments_count, shares_count, views_count, creator:user_profiles(user_id, full_name, display_name, username, avatar_url, verified)')
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .range(page * limit, (page + 1) * limit - 1);
  if (error) throw error;
  return data as StreetPost[];
}

// ===================== USER POSTS (for profile) =====================
export async function getUserPosts(userId: string, page = 0, limit = 20) {
  const { data, error } = await supabase
    .from('streets_posts')
    .select('id, creator_id, content, media_url, media_type, likes_count, comments_count, shares_count, views_count, created_at, updated_at, is_public, allow_comments, caption, hashtags')
    .eq('creator_id', userId)
    .order('created_at', { ascending: false })
    .range(page * limit, (page + 1) * limit - 1);
  if (error) throw error;
  return data as StreetPost[];
}

// ===================== SINGLE POST =====================
export async function getPostById(postId: string) {
  const { data, error } = await supabase
    .from('streets_posts')
    .select('*, creator:user_profiles(user_id, full_name, display_name, username, avatar_url, verified)')
    .eq('id', postId)
    .single();
  if (error) throw error;
  return data as StreetPost;
}

// ===================== CREATE POST =====================
export async function createPost(payload: CreatePostPayload & { creator_id: string }) {
  const { data, error } = await supabase
    .from('streets_posts')
    .insert({ ...payload, created_at: new Date().toISOString() })
    .select()
    .single();
  if (error) throw error;
  return data as StreetPost;
}

// ===================== UPDATE POST =====================
export async function updatePost(postId: string, payload: Partial<CreatePostPayload>) {
  const { data, error } = await supabase
    .from('streets_posts')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', postId)
    .select()
    .single();
  if (error) throw error;
  return data as StreetPost;
}

// ===================== DELETE POST =====================
export async function deletePost(postId: string) {
  const { error } = await supabase.from('streets_posts').delete().eq('id', postId);
  if (error) throw error;
  return true;
}

// ===================== COMMENTS =====================
export async function getComments(postId: string) {
  const { data, error } = await supabase
    .from('streets_comments')
    .select('id, post_id, user_id, content, created_at, user:user_profiles(user_id, full_name, display_name, username, avatar_url)')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data as StreetComment[];
}

export async function addComment(postId: string, userId: string, content: string) {
  const { data, error } = await supabase
    .from('streets_comments')
    .insert({ post_id: postId, user_id: userId, content })
    .select()
    .single();
  if (error) throw error;
  // Increment comment count
  await supabase.rpc('increment_comment_count', { post_id: postId });
  return data;
}

// ===================== LIKES =====================
export async function likePost(postId: string, userId: string) {
  const { error } = await supabase.from('streets_likes').insert({ post_id: postId, user_id: userId });
  if (error) throw error;
  await supabase.rpc('increment_like_count', { post_id: postId });
}

export async function unlikePost(postId: string, userId: string) {
  const { error } = await supabase.from('streets_likes').delete().eq('post_id', postId).eq('user_id', userId);
  if (error) throw error;
  await supabase.rpc('decrement_like_count', { post_id: postId });
}

// ===================== SAVES =====================
export async function savePost(postId: string, userId: string) {
  const { error } = await supabase.from('streets_saves').insert({ post_id: postId, user_id: userId });
  if (error) throw error;
}

// ===================== SHARES =====================
export async function sharePost(postId: string, userId: string) {
  const { error } = await supabase.from('streets_shares').insert({ post_id: postId, user_id: userId });
  if (error) throw error;
  await supabase.rpc('increment_share_count', { post_id: postId });
}

// ===================== FOLLOW =====================
export async function followUser(followerId: string, followingId: string) {
  const { error } = await supabase.from('streets_follows').insert({ follower_id: followerId, following_id: followingId });
  if (error) throw error;
}

export async function unfollowUser(followerId: string, followingId: string) {
  const { error } = await supabase.from('streets_follows').delete().eq('follower_id', followerId).eq('following_id', followingId);
  if (error) throw error;
}

export async function isFollowing(followerId: string, followingId: string) {
  const { data, error } = await supabase
    .from('streets_follows')
    .select('id')
    .eq('follower_id', followerId)
    .eq('following_id', followingId)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return !!data;
}

export async function getFollowerCount(userId: string) {
  const { count, error } = await supabase.from('streets_follows').select('*', { count: 'exact', head: true }).eq('following_id', userId);
  if (error) throw error;
  return count || 0;
}

export async function getFollowingCount(userId: string) {
  const { count, error } = await supabase.from('streets_follows').select('*', { count: 'exact', head: true }).eq('follower_id', userId);
  if (error) throw error;
  return count || 0;
}

// ===================== SEARCH =====================
export async function searchPosts(query: string, page = 0, limit = 20) {
  const { data, error } = await supabase
    .from('streets_posts')
    .select('id, creator_id, content, media_url, media_type, likes_count, comments_count, shares_count, views_count, creator:user_profiles(user_id, full_name, display_name, username, avatar_url, verified)')
    .or(`content.ilike.%${query}%,hashtags.cs.{"${query}"}`)
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .range(page * limit, (page + 1) * limit - 1);
  if (error) throw error;
  return data as StreetPost[];
}

// ===================== TRENDING =====================
export async function getTrendingPosts(limit = 20) {
  const { data, error } = await supabase
    .from('streets_posts')
    .select('id, creator_id, content, media_url, media_type, likes_count, comments_count, shares_count, views_count, creator:user_profiles(user_id, full_name, display_name, username, avatar_url, verified)')
    .eq('is_public', true)
    .order('likes_count', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data as StreetPost[];
}
