import { supabase } from '@/lib/supabase';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

export interface StreetPost {
  id: string;
  creator_id: string;
  content: string;
  media_url?: string;
  media_type?: 'image' | 'video';
  caption?: string;
  hashtags?: string[];
  thumbnail_url?: string;
  created_at: string;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  views_count: number;
  view_count?: number; // Alias for backward compatibility
  is_boosted?: boolean;
  is_published: boolean;
  creator?: { user_id: string; full_name: string; avatar_url: string };
}

export type StreetsPost = StreetPost;
export type StreetsComment = any;
export type AuthorProfile = any;
export type PostAnalytics = any;
export type BoostParams = any;

export async function uploadMedia(file: { uri: string; name?: string; type?: string } | File, userId: string, onProgress?: (p: number) => void) {
  let blobToUpload: Blob | Uint8Array;
  let contentType = 'image/jpeg';
  let fileName = `upload_${Date.now()}`;

  // Handle both React Native file object and Web File object
  if ('uri' in file) {
    contentType = file.type || 'image/jpeg';
    fileName = file.name || fileName;
    if (Platform.OS !== 'web') {
      const b64 = await FileSystem.readAsStringAsync(file.uri, { encoding: FileSystem.EncodingType.Base64 });
      blobToUpload = new Uint8Array(atob(b64).split('').map(c => c.charCodeAt(0))) as any;
    } else {
      const response = await fetch(file.uri);
      blobToUpload = await response.blob();
    }
  } else {
    // Web File object
    contentType = file.type || 'image/jpeg';
    fileName = file.name || fileName;
    blobToUpload = file as any;
  }

  const path = `${userId}/${Date.now()}-${fileName}`;
  const { error: uploadError } = await supabase.storage
    .from('streets-media')
    .upload(path, blobToUpload, { contentType, upsert: true });
  
  if (uploadError) throw uploadError;

  const { data: urlData } = supabase.storage.from('streets-media').getPublicUrl(path);
  return { url: urlData.publicUrl, thumbnailUrl: urlData.publicUrl };
}

export async function createPost(payload: {
  creatorId: string;
  content: string;
  mediaUrl?: string;
  thumbnailUrl?: string;
  mediaType?: 'image' | 'video';
  isPublic?: boolean;
  caption?: string;
  hashtags?: string[];
}) {
  const { data, error } = await supabase
    .from('education_feed_posts')
    .insert({
      creator_id: payload.creatorId,
      content: payload.content,
      media_url: payload.mediaUrl,
      thumbnail_url: payload.thumbnailUrl,
      media_type: payload.mediaType,
      caption: payload.caption,
      hashtags: payload.hashtags,
      is_published: payload.isPublic ?? true,
    })
    .select()
    .single();
    
  if (error) throw error;
  return data;
}

export async function getFeedPosts(limit = 20, offset = 0) {
  const { data, error } = await supabase
    .from('education_feed_posts')
    .select('*, creator:creator_id(user_id, full_name, avatar_url)')
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) throw error;
  return data || [];
}

export const fetchStreetsPosts = getFeedPosts;

export async function fetchPostsByUser(userId: string, limit = 20) {
  const { data, error } = await supabase
    .from('education_feed_posts')
    .select('*')
    .eq('creator_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

export async function fetchAuthorProfiles(userIds: string[]) {
  if (userIds.length === 0) return [];
  const { data, error } = await supabase
    .from('user_profiles')
    .select('id, full_name, avatar_url')
    .in('id', userIds);
  if (error) throw error;
  return data || [];
}

export async function checkUserLiked(postId: string, userId: string) {
  const { data, error } = await supabase
    .from('education_feed_likes')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return !!data;
}

export async function fetchComments(postId: string) {
  const { data, error } = await supabase
    .from('education_feed_comments')
    .select('*')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function addComment(postId: string, userId: string, content: string) {
  const { data, error } = await supabase
    .from('education_feed_comments')
    .insert({ post_id: postId, user_id: userId, content })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function sharePost(postId: string, userId: string) {
  await supabase.rpc('increment_post_shares', { post_id: postId });
  return true;
}

export async function repostPost(postId: string, userId: string, caption?: string) {
  const { data: original } = await supabase.from('education_feed_posts').select('*').eq('id', postId).single();
  if (!original) throw new Error('Post not found');
  
  const { data, error } = await supabase
    .from('education_feed_posts')
    .insert({
      creator_id: userId,
      content: caption || `Reposted: ${original.content}`,
      media_url: original.media_url,
      media_type: original.media_type,
      is_published: true,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function incrementViewCount(postId: string) {
  // Stub: in a real app, this would be an RPC
  return true;
}

export async function fetchPostAnalytics(postId: string) {
  return { views: 0, likes: 0, shares: 0, comments: 0 };
}

export async function boostPost(params: BoostParams) {
  return { success: true };
}

export async function toggleLikePost(postId: string, userId: string) {
  const { data: existing } = await supabase
    .from('education_feed_likes')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .maybeSingle();

  if (existing) {
    await supabase.from('education_feed_likes').delete().eq('id', existing.id);
  } else {
    await supabase.from('education_feed_likes').insert({ post_id: postId, user_id: userId });
  }
  
  const { count } = await supabase
    .from('education_feed_likes')
    .select('*', { count: 'exact', head: true })
    .eq('post_id', postId);

  return { liked: !existing, count: count || 0 };
}
