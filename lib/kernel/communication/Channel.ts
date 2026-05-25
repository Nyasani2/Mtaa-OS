export type ChannelType = 'kernel' | 'business' | 'wallet' | 'notification' | 'asis' | 'analytics';

export interface ChannelMessage<T = unknown> {
  id: string;
  channel: ChannelType;
  topic: string;
  payload: T;
  timestamp: number;
  source: string;
  priority: 'low' | 'normal' | 'high' | 'critical';
  traceId: string;
}

export interface ChannelSubscription {
  id: string;
  channel: ChannelType;
  topic: string;
  handler: (message: ChannelMessage) => void | Promise<void>;
  filter?: (message: ChannelMessage) => boolean;
}

export class Channel {
  private static instance: Channel;
  private subscriptions: Map<string, ChannelSubscription[]> = new Map();
  private messageLog: ChannelMessage[] = [];
  private maxLogSize = 1000;

  static getInstance(): Channel {
    if (!Channel.instance) Channel.instance = new Channel();
    return Channel.instance;
  }

  publish<T>(
    channel: ChannelType,
    topic: string,
    payload: T,
    options: {
      source: string;
      priority?: 'low' | 'normal' | 'high' | 'critical';
      traceId?: string;
    }
  ): void {
    if (options.source.startsWith('asis') && ['kernel', 'business', 'wallet'].includes(channel)) {
      throw new Error(`ASIS blocked: Cannot publish to ${channel} channel`);
    }

    const message: ChannelMessage<T> = {
      id: `${channel}:${topic}:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`,
      channel, topic, payload,
      timestamp: Date.now(),
      source: options.source,
      priority: options.priority || 'normal',
      traceId: options.traceId || this.generateTraceId(),
    };

    this.messageLog.push(message);
    if (this.messageLog.length > this.maxLogSize) this.messageLog.shift();

    const key = `${channel}:${topic}`;
    const subs = this.subscriptions.get(key) || [];
    subs.forEach(sub => {
      if (sub.filter && !sub.filter(message)) return;
      try { sub.handler(message); } catch (err) { console.error(`[Channel] Handler error:`, err); }
    });

    const wildcardSubs = this.subscriptions.get(`${channel}:*`) || [];
    wildcardSubs.forEach(sub => {
      if (sub.filter && !sub.filter(message)) return;
      try { sub.handler(message); } catch (err) { console.error(`[Channel] Wildcard error:`, err); }
    });
  }

  subscribe(
    channel: ChannelType,
    topic: string,
    handler: (message: ChannelMessage) => void | Promise<void>,
    options?: { filter?: (message: ChannelMessage) => boolean; source: string; }
  ): () => void {
    const subId = `${channel}:${topic}:${Date.now()}:${Math.random().toString(36).substr(2, 5)}`;
    const sub: ChannelSubscription = { id: subId, channel, topic, handler, filter: options?.filter };
    const key = `${channel}:${topic}`;
    const existing = this.subscriptions.get(key) || [];
    existing.push(sub);
    this.subscriptions.set(key, existing);
    return () => {
      const updated = (this.subscriptions.get(key) || []).filter(s => s.id !== subId);
      this.subscriptions.set(key, updated);
    };
  }

  getLog(channel?: ChannelType, limit = 100): ChannelMessage[] {
    let logs = this.messageLog;
    if (channel) logs = logs.filter(m => m.channel === channel);
    return logs.slice(-limit);
  }

  private generateTraceId(): string {
    return `trace-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const channel = Channel.getInstance();
