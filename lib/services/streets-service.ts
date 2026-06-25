import { supabase } from '@/lib/supabase';

export interface CreatePostPayload {
  title: string;
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
    id: string;
    full_name: string | null;
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
    id: string;
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
  };
}

export interface StreetMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  read: boolean;
}

export interface StreetFollow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface StreetLike {
  id: string;
  post_id: string;
  user_id: string;
  created_at: string;
}

export interface StreetSave {
  id: string;
  post_id: string;
  user_id: string;
  created_at: string;
}

export interface StreetShare {
  id: string;
  post_id: string;
  user_id: string;
  created_at: string;
}

// ============================================================
// POST CRUD
// ============================================================

export async function getFeedPosts(limit = 20, offset = 0): Promise<StreetPost[]> {
  const { data, error } = await supabase
    .from('streets_posts')
    .select(`
      *,
      creator:profiles(id, full_name, username, avatar_url, verified)
    `)
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return (data || []) as StreetPost[];
}

export async function getPostById(postId: string): Promise<StreetPost | null> {
  const { data, error } = await supabase
    .from('streets_posts')
    .select(`
      *,
      creator:profiles(id, full_name, username, avatar_url, verified)
    `)
    .eq('id', postId)
    .single();

  if (error) return null;
  return data as StreetPost;
}

export async function createPost(creatorId: string, payload: CreatePostPayload): Promise<StreetPost | null> {
  const { data, error } = await supabase
    .from('streets_posts')
    .insert({
      creator_id: creatorId,
      ...payload,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select(`
      *,
      creator:profiles(id, full_name, username, avatar_url, verified)
    `)
    .single();

  if (error) throw error;
  return data as StreetPost;
}

export async function updatePost(postId: string, creatorId: string, payload: Partial<CreatePostPayload>): Promise<StreetPost | null> {
  const { data, error } = await supabase
    .from('streets_posts')
    .update({
      ...payload,
      updated_at: new Date().toISOString(),
    })
    .eq('id', postId)
    .eq('creator_id', creatorId)
    .select(`
      *,
      creator:profiles(id, full_name, username, avatar_url, verified)
    `)
    .single();

  if (error) return null;
  return data as StreetPost;
}

export async function deletePost(postId: string, creatorId: string): Promise<boolean> {
  const { error } = await supabase
    .from('streets_posts')
    .delete()
    .eq('id', postId)
    .eq('creator_id', creatorId);

  return !error;
}

// ============================================================
// USER POSTS
// ============================================================

export async function getUserPosts(userId: string): Promise<StreetPost[]> {
  const { data, error } = await supabase
    .from('streets_posts')
    .select(`
      *,
      creator:profiles(id, full_name, username, avatar_url, verified)
    `)
    .eq('creator_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as StreetPost[];
}

// ============================================================
// LIKES
// ============================================================

export async function likePost(postId: string, userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('streets_likes')
    .upsert({ post_id: postId, user_id: userId }, { onConflict: 'post_id,user_id' });

  return !error;
}

export async function unlikePost(postId: string, userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('streets_likes')
    .delete()
    .eq('post_id', postId)
    .eq('user_id', userId);

  return !error;
}

export async function isPostLiked(postId: string, userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('streets_likes')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .maybeSingle();

  return !!data;
}

export async function getPostLikesCount(postId: string): Promise<number> {
  const { count, error } = await supabase
    .from('streets_likes')
    .select('id', { count: 'exact', head: true })
    .eq('post_id', postId);

  if (error) return 0;
  return count || 0;
}

// ============================================================
// SAVES
// ============================================================

export async function savePost(postId: string, userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('streets_saves')
    .upsert({ post_id: postId, user_id: userId }, { onConflict: 'post_id,user_id' });

  return !error;
}

export async function unsavePost(postId: string, userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('streets_saves')
    .delete()
    .eq('post_id', postId)
    .eq('user_id', userId);

  return !error;
}

export async function isPostSaved(postId: string, userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('streets_saves')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .maybeSingle();

  return !!data;
}

// ============================================================
// SHARES
// ============================================================

export async function sharePost(postId: string, userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('streets_shares')
    .insert({ post_id: postId, user_id: userId });

  return !error;
}

// ============================================================
// COMMENTS
// ============================================================

export async function addComment(postId: string, userId: string, content: string): Promise<StreetComment | null> {
  const { data, error } = await supabase
    .from('streets_comments')
    .insert({ post_id: postId, user_id: userId, content })
    .select(`
      *,
      user:profiles(id, full_name, username, avatar_url)
    `)
    .single();

  if (error) return null;
  return data as StreetComment;
}

export async function getComments(postId: string): Promise<StreetComment[]> {
  const { data, error } = await supabase
    .from('streets_comments')
    .select(`
      *,
      user:profiles(id, full_name, username, avatar_url)
    `)
    .eq('post_id', postId)
    .order('created_at', { ascending: true });

  if (error) return [];
  return (data || []) as StreetComment[];
}

export async function deleteComment(commentId: string, userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('streets_comments')
    .delete()
    .eq('id', commentId)
    .eq('user_id', userId);

  return !error;
}

// ============================================================
// FOLLOWS
// ============================================================

export async function followUser(followerId: string, followingId: string): Promise<boolean> {
  const { error } = await supabase
    .from('streets_follows')
    .upsert({ follower_id: followerId, following_id: followingId }, { onConflict: 'follower_id,following_id' });

  return !error;
}

export async function unfollowUser(followerId: string, followingId: string): Promise<boolean> {
  const { error } = await supabase
    .from('streets_follows')
    .delete()
    .eq('follower_id', followerId)
    .eq('following_id', followingId);

  return !error;
}

export async function isFollowing(followerId: string, followingId: string): Promise<boolean> {
  const { data } = await supabase
    .from('streets_follows')
    .select('id')
    .eq('follower_id', followerId)
    .eq('following_id', followingId)
    .maybeSingle();

  return !!data;
}

export async function getFollowersCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('streets_follows')
    .select('id', { count: 'exact', head: true })
    .eq('following_id', userId);

  if (error) return 0;
  return count || 0;
}

export async function getFollowingCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('streets_follows')
    .select('id', { count: 'exact', head: true })
    .eq('follower_id', userId);

  if (error) return 0;
  return count || 0;
}

// ============================================================
// MESSAGES
// ============================================================

export async function sendMessage(senderId: string, receiverId: string, content: string): Promise<StreetMessage | null> {
  const { data, error } = await supabase
    .from('streets_messages')
    .insert({ sender_id: senderId, receiver_id: receiverId, content, read: false })
    .select()
    .single();

  if (error) return null;
  return data as StreetMessage;
}

export async function getMessages(userId: string, partnerId: string): Promise<StreetMessage[]> {
  const { data, error } = await supabase
    .from('streets_messages')
    .select('*')
    .or(`and(sender_id.eq.${userId},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${userId})`)
    .order('created_at', { ascending: true });

  if (error) return [];
  return (data || []) as StreetMessage[];
}

export async function markMessagesRead(userId: string, senderId: string): Promise<boolean> {
  const { error } = await supabase
    .from('streets_messages')
    .update({ read: true })
    .eq('receiver_id', userId)
    .eq('sender_id', senderId)
    .eq('read', false);

  return !error;
}

// ============================================================
// DISCOVER / SEARCH
// ============================================================

export async function searchPosts(query: string, limit = 50): Promise<StreetPost[]> {
  const { data, error } = await supabase
    .from('streets_posts')
    .select(`
      *,
      creator:profiles(id, full_name, username, avatar_url, verified)
    `)
    .eq('is_public', true)
    .or(`title.ilike.%${query}%,content.ilike.%${query}%,hashtags.cs.{${query}}`)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) return [];
  return (data || []) as StreetPost[];
}

