/**
 * ASIS Layer 4 — Behavior Event System
 * Event-driven learning from actions, not just conversations
 * 
 * Learns from:
 * - wallet actions
 * - ride behavior
 * - repeated choices
 * - accepted/ignored suggestions
 * - time patterns
 */

import {
  BehaviorEvent,
  BehaviorEventType,
  ContextScope,
  MemoryLayer,
  MemoryPriority,
} from '../types';
import { MemoryEngine } from './memory-engine';
import { EventBus } from '../kernel/event-bus';

export class BehaviorEventSystem {
  private memoryEngine: MemoryEngine;
  private eventBus: EventBus;
  private queue: BehaviorEvent[] = [];
  private flushInterval: number = 30000; // 30 seconds
  private maxQueueSize: number = 100;

  constructor(memoryEngine: MemoryEngine, eventBus: EventBus) {
    this.memoryEngine = memoryEngine;
    this.eventBus = eventBus;
    this.startFlushTimer();
    this.listenToEvents();
  }

  /**
   * Record a behavior event
   */
  async record(event: Omit<BehaviorEvent, 'id' | 'timestamp'>): Promise<BehaviorEvent> {
    const fullEvent: BehaviorEvent = {
      ...event,
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date(),
    };

    this.queue.push(fullEvent);

    // Flush if queue is full
    if (this.queue.length >= this.maxQueueSize) {
      await this.flush();
    }

    // Emit for real-time processing
    this.eventBus.emit('behavior:event', fullEvent);

    return fullEvent;
  }

  /**
   * Flush queued events to memory
   */
  async flush(): Promise<void> {
    if (this.queue.length === 0) return;

    const events = [...this.queue];
    this.queue = [];

    // Store as short-term memory (aggregated later)
    for (const event of events) {
      await this.memoryEngine.store(
        MemoryLayer.SHORT_TERM,
        `behavior:${event.type}:${event.id}`,
        event,
        {
          priority: MemoryPriority.NORMAL,
          scope: event.domain,
          ttl: 1440, // 24 hours
          source: {
            type: 'behavior',
            sessionId: event.sessionId,
            agentId: event.agentId,
          },
          tags: ['behavior', event.type, event.action, event.outcome],
        }
      );
    }

    // Aggregate patterns
    await this.aggregatePatterns(events);
  }

  /**
   * Get behavior patterns for a user
   */
  async getPatterns(
    userId: string,
    domain?: ContextScope,
    type?: BehaviorEventType
  ): Promise<BehaviorPattern[]> {
    const query = {
      layer: MemoryLayer.LONG_TERM,
      tags: ['behavior_pattern', ...(type ? [type] : [])],
      ...(domain && { contextScope: domain }),
      limit: 50,
      sortBy: 'confidence',
      sortOrder: 'desc',
    };

    const memories = await this.memoryEngine.retrieve(query);
    return memories.map(m => m.value as BehaviorPattern).filter(Boolean);
  }

  /**
   * Get recent events
   */
  async getRecentEvents(
    userId: string,
    limit: number = 50,
    type?: BehaviorEventType
  ): Promise<BehaviorEvent[]> {
    const query = {
      layer: MemoryLayer.SHORT_TERM,
      tags: ['behavior', ...(type ? [type] : [])],
      limit,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    };

    const memories = await this.memoryEngine.retrieve(query);
    return memories.map(m => m.value as BehaviorEvent).filter(Boolean);
  }

  private listenToEvents(): void {
    // Listen to system events and convert to behavior events
    this.eventBus.on('wallet:transaction', (data) => {
      this.record({
        type: BehaviorEventType.WALLET_ACTION,
        sessionId: data.sessionId,
        userId: data.userId,
        agentId: 'wallet_agent',
        domain: ContextScope.WALLET,
        action: data.action,
        payload: data,
        outcome: data.success ? 'success' : 'failure',
        durationMs: data.durationMs,
        metadata: {
          deviceType: data.deviceType,
          networkType: data.networkType,
        },
      });
    });

    this.eventBus.on('mtaxi:ride_complete', (data) => {
      this.record({
        type: BehaviorEventType.RIDE_REQUEST,
        sessionId: data.sessionId,
        userId: data.userId,
        agentId: 'mtaxi_agent',
        domain: ContextScope.TRANSPORT,
        action: 'ride_complete',
        payload: data,
        outcome: 'success',
        durationMs: data.durationMs,
        metadata: {
          deviceType: data.deviceType,
          networkType: data.networkType,
          location: data.dropoffLocation,
          timeOfDay: this.getTimeOfDay(),
        },
      });
    });

    this.eventBus.on('search:query', (data) => {
      this.record({
        type: BehaviorEventType.SEARCH_QUERY,
        sessionId: data.sessionId,
        userId: data.userId,
        domain: ContextScope.GLOBAL,
        action: 'search',
        payload: { query: data.query, results: data.resultCount },
        outcome: data.resultCount > 0 ? 'success' : 'ignored',
        metadata: {
          deviceType: data.deviceType,
          networkType: data.networkType,
        },
      });
    });

    this.eventBus.on('suggestion:accepted', (data) => {
      this.record({
        type: BehaviorEventType.SUGGESTION_ACCEPTED,
        sessionId: data.sessionId,
        userId: data.userId,
        agentId: data.agentId,
        domain: data.domain || ContextScope.GLOBAL,
        action: 'accept_suggestion',
        payload: { suggestion: data.suggestion, reason: data.reason },
        outcome: 'success',
        metadata: {},
      });
    });

    this.eventBus.on('suggestion:ignored', (data) => {
      this.record({
        type: BehaviorEventType.SUGGESTION_IGNORED,
        sessionId: data.sessionId,
        userId: data.userId,
        agentId: data.agentId,
        domain: data.domain || ContextScope.GLOBAL,
        action: 'ignore_suggestion',
        payload: { suggestion: data.suggestion },
        outcome: 'ignored',
        metadata: {},
      });
    });
  }

  private async aggregatePatterns(events: BehaviorEvent[]): Promise<void> {
    // Group by action and domain
    const groups = new Map<string, BehaviorEvent[]>();
    for (const event of events) {
      const key = `${event.domain}:${event.action}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(event);
    }

    // Store aggregated patterns
    for (const [key, groupEvents] of groups) {
      if (groupEvents.length < 3) continue; // Need minimum sample size

      const pattern = {
        pattern: key,
        frequency: groupEvents.length,
        lastObserved: groupEvents[groupEvents.length - 1].timestamp,
        confidence: Math.min(groupEvents.length / 10, 1.0),
        examples: groupEvents.slice(-5).map(e => JSON.stringify(e.payload)),
      };

      await this.memoryEngine.store(
        MemoryLayer.LONG_TERM,
        `pattern:${key}`,
        pattern,
        {
          priority: MemoryPriority.NORMAL,
          scope: groupEvents[0].domain,
          source: { type: 'system' },
          tags: ['behavior_pattern', groupEvents[0].type, groupEvents[0].domain],
          confidence: pattern.confidence,
        }
      );
    }
  }

  private startFlushTimer(): void {
    setInterval(() => this.flush(), this.flushInterval);
  }

  private getTimeOfDay(): 'morning' | 'afternoon' | 'evening' | 'night' {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
  }
}

interface BehaviorPattern {
  pattern: string;
  frequency: number;
  lastObserved: Date;
  confidence: number;
  examples: string[];
}
