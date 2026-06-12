cd ~/Downloads
unzip -o edu_routes_batch1.zip -d ~/MTAA_OS_V10/
import { supabase } from '@/lib/supabase/client';

// feedService.ts - Education Feed Service
// FIXED: import path corrected from @/lib/supabase to @/lib/supabase/client

export interface FeedPost {
  id: string;
  institution_id?: string;
  author_id: string;
cd ~/Downloads
unzip -o edu_routes_batch1.zip -d ~/MTAA_OS_V10/  author_type: 'teacher' | 'student' | 'admin' | 'parent';
  title: string;
  content: string;
  post_type: 'announcement' | 'assignment' | 'event' | 'general';
  attachments?: string[];
  pinned?: boolean;
  created_at: string;
  updated_at: string;
}

export async function getEducationFeed(institutionId?: string, limit = 20) {
  let query = supabase
    .from('education_feed_posts')
    .select('*')
    .order('pinned', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit);

  if (institutionId) {
    query = query.eq('institution_id', institutionId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as FeedPost[];
}

export async function createFeedPost(post: Omit<FeedPost, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('education_feed_posts')
    .insert(post)
    .select()
    .single();
  if (error) throw error;
  return data as FeedPost;
}

export async function updateFeedPost(id: string, updates: Partial<FeedPost>) {
  const { data, error } = await supabase
    .from('education_feed_posts')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as FeedPost;
}

export async function deleteFeedPost(id: string) {
  const { error } = await supabase.from('education_feed_posts').delete().eq('id', id);
  if (error) throw error;
}
