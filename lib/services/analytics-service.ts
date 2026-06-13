import { supabase } from '@/lib/supabase';

export type AnalyticsAction = 'track' | 'metric' | 'realtime';

export interface AnalyticsTrackParams {
  action: 'track';
  event: string;
  userId?: string;
  properties?: Record<string, any>;
  timestamp?: string;
  sessionId?: string;
}

export interface AnalyticsMetricParams {
  action: 'metric';
  metricName: string;
  filters?: Record<string, any>;
  period?: { start: string; end: string };
  aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max';
}

export interface AnalyticsRealtimeParams {
  action: 'realtime';
  metricNames: string[];
  refreshInterval?: number;
}

export type AnalyticsParams = AnalyticsTrackParams | AnalyticsMetricParams | AnalyticsRealtimeParams;

export async function analyticsOperation(params: AnalyticsParams) {
  const { data, error } = await supabase.functions.invoke('analytics-operations', {
    body: params,
  });
  if (error) throw error;
  return data;
}

export const trackEvent = (p: Omit<AnalyticsTrackParams, 'action'>) => 
  analyticsOperation({ action: 'track', ...p } as AnalyticsTrackParams);

export const getMetric = (p: Omit<AnalyticsMetricParams, 'action'>) => 
  analyticsOperation({ action: 'metric', ...p } as AnalyticsMetricParams);

export const getRealtime = (p: Omit<AnalyticsRealtimeParams, 'action'>) => 
  analyticsOperation({ action: 'realtime', ...p } as AnalyticsRealtimeParams);
