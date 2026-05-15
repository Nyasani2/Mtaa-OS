/**
 * MTAA AFRIQ — Messaging Bus Engine (Kernel Layer)
 * Pub/sub, cross-app event routing, channel subscriptions, broadcast
 * Phase: P0 Foundation
 * NO FIREBASE — Supabase Realtime + WebSocket + Postgres LISTEN/NOTIFY
 */

import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { EventEmitter } from 'events';

// ─── Types ─────────────────────────────────────────────────────────

export type MessagePriority = 'critical' | 'high' | 'normal' | 'low';
export type MessageChannel = 
  | 'system' | 'wallet' | 'payment' | 'mtaxi' | 'mtruck' | 'marketplace'
  | 'shop' | 'tribes' | 'jobs' | 'education' | 'health' | 'civic'
  | 'notification' | 'analytics' | 'security' | 'identity';

export interface BusMessage {
  id: string;
  channel: MessageChannel;
  topic: string;                      // e.g. "ride.requested", "payment.completed"
  payload: Record<string, unknown>;
  priority: MessagePriority;
  sender_app: string;               // e.g. "mtaxi", "wallet"
  sender_user_id?: string;
  target_user_id?: string;          // null = broadcast to channel subscribers
  target_app?: string;              // null = all apps
  correlation_id?: string;          // For request/response tracing
  parent_id?: string;               // For threaded messages
  timestamp: string;
  ttl_seconds?: number;             // Time-to-live, 0 = persistent
  delivered_to: string[];           // App IDs that received this
  acknowledged_by: string[];        // Apps that acknowledged
}

export interface ChannelSubscription {
  id: string;
  app_id: string;
  channel: MessageChannel;
  topics: string[];                 // ["*"] = all topics, or ["ride.requested", "ride.completed"]
  user_id?: string;                 // null = system-level subscription
  filter?: Record<string, unknown>; // e.g. { "status": "pending" }
  priority_min?: MessagePriority;
  created_at: string;
  active: boolean;
}

export interface MessageHandler {
  id: string;
  app_id: string;
  channel: MessageChannel;
  topics: string[];
  handler: (message: BusMessage) => Promise<void> | void;
}

export interface BusStats {
  totalMessagesPublished: number;
  totalMessagesDelivered: number;
  activeSubscriptions: number;
  activeChannels: number;
  messagesPerSecond: number;
  avgDeliveryTimeMs: number;
}

// ─── Constants ─────────────────────────────────────────────────────

const DEFAULT_TTL_SECONDS = 86400;   // 24 hours
const MAX_MESSAGE_SIZE_BYTES = 65536; // 64 KB
const DELIVERY_TIMEOUT_MS = 5000;
const RETRY_ATTEMPTS = 3;

const SYSTEM_CHANNELS: MessageChannel[] = [
  'system', 'wallet', 'payment', 'mtaxi', 'mtruck', 'marketplace',
  'shop', 'tribes', 'jobs', 'education', 'health', 'civic',
  'notification', 'analytics', 'security', 'identity',
];

// ─── Messaging Bus Engine Class ────────────────────────────────────

export class MessagingBusEngine extends EventEmitter {
  private supabase: SupabaseClient;
  private realtimeChannels: Map<string, RealtimeChannel> = new Map();
  private localHandlers: Map<string, Set<MessageHandler>> = new Map(); // channel -> handlers
  private messageHistory: Map<string, BusMessage> = new Map(); // id -> message
  private stats: BusStats;
  private isConnected: boolean = false;

