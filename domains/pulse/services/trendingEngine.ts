// domains/pulse/services/trendingEngine.ts
// MTAA Pulse — Trending Detection Engine (ported from old trendingEngine.ts)

import { supabase } from '@/lib/supabase';
import { rankingEngine, type ContentStats } from './rankingEngine';

export interface TrendingItem {
  entity_id: string;
  entity_type: string;
  entity_name: string;
  score: number;
  velocity: number;
  view_count: number;
  engagement_count: number;
  period: string;
  rank: number;
}

export const trendingEngine = {
  async detectTrending(period: 'hourly' | 'daily' | 'weekly' = 'daily'): Promise<TrendingItem[]> {
    const periodMs = {
      hourly: 60 * 60 * 1000,
      daily: 24 * 60 * 60 * 1000,
      weekly: 7 * 24 * 60 * 60 * 1000,
    };

    const { data: events } = await supabase
      .from('pulse_events')
      .select('*')
      .eq('source', 'feed')
      .eq('event_type', 'post_created')
      .gte('created_at', new Date(Date.now() - periodMs[period]).toISOString())
      .order('created_at', { ascending: false });

    const scored = (events || []).map(event => {
      const payload = event.payload || {};
      const stats: ContentStats = {
        watch_time: payload.watch_time || 0,
        duration: payload.duration || 1,
        likes: payload.likes_count || 0,
        comments: payload.comments_count || 0,
        shares: payload.shares_count || 0,
        views: payload.views_count || 0,
      };
      const ranked = rankingEngine.scoreContent(stats, event.created_at);

      return {
        entity_id: event.id,
        entity_type: 'post',
        entity_name: payload.content?.substring(0, 50) || 'Untitled',
        score: ranked.score,
        velocity: ranked.breakdown.recency,
        view_count: stats.views,
        engagement_count: stats.likes + stats.comments + stats.shares,
        period,
        rank: 0,
      };
    });

    scored.sort((a, b) => b.score - a.score);
    scored.forEach((item, index) => { item.rank = index + 1; });

    return scored;
  },

  isTrending(stats: ContentStats): boolean {
    return rankingEngine.isTrending(stats);
  },

  isViral(stats: ContentStats): boolean {
    return rankingEngine.isViral(stats);
  },

  async updateTrends(period: 'hourly' | 'daily' | 'weekly' = 'daily'): Promise<void> {
    const trending = await this.detectTrending(period);
    const top20 = trending.slice(0, 20);

    await supabase
      .from('pulse_trends')
      .delete()
      .eq('period', period)
      .eq('entity_type', 'post');

    if (top20.length > 0) {
      const periodMs = {
        hourly: 2 * 60 * 60 * 1000,
        daily: 48 * 60 * 60 * 1000,
        weekly: 14 * 24 * 60 * 60 * 1000,
      };

      await supabase.from('pulse_trends').insert(
        top20.map(item => ({
          entity_type: item.entity_type,
          entity_id: item.entity_id,
          entity_name: item.entity_name,
          score: item.score,
          velocity: item.velocity,
          view_count: item.view_count,
          engagement_count: item.engagement_count,
          period: item.period,
          rank: item.rank,
          expires_at: new Date(Date.now() + periodMs[period]).toISOString(),
        }))
      );
    }
  },
};
