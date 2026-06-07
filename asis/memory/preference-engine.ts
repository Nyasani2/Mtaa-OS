/**
 * ASIS Layer 4 — Preference Engine
 * Learns preferences from explicit feedback and implicit behavior
 * Supports A/B testing hooks
 */

import {
  UserPreference,
  PreferenceCategory,
  MemoryLayer,
  MemoryPriority,
  ContextScope,
  BehaviorEvent,
  BehaviorEventType,
} from '../types';
import { MemoryEngine } from './memory-engine';
import { EventBus } from '../kernel/event-bus';

export interface ABTestVariant {
  id: string;
  name: string;
  config: Record<string, unknown>;
  weight: number;
}

export interface ABTest {
  id: string;
  name: string;
  variants: ABTestVariant[];
  targetAudience: string;
  startDate: Date;
  endDate?: Date;
}

export class PreferenceEngine {
  private memoryEngine: MemoryEngine;
  private eventBus: EventBus;
  private activeTests: Map<string, ABTest> = new Map();

  constructor(memoryEngine: MemoryEngine, eventBus: EventBus) {
    this.memoryEngine = memoryEngine;
    this.eventBus = eventBus;
  }

  /**
   * Set explicit preference
   */
  async setPreference(
    category: string,
    key: string,
    value: unknown,
    scope: ContextScope = ContextScope.GLOBAL
  ): Promise<UserPreference> {
    const existing = await this.memoryEngine.get(MemoryLayer.PREFERENCE, key, scope);

    let sampleSize = 1;
    let confidence = 1.0;

    if (existing) {
      const prev = existing.value as UserPreference;
      sampleSize = prev.sampleSize + 1;
      confidence = Math.min(1.0, prev.confidence + 0.1);
    }

    const preference: UserPreference = {
      id: `pref_${key}`,
      category,
      key,
      value,
      confidence,
      source: 'explicit',
      updatedAt: new Date(),
      sampleSize,
    };

    await this.memoryEngine.store(
      MemoryLayer.PREFERENCE,
      key,
      preference,
      {
        priority: MemoryPriority.HIGH,
        scope,
        source: { type: 'explicit' },
        tags: ['preference', category],
        confidence,
      }
    );

    this.eventBus.emit('preference:set', { category, key, value, scope });

    return preference;
  }

  /**
   * Learn preference from behavior
   */
  async learnFromBehavior(event: BehaviorEvent): Promise<void> {
    // Skip if outcome was failure or cancelled
    if (event.outcome === 'failure' || event.outcome === 'cancelled') return;

    switch (event.type) {
      case BehaviorEventType.WALLET_ACTION:
        await this.learnWalletPreference(event);
        break;
      case BehaviorEventType.RIDE_REQUEST:
        await this.learnTransportPreference(event);
        break;
      case BehaviorEventType.SUGGESTION_ACCEPTED:
        await this.learnSuggestionPreference(event);
        break;
      case BehaviorEventType.SUGGESTION_IGNORED:
        await this.learnRejectionPattern(event);
        break;
      case BehaviorEventType.SEARCH_QUERY:
        await this.learnSearchPreference(event);
        break;
    }
  }

  /**
   * Get preference with confidence
   */
  async getPreference(key: string, scope?: ContextScope): Promise<UserPreference | null> {
    const entry = await this.memoryEngine.get(MemoryLayer.PREFERENCE, key, scope);
    return entry ? (entry.value as UserPreference) : null;
  }

  /**
   * Get all preferences by category
   */
  async getPreferencesByCategory(category: string): Promise<UserPreference[]> {
    const memories = await this.memoryEngine.retrieve({
      layer: MemoryLayer.PREFERENCE,
      tags: [category],
      limit: 100,
    });

    return memories.map(m => m.value as UserPreference).filter(Boolean);
  }

  /**
   * Get all preference categories
   */
  async getCategories(): Promise<PreferenceCategory[]> {
    const memories = await this.memoryEngine.retrieve({
      layer: MemoryLayer.PREFERENCE,
      limit: 1000,
    });

    const categories = new Map<string, PreferenceCategory>();

    for (const mem of memories) {
      const pref = mem.value as UserPreference;
      if (!categories.has(pref.category)) {
        categories.set(pref.category, {
          name: pref.category,
          description: '',
          scope: mem.contextScope,
          editable: true,
          deletable: true,
          entries: [],
        });
      }
      categories.get(pref.category)!.entries.push(pref);
    }

    return Array.from(categories.values());
  }

  /**
   * Register A/B test
   */
  registerABTest(test: ABTest): void {
    this.activeTests.set(test.id, test);
  }