  constructor(supabaseUrl: string, supabaseKey: string) {
    super();
    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });
    this.stats = {
      totalMessagesPublished: 0,
      totalMessagesDelivered: 0,
      activeSubscriptions: 0,
      activeChannels: 0,
      messagesPerSecond: 0,
      avgDeliveryTimeMs: 0,
    };
  }

  // ─── Connection ──────────────────────────────────────────────────

  async connect(): Promise<void> {
    if (this.isConnected) return;

    // Subscribe to all system channels via Supabase Realtime
    for (const channel of SYSTEM_CHANNELS) {
      await this.subscribeToPostgresChannel(channel);
    }

    this.isConnected = true;
    this.emit('connected');
    console.log('[Bus] ✅ Connected to all channels');
  }

  disconnect(): void {
    this.realtimeChannels.forEach(ch => ch.unsubscribe());
    this.realtimeChannels.clear();
    this.isConnected = false;
    this.emit('disconnected');
  }

  // ─── Publish ─────────────────────────────────────────────────────

  /**
   * Publish a message to the bus
   * Flow: Validate → Persist → Route → Deliver → Ack track
   */
  async publish(message: Omit<BusMessage, 'id' | 'timestamp' | 'delivered_to' | 'acknowledged_by'>): Promise<string> {
    const messageId = this.generateId();
    const now = new Date().toISOString();

    const fullMessage: BusMessage = {
      ...message,
      id: messageId,
      timestamp: now,
      delivered_to: [],
      acknowledged_by: [],
    };

    // 1. Validate
    this.validateMessage(fullMessage);

    // 2. Persist to database (for replay, audit, offline delivery)
    await this.persistMessage(fullMessage);

    // 3. Route and deliver
    const deliveryStart = Date.now();
    const delivered = await this.routeDelivery(fullMessage);
    const deliveryTime = Date.now() - deliveryStart;

    // 4. Update stats
    this.stats.totalMessagesPublished++;
    this.stats.totalMessagesDelivered += delivered;
    this.stats.avgDeliveryTimeMs = (this.stats.avgDeliveryTimeMs + deliveryTime) / 2;

    // 5. Emit event for local subscribers
    this.emit('message', fullMessage);
    this.emit(`message:${message.channel}`, fullMessage);
    this.emit(`message:${message.channel}:${message.topic}`, fullMessage);

    // 6. Broadcast via Postgres NOTIFY for other server instances
    await this.broadcastViaNotify(fullMessage);

    return messageId;
  }

  /**
   * Publish and wait for response (request/response pattern)
   */
  async publishAndWait(
    message: Omit<BusMessage, 'id' | 'timestamp' | 'delivered_to' | 'acknowledged_by'>,
    timeoutMs: number = 10000
  ): Promise<BusMessage> {
    const correlationId = this.generateId();
    const messageId = await this.publish({
      ...message,
      correlation_id: correlationId,
    });

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.off(`response:${correlationId}`, handler);
        reject(new Error(`Response timeout for correlation ${correlationId}`));
      }, timeoutMs);

      const handler = (response: BusMessage) => {
        clearTimeout(timer);
        this.off(`response:${correlationId}`, handler);
        resolve(response);
      };

      this.on(`response:${correlationId}`, handler);
    });
  }

  // ─── Subscribe ───────────────────────────────────────────────────

  /**
   * Subscribe to a channel/topic
   */
  async subscribe(
    appId: string,
    channel: MessageChannel,
    topics: string[] = ['*'],
    options: { user_id?: string; filter?: Record<string, unknown>; priority_min?: MessagePriority } = {}
  ): Promise<string> {
    const subscriptionId = this.generateId();

    const subscription: ChannelSubscription = {
      id: subscriptionId,
      app_id: appId,
      channel,
      topics,
      user_id: options.user_id,
      filter: options.filter,
      priority_min: options.priority_min,
      created_at: new Date().toISOString(),
      active: true,
    };

    // Persist subscription
    await this.supabase.from('bus_subscriptions').insert(subscription);

    // Subscribe to Supabase Realtime for this channel
    await this.subscribeToPostgresChannel(channel);

    // Update local handler map
    if (!this.localHandlers.has(channel)) {
      this.localHandlers.set(channel, new Set());
    }

    this.stats.activeSubscriptions++;
    this.emit('subscribed', subscription);

    return subscriptionId;
  }

  /**
   * Unsubscribe from a channel
   */
  async unsubscribe(subscriptionId: string): Promise<void> {
    await this.supabase
      .from('bus_subscriptions')
      .update({ active: false })
      .eq('id', subscriptionId);

    this.stats.activeSubscriptions = Math.max(0, this.stats.activeSubscriptions - 1);
    this.emit('unsubscribed', { subscriptionId });
  }

  /**
   * Register a local handler for immediate in-process delivery
   */
  registerHandler(handler: MessageHandler): void {
    const channel = handler.channel;
    if (!this.localHandlers.has(channel)) {
      this.localHandlers.set(channel, new Set());
    }
    this.localHandlers.get(channel)!.add(handler);
  }

  unregisterHandler(handlerId: string): void {
    this.localHandlers.forEach((handlers) => {
      for (const h of handlers) {
        if (h.id === handlerId) handlers.delete(h);
      }
    });
  }

  // ─── Delivery ────────────────────────────────────────────────────

  private async routeDelivery(message: BusMessage): Promise<number> {
    let deliveredCount = 0;

    // 1. Local in-process handlers
    const localHandlers = this.localHandlers.get(message.channel);
    if (localHandlers) {
      for (const handler of localHandlers) {
        if (this.shouldDeliverToHandler(message, handler)) {
          try {
            await Promise.race([
              handler.handler(message),
              new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Handler timeout')), DELIVERY_TIMEOUT_MS)
              ),
            ]);
            deliveredCount++;
            message.delivered_to.push(handler.app_id);
          } catch (err) {
            this.emit('handler_error', { messageId: message.id, handlerId: handler.id, error: err });
          }
        }
      }
    }

    // 2. Database subscribers (other instances, edge functions)
    const { data: subscribers } = await this.supabase
      .from('bus_subscriptions')
      .select('*')
      .eq('channel', message.channel)
      .eq('active', true);

    if (subscribers) {
      for (const sub of subscribers) {
        if (this.shouldDeliverToSubscriber(message, sub)) {
          // Send via Supabase Realtime broadcast
          const realtimeChannel = this.realtimeChannels.get(message.channel);
          if (realtimeChannel) {
            realtimeChannel.send({
              type: 'broadcast',
              event: message.topic,
              payload: message,
            });
            deliveredCount++;
            message.delivered_to.push(sub.app_id);
          }
        }
      }
    }

    // 3. Targeted user delivery (if target_user_id specified)
    if (message.target_user_id) {
      await this.deliverToUser(message.target_user_id, message);
      deliveredCount++;
    }

    // 4. Targeted app delivery (if target_app specified)
    if (message.target_app && !message.target_user_id) {
      await this.deliverToApp(message.target_app, message);
      deliveredCount++;
    }

    // Update delivered_to in database
    await this.supabase
      .from('bus_messages')
      .update({ delivered_to: message.delivered_to })
      .eq('id', message.id);

    return deliveredCount;
  }

  private shouldDeliverToHandler(message: BusMessage, handler: MessageHandler): boolean {
    // Topic match
    if (!handler.topics.includes('*') && !handler.topics.includes(message.topic)) {
      return false;
    }
    // App filter
    if (message.target_app && message.target_app !== handler.app_id) {
      return false;
    }
    return true;
  }

  private shouldDeliverToSubscriber(message: BusMessage, sub: ChannelSubscription): boolean {
    // Topic match
    if (!sub.topics.includes('*') && !sub.topics.includes(message.topic)) {
      return false;
    }
    // User filter
    if (message.target_user_id && sub.user_id && sub.user_id !== message.target_user_id) {
      return false;
    }
    // Priority filter
    if (sub.priority_min) {
      const priorityOrder = { critical: 4, high: 3, normal: 2, low: 1 };
      if (priorityOrder[message.priority] < priorityOrder[sub.priority_min]) {
        return false;
      }
    }
    // Custom filter
    if (sub.filter && message.payload) {
      for (const [key, value] of Object.entries(sub.filter)) {
        if (message.payload[key] !== value) return false;
      }
    }
    return true;
  }

  // ─── Postgres NOTIFY Bridge ────────────────────────────────────

  private async broadcastViaNotify(message: BusMessage): Promise<void> {
    // Use Supabase RPC to trigger Postgres NOTIFY
    await this.supabase.rpc('bus_notify', {
      p_channel: message.channel,
      p_topic: message.topic,
      p_payload: JSON.stringify(message),
    });
  }

  private async subscribeToPostgresChannel(channel: MessageChannel): Promise<void> {
    if (this.realtimeChannels.has(channel)) return;

    const realtimeChannel = this.supabase
      .channel(`bus:${channel}`)
      .on('broadcast', { event: '*' }, (payload) => {
        const message = payload.payload as BusMessage;
        this.emit('message', message);
        this.emit(`message:${channel}`, message);
        this.emit(`message:${channel}:${message.topic}`, message);

        // Trigger local handlers
        const handlers = this.localHandlers.get(channel);
        if (handlers) {
          handlers.forEach(h => {
            if (this.shouldDeliverToHandler(message, h)) {
              h.handler(message).catch(err => {
                this.emit('handler_error', { messageId: message.id, handlerId: h.id, error: err });
              });
            }
          });
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`[Bus] ✅ Subscribed to channel: ${channel}`);
        }
      });

    this.realtimeChannels.set(channel, realtimeChannel);
  }

  // ─── User/App Delivery ─────────────────────────────────────────

  private async deliverToUser(userId: string, message: BusMessage): Promise<void> {
    // Insert into user-specific inbox for offline retrieval
    await this.supabase.from('user_message_inbox').insert({
      id: this.generateId(),
      user_id: userId,
      message_id: message.id,
      channel: message.channel,
      topic: message.topic,
      payload: message.payload,
      read: false,
      created_at: new Date().toISOString(),
    });
  }

  private async deliverToApp(appId: string, message: BusMessage): Promise<void> {
    // Insert into app-specific queue
    await this.supabase.from('app_message_queue').insert({
      id: this.generateId(),
      app_id: appId,
      message_id: message.id,
      channel: message.channel,
      topic: message.topic,
      payload: message.payload,
      processed: false,
      created_at: new Date().toISOString(),
    });
  }

  // ─── Acknowledgment ──────────────────────────────────────────────

  async acknowledge(messageId: string, appId: string): Promise<void> {
    const { data: message } = await this.supabase
      .from('bus_messages')
      .select('acknowledged_by')
      .eq('id', messageId)
      .single();

    if (message) {
      const acknowledged = [...(message.acknowledged_by || []), appId];
      await this.supabase
        .from('bus_messages')
        .update({ acknowledged_by: acknowledged })
        .eq('id', messageId);

      this.emit('acknowledged', { messageId, appId });
    }
  }

  // ─── Replay / History ────────────────────────────────────────────

  async replayMessages(
    channel: MessageChannel,
    options: { since?: string; topics?: string[]; limit?: number } = {}
  ): Promise<BusMessage[]> {
    let query = this.supabase
      .from('bus_messages')
      .select('*')
      .eq('channel', channel)
      .order('timestamp', { ascending: false });

    if (options.since) query = query.gte('timestamp', options.since);
    if (options.topics?.length) query = query.in('topic', options.topics);
    if (options.limit) query = query.limit(options.limit);

    const { data } = await query;
    return data || [];
  }

  // ─── Stats ─────────────────────────────────────────────────────

  getStats(): BusStats {
    return { ...this.stats, activeChannels: this.realtimeChannels.size };
  }

  async getChannelStats(channel: MessageChannel): Promise<{
    messagesLastHour: number;
    avgDeliveryTime: number;
    activeSubscribers: number;
    topTopics: { topic: string; count: number }[];
  }> {
    const hourAgo = new Date(Date.now() - 3600000).toISOString();

    const { data: messages } = await this.supabase
      .from('bus_messages')
      .select('*')
      .eq('channel', channel)
      .gte('timestamp', hourAgo);

    const { data: subscribers } = await this.supabase
      .from('bus_subscriptions')
      .select('*')
      .eq('channel', channel)
      .eq('active', true);

    const topicCounts: Record<string, number> = {};
    (messages || []).forEach(m => {
      topicCounts[m.topic] = (topicCounts[m.topic] || 0) + 1;
    });

    const topTopics = Object.entries(topicCounts)
      .map(([topic, count]) => ({ topic, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      messagesLastHour: messages?.length || 0,
      avgDeliveryTime: this.stats.avgDeliveryTimeMs,
      activeSubscribers: subscribers?.length || 0,
      topTopics,
    };
  }

  // ─── Cleanup ───────────────────────────────────────────────────

  async cleanupExpiredMessages(maxAgeHours: number = 24): Promise<number> {
    const cutoff = new Date(Date.now() - maxAgeHours * 3600000).toISOString();
    const { error } = await this.supabase
      .from('bus_messages')
      .delete()
      .lt('timestamp', cutoff)
      .eq('ttl_seconds', 0);

    if (error) throw error;
    return 0; // Return actual count from RPC
  }

  // ─── Helpers ─────────────────────────────────────────────────────

  private validateMessage(message: BusMessage): void {
    if (!message.channel || !message.topic) {
      throw new Error('Message must have channel and topic');
    }
    const size = JSON.stringify(message.payload).length;
    if (size > MAX_MESSAGE_SIZE_BYTES) {
      throw new Error(`Message payload exceeds ${MAX_MESSAGE_SIZE_BYTES} bytes`);
    }
  }

  private async persistMessage(message: BusMessage): Promise<void> {
    const ttl = message.ttl_seconds ?? DEFAULT_TTL_SECONDS;
    const expiresAt = ttl > 0
      ? new Date(Date.now() + ttl * 1000).toISOString()
      : null;

    await this.supabase.from('bus_messages').insert({
      ...message,
      expires_at: expiresAt,
    });
  }

  private generateId(): string {
    return `bus_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// ─── Singleton Export ────────────────────────────────────────────

let busInstance: MessagingBusEngine | null = null;

export function getMessagingBusEngine(): MessagingBusEngine {
  if (!busInstance) {
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    busInstance = new MessagingBusEngine(supabaseUrl, supabaseKey);
  }
  return busInstance;
}

export { MessagingBusEngine };
