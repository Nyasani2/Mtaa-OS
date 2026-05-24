/**
 * ASIS Event Bus
 * Typed, async, priority-aware event system for OS-wide coordination
 */

export interface ASISEvent {
  type: string;
  payload: any;
  timestamp: number;
  source: string;
  priority: 'low' | 'normal' | 'high' | 'critical';
  id: string;
}

export type ASISEventHandler = (event: ASISEvent) => void | Promise<void>;

export interface EventSubscription {
  id: string;
  type: string;
  handler: ASISEventHandler;
  priority: 'low' | 'normal' | 'high' | 'critical';
  once: boolean;
}

export class ASISEventBus {
  private _subscriptions: Map<string, EventSubscription[]> = new Map();
  private _history: ASISEvent[] = [];
  private _maxHistory: number = 1000;
  private _middleware: Array<(event: ASISEvent) => ASISEvent | null> = [];
  private _initialized: boolean = false;
  private _stats = {
    eventsEmitted: 0,
    eventsHandled: 0,
    errors: 0,
  };

  async initialize(): Promise<void> {
    this._subscriptions = new Map();
    this._history = [];
    this._initialized = true;
    console.log('[ASIS:EventBus] Initialized');
  }

  async shutdown(): Promise<void> {
    this._subscriptions.clear();
    this._history = [];
    this._initialized = false;
    console.log('[ASIS:EventBus] Shutdown');
  }

  get isInitialized(): boolean {
    return this._initialized;
  }

  use(middleware: (event: ASISEvent) => ASISEvent | null): void {
    this._middleware.push(middleware);
  }

  on(
    type: string,
    handler: ASISEventHandler,
    options?: { priority?: 'low' | 'normal' | 'high' | 'critical'; once?: boolean }
  ): () => void {
    if (!this._initialized) {
      throw new Error('EventBus not initialized');
    }

    const subscription: EventSubscription = {
      id: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      handler,
      priority: options?.priority || 'normal',
      once: options?.once || false,
    };

    if (!this._subscriptions.has(type)) {
      this._subscriptions.set(type, []);
    }
    this._subscriptions.get(type)!.push(subscription);

    return () => this.off(subscription.id);
  }

  once(type: string, handler: ASISEventHandler): () => void {
    return this.on(type, handler, { once: true });
  }

  off(subscriptionId: string): void {
    for (const [type, subs] of this._subscriptions.entries()) {
      const filtered = subs.filter((s) => s.id !== subscriptionId);
      if (filtered.length === 0) {
        this._subscriptions.delete(type);
      } else {
        this._subscriptions.set(type, filtered);
      }
    }
  }

  emit(type: string, payload: any, options?: { priority?: 'low' | 'normal' | 'high' | 'critical'; source?: string }): void {
    if (!this._initialized) {
      throw new Error('EventBus not initialized');
    }

    let event: ASISEvent = {
      type,
      payload,
      timestamp: Date.now(),
      source: options?.source || 'asis',
      priority: options?.priority || 'normal',
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };

    for (const mw of this._middleware) {
      event = mw(event) as ASISEvent;
      if (!event) return;
    }

    this._stats.eventsEmitted++;
    this._history.push(event);
    if (this._history.length > this._maxHistory) {
      this._history.shift();
    }

    const handlers = this._subscriptions.get(type) || [];
    const sortedHandlers = [...handlers].sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, normal: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    for (const sub of sortedHandlers) {
      try {
        Promise.resolve(sub.handler(event)).catch((err) => {
          this._stats.errors++;
          console.error(`[ASIS:EventBus] Handler error for ${type}:`, err);
        });

        if (sub.once) {
          this.off(sub.id);
        }
      } catch (err) {
        this._stats.errors++;
        console.error(`[ASIS:EventBus] Sync handler error for ${type}:`, err);
      }
    }

    this._stats.eventsHandled += handlers.length;
  }

  waitFor(type: string, timeoutMs: number = 5000): Promise<ASISEvent> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        unsubscribe();
        reject(new Error(`Timeout waiting for event: ${type}`));
      }, timeoutMs);

      const unsubscribe = this.once(type, (event) => {
        clearTimeout(timer);
        resolve(event);
      });
    });
  }

  getHistory(type?: string, limit: number = 100): ASISEvent[] {
    let filtered = this._history;
    if (type) {
      filtered = filtered.filter((e) => e.type === type);
    }
    return filtered.slice(-limit);
  }

  getStats() {
    return { ...this._stats };
  }

  broadcast(payload: any): void {
    this.emit('asis:broadcast', payload, { priority: 'normal', source: 'system' });
  }
}
