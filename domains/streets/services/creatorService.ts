// lib/streets/services/creatorService.ts
// MTAA Streets — Creator Studio Service (analytics + insights)

import { supabase } from '@/lib/supabase';
import { StreetCreatorStudioMetrics, StreetPost } from '../types';

export async function fetchCreatorMetrics(userId: string): Promise<StreetCreatorStudioMetrics> {
  const { data: posts, error: postsError } = await supabase
    .from('streets_posts')
    .select('id, like_count, comment_count, share_count, view_count, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (postsError) throw postsError;

  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('follower_count, post_count')
    .eq('user_id', userId)
    .single();

  if (profileError) throw profileError;

  const allPosts = posts || [];
  const totalPosts = allPosts.length;
  const totalViews = allPosts.reduce((sum, p) => sum + (p.view_count || 0), 0);
  const totalLikes = allPosts.reduce((sum, p) => sum + (p.like_count || 0), 0);
  const totalComments = allPosts.reduce((sum, p) => sum + (p.comment_count || 0), 0);
  const totalShares = allPosts.reduce((sum, p) => sum + (p.share_count || 0), 0);

  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();

  const followers7d = await fetchFollowerGrowth(userId, sevenDaysAgo);
  const followers30d = await fetchFollowerGrowth(userId, thirtyDaysAgo);

  const topPosts = allPosts
    .sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
    .slice(0, 5);

  const engagementRate = totalViews > 0
    ? ((totalLikes + totalComments + totalShares) / totalViews) * 100
    : 0;

  return {
    total_posts: totalPosts,
    total_views: totalViews,
    total_likes: totalLikes,
    total_comments: totalComments,
    total_shares: totalShares,
    total_followers: profile?.follower_count || 0,
    follower_growth_7d: followers7d,
    follower_growth_30d: followers30d,
    top_posts: topPosts as StreetPost[],
    audience_demographics: {},
    engagement_rate: Math.round(engagementRate * 100) / 100,
  };
}

async function fetchFollowerGrowth(userId: string, since: string): Promise<number> {
  const { count, error } = await supabase
    .from('streets_follows')
    .select('*', { count: 'exact', head: true })
    .eq('following_id', userId)
    .gte('created_at', since);

  if (error) throw error;
  return count || 0;
}

export async function fetchPostAnalytics(postId: string): Promise<{
  views: number;
  likes: number;
  comments: number;
  shares: number;
  reach: number;
}> {
  const { data, error } = await supabase
    .from('streets_posts')
    .select('view_count, like_count, comment_count, share_count')
    .eq('id', postId)
    .single();

  if (error) throw error;

  return {
    views: data?.view_count || 0,
    likes: data?.like_count || 0,
    comments: data?.comment_count || 0,
    shares: data?.share_count || 0,
    reach: data?.view_count || 0,
  };
}

export async function fetchAudienceDemographics(userId: string): Promise<Record<string, any>> {
  const { data, error } = await supabase
    .from('streets_audience_demographics')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    return { age: {}, gender: {}, location: {}, devices: {} };
  }

  return data.demographics || {};
}
