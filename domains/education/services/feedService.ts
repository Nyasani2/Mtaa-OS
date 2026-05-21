
import { supabase } from '@/lib/supabase';
import { FeedPost } from '../types/education.types';

export async function getFeed(institutionId: string, isJunior?: boolean) {
  let query = supabase
    .from('education_feeds')
    .select('*, author:profiles(full_name, avatar_url)')
    .eq('institution_id', institutionId)
    .eq('is_active', true)
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false });

  if (isJunior) query = query.eq('is_junior_safe', true);

  const { data, error } = await query;
  if (error) throw error;
  return data as FeedPost[];
}

export async function createFeedPost(post: Partial<FeedPost>) {
  const { data, error } = await supabase
    .from('education_feeds')
    .insert(post)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function likeFeedPost(postId: string, userId: string) {
  const { error } = await supabase
    .from('education_feed_likes')
    .insert({ feed_id: postId, user_id: userId });
  if (error && error.code !== '23505') throw error;

  // Increment count
  await supabase.rpc('increment_feed_likes', { post_id: postId });
}
