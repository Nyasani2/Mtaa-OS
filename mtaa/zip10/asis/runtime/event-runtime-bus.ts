// ============================================================
    // EVENT RUNTIME BUS — System nervous system
    // Cross-module communication, ordered delivery, event replay
    // ============================================================

    import { IEventRuntimeBus } from './interfaces';
    import { RuntimeEvent, EventPriority } from './types';

    export class EventRuntimeBus implements IEventRuntimeBus {
      private listeners: Map<string, Set<(event: RuntimeEvent) => void>> = new Map();
      private oneTimeListeners: Map<string, Set<(event: RuntimeEvent) => void>> = new Map();
      private eventHistory: RuntimeEvent[] = [];
      private maxHistorySize: number = 1000;
      private queue: RuntimeEvent[] = [];
      private processing: boolean = false;

      async emit(event: RuntimeEvent): Promise<void> {
        // Priority queue insertion
        const priorityOrder: Record<EventPriority, number> = { critical: 0, high: 1, normal: 2, low: 3, background: 4 };
        const insertIdx = this.queue.findIndex(e => priorityOrder[e.priority] > priorityOrder[event.priority]);
        if (insertIdx === -1) this.queue.push(event);
        else this.queue.splice(insertIdx, 0, event);

        // Store in history
        this.eventHistory.push(event);
        if (this.eventHistory.length > this.maxHistorySize) {
          this.eventHistory.shift();
        }

        // Process queue
        await this.processQueue();
      }

      on(eventType: string, listener: (event: RuntimeEvent) => void): () => void {
        if (!this.listeners.has(eventType)) this.listeners.set(eventType, new Set());
        this.listeners.get(eventType)!.add(listener);

        return () => {
          this.listeners.get(eventType)?.delete(listener);
        };
      }

      once(eventType: string, listener: (event: RuntimeEvent) => void): () => void {
        if (!this.oneTimeListeners.has(eventType)) this.oneTimeListeners.set(eventType, new Set());
        this.oneTimeListeners.get(eventType)!.add(listener);

        return () => {
          this.oneTimeListeners.get(eventType)?.delete(listener);
        };
      }

      async replay(correlationId: string): Promise<RuntimeEvent[]> {
        return this.eventHistory.filter(e => e.correlationId === correlationId);
      }

      getQueueDepth(): number {
        return this.queue.length;
      }

      private async processQueue(): Promise<void> {
        if (this.processing) return;
        this.processing = true;

        while (this.queue.length > 0) {
          const event = this.queue.shift()!;
          event.processed = true;

          // Notify regular listeners
          const regular = this.listeners.get(event.type) || new Set();
          for (const listener of regular) {
            try {
              listener(event);
              event.listeners.push('regular');
            } catch (err) {
              console.error(`[EventBus] Listener error for ${event.type}:`, err);
            }
          }

          // Notify one-time listeners
          const oneTime = this.oneTimeListeners.get(event.type);
          if (oneTime) {
            for (const listener of oneTime) {
              try {
                listener(event);
                event.listeners.push('one_time');
              } catch (err) {
                console.error(`[EventBus] One-time listener error for ${event.type}:`, err);
              }
            }
            this.oneTimeListeners.delete(event.type);
          }

          // Wildcard listeners (all events)
          const wildcards = this.listeners.get('*') || new Set();
          for (const listener of wildcards) {
            try {
              listener(event);
              event.listeners.push('wildcard');
            } catch (err) {
              console.error(`[EventBus] Wildcard listener error:`, err);
            }
          }
        }

        this.processing = false;
      }
    }
    