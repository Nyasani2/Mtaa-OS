// domains/pulse/services/feedEngine.ts
// MTAA Pulse — Smart Feed Algorithm
// Uses resolved_media_url and resolved_thumbnail_url from pulse_events

import { supabase } from '@/lib/supabase';

export interface FeedPost {
  id: string;
  user_id: string;
  content: string;
  media_url?: string;
  thumbnail_url?: string;
  music_url?: string;
  music_start?: number;
  is_duet: boolean;
  is_collab: boolean;
  original_post_id?: string;
  collab_users?: string[];
  created_at: string;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  views_count: number;
  author: {
    id: string;
    display_name: string;
    avatar_url?: string;
    verified: boolean;
  };
}

export const feedEngine = {
  async getSmartFeed(user_id: string, limit: number = 25): Promise<FeedPost[]> {
    const { data: follows } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', user_id);

    const followingIds = (follows || []).map(f => f.following_id);

    const { data: skips } = await supabase
      .from('pulse_event_interactions')
      .select('event_id')
      .eq('user_id', user_id)
      .eq('interaction_type', 'dismiss');

    const skippedPostIds = (skips || []).map(s => s.event_id);
    const skipFilter = skippedPostIds.length > 0
      ? `(${skippedPostIds.join(',')})`
      : '(00000000-0000-0000-0000-000000000000)';

    const followedLimit = Math.ceil(limit * 0.7);
    let followedQuery = supabase
      .from('pulse_events')
      .select(`
        id, user_id, payload, created_at,
        resolved_media_url,
        resolved_thumbnail_url,
        profiles:user_id (id, display_name, avatar_url, verified)
      `)
      .eq('source', 'feed')
      .eq('event_type', 'post_created')
      .not('id', 'in', skipFilter)
      .order('created_at', { ascending: false })
      .limit(followedLimit);

    if (followingIds.length > 0) {
      followedQuery = followedQuery.in('user_id', followingIds);
    } else {
      followedQuery = followedQuery.eq('user_id', '00000000-0000-0000-0000-000000000000');
    }

    const { data: followedPosts } = await followedQuery;

    const trendingLimit = Math.ceil(limit * 0.3);
    const { data: trending } = await supabase
      .from('pulse_trends')
      .select(`
        entity_id,
        pulse_events!inner(id, user_id, payload, created_at, resolved_media_url, resolved_thumbnail_url),
        profiles:pulse_events.user_id(id, display_name, avatar_url, verified)
      `)
      .eq('entity_type', 'post')
      .not('entity_id', 'in', skipFilter)
      .gt('expires_at', new Date().toISOString())
      .order('score', { ascending: false })
      .limit(trendingLimit);

    const followed = (followedPosts || []).map(p => this.mapToFeedPost(p));
    const trendingPosts = (trending || []).map(t => this.mapToFeedPost(t.pulse_events));

    const merged = [...followed, ...trendingPosts];
    const unique = merged.filter((post, index, self) =>
      index === self.findIndex(p => p.id === post.id)
    );

    return unique.slice(0, limit);
  },

  async getForYouFeed(user_id: string, limit: number = 25): Promise<FeedPost[]> {
    const { data: interests } = await supabase
      .from('user_interests')
      .select('tag')
      .eq('user_id', user_id);

    const tags = (interests || []).map(i => i.tag);

    if (tags.length === 0) {
      return this.getTrendingFeed(limit);
    }

    const { data: posts } = await supabase
      .from('pulse_events')
      .select(`
        id, user_id, payload, created_at,
        resolved_media_url,
        resolved_thumbnail_url,
        profiles:user_id (id, display_name, avatar_url, verified)
      `)
      .eq('source', 'feed')
      .eq('event_type', 'post_created')
      .order('created_at', { ascending: false })
      .limit(limit * 2);

    const filtered = (posts || []).filter(post => {
      const content = post.payload?.content || '';
      const tags_in_post = post.payload?.tags || [];
      return tags.some(tag =>
        content.toLowerCase().includes(tag.toLowerCase()) ||
        tags_in_post.some((t: string) => t.toLowerCase() === tag.toLowerCase())
      );
    });

    return filtered.slice(0, limit).map(p => this.mapToFeedPost(p));
  },

  async getTrendingFeed(limit: number = 25): Promise<FeedPost[]> {
    const { data: trends } = await supabase
      .from('pulse_trends')
      .select(`
        entity_id, score,
        pulse_events!inner(id, user_id, payload, created_at, resolved_media_url, resolved_thumbnail_url),
        profiles:pulse_events.user_id(id, display_name, avatar_url, verified)
      `)
      .eq('entity_type', 'post')
      .gt('expires_at', new Date().toISOString())
      .order('score', { ascending: false })
      .limit(limit);

    return (trends || []).map(t => this.mapToFeedPost(t.pulse_events));
  },

  async getFollowingFeed(user_id: string, limit: number = 25): Promise<FeedPost[]> {
    const { data: follows } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', user_id);

    const followingIds = (follows || []).map(f => f.following_id);
    if (followingIds.length === 0) return [];

    const { data: posts } = await supabase
      .from('pulse_events')
      .select(`
        id, user_id, payload, created_at,
        resolved_media_url,
        resolved_thumbnail_url,
        profiles:user_id (id, display_name, avatar_url, verified)
      `)
      .eq('source', 'feed')
      .eq('event_type', 'post_created')
      .in('user_id', followingIds)
      .order('created_at', { ascending: false })
      .limit(limit);

    return (posts || []).map(p => this.mapToFeedPost(p));
  },

  mapToFeedPost(raw: any): FeedPost {
    const payload = raw.payload || {};
    const profile = raw.profiles || {};
    return {
      id: raw.id,
      user_id: raw.user_id,
      content: payload.content || '',
      media_url: raw.resolved_media_url || payload.media_url,
      thumbnail_url: raw.resolved_thumbnail_url || payload.thumbnail_url,
      music_url: payload.music_url,
      music_start: payload.music_start || 0,
      is_duet: payload.is_duet || false,
      is_collab: payload.is_collab || false,
      original_post_id: payload.original_post_id,
      collab_users: payload.collab_users || [],
      created_at: raw.created_at,
      likes_count: payload.likes_count || 0,
      comments_count: payload.comments_count || 0,
      shares_count: payload.shares_count || 0,
      views_count: payload.views_count || 0,
      author: {
        id: profile.id || raw.user_id,
        display_name: profile.display_name || 'Unknown',
        avatar_url: profile.avatar_url,
        verified: profile.verified || false,
      },
    };
  },
};
