import { supabase } from '@/lib/supabase';

const PAGE_SIZE = 20;

export interface StreetComment {
  id: string; post_id: string; user_id: string;
  content: string; parent_id: string | null;
  likes_count: number; replies_count: number;
  is_pinned: boolean; created_at: string; updated_at: string;
  author?: { id: string; display_name: string | null; avatar_url: string | null };
  liked_by_me?: boolean;
}

export interface CommentInput { text: string; }
export interface ReplyInput { text: string; }

export async function fetchComments(postId: string, page: number = 0) {
  const { data, error } = await supabase.from('streets_comments').select(`*, author:user_profiles(id, display_name, avatar_url)`).eq('post_id', postId).is('parent_id', null).order('created_at', { ascending: false }).range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
  if (error) throw error;
  return { comments: (data || []).map((row: any) => ({ ...row, author: Array.isArray(row.author) ? row.author[0] : row.author, liked_by_me: false })), hasMore: (data || []).length === PAGE_SIZE };
}

export async function fetchReplies(commentId: string, page: number = 0) {
  const { data, error } = await supabase.from('streets_comments').select(`*, author:user_profiles(id, display_name, avatar_url)`).eq('parent_id', commentId).order('created_at', { ascending: true }).range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
  if (error) throw error;
  return { replies: (data || []).map((row: any) => ({ ...row, author: Array.isArray(row.author) ? row.author[0] : row.author, liked_by_me: false })), hasMore: (data || []).length === PAGE_SIZE };
}

export async function addComment(postId: string, input: CommentInput) { return createComment(postId, input.text); }

export async function addReply(commentId: string, input: ReplyInput) {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error('Not authenticated');
  const { data: parentComment } = await supabase.from('streets_comments').select('post_id').eq('id', commentId).single();
  if (!parentComment) throw new Error('Parent comment not found');
  const { data, error } = await supabase.from('streets_comments').insert({ post_id: parentComment.post_id, user_id: userData.user.id, parent_id: commentId, content: input.text, likes_count: 0, replies_count: 0 }).select(`*, author:user_profiles(id, display_name, avatar_url)`).single();
  if (error) throw error;
  return { ...data, author: Array.isArray(data.author) ? data.author[0] : data.author, liked_by_me: false };
}

export async function createComment(postId: string, content: string) {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error('Not authenticated');
  const { data, error } = await supabase.from('streets_comments').insert({ post_id: postId, user_id: userData.user.id, parent_id: null, content, likes_count: 0, replies_count: 0 }).select(`*, author:user_profiles(id, display_name, avatar_url)`).single();
  if (error) throw error;
  return { ...data, author: Array.isArray(data.author) ? data.author[0] : data.author, liked_by_me: false };
}

export async function likeComment(commentId: string) {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error('Not authenticated');
  const { error } = await supabase.from('streets_comment_likes').insert({ comment_id: commentId, user_id: userData.user.id });
  if (error) { await supabase.from('streets_comment_likes').delete().eq('comment_id', commentId).eq('user_id', userData.user.id); }
}

export async function deleteComment(commentId: string) {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error('Not authenticated');
  const { error } = await supabase.from('streets_comments').delete().eq('id', commentId).eq('user_id', userData.user.id);
  if (error) throw error;
}