export async function getTrendingPosts(limit = 20): Promise<StreetPost[]> {
  const { data, error } = await supabase
    .from('streets_posts')
    .select(`
      *,
      creator:profiles(id, full_name, username, avatar_url, verified)
    `)
    .eq('is_public', true)
    .order('views_count', { ascending: false })
    .limit(limit);

  if (error) return [];
  return (data || []) as StreetPost[];
}

// ============================================================
// VIEWS
// ============================================================

export async function incrementViews(postId: string): Promise<void> {
  try {
    await supabase.rpc('increment_streets_views', { post_id: postId });
  } catch {
    // Silent fail
  }
}

// ============================================================
// USER STATS
// ============================================================

export async function getUserStats(userId: string): Promise<{ posts: number; followers: number; following: number }> {
  const [postsRes, followersRes, followingRes] = await Promise.all([
    supabase.from('streets_posts').select('id', { count: 'exact', head: true }).eq('creator_id', userId),
    supabase.from('streets_follows').select('id', { count: 'exact', head: true }).eq('following_id', userId),
    supabase.from('streets_follows').select('id', { count: 'exact', head: true }).eq('follower_id', userId),
  ]);

  return {
    posts: postsRes.count || 0,
    followers: followersRes.count || 0,
    following: followingRes.count || 0,
  };
}
