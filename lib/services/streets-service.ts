import { supabase } from '@/lib/supabase';

export interface StreetPost {
  id: string;
  creator_id: string;
  title: string | null;
  content: string;
  media_type: string | null;
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
  created_at: string;
  updated_at: string;
  scheduled_at: string | null;
  published_at: string | null;
  caption: string | null;
  video_duration: number | null;
  video_thumbnail_url: string | null;
  saves_count: number;
  view_count: number;
}

export interface CreatePostInput {
  creator_id: string;
  title?: string;
  content: string;
  media_url?: string | null;
  media_type?: string | null;
  thumbnail_url?: string | null;
  hashtags?: string[] | null;
  location?: string | null;
  music_id?: string | null;
  music_title?: string | null;
  duration?: number | null;
  is_public?: boolean;
  allow_comments?: boolean;
  allow_duet?: boolean;
  caption?: string | null;
  video_duration?: number | null;
  video_thumbnail_url?: string | null;
}

const STORAGE_BUCKET = 'media';
const STORAGE_PATH = 'streets';

export async function getFeedPosts(offset: number = 0, limit: number = 20): Promise<StreetPost[]> {
  const { data, error } = await supabase
    .from('streets_posts')
    .select('*')
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Feed load error:', error);
    throw new Error(`Feed error: ${error.message}`);
  }

  return (data ?? []) as StreetPost[];
}

export async function getUserPosts(userId: string, offset: number = 0, limit: number = 20): Promise<StreetPost[]> {
  const { data, error } = await supabase
    .from('streets_posts')
    .select('*')
    .eq('creator_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw new Error(`User posts error: ${error.message}`);
  }

  return (data ?? []) as StreetPost[];
}

export async function getFollowingFeed(userId: string, offset: number = 0, limit: number = 20): Promise<StreetPost[]> {
  if (!userId) {
    return getFeedPosts(offset, limit);
  }

  const { data: following, error: followsError } = await supabase
    .from('user_follows')
    .select('following_id')
    .eq('follower_id', userId);

  if (followsError || !following || following.length === 0) {
    const { data, error } = await supabase
      .from('streets_posts')
      .select('*')
      .or(`creator_id.eq.${userId},is_public.eq.true`)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Following feed error: ${error.message}`);
    }
    return (data ?? []) as StreetPost[];
  }

  const followingIds = following.map((f: any) => f.following_id);
  followingIds.push(userId);

  const { data, error } = await supabase
    .from('streets_posts')
    .select('*')
    .in('creator_id', followingIds)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw new Error(`Following feed error: ${error.message}`);
  }

  return (data ?? []) as StreetPost[];
}

export async function createPost(input: CreatePostInput): Promise<StreetPost> {
  if (!input.creator_id) {
    throw new Error('You must be logged in to create a post');
  }

  const { data, error } = await supabase
    .from('streets_posts')
    .insert({
      creator_id: input.creator_id,
      title: input.title ?? null,
      content: input.content,
      media_url: input.media_url ?? null,
      media_type: input.media_type ?? null,
      thumbnail_url: input.thumbnail_url ?? null,
      hashtags: input.hashtags ?? null,
      location: input.location ?? null,
      music_id: input.music_id ?? null,
      music_title: input.music_title ?? null,
      duration: input.duration ?? null,
      is_public: input.is_public ?? true,
      allow_comments: input.allow_comments ?? true,
      allow_duet: input.allow_duet ?? false,
      caption: input.caption ?? null,
      video_duration: input.video_duration ?? null,
      video_thumbnail_url: input.video_thumbnail_url ?? null,
      views_count: 0,
      likes_count: 0,
      comments_count: 0,
      shares_count: 0,
      saves_count: 0,
      view_count: 0,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Create post error: ${error.message}`);
  }

  return data as StreetPost;
}

export async function uploadMedia(file: File | Blob, fileName: string): Promise<string> {
  const path = `${STORAGE_PATH}/${Date.now()}_${fileName}`;
  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(path, file, { upsert: true });

  if (uploadError) {
    throw new Error(`Upload error: ${uploadError.message}`);
  }

  const { data: urlData } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(path);

  return urlData.publicUrl;
}

export async function likePost(postId: string): Promise<void> {
  const { error } = await supabase
    .from('streets_posts')
    .update({ likes_count: supabase.rpc('increment', { x: 1 }) })
    .eq('id', postId);

  if (error) {
    throw new Error(`Like error: ${error.message}`);
  }
}

export async function unlikePost(postId: string): Promise<void> {
  const { error } = await supabase
    .from('streets_posts')
    .update({ likes_count: supabase.rpc('decrement', { x: 1 }) })
    .eq('id', postId);

  if (error) {
    throw new Error(`Unlike error: ${error.message}`);
  }
}

export async function deletePost(postId: string, userId: string): Promise<void> {
  if (!userId) {
    throw new Error('You must be logged in to delete a post');
  }

  const { error } = await supabase
    .from('streets_posts')
    .delete()
    .eq('id', postId)
    .eq('creator_id', userId);

  if (error) {
    throw new Error(`Delete error: ${error.message}`);
  }
}

export async function getPostById(postId: string): Promise<StreetPost | null> {
  const { data, error } = await supabase
    .from('streets_posts')
    .select('*')
    .eq('id', postId)
    .single();

  if (error) {
    throw new Error(`Get post error: ${error.message}`);
  }

  return data as StreetPost | null;
}