  /**
   * Get variant for user
   */
  getABVariant(testId: string, userId: string): ABTestVariant | null {
    const test = this.activeTests.get(testId);
    if (!test) return null;

    // Deterministic assignment based on userId hash
    const hash = this.hashString(`${testId}:${userId}`);
    const totalWeight = test.variants.reduce((sum, v) => sum + v.weight, 0);
    let cumulative = 0;

    for (const variant of test.variants) {
      cumulative += variant.weight / totalWeight;
      if (hash <= cumulative) return variant;
    }

    return test.variants[test.variants.length - 1];
  }

  /**
   * Record A/B test outcome
   */
  async recordABOutcome(
    testId: string,
    variantId: string,
    userId: string,
    metric: string,
    value: number
  ): Promise<void> {
    await this.memoryEngine.store(
      MemoryLayer.LONG_TERM,
      `ab_test:${testId}:${variantId}:${userId}`,
      { testId, variantId, userId, metric, value, timestamp: new Date() },
      {
        priority: MemoryPriority.NORMAL,
        scope: ContextScope.GLOBAL,
        source: { type: 'system' },
        tags: ['ab_test', testId, variantId, metric],
      }
    );
  }

  private async learnWalletPreference(event: BehaviorEvent): Promise<void> {
    const payload = event.payload as any;

    // Learn preferred payment method
    if (payload.paymentMethod) {
      await this.updateImplicitPreference(
        'wallet',
        'preferred_payment_method',
        payload.paymentMethod,
        event.domain
      );
    }

    // Learn typical transfer amount range
    if (payload.amount) {
      const pref = await this.getPreference('typical_transfer_amount', event.domain);
      const currentAvg = pref ? (pref.value as number) : 0;
      const newAvg = currentAvg === 0 ? payload.amount : (currentAvg * 0.7 + payload.amount * 0.3);
      await this.updateImplicitPreference('wallet', 'typical_transfer_amount', newAvg, event.domain);
    }
  }

  private async learnTransportPreference(event: BehaviorEvent): Promise<void> {
    const payload = event.payload as any;

    // Learn frequent routes
    if (payload.pickupLocation && payload.dropoffLocation) {
      const routeKey = `route:${payload.pickupLocation}:${payload.dropoffLocation}`;
      await this.updateImplicitPreference('transport', 'frequent_routes', routeKey, event.domain);
    }

    // Learn preferred vehicle type
    if (payload.vehicleType) {
      await this.updateImplicitPreference('transport', 'preferred_vehicle', payload.vehicleType, event.domain);
    }

    // Learn time-of-day patterns
    const timeOfDay = event.metadata.timeOfDay;
    if (timeOfDay) {
      await this.updateImplicitPreference('transport', `active_${timeOfDay}`, true, event.domain);
    }
  }

  private async learnSuggestionPreference(event: BehaviorEvent): Promise<void> {
    const payload = event.payload as any;

    // Boost confidence for accepted suggestions
    if (payload.suggestion) {
      await this.updateImplicitPreference(
        'suggestions',
        `accepts_${payload.suggestion.type}`,
        true,
        event.domain
      );
    }
  }

  private async learnRejectionPattern(event: BehaviorEvent): Promise<void> {
    const payload = event.payload as any;

    // Reduce confidence for ignored suggestions
    if (payload.suggestion) {
      await this.updateImplicitPreference(
        'suggestions',
        `ignores_${payload.suggestion.type}`,
        true,
        event.domain,
        0.3 // Lower confidence for negative signals
      );
    }
  }

  private async learnSearchPreference(event: BehaviorEvent): Promise<void> {
    const payload = event.payload as any;

    if (payload.query) {
      await this.updateImplicitPreference('search', 'common_queries', payload.query, event.domain);
    }
  }

  private async updateImplicitPreference(
    category: string,
    key: string,
    value: unknown,
    scope: ContextScope,
    confidenceBoost: number = 0.1
  ): Promise<void> {
    const existing = await this.memoryEngine.get(MemoryLayer.PREFERENCE, key, scope);

    let sampleSize = 1;
    let confidence = confidenceBoost;
    let currentValue = value;

    if (existing) {
      const prev = existing.value as UserPreference;
      sampleSize = prev.sampleSize + 1;
      confidence = Math.min(1.0, prev.confidence + confidenceBoost);

      // For arrays (like routes), append
      if (Array.isArray(prev.value)) {
        currentValue = [...(prev.value as unknown[]), value];
        // Keep only last 20
        if (Array.isArray(currentValue) && currentValue.length > 20) {
          currentValue = currentValue.slice(-20);
        }
      }
    }

    const preference: UserPreference = {
      id: `pref_${key}`,
      category,
      key,
      value: currentValue,
      confidence,
      source: 'implicit',
      updatedAt: new Date(),
      sampleSize,
    };

    await this.memoryEngine.store(
      MemoryLayer.PREFERENCE,
      key,
      preference,
      {
        priority: MemoryPriority.NORMAL,
        scope,
        source: { type: 'inferred' },
        tags: ['preference', category, 'implicit'],
        confidence,
      }
    );
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash + char) | 0;
    }
    return Math.abs(hash) / 2147483647;
  }
}