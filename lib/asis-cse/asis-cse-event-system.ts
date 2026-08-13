// @ts-nocheck
/**
 * ASIS CSE — Event System
 * Decoupled nervous system for inter-engine communication
 * Pub/sub with typed events, priority queues, and correlation tracking
 */

import { v4 as uuidv4 } from 'uuid';

export interface CognitiveEvent {
  id: string;
  type: CognitiveEventType;
  payload: any;
  timestamp: number;
  source: string;
  priority: EventPriority;
  correlationId?: string;
}

export enum CognitiveEventType {
  CYCLE_START = 'CYCLE_START',
  CYCLE_END = 'CYCLE_END',
  ENGINE_START = 'ENGINE_START',
  ENGINE_COMPLETE = 'ENGINE_COMPLETE',
  ENGINE_ERROR = 'ENGINE_ERROR',
  FEEDBACK_TRIGGER = 'FEEDBACK_TRIGGER',
  REFLECTION_TRIGGER = 'REFLECTION_TRIGGER',
  LEARNING_TRIGGER = 'LEARNING_TRIGGER',
  ADAPTATION_TRIGGER = 'ADAPTATION_TRIGGER',
  WISDOM_CHECK = 'WISDOM_CHECK',
  SECURITY_ALERT = 'SECURITY_ALERT',
  OBSERVATION_CAPTURED = 'OBSERVATION_CAPTURED',
  EVIDENCE_VALIDATED = 'EVIDENCE_VALIDATED',
  KNOWLEDGE_UPDATED = 'KNOWLEDGE_UPDATED',
  UNDERSTANDING_FORMED = 'UNDERSTANDING_FORMED',
  REASONING_COMPLETE = 'REASONING_COMPLETE',
  DECISION_MADE = 'DECISION_MADE',
  ACTION_EXECUTED = 'ACTION_EXECUTED',
  SIMULATION_RUN = 'SIMULATION_RUN',
  PLAN_CREATED = 'PLAN_CREATED',
  COLLECTIVE_SYNC = 'COLLECTIVE_SYNC',
  EVOLUTION_REQUEST = 'EVOLUTION_REQUEST',
  HEALTH_CHECK = 'HEALTH_CHECK',
  METRICS_SNAPSHOT = 'METRICS_SNAPSHOT',
  CONTEXT_UPDATED = 'CONTEXT_UPDATED',
  CLOCK_TICK = 'CLOCK_TICK',
  DIAGNOSTIC_ALERT = 'DIAGNOSTIC_ALERT',
}

export enum EventPriority {
  CRITICAL = 0,
  HIGH = 1,
  NORMAL = 2,
  LOW = 3,
  BACKGROUND = 4,
}

export type EventHandler = (event: CognitiveEvent) => void | Promise<void>;

export class CognitiveEventBus {
  private handlers: Map<CognitiveEventType, Set<EventHandler>> = new Map();
  private queue: CognitiveEvent[] = [];
  private processing = false;
  private history: CognitiveEvent[] = [];
  private maxHistory = 1000;

  subscribe(type: CognitiveEventType, handler: EventHandler): () => void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    this.handlers.get(type)!.add(handler);
    return () => this.handlers.get(type)?.delete(handler);
  }

  subscribeMany(
    types: CognitiveEventType[],
    handler: EventHandler
  ): () => void {
    const unsubscribes = types.map((t: any) => this.subscribe(t, handler));
    return () => unsubscribes.forEach(u => u());
  }

  publish(event: Omit<CognitiveEvent, 'id' | 'timestamp'>): string {
    const fullEvent: CognitiveEvent = {
      ...event,
      id: uuidv4(),
      timestamp: Date.now(),
    };
    this.queue.push(fullEvent);
    this.queue.sort((a, b) => a.priority - b.priority);
    this.processQueue();
    return fullEvent.id;
  }

  publishSync(type: CognitiveEventType, payload: any, source: string, priority = EventPriority.NORMAL, correlationId?: string): string {
    return this.publish({ type, payload, source, priority, correlationId });
  }

  private async processQueue(): Promise<void> {
    if (this.processing) return;
    this.processing = true;
    while (this.queue.length > 0) {
      const event = this.queue.shift()!;
      const handlers = this.handlers.get(event.type);
      if (handlers) {
        await Promise.all(
          Array.from(handlers).map((h) =>
            Promise.resolve()
              .then(() => h(event))
              .catch((err) => {
                console.error(`[EventBus] Handler error for ${event.type}:`, err);
              })
          )
        );
      }
      this.history.push(event);
      if (this.history.length > this.maxHistory) {
        this.history.shift();
      }
    }
    this.processing = false;
  }

  getHistory(type?: CognitiveEventType, limit = 100): CognitiveEvent[] {
    const filtered = type
      ? this.history.filter((e) => e.type === type)
      : [...this.history];
    return filtered.slice(-limit);
  }

  getHistoryByCorrelation(correlationId: string): CognitiveEvent[] {
    return this.history.filter((e) => e.correlationId === correlationId);
  }

  clearHistory(): void {
    this.history = [];
  }

  getQueueDepth(): number {
    return this.queue.length;
  }

  getSubscriberCount(type?: CognitiveEventType): number {
    if (type) {
      return this.handlers.get(type)?.size || 0;
    }
    let total = 0;
    this.handlers.forEach((set) => (total += set.size));
    return total;
  }
}

export const globalEventBus = new CognitiveEventBus();
