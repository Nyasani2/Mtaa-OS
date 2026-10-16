import { supabase } from '@/lib/supabase';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

export interface StreetPost {
  id: string;
  creator_id: string;
  content: string;
  caption?: string;
  media_url?: string;
  thumbnail_url?: string;
  media_type?: 'image' | 'video';
  hashtags?: string[];
  is_public: boolean;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  views_count: number;
  view_count?: number;
  is_boosted?: boolean;
  created_at: string;
  creator?: { user_id: string; full_name: string; avatar_url: string };
}

export type StreetsPost = StreetPost;
export type StreetsComment = any;
export type AuthorProfile = any;
export type PostAnalytics = any;
export type BoostParams = any;

// ─── MEDIA UPLOAD (Base64 for Android/iOS) ───
export async function uploadMedia(file: { uri: string; name?: string; type?: string } | File, userId: string, onProgress?: (p: number) => void) {
  let blobToUpload: Blob | Uint8Array;
  let contentType = file.type || 'image/jpeg';
  let fileName = file.name || `upload_${Date.now()}`;

  if ('uri' in file) {
    if (Platform.OS !== 'web') {
      const b64 = await FileSystem.readAsStringAsync(file.uri, { encoding: FileSystem.EncodingType.Base64 });
      blobToUpload = new Uint8Array(atob(b64).split('').map(c => c.charCodeAt(0))) as any;
    } else {
      const response = await fetch(file.uri);
      blobToUpload = await response.blob();
    }
  } else {
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

// ─── POSTS ───
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
    .from('streets_posts')
    .insert({
      creator_id: payload.creatorId,
      content: payload.content,
      caption: payload.caption,
      media_url: payload.mediaUrl,
      thumbnail_url: payload.thumbnailUrl,
      media_type: payload.mediaType,
      hashtags: payload.hashtags,
      is_public: payload.isPublic ?? true,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getFeedPosts(limit = 20, offset = 0) {
  const { data, error } = await supabase
    .from('streets_posts')
    .select('*, creator:creator_id(user_id, full_name, avatar_url)')
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) throw error;
  return data || [];
}

export const fetchStreetsPosts = getFeedPosts;

export async function fetchPostsByUser(userId: string, limit = 50) {
  const { data, error } = await supabase
    .from('streets_posts')
    .select('*')
    .eq('creator_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}
export const getUserPosts = fetchPostsByUser;

export async function getPostById(postId: string) {
  const { data, error } = await supabase
    .from('streets_posts')
    .select('*, creator:creator_id(user_id, full_name, avatar_url)')
    .eq('id', postId)
    .single();
  if (error) throw error;
  return data;
}

export async function updatePost(postId: string, updates: any) {
  const { data, error } = await supabase
    .from('streets_posts')
    .update(updates)
    .eq('id', postId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deletePost(postId: string) {
  const { error } = await supabase.from('streets_posts').delete().eq('id', postId);
  if (error) throw error;
  return true;
}

export async function getPostsByHashtag(hashtag: string, limit = 20) {
  const { data, error } = await supabase
    .from('streets_posts')
    .select('*')
    .contains('hashtags', [hashtag])
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

// ─── PROFILES ───
export async function fetchAuthorProfiles(userIds: string[]) {
  if (userIds.length === 0) return [];
  const { data, error } = await supabase
    .from('user_profiles')
    .select('id, full_name, avatar_url')
    .in('id', userIds);
  if (error) throw error;
  return data || [];
}

export async function getUserProfile(userId: string) {
  const { data, error } = await supabase.from('user_profiles').select('*').eq('id', userId).single();
  if (error) throw error;
  return data;
}

export async function getFollowerCounts(userId: string) {
  const { count: followers } = await supabase.from('profile_follows').select('*', { count: 'exact', head: true }).eq('following_id', userId);
  const { count: following } = await supabase.from('profile_follows').select('*', { count: 'exact', head: true }).eq('follower_id', userId);
  return { followers: followers || 0, following: following || 0 };
}

// ─── LIKES ───
export async function checkUserLiked(postId: string, userId: string) {
  const { data, error } = await supabase.from('streets_post_likes').select('id').eq('post_id', postId).eq('user_id', userId).maybeSingle();
  if (error) throw error;
  return !!data;
}

export async function toggleLikePost(postId: string, userId: string) {
  const { data: existing } = await supabase.from('streets_post_likes').select('id').eq('post_id', postId).eq('user_id', userId).maybeSingle();
  if (existing) {
    await supabase.from('streets_post_likes').delete().eq('id', existing.id);
  } else {
    await supabase.from('streets_post_likes').insert({ post_id: postId, user_id: userId });
  }
  const { count } = await supabase.from('streets_post_likes').select('*', { count: 'exact', head: true }).eq('post_id', postId);
  return { liked: !existing, count: count || 0 };
}

// ─── COMMENTS ───
export async function fetchComments(postId: string) {
  const { data, error } = await supabase
    .from('streets_comments')
    .select('*, author:user_id(user_id, full_name, avatar_url)')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function addComment(postId: string, userId: string, content: string) {
  const { data, error } = await supabase
    .from('streets_comments')
    .insert({ post_id: postId, user_id: userId, content })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ─── SHARES & REPOSTS ───
export async function sharePost(postId: string, userId: string) {
  return { success: true, shares_count: 0 };
}

export async function repostPost(postId: string, userId: string, caption?: string) {
  const { data: original } = await supabase.from('streets_posts').select('*').eq('id', postId).single();
  if (!original) throw new Error('Post not found');
  
  const { data, error } = await supabase
    .from('streets_posts')
    .insert({
      creator_id: userId,
      content: caption || `Reposted: ${original.content}`,
      media_url: original.media_url,
      media_type: original.media_type,
      is_public: true,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ─── VIEWS & ANALYTICS ───
export async function incrementViewCount(postId: string) {
  return true;
}

export async function fetchPostAnalytics(postId: string) {
  const { data } = await supabase.from('streets_posts').select('views_count, likes_count, shares_count, comments_count').eq('id', postId).single();
  return data || { views: 0, likes: 0, shares: 0, comments: 0 };
}

export async function boostPost(params: BoostParams) {
  return { success: true };
}

// ─── NOTIFICATIONS ───
export async function getNotifications(userId: string) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  return data || [];
}

export async function markNotificationRead(notificationId: string) {
  const { error } = await supabase.from('notifications').update({ read: true }).eq('id', notificationId);
  if (error) throw error;
  return true;
}
