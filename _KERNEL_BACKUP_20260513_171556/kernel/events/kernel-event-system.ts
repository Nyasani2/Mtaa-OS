/**
 * MTAA OS — Unified Kernel Event System
 * Single canonical event layer. All realtime communication flows here.
 * Replaces: event-bus/, events/, messaging-bus-engine.ts
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

// ─── TYPES ────────────────────────────────────────────────

export type KernelEventDomain =
  | 'kernel'
  | 'civic'
  | 'wallet'
  | 'health'
  | 'treasury'
  | 'revenue'
  | 'mtaxi'
  | 'mtruck'
  | 'streets'
  | 'hookup'
  | 'tribes'
  | 'shop'
  | 'marketplace'
  | 'jobs'
  | 'education'
  | 'appstore'
  | 'search'
  | 'analytics'
  | 'messaging'
  | 'ads';

export type KernelEventPriority = 'critical' | 'high' | 'normal' | 'low' | 'background';

export interface KernelEvent<T = unknown> {
  id: string;
  domain: KernelEventDomain;
  type: string;
  payload: T;
  priority: KernelEventPriority;
  timestamp: number;
  traceId: string;
  sourceModule: string;
  targetModules?: string[];
  ttl?: number; // ms, auto-expire
}

export interface KernelEventSubscription {
  id: string;
  domain: KernelEventDomain | KernelEventDomain[];
  types?: string[];
  handler: (event: KernelEvent) => void | Promise<void>;
  priority?: KernelEventPriority;
  once?: boolean;
}

export interface KernelEventBusConfig {
  supabaseUrl: string;
  supabaseKey: string;
  localBufferSize?: number;
  enableRealtime?: boolean;
  enablePersistence?: boolean;
}

// ─── SINGLETON ──────────────────────────────────────────────

let _instance: KernelEventSystem | null = null;

export class KernelEventSystem {
  private supabase: SupabaseClient;
  private subscriptions: Map<string, KernelEventSubscription> = new Map();
  private buffer: KernelEvent[] = [];
  private listeners: Map<string, Set<(event: KernelEvent) => void>> = new Map();
  private realtimeChannels: Map<string, any> = new Map();
  private config: KernelEventBusConfig;
  private isBooted = false;
  private metrics = { published: 0, delivered: 0, dropped: 0, errors: 0 };

  constructor(config: KernelEventBusConfig) {
    this.config = {
      localBufferSize: 1000,
      enableRealtime: true,
      enablePersistence: true,
      ...config,
    };
    this.supabase = createClient(config.supabaseUrl, config.supabaseKey);
  }

  static getInstance(config?: KernelEventBusConfig): KernelEventSystem {
    if (!_instance) {
      if (!config) throw new Error('KernelEventSystem requires config on first init');
      _instance = new KernelEventSystem(config);
    }
    return _instance;
  }

  static reset(): void {
    if (_instance) {
      _instance.destroy();
      _instance = null;
    }
  }

  // ─── BOOT / LIFECYCLE ───────────────────────────────────

  async boot(): Promise<void> {
    if (this.isBooted) return;
    this.isBooted = true;

    if (this.config.enableRealtime) {
      await this._initRealtimeBroadcast();
    }

    this._startBufferFlush();
    this._emit({ domain: 'kernel', type: 'kernel.event_system.booted', payload: {} });
  }

  destroy(): void {
    this.realtimeChannels.forEach((ch) => ch.unsubscribe());
    this.realtimeChannels.clear();
    this.subscriptions.clear();
    this.listeners.clear();
    this.buffer = [];
    this.isBooted = false;
  }

  // ─── PUBLISH ──────────────────────────────────────────────

  publish<T>(event: Omit<KernelEvent<T>, 'id' | 'timestamp' | 'traceId'> & { traceId?: string }): string {
    const fullEvent: KernelEvent<T> = {
      id: this._generateId(),
      timestamp: Date.now(),
      traceId: event.traceId || this._generateTraceId(),
      ...event,
    } as KernelEvent<T>;

    this.buffer.push(fullEvent);
    this.metrics.published++;

    // Local delivery
    this._deliverLocal(fullEvent);

    // Persist if enabled
    if (this.config.enablePersistence) {
      this._persistEvent(fullEvent).catch(() => this.metrics.errors++);
    }

    // Broadcast if realtime
    if (this.config.enableRealtime) {
      this._broadcast(fullEvent).catch(() => this.metrics.errors++);
    }

    // TTL cleanup
    if (fullEvent.ttl) {
      setTimeout(() => this._expireEvent(fullEvent.id), fullEvent.ttl);
    }

    return fullEvent.id;
  }

  // ─── SUBSCRIBE ────────────────────────────────────────────

  subscribe(sub: KernelEventSubscription): () => void {
    this.subscriptions.set(sub.id, sub);

    // Register typed listener
    const key = this._listenerKey(sub.domain, sub.types);
    if (!this.listeners.has(key)) this.listeners.set(key, new Set());
    this.listeners.get(key)!.add(sub.handler);

    // Auto-subscribe to Supabase realtime for this domain
    if (this.config.enableRealtime) {
      this._subscribeDomainRealtime(sub.domain);
    }

    return () => this.unsubscribe(sub.id);
  }

  unsubscribe(subId: string): void {
    const sub = this.subscriptions.get(subId);
    if (!sub) return;

    const key = this._listenerKey(sub.domain, sub.types);
    const set = this.listeners.get(key);
    if (set) {
      set.delete(sub.handler);
      if (set.size === 0) this.listeners.delete(key);
    }

    this.subscriptions.delete(subId);
  }

  // ─── QUERY / HISTORY ──────────────────────────────────────

  async queryEvents(filters: {
    domain?: KernelEventDomain;
    type?: string;
    since?: number;
    limit?: number;
  }): Promise<KernelEvent[]> {
    let query = this.supabase.from('kernel_events').select('*').order('timestamp', { ascending: false });

    if (filters.domain) query = query.eq('domain', filters.domain);
    if (filters.type) query = query.eq('type', filters.type);
    if (filters.since) query = query.gte('timestamp', filters.since);
    if (filters.limit) query = query.limit(filters.limit);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  // ─── METRICS ──────────────────────────────────────────────

  getMetrics() {
    return { ...this.metrics, subscriptionCount: this.subscriptions.size, bufferSize: this.buffer.length };
  }

  // ─── INTERNALS ────────────────────────────────────────────

  private _deliverLocal(event: KernelEvent): void {
    const keys = [
      this._listenerKey(event.domain, [event.type]),
      this._listenerKey(event.domain, undefined),
      this._listenerKey('*', undefined),
    ];

    for (const key of keys) {
      const handlers = this.listeners.get(key);
      if (!handlers) continue;
      for (const handler of handlers) {
        try {
          handler(event);
          this.metrics.delivered++;
        } catch (err) {
          this.metrics.errors++;
          this.publish({
            domain: 'kernel',
            type: 'kernel.event_delivery.error',
            payload: { eventId: event.id, error: String(err) },
            priority: 'critical',
            sourceModule: 'kernel.event_system',
          });
        }
      }
    }
  }

  private async _persistEvent(event: KernelEvent): Promise<void> {
    const { error } = await this.supabase.from('kernel_events').insert({
      id: event.id,
      domain: event.domain,
      type: event.type,
      payload: event.payload,
      priority: event.priority,
      timestamp: event.timestamp,
      trace_id: event.traceId,
      source_module: event.sourceModule,
      target_modules: event.targetModules,
    });
    if (error) throw error;
  }

  private async _broadcast(event: KernelEvent): Promise<void> {
    await this.supabase.channel('kernel-events').send({
      type: 'broadcast',
      event: 'kernel.event',
      payload: event,
    });
  }

  private async _initRealtimeBroadcast(): Promise<void> {
    const channel = this.supabase.channel('kernel-events');
    channel.on('broadcast', { event: 'kernel.event' }, (msg: { payload: KernelEvent }) => {
      this._deliverLocal(msg.payload);
    });
    await channel.subscribe();
    this.realtimeChannels.set('kernel-events', channel);
  }

  private _subscribeDomainRealtime(domain: KernelEventDomain | KernelEventDomain[]): void {
    const domains = Array.isArray(domain) ? domain : [domain];
    for (const d of domains) {
      if (this.realtimeChannels.has(`domain-${d}`)) continue;

      const channel = this.supabase.channel(`domain-${d}`);
      channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'kernel_events', filter: `domain=eq.${d}` },
        (payload: RealtimePostgresChangesPayload<any>) => {
          if (payload.new) this._deliverLocal(payload.new as KernelEvent);
        }
      );
      channel.subscribe();
      this.realtimeChannels.set(`domain-${d}`, channel);
    }
  }

  private _startBufferFlush(): void {
    setInterval(() => {
      if (this.buffer.length > (this.config.localBufferSize || 1000)) {
        this.buffer = this.buffer.slice(-(this.config.localBufferSize || 1000));
        this.metrics.dropped++;
      }
    }, 5000);
  }

  private _expireEvent(eventId: string): void {
    this.buffer = this.buffer.filter((e) => e.id !== eventId);
  }

  private _listenerKey(domain: KernelEventDomain | '*', types?: string[]): string {
    const d = Array.isArray(domain) ? domain.join(',') : domain;
    return types ? `${d}:${types.join(',')}` : `${d}:*`;
  }

  private _generateId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }

  private _generateTraceId(): string {
    return `trc_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }
}

// ─── BACKWARD COMPATIBILITY EXPORTS ─────────────────────────

/** @deprecated Use KernelEventSystem.getInstance() */
export const getEventBus = KernelEventSystem.getInstance.bind(KernelEventSystem);

/** @deprecated Use KernelEventSystem */
export const EventBus = KernelEventSystem;

export default KernelEventSystem;
