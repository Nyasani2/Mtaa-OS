// domains/pulse/services/signalService.ts
// MTAA Pulse — AI Signal Recording (ported from old aitaurus_feed.js)

import { supabase } from '@/lib/supabase';

export type SignalAction =
  | 'view' | 'like' | 'unlike' | 'comment' | 'share' | 'save' | 'unsave'
  | 'not_interested' | 'report' | 'follow' | 'unfollow' | 'click'
  | 'watch_start' | 'watch_complete' | 'watch_skip' | 'ad_click';

export interface SignalPayload {
  post_id?: string;
  content_id?: string;
  action: SignalAction;
  metadata?: Record<string, any>;
  duration?: number;
  position?: number;
}

export const signalService = {
  async recordSignal(user_id: string, payload: SignalPayload): Promise<void> {
    const { error } = await supabase.from('pulse_event_interactions').insert({
      event_id: payload.post_id || payload.content_id || '00000000-0000-0000-0000-000000000000',
      user_id,
      interaction_type: payload.action,
      metadata: {
        ...payload.metadata,
        duration: payload.duration,
        position: payload.position,
      },
    });

    if (error) {
      console.error('Failed to record signal:', error.message);
    }
  },

  async recordBatch(user_id: string, signals: SignalPayload[]): Promise<void> {
    if (signals.length === 0) return;

    const rows = signals.map(s => ({
      event_id: s.post_id || s.content_id || '00000000-0000-0000-0000-000000000000',
      user_id,
      interaction_type: s.action,
      metadata: { ...s.metadata, duration: s.duration, position: s.position },
    }));

    const { error } = await supabase.from('pulse_event_interactions').insert(rows);
    if (error) console.error('Failed to record batch signals:', error.message);
  },

  async getPostSignals(user_id: string, post_id: string): Promise<SignalAction[]> {
    const { data, error } = await supabase
      .from('pulse_event_interactions')
      .select('interaction_type')
      .eq('user_id', user_id)
      .eq('event_id', post_id)
      .order('created_at', { ascending: false });

    if (error) return [];
    return (data || []).map(d => d.interaction_type as SignalAction);
  },

  async hasLiked(user_id: string, post_id: string): Promise<boolean> {
    const signals = await this.getPostSignals(user_id, post_id);
    let likeCount = 0;
    for (const action of signals) {
      if (action === 'like') likeCount++;
      if (action === 'unlike') likeCount--;
    }
    return likeCount > 0;
  },

  async hasSaved(user_id: string, post_id: string): Promise<boolean> {
    const signals = await this.getPostSignals(user_id, post_id);
    let saveCount = 0;
    for (const action of signals) {
      if (action === 'save') saveCount++;
      if (action === 'unsave') saveCount--;
    }
    return saveCount > 0;
  },

  async getNotInterestedPosts(user_id: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('pulse_event_interactions')
      .select('event_id')
      .eq('user_id', user_id)
      .eq('interaction_type', 'dismiss');

    if (error) return [];
    return (data || []).map(d => d.event_id);
  },
};
