import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export interface StreetPost {
  id: string;
  creator_id: string;
  title: string | null;
  content: string | null;
  caption: string | null;
  media_type: 'image' | 'video' | 'text' | null;
  media_url: string | null;
  thumbnail_url: string | null;
  video_thumbnail_url: string | null;
  hashtags: string[] | null;
  location: string | null;
  music_id: string | null;
  music_title: string | null;
  duration: number | null;
  video_duration: number | null;
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
  created_at: string;
  updated_at: string;
  scheduled_at: string | null;
  published_at: string | null;
}

export interface CreatorProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  username: string | null;
}

const LIMIT = 10;

export async function loadFeed(offset = 0, limit = LIMIT): Promise<StreetPost[]> {
  const { data, error } = await supabase
    .from('streets_posts')
    .select('*')
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('streets loadFeed error:', error);
    throw error;
  }
  return (data || []) as StreetPost[];
}

export async function loadFollowing(userId: string, offset = 0, limit = LIMIT): Promise<StreetPost[]> {
  const { data: follows } = await supabase
    .from('user_follows')
    .select('following_id')
    .eq('follower_id', userId);

  const followingIds = follows?.map(f => f.following_id) || [];
  if (followingIds.length === 0) return [];

  const { data, error } = await supabase
    .from('streets_posts')
    .select('*')
    .in('creator_id', followingIds)
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('streets loadFollowing error:', error);
    throw error;
  }
  return (data || []) as StreetPost[];
}

export async function loadDiscover(offset = 0, limit = LIMIT): Promise<StreetPost[]> {
  const { data, error } = await supabase
    .from('streets_posts')
    .select('*')
    .eq('is_public', true)
    .order('likes_count', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('streets loadDiscover error:', error);
    throw error;
  }
  return (data || []) as StreetPost[];
}

export async function getCreatorProfiles(userIds: string[]): Promise<Record<string, CreatorProfile>> {
  if (userIds.length === 0) return {};
  const uniqueIds = [...new Set(userIds)];

  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, username')
    .in('id', uniqueIds);

  if (error) {
    console.error('getCreatorProfiles error:', error);
    return {};
  }

  const map: Record<string, CreatorProfile> = {};
  (data || []).forEach((p: any) => {
    map[p.id] = p;
  });
  return map;
}

export async function createPost(post: Partial<StreetPost>): Promise<StreetPost> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData?.user?.id;
  if (!userId) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('streets_posts')
    .insert({
      ...post,
      creator_id: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('createPost error:', error);
    throw error;
  }
  return data as StreetPost;
}

export async function deletePost(postId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('streets_posts')
    .delete()
    .eq('id', postId)
    .eq('creator_id', userId);

  if (error) {
    console.error('deletePost error:', error);
    throw error;
  }
}

export async function likePost(postId: string, userId: string): Promise<void> {
  const { error: likeError } = await supabase
    .from('streets_likes')
    .upsert({ post_id: postId, user_id: userId, created_at: new Date().toISOString() },
      { onConflict: 'post_id,user_id' });

  if (likeError) {
    console.error('likePost error:', likeError);
    throw likeError;
  }

  const { error: incError } = await supabase.rpc('increment_street_likes', { post_id: postId });
  if (incError) {
    const { data: post } = await supabase.from('streets_posts').select('likes_count').eq('id', postId).single();
    await supabase.from('streets_posts').update({ likes_count: (post?.likes_count || 0) + 1 }).eq('id', postId);
  }
}

export async function unlikePost(postId: string, userId: string): Promise<void> {
  const { error: unlikeError } = await supabase
    .from('streets_likes')
    .delete()
    .eq('post_id', postId)
    .eq('user_id', userId);

  if (unlikeError) {
    console.error('unlikePost error:', unlikeError);
    throw unlikeError;
  }

  const { error: decError } = await supabase.rpc('decrement_street_likes', { post_id: postId });
  if (decError) {
    const { data: post } = await supabase.from('streets_posts').select('likes_count').eq('id', postId).single();
    const newCount = Math.max(0, (post?.likes_count || 0) - 1);
    await supabase.from('streets_posts').update({ likes_count: newCount }).eq('id', postId);
  }
}

export async function checkUserLiked(postId: string, userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('streets_likes')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('checkUserLiked error:', error);
  }
  return !!data;
}

export async function uploadMedia(file: File, bucket = 'streets-media'): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(fileName, file, { upsert: false });

  if (uploadError) {
    console.error('uploadMedia error:', uploadError);
    throw uploadError;
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
  return data.publicUrl;
}
