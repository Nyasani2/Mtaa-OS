/**
 * MTAA Analytics Engine
 * Event tracking, dashboards, real-time metrics, reports
 * No Google Analytics — Supabase PostgreSQL + Edge Functions only
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ─── Types ─────────────────────────────────────────────────

export interface AnalyticsEvent {
  id?: string;
  event_type: string;
  event_name: string;
  user_id?: string;
  session_id?: string;
  app_id?: string;
  page?: string;
  properties?: Record<string, any>;
  timestamp?: string;
}

export interface MetricConfig {
  name: string;
  table: string;
  aggregation: 'count' | 'sum' | 'avg' | 'min' | 'max' | 'unique';
  column?: string;
  filter?: Record<string, any>;
  groupBy?: string;
  interval?: 'hour' | 'day' | 'week' | 'month';
}

export interface DashboardWidget {
  id: string;
  type: 'number' | 'chart' | 'table' | 'list';
  title: string;
  metric: string;
  config: MetricConfig;
  refreshInterval?: number;
}

export interface TimeSeriesPoint {
  timestamp: string;
  value: number;
  label?: string;
}

export interface AnalyticsReport {
  id: string;
  name: string;
  widgets: DashboardWidget[];
  created_at: string;
  updated_at: string;
}

// ─── Default Metric Configs ──────────────────────────────

export const DEFAULT_METRICS: Record<string, MetricConfig> = {
  // User metrics
  'daily_active_users': {
    name: 'Daily Active Users',
    table: 'user_sessions',
    aggregation: 'unique',
    column: 'user_id',
    interval: 'day',
  },
  'monthly_active_users': {
    name: 'Monthly Active Users',
    table: 'user_sessions',
    aggregation: 'unique',
    column: 'user_id',
    interval: 'month',
  },
  'new_signups': {
    name: 'New Signups',
    table: 'profiles',
    aggregation: 'count',
    interval: 'day',
  },
  'kyc_completion_rate': {
    name: 'KYC Completion Rate',
    table: 'profiles',
    aggregation: 'avg',
    column: 'kyc_level',
    interval: 'day',
  },
  // Commerce metrics
  'total_transactions': {
    name: 'Total Transactions',
    table: 'transactions',
    aggregation: 'count',
    interval: 'day',
  },
  'transaction_volume': {
    name: 'Transaction Volume',
    table: 'transactions',
    aggregation: 'sum',
    column: 'amount',
    interval: 'day',
  },
  'escrow_volume': {
    name: 'Escrow Volume',
    table: 'escrow_accounts',
    aggregation: 'sum',
    column: 'amount',
    interval: 'day',
  },
  // App metrics
  'app_installs': {
    name: 'App Installs',
    table: 'app_store_installs',
    aggregation: 'count',
    interval: 'day',
  },
  'app_sessions': {
    name: 'App Sessions',
    table: 'app_sessions',
    aggregation: 'count',
    interval: 'day',
  },
  // Civic metrics
  'active_projects': {
    name: 'Active Civic Projects',
    table: 'civic_projects',
    aggregation: 'count',
    filter: { status: 'active' },
    interval: 'day',
  },
  'contractor_applications': {
    name: 'Contractor Applications',
    table: 'civic_contractors',
    aggregation: 'count',
    interval: 'day',
  },
  // Transport metrics
  'mtaxi_rides': {
    name: 'MTaxi Rides',
    table: 'mtaxi_rides',
    aggregation: 'count',
    interval: 'day',
  },
  'mtruck_deliveries': {
    name: 'MTruck Deliveries',
    table: 'mtruck_rides',
    aggregation: 'count',
    interval: 'day',
  },
  // Search metrics
  'search_queries': {
    name: 'Search Queries',
    table: 'search_logs',
    aggregation: 'count',
    interval: 'day',
  },
  'zero_result_searches': {
    name: 'Zero Result Searches',
    table: 'search_logs',
    aggregation: 'count',
    filter: { results_count: 0 },
    interval: 'day',
  },
  // Storage metrics
  'files_uploaded': {
    name: 'Files Uploaded',
    table: 'storage_files',
    aggregation: 'count',
    interval: 'day',
  },
  'storage_used': {
    name: 'Storage Used (MB)',
    table: 'storage_files',
    aggregation: 'sum',
    column: 'size',
    interval: 'day',
  },
  // Messaging metrics
  'messages_sent': {
    name: 'Messages Sent',
    table: 'bus_messages',
    aggregation: 'count',
    interval: 'day',
  },
  'active_channels': {
    name: 'Active Channels',
    table: 'bus_subscriptions',
    aggregation: 'unique',
    column: 'channel',
    interval: 'day',
  },
};

// ─── Analytics Engine Class ──────────────────────────────

export class AnalyticsEngine {
  private client: SupabaseClient;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.client = createClient(supabaseUrl, supabaseKey);
  }

  // ─── Event Tracking ──────────────────────────────────

  async trackEvent(event: AnalyticsEvent): Promise<boolean> {
    const { error } = await this.client.from('analytics_events').insert({
      event_type: event.event_type,
      event_name: event.event_name,
      user_id: event.user_id || null,
      session_id: event.session_id || crypto.randomUUID(),
      app_id: event.app_id || null,
      page: event.page || null,
      properties: event.properties || {},
      timestamp: event.timestamp || new Date().toISOString(),
    });

    if (error) { console.error('[Analytics] Track failed:', error.message); return false; }
    return true;
  }

  async trackBatch(events: AnalyticsEvent[]): Promise<boolean> {
    const { error } = await this.client.from('analytics_events').insert(
      events.map(e => ({
        event_type: e.event_type,
        event_name: e.event_name,
        user_id: e.user_id || null,
        session_id: e.session_id || crypto.randomUUID(),
        app_id: e.app_id || null,
        page: e.page || null,
        properties: e.properties || {},
        timestamp: e.timestamp || new Date().toISOString(),
      }))
    );

    if (error) { console.error('[Analytics] Batch track failed:', error.message); return false; }
    return true;
  }

  // ─── Metric Queries ──────────────────────────────────

  async getMetric(metricKey: string, startDate?: Date, endDate?: Date): Promise<{
    value: number;
    previousValue: number;
    change: number;
    changePercent: number;
    timeSeries: TimeSeriesPoint[];
  }> {
    const config = DEFAULT_METRICS[metricKey];
    if (!config) throw new Error(`Unknown metric: ${metricKey}`);

    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate || new Date();

    const { data, error } = await this.client.rpc('mtaa_get_metric', {
      p_table: config.table,
      p_aggregation: config.aggregation,
      p_column: config.column || 'id',
      p_filter: config.filter || {},
      p_group_by: config.groupBy || null,
      p_interval: config.interval || 'day',
      p_start: start.toISOString(),
      p_end: end.toISOString(),
    });

    if (error) {
      console.error('[Analytics] Metric query failed:', error.message);
      return { value: 0, previousValue: 0, change: 0, changePercent: 0, timeSeries: [] };
    }

    return data || { value: 0, previousValue: 0, change: 0, changePercent: 0, timeSeries: [] };
  }

  async getMultipleMetrics(metricKeys: string[], startDate?: Date, endDate?: Date): Promise<Record<string, any>> {
    const results: Record<string, any> = {};
    await Promise.all(
      metricKeys.map(async key => {
        results[key] = await this.getMetric(key, startDate, endDate);
      })
    );
    return results;
  }

  // ─── Real-time Metrics ───────────────────────────────

  async getRealtimeMetrics(): Promise<{
    onlineUsers: number;
    activeSessions: number;
    transactionsPerMinute: number;
    messagesPerMinute: number;
    searchesPerMinute: number;
  }> {
    const { data, error } = await this.client.rpc('mtaa_realtime_metrics');
    if (error) {
      console.error('[Analytics] Realtime failed:', error.message);
      return { onlineUsers: 0, activeSessions: 0, transactionsPerMinute: 0, messagesPerMinute: 0, searchesPerMinute: 0 };
    }
    return data || { onlineUsers: 0, activeSessions: 0, transactionsPerMinute: 0, messagesPerMinute: 0, searchesPerMinute: 0 };
  }

  // ─── Dashboard Management ──────────────────────────

  async createDashboard(name: string, widgets: DashboardWidget[]): Promise<string | null> {
    const id = crypto.randomUUID();
    const { error } = await this.client.from('analytics_dashboards').insert({
      id,
      name,
      widgets,
    });
    if (error) { console.error('[Analytics] Dashboard create failed:', error.message); return null; }
    return id;
  }

  async getDashboard(id: string): Promise<AnalyticsReport | null> {
    const { data, error } = await this.client.from('analytics_dashboards').select('*').eq('id', id).single();
    if (error || !data) return null;
    return data;
  }

  async listDashboards(): Promise<AnalyticsReport[]> {
    const { data, error } = await this.client.from('analytics_dashboards').select('*').order('updated_at', { ascending: false });
    if (error) { console.error('[Analytics] List dashboards failed:', error.message); return []; }
    return data || [];
  }

  async updateDashboard(id: string, widgets: DashboardWidget[]): Promise<boolean> {
    const { error } = await this.client.from('analytics_dashboards').update({ widgets, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) { console.error('[Analytics] Dashboard update failed:', error.message); return false; }
    return true;
  }

  // ─── Reports ───────────────────────────────────────

  async generateReport(metricKeys: string[], startDate: Date, endDate: Date, format: 'json' | 'csv' = 'json'): Promise<any> {
    const metrics = await this.getMultipleMetrics(metricKeys, startDate, endDate);

    if (format === 'csv') {
      let csv = "Metric,Value,Previous,Change,Change%\n";
      Object.entries(metrics).forEach(([key, data]) => {
        csv += `${key},${data.value},${data.previousValue},${data.change},${data.changePercent}
`;
      });
      return csv;
    }

    return {
      generated_at: new Date().toISOString(),
      period: { start: startDate.toISOString(), end: endDate.toISOString() },
      metrics,
    };
  }

  // ─── Funnel Analysis ─────────────────────────────────

  async getFunnel(steps: { event: string; filter?: Record<string, any> }[], period: 'day' | 'week' | 'month' = 'day'): Promise<{
    step: string;
    count: number;
    conversionRate: number;
    dropOffRate: number;
  }[]> {
    const { data, error } = await this.client.rpc('mtaa_funnel_analysis', {
      p_steps: steps,
      p_period: period,
    });

    if (error) {
      console.error('[Analytics] Funnel failed:', error.message);
      return [];
    }
    return data || [];
  }

  // ─── Retention ───────────────────────────────────────

  async getRetention(cohortDate: Date, periods: number = 7): Promise<{
    period: number;
    retained: number;
    retentionRate: number;
  }[]> {
    const { data, error } = await this.client.rpc('mtaa_retention_analysis', {
      p_cohort_date: cohortDate.toISOString(),
      p_periods: periods,
    });

    if (error) {
      console.error('[Analytics] Retention failed:', error.message);
      return [];
    }
    return data || [];
  }

  // ─── Event Explorer ──────────────────────────────────

  async queryEvents(options: {
    eventType?: string;
    eventName?: string;
    userId?: string;
    appId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ events: AnalyticsEvent[]; total: number }> {
    let query = this.client.from('analytics_events').select('*', { count: 'exact' });

    if (options.eventType) query = query.eq('event_type', options.eventType);
    if (options.eventName) query = query.eq('event_name', options.eventName);
    if (options.userId) query = query.eq('user_id', options.userId);
    if (options.appId) query = query.eq('app_id', options.appId);
    if (options.startDate) query = query.gte('timestamp', options.startDate.toISOString());
    if (options.endDate) query = query.lte('timestamp', options.endDate.toISOString());

    query = query.order('timestamp', { ascending: false })
      .limit(options.limit || 50)
      .range(options.offset || 0, (options.offset || 0) + (options.limit || 50) - 1);

    const { data, error, count } = await query;
    if (error) { console.error('[Analytics] Event query failed:', error.message); return { events: [], total: 0 }; }
    return { events: data || [], total: count || 0 };
  }

  // ─── Helpers ─────────────────────────────────────────

  getAvailableMetrics(): string[] {
    return Object.keys(DEFAULT_METRICS);
  }

  getMetricConfig(key: string): MetricConfig | undefined {
    return DEFAULT_METRICS[key];
  }
}

// ─── Singleton Export ────────────────────────────────────

let engineInstance: AnalyticsEngine | null = null;

export function getAnalyticsEngine(): AnalyticsEngine {
  if (!engineInstance) {
    const url = process.env.EXPO_PUBLIC_SUPABASE_URL!;
    const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;
    engineInstance = new AnalyticsEngine(url, key);
  }
  return engineInstance;
}

export { AnalyticsEngine };
