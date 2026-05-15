/**
 * MTAA OS — National Realtime Layer
 * ONLY deployed after kernel stabilization.
 *
 * Streams:
 *   - ER live queue streaming
 *   - treasury live monitoring
 *   - tax event streaming
 *   - fleet realtime control
 *   - civic emergency alerts
 */

import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { KernelEventSystem, KernelEvent } from '../events/kernel-event-system';

export type NationalStreamType =
  | 'health.er_queue'
  | 'treasury.live_monitor'
  | 'revenue.tax_events'
  | 'fleet.control'
  | 'civic.emergency_alerts'
  | 'civic.project_updates'
  | 'wallet.transactions';

export interface NationalStreamConfig {
  type: NationalStreamType;
  filter?: Record<string, unknown>;
  bufferSize?: number;
  throttleMs?: number;
}

export interface StreamPacket<T = unknown> {
  streamType: NationalStreamType;
  timestamp: number;
  sequence: number;
  payload: T;
  source: string;
  priority: 'low' | 'normal' | 'high' | 'critical';
}

export class NationalRealtimeLayer {
  private supabase: SupabaseClient;
  private eventSystem: KernelEventSystem;
  private channels: Map<NationalStreamType, RealtimeChannel> = new Map();
  private buffers: Map<NationalStreamType, StreamPacket[]> = new Map();
  private sequenceCounters: Map<NationalStreamType, number> = new Map();
  private isActive = false;

  constructor(supabaseUrl: string, supabaseKey: string, eventSystem: KernelEventSystem) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.eventSystem = eventSystem;
  }

  async activate(): Promise<void> {
    if (this.isActive) return;
    this.isActive = true;

    // Initialize all national streams
    await this._initStream('health.er_queue', 'health_emergency_queue');
    await this._initStream('treasury.live_monitor', 'treasury_transactions');
    await this._initStream('revenue.tax_events', 'revenue_payments');
    await this._initStream('fleet.control', 'fleet_positions');
    await this._initStream('civic.emergency_alerts', 'civic_emergencies');
    await this._initStream('civic.project_updates', 'civic_projects');
    await this._initStream('wallet.transactions', 'wallet_transactions');

    this.eventSystem.publish({
      domain: 'kernel',
      type: 'kernel.national_realtime.activated',
      payload: { streams: Array.from(this.channels.keys()) },
      priority: 'high',
      sourceModule: 'kernel.national_realtime',
    });
  }

  deactivate(): void {
    this.isActive = false;
    this.channels.forEach((ch) => ch.unsubscribe());
    this.channels.clear();
    this.buffers.clear();
  }

  getStreamBuffer(type: NationalStreamType): StreamPacket[] {
    return [...(this.buffers.get(type) || [])];
  }

  subscribeToStream<T>(
    type: NationalStreamType,
    handler: (packet: StreamPacket<T>) => void
  ): () => void {
    // Also bridge to kernel event system
    return this.eventSystem.subscribe({
      id: `national-stream-${type}-${Date.now()}`,
      domain: this._mapToDomain(type),
      handler: (event: KernelEvent) => {
        const packet: StreamPacket<T> = {
          streamType: type,
          timestamp: event.timestamp,
          sequence: this._nextSequence(type),
          payload: event.payload as T,
          source: event.sourceModule,
          priority: event.priority as StreamPacket['priority'],
        };
        handler(packet);
      },
    });
  }

  private async _initStream(type: NationalStreamType, tableName: string): Promise<void> {
    const channel = this.supabase.channel(`national-${type}`);

    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: tableName },
      (payload: any) => {
        const packet: StreamPacket = {
          streamType: type,
          timestamp: Date.now(),
          sequence: this._nextSequence(type),
          payload: payload.new || payload.old,
          source: tableName,
          priority: this._inferPriority(type, payload),
        };

        this._bufferPacket(type, packet);

        // Bridge to kernel event system
        this.eventSystem.publish({
          domain: this._mapToDomain(type),
          type: `national.${type}.update`,
          payload: packet.payload,
          priority: packet.priority,
          sourceModule: 'kernel.national_realtime',
        });
      }
    );

    await channel.subscribe();
    this.channels.set(type, channel);
    this.buffers.set(type, []);
    this.sequenceCounters.set(type, 0);
  }

  private _bufferPacket(type: NationalStreamType, packet: StreamPacket): void {
    const buffer = this.buffers.get(type)!;
    buffer.push(packet);
    if (buffer.length > 1000) buffer.shift();
  }

  private _nextSequence(type: NationalStreamType): number {
    const current = this.sequenceCounters.get(type) || 0;
    this.sequenceCounters.set(type, current + 1);
    return current + 1;
  }

  private _mapToDomain(type: NationalStreamType): any {
    const map: Record<NationalStreamType, string> = {
      'health.er_queue': 'health',
      'treasury.live_monitor': 'treasury',
      'revenue.tax_events': 'revenue',
      'fleet.control': 'mtaxi',
      'civic.emergency_alerts': 'civic',
      'civic.project_updates': 'civic',
      'wallet.transactions': 'wallet',
    };
    return map[type];
  }

  private _inferPriority(type: NationalStreamType, payload: any): StreamPacket['priority'] {
    if (type === 'civic.emergency_alerts') return 'critical';
    if (type === 'health.er_queue' && payload.new?.severity === 'critical') return 'critical';
    if (type === 'fleet.control' && payload.new?.alert === true) return 'high';
    return 'normal';
  }
}

export default NationalRealtimeLayer;
