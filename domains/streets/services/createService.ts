// lib/streets/services/createService.ts
// MTAA Streets — Create Post Service (wired to streets_posts table)

import { supabase } from '@/lib/supabase';
import { StreetPost } from '../types';

interface CreatePostInput {
  content: string;
  media_urls?: string[];
  media_type?: 'image' | 'video' | 'audio' | 'none';
  location?: { lat: number; lng: number; name?: string };
  visibility?: 'public' | 'friends' | 'private' | 'tribe';
  tribe_id?: string;
  tags?: string[];
  mentions?: string[];
}

export async function createPost(
  input: CreatePostInput,
  userId: string
): Promise<StreetPost> {
  const { data, error } = await supabase
    .from('streets_posts')
    .insert({
      user_id: userId,
      content: input.content,
      media_urls: input.media_urls || [],
      media_type: input.media_type || 'none',
      location: input.location || null,
      visibility: input.visibility || 'public',
      tribe_id: input.tribe_id || null,
      tags: input.tags || [],
      mentions: input.mentions || [],
      like_count: 0,
      comment_count: 0,
      share_count: 0,
      view_count: 0,
      is_pinned: false,
      is_edited: false,
    })
    .select(`
      *,
      author:profiles(id, display_name, handle, avatar_url, is_verified)
    `)
    .single();

  if (error) throw error;

  return {
    id: data.id,
    user_id: data.user_id,
    content: data.content,
    media_urls: data.media_urls || [],
    media_type: data.media_type || 'none',
    location: data.location,
    visibility: data.visibility,
    tribe_id: data.tribe_id,
    tags: data.tags || [],
    mentions: data.mentions || [],
    like_count: data.like_count || 0,
    comment_count: data.comment_count || 0,
    share_count: data.share_count || 0,
    view_count: data.view_count || 0,
    is_pinned: data.is_pinned || false,
    is_edited: data.is_edited || false,
    created_at: data.created_at,
    updated_at: data.updated_at,
    author: data.author,
    liked_by_me: false,
    saved_by_me: false,
  };
}

export async function updatePost(
  postId: string,
  input: Partial<CreatePostInput>,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from('streets_posts')
    .update({
      ...input,
      is_edited: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', postId)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function uploadMedia(
  file: File,
  userId: string
): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/${Date.now()}.${fileExt}`;
  const filePath = `streets/media/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('streets')
    .upload(filePath, file, { upsert: false });

  if (uploadError) throw uploadError;

  const { data: urlData } = supabase.storage
    .from('streets')
    .getPublicUrl(filePath);

  return urlData.publicUrl;
}

export async function uploadMultipleMedia(
  files: File[],
  userId: string
): Promise<string[]> {
  const uploads = files.map((file) => uploadMedia(file, userId));
  return Promise.all(uploads);
}
