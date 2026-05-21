// lib/kernel/services/telemetry.service.ts
import { supabase } from '@/lib/supabase';

export interface TelemetryEvent {
  event_type: string;
  event_name: string;
  user_id?: string;
  session_id?: string;
  properties?: Record<string, any>;
  timestamp?: string;
}

export interface PerformanceMetric {
  metric_name: string;
  value: number;
  unit: string;
  tags?: Record<string, string>;
  timestamp?: string;
}

export class TelemetryService {
  private static sessionId: string = '';
  private static buffer: TelemetryEvent[] = [];
  private static flushInterval: NodeJS.Timeout | null = null;

  static init() {
    this.sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.flushInterval = setInterval(() => this.flush(), 30000); // Flush every 30s
    console.log('[Telemetry] Session started:', this.sessionId);
  }

  static track(event: TelemetryEvent) {
    const enriched = {
      ...event,
      session_id: this.sessionId,
      timestamp: event.timestamp || new Date().toISOString(),
    };
    this.buffer.push(enriched);

    // Flush immediately for critical events
    if (['error', 'crash', 'security_alert'].includes(event.event_type)) {
      this.flush();
    }
  }

  static async flush() {
    if (this.buffer.length === 0) return;

    const events = [...this.buffer];
    this.buffer = [];

    try {
      const { error } = await supabase.from('kernel_events').insert(
        events.map(e => ({
          event_type: e.event_type,
          event_data: e,
          severity: e.event_type === 'error' ? 'error' : 'info',
        }))
      );
      if (error) {
        console.error('[Telemetry] Flush failed:', error);
        // Re-buffer failed events
        this.buffer.unshift(...events);
      }
    } catch (err) {
      console.error('[Telemetry] Flush exception:', err);
      this.buffer.unshift(...events);
    }
  }

  static async trackMetric(metric: PerformanceMetric) {
    try {
      await supabase.from('kernel_health_snapshots').insert({
        metric_name: metric.metric_name,
        metric_value: metric.value,
        unit: metric.unit,
        tags: metric.tags || {},
        recorded_at: metric.timestamp || new Date().toISOString(),
      });
    } catch (err) {
      console.error('[Telemetry] Metric failed:', err);
    }
  }

  static pageView(page: string, properties?: Record<string, any>) {
    this.track({
      event_type: 'page_view',
      event_name: `page_${page}`,
      properties: { page, ...properties },
    });
  }

  static error(error: Error, context?: string) {
    this.track({
      event_type: 'error',
      event_name: error.name,
      properties: {
        message: error.message,
        stack: error.stack,
        context,
      },
    });
  }

  static userAction(action: string, properties?: Record<string, any>) {
    this.track({
      event_type: 'user_action',
      event_name: action,
      properties,
    });
  }

  static destroy() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
    this.flush();
  }
}
