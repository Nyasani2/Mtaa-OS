// lib/streets/services/commentService.ts
// MTAA Streets — Comment Service (wired to streets_comments table)

import { supabase } from '@/lib/supabase';
import { StreetComment } from '../types';

const PAGE_SIZE = 20;

export async function fetchComments(
  postId: string,
  page: number = 0
): Promise<{ comments: StreetComment[]; hasMore: boolean }> {
  const { data, error } = await supabase
    .from('streets_comments')
    .select(`
      *,
      author:profiles(id, display_name, handle, avatar_url, is_verified),
      liked_by_me:streets_comment_likes!inner(user_id)
    `)
    .eq('post_id', postId)
    .is('parent_id', null)
    .order('created_at', { ascending: true })
    .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

  if (error) throw error;

  const comments: StreetComment[] = (data || []).map((row: any) => ({
    id: row.id,
    post_id: row.post_id,
    user_id: row.user_id,
    parent_id: row.parent_id,
    content: row.content,
    media_url: row.media_url,
    like_count: row.like_count || 0,
    reply_count: row.reply_count || 0,
    created_at: row.created_at,
    updated_at: row.updated_at,
    author: row.author,
    liked_by_me: !!row.liked_by_me?.length,
    replies: [],
  }));

  return { comments, hasMore: comments.length === PAGE_SIZE };
}

export async function fetchReplies(
  commentId: string,
  page: number = 0
): Promise<{ replies: StreetComment[]; hasMore: boolean }> {
  const { data, error } = await supabase
    .from('streets_comments')
    .select(`
      *,
      author:profiles(id, display_name, handle, avatar_url, is_verified)
    `)
    .eq('parent_id', commentId)
    .order('created_at', { ascending: true })
    .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

  if (error) throw error;

  const replies: StreetComment[] = (data || []).map((row: any) => ({
    id: row.id,
    post_id: row.post_id,
    user_id: row.user_id,
    parent_id: row.parent_id,
    content: row.content,
    media_url: row.media_url,
    like_count: row.like_count || 0,
    reply_count: row.reply_count || 0,
    created_at: row.created_at,
    updated_at: row.updated_at,
    author: row.author,
    liked_by_me: false,
    replies: [],
  }));

  return { replies, hasMore: replies.length === PAGE_SIZE };
}

export async function createComment(
  postId: string,
  content: string,
  userId: string,
  parentId?: string,
  mediaUrl?: string
): Promise<StreetComment> {
  const { data, error } = await supabase
    .from('streets_comments')
    .insert({
      post_id: postId,
      user_id: userId,
      parent_id: parentId || null,
      content,
      media_url: mediaUrl || null,
      like_count: 0,
      reply_count: 0,
    })
    .select(`
      *,
      author:profiles(id, display_name, handle, avatar_url, is_verified)
    `)
    .single();

  if (error) throw error;

  return {
    id: data.id,
    post_id: data.post_id,
    user_id: data.user_id,
    parent_id: data.parent_id,
    content: data.content,
    media_url: data.media_url,
    like_count: data.like_count || 0,
    reply_count: data.reply_count || 0,
    created_at: data.created_at,
    updated_at: data.updated_at,
    author: data.author,
    liked_by_me: false,
    replies: [],
  };
}

export async function likeComment(commentId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('streets_comment_likes')
    .insert({ comment_id: commentId, user_id: userId });
  if (error) throw error;
}

export async function unlikeComment(commentId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('streets_comment_likes')
    .delete()
    .eq('comment_id', commentId)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function deleteComment(commentId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('streets_comments')
    .delete()
    .eq('id', commentId)
    .eq('user_id', userId);
  if (error) throw error;
}
