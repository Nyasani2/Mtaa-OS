// domains/pulse/services/pulseService.ts
// MTAA Pulse — Service Layer (direct Supabase, no React Query)

import { supabase } from '@/lib/supabase';
import type {
  PulseEvent, PulseTopic, PulseTrend, PulseAlert, PulseRecommendation,
  PulseSavedItem, PulseAnalytics, PulseCreatorScore, PulseSearchResult,
  PulseReport, PulseModerationItem
} from '../types';

export const pulseService = {
  // ==========================================================================
  // EVENTS
  // ==========================================================================
  async getEvents(params?: { source?: string; limit?: number; processed?: boolean }): Promise<PulseEvent[]> {
    let query = supabase.from('pulse_events').select('*').order('created_at', { ascending: false });
    if (params?.source) query = query.eq('source', params.source);
    if (params?.processed !== undefined) query = query.eq('processed', params.processed);
    if (params?.limit) query = query.limit(params.limit);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async emitEvent(event: Omit<PulseEvent, 'id' | 'created_at'>): Promise<PulseEvent> {
    const { data, error } = await supabase.from('pulse_events').insert(event).select().single();
    if (error) throw error;
    return data;
  },

  // ==========================================================================
  // TOPICS
  // ==========================================================================
  async getTopics(params?: { category?: string; featured?: boolean; limit?: number }): Promise<PulseTopic[]> {
    let query = supabase.from('pulse_topics').select('*').eq('is_active', true).is('deleted_at', null).order('trending_score', { ascending: false });
    if (params?.category) query = query.eq('category', params.category);
    if (params?.featured) query = query.eq('is_featured', true);
    if (params?.limit) query = query.limit(params.limit);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async getTopicBySlug(slug: string): Promise<PulseTopic | null> {
    const { data, error } = await supabase.from('pulse_topics').select('*').eq('slug', slug).single();
    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  },

  async followTopic(topicId: string): Promise<void> {
    const { error } = await supabase.from('pulse_topic_followers').insert({ topic_id: topicId, notification_enabled: true });
    if (error) throw error;
  },

  async unfollowTopic(topicId: string): Promise<void> {
    const { error } = await supabase.from('pulse_topic_followers').delete().eq('topic_id', topicId);
    if (error) throw error;
  },

  async getFollowedTopics(): Promise<string[]> {
    const { data, error } = await supabase.from('pulse_topic_followers').select('topic_id');
    if (error) throw error;
    return (data || []).map(d => d.topic_id);
  },

  // ==========================================================================
  // TRENDS
  // ==========================================================================
  async getTrends(params?: { period?: string; region?: string; entityType?: string; limit?: number }): Promise<PulseTrend[]> {
    let query = supabase.from('pulse_trends').select('*').gt('expires_at', new Date().toISOString()).order('score', { ascending: false });
    if (params?.period) query = query.eq('period', params.period);
    if (params?.region) query = query.eq('region', params.region);
    if (params?.entityType) query = query.eq('entity_type', params.entityType);
    if (params?.limit) query = query.limit(params.limit);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  // ==========================================================================
  // ALERTS
  // ==========================================================================
  async getAlerts(params?: { type?: string; severity?: string; region?: string; limit?: number }): Promise<PulseAlert[]> {
    let query = supabase.from('pulse_alerts').select('*').is('deleted_at', null).order('created_at', { ascending: false });
    if (params?.type) query = query.eq('alert_type', params.type);
    if (params?.severity) query = query.eq('severity', params.severity);
    if (params?.region) query = query.eq('region', params.region);
    if (params?.limit) query = query.limit(params.limit);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async getAlertDeliveries(): Promise<{ alert_id: string; read_at?: string; dismissed_at?: string }[]> {
    const { data, error } = await supabase.from('pulse_alert_deliveries').select('alert_id, read_at, dismissed_at');
    if (error) throw error;
    return data || [];
  },

  async markAlertRead(alertId: string): Promise<void> {
    const { error } = await supabase.from('pulse_alert_deliveries').upsert({ alert_id: alertId, read_at: new Date().toISOString() });
    if (error) throw error;
  },

  async dismissAlert(alertId: string): Promise<void> {
    const { error } = await supabase.from('pulse_alert_deliveries').upsert({ alert_id: alertId, dismissed_at: new Date().toISOString() });
    if (error) throw error;
  },

  // ==========================================================================
  // RECOMMENDATIONS
  // ==========================================================================
  async getRecommendations(params?: { type?: string; limit?: number }): Promise<PulseRecommendation[]> {
    let query = supabase.from('pulse_recommendations').select('*').gt('expires_at', new Date().toISOString()).order('score', { ascending: false });
    if (params?.type) query = query.eq('rec_type', params.type);
    if (params?.limit) query = query.limit(params.limit);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async recordRecommendationClick(recId: string): Promise<void> {
    const { error } = await supabase.from('pulse_recommendations').update({ clicked_at: new Date().toISOString() }).eq('id', recId);
    if (error) throw error;
  },

  async dismissRecommendation(recId: string): Promise<void> {
    const { error } = await supabase.from('pulse_recommendations').update({ dismissed_at: new Date().toISOString() }).eq('id', recId);
    if (error) throw error;
  },

  // ==========================================================================
  // SAVED ITEMS
  // ==========================================================================
  async getSavedItems(): Promise<PulseSavedItem[]> {
    const { data, error } = await supabase.from('pulse_saved_items').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async saveItem(item: Omit<PulseSavedItem, 'id' | 'created_at'>): Promise<PulseSavedItem> {
    const { data, error } = await supabase.from('pulse_saved_items').insert(item).select().single();
    if (error) throw error;
    return data;
  },

  async unsaveItem(itemId: string): Promise<void> {
    const { error } = await supabase.from('pulse_saved_items').delete().eq('id', itemId);
    if (error) throw error;
  },

  // ==========================================================================
  // ANALYTICS
  // ==========================================================================
  async getAnalytics(params?: { metric?: string; period?: string; region?: string; limit?: number }): Promise<PulseAnalytics[]> {
    let query = supabase.from('pulse_analytics').select('*').order('snapshot_at', { ascending: false });
    if (params?.metric) query = query.eq('metric_name', params.metric);
    if (params?.period) query = query.eq('period', params.period);
    if (params?.region) query = query.eq('region', params.region);
    if (params?.limit) query = query.limit(params.limit);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  // ==========================================================================
  // CREATOR SCORES
  // ==========================================================================
  async getCreatorScores(params?: { limit?: number; category?: string }): Promise<PulseCreatorScore[]> {
    let query = supabase.from('pulse_creator_scores').select('*').order('overall_score', { ascending: false });
    if (params?.category) query = query.eq('rank_category', params.category);
    if (params?.limit) query = query.limit(params.limit);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  // ==========================================================================
  // SEARCH
  // ==========================================================================
  async search(query: string, params?: { type?: string; limit?: number; offset?: number }): Promise<PulseSearchResult[]> {
    const { data, error } = await supabase.rpc('pulse_search', {
      search_query: query,
      entity_type: params?.type || null,
      result_limit: params?.limit || 20,
      result_offset: params?.offset || 0
    });
    if (error) throw error;
    return data || [];
  },

  async getSearchSuggestions(query: string): Promise<string[]> {
    const { data, error } = await supabase.rpc('pulse_search_suggestions', { search_query: query });
    if (error) throw error;
    return data || [];
  },

  // ==========================================================================
  // REPORTS
  // ==========================================================================
  async submitReport(report: Omit<PulseReport, 'id' | 'created_at' | 'updated_at' | 'status'>): Promise<PulseReport> {
    const { data, error } = await supabase.from('pulse_reports').insert({ ...report, status: 'pending' }).select().single();
    if (error) throw error;
    return data;
  },

  // ==========================================================================
  // MODERATION
  // ==========================================================================
  async getModerationQueue(): Promise<PulseModerationItem[]> {
    const { data, error } = await supabase.from('pulse_moderation_queue').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },
};
