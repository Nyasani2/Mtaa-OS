/**
 * ASIS CSE — 7-Tier Memory Architecture
 * Sensory → Working → Episodic → Semantic → Procedural → Strategic → Collective
 */

import {
  SENSORY_TTL_MS,
  WORKING_MAX_ITEMS,
  EPISODIC_MAX_ITEMS,
  SEMANTIC_MAX_ITEMS,
  PROCEDURAL_MAX_ITEMS,
  STRATEGIC_MAX_ITEMS,
  MEMORY_PROMOTION_THRESHOLD,
  CONTEXT_DECAY,
} from './asis-cse-constants';

import type {
  MemoryTier,
  MemoryEnvelope,
  MemoryQuery,
  MemoryRetrieval,
  MemoryMetadata,
} from './asis-cse-types';

import { cosineSimilarity, ema } from './asis-cse-kamos';

// ============================================================================
// Tier Configuration
// ============================================================================

interface TierConfig {
  maxItems: number;
  ttlMs: number | null;
  promotionThreshold: number;
  decayRate: number;
}

const TIER_CONFIG: Record<MemoryTier, TierConfig> = {
  sensory: {
    maxItems: 100,
    ttlMs: SENSORY_TTL_MS,
    promotionThreshold: 0.9,
    decayRate: 0.5,
  },
  working: {
    maxItems: WORKING_MAX_ITEMS,
    ttlMs: null,
    promotionThreshold: MEMORY_PROMOTION_THRESHOLD,
    decayRate: 0.1,
  },
  episodic: {
    maxItems: EPISODIC_MAX_ITEMS,
    ttlMs: null,
    promotionThreshold: MEMORY_PROMOTION_THRESHOLD,
    decayRate: 0.02,
  },
  semantic: {
    maxItems: SEMANTIC_MAX_ITEMS,
    ttlMs: null,
    promotionThreshold: MEMORY_PROMOTION_THRESHOLD,
    decayRate: 0.005,
  },
  procedural: {
    maxItems: PROCEDURAL_MAX_ITEMS,
    ttlMs: null,
    promotionThreshold: MEMORY_PROMOTION_THRESHOLD,
    decayRate: 0.001,
  },
  strategic: {
    maxItems: STRATEGIC_MAX_ITEMS,
    ttlMs: null,
    promotionThreshold: 0.85,
    decayRate: 0.001,
  },
  collective: {
    maxItems: 100000,
    ttlMs: null,
    promotionThreshold: 0.9,
    decayRate: 0.0,
  },
};

const TIER_ORDER: MemoryTier[] = [
  'sensory',
  'working',
  'episodic',
  'semantic',
  'procedural',
  'strategic',
  'collective',
];

// ============================================================================
// Memory Store
// ============================================================================

export class MemoryStore {
  private stores: Map<MemoryTier, Map<string, MemoryEnvelope>>;
  private accessLog: Map<string, number>;

  constructor() {
    this.stores = new Map();
    for (const tier of TIER_ORDER) {
      this.stores.set(tier, new Map());
    }
    this.accessLog = new Map();
  }

  /**
   * Stores a memory envelope in the specified tier.
   * If tier is full, evicts lowest-salience item.
   */
  store(envelope: MemoryEnvelope): MemoryEnvelope {
    const tierStore = this.stores.get(envelope.tier);
    if (!tierStore) throw new Error(`Invalid memory tier: ${envelope.tier}`);

    const config = TIER_CONFIG[envelope.tier];

    // Eviction if at capacity
    if (tierStore.size >= config.maxItems) {
      this.evictLowestSalience(envelope.tier);
    }

    tierStore.set(envelope.id, envelope);
    this.accessLog.set(envelope.id, Date.now());

    return envelope;
  }

  /**
   * Queries memory across tiers with relevance ranking.
   */
  async query(query: MemoryQuery): Promise<MemoryRetrieval[]> {
    const tiers = query.tier
      ? Array.isArray(query.tier)
        ? query.tier
        : [query.tier]
      : TIER_ORDER;

    const results: MemoryRetrieval[] = [];
    const now = Date.now();

    for (const tier of tiers) {
      const tierStore = this.stores.get(tier);
      if (!tierStore) continue;

      for (const envelope of tierStore.values()) {
        // Filter by criteria
        if (query.source && envelope.metadata.source !== query.source) continue;
        if (query.minConfidence && envelope.metadata.confidence < query.minConfidence) continue;
        if (query.minSalience && envelope.metadata.salience < query.minSalience) continue;
        if (query.after && envelope.createdAt < query.after) continue;
        if (query.before && envelope.createdAt > query.before) continue;
        if (query.tags && !query.tags.some((t) => envelope.metadata.tags.includes(t))) continue;

        // Skip expired sensory memories
        const config = TIER_CONFIG[tier];
        if (config.ttlMs && now - envelope.createdAt > config.ttlMs) continue;

        // Compute relevance score
        const recency = this.computeRecency(envelope, now);
        const accessBoost = Math.log1p(envelope.accessCount) * 0.1;
        const tagMatch = query.tags
          ? envelope.metadata.tags.filter((t) => query.tags!.includes(t)).length /
            query.tags.length
          : 0;

        const relevance =
          envelope.metadata.salience * 0.4 +
          envelope.metadata.confidence * 0.3 +
          recency * 0.2 +
          accessBoost * 0.05 +
          tagMatch * 0.05;

        // Apply decay
        const decayedSalience = this.applyDecay(envelope, now);

        results.push({
          envelope,
          relevance,
          decayedSalience,
        });
      }
    }

    // Sort by relevance descending
    results.sort((a, b) => b.relevance - a.relevance);

    return query.limit ? results.slice(0, query.limit) : results;
  }

  /**
   * Retrieves a single memory by ID across all tiers.
   */
  retrieve(id: string): MemoryEnvelope | null {
    for (const tier of TIER_ORDER) {
      const tierStore = this.stores.get(tier);
      if (!tierStore) continue;
      const envelope = tierStore.get(id);
      if (envelope) {
        // Update access stats
        envelope.accessCount++;
        envelope.lastAccessed = Date.now();
        this.accessLog.set(id, Date.now());
        return envelope;
      }
    }
    return null;
  }

  /**
   * Forgets a memory by ID.
   */
  forget(id: string): boolean {
    for (const tier of TIER_ORDER) {
      const tierStore = this.stores.get(tier);
      if (!tierStore) continue;
      if (tierStore.has(id)) {
        tierStore.delete(id);
        this.accessLog.delete(id);
        return true;
      }
    }
    return false;
  }

  /**
   * Promotes a memory to the next tier if it meets threshold.
   */
  promote(id: string): boolean {
    for (let i = 0; i < TIER_ORDER.length - 1; i++) {
      const currentTier = TIER_ORDER[i];
      const nextTier = TIER_ORDER[i + 1];
      const tierStore = this.stores.get(currentTier);
      if (!tierStore) continue;

      const envelope = tierStore.get(id);
      if (!envelope) continue;

      const config = TIER_CONFIG[currentTier];
      if (envelope.metadata.confidence < config.promotionThreshold) return false;

      // Remove from current tier
      tierStore.delete(id);

      // Store in next tier
      const promoted: MemoryEnvelope = {
        ...envelope,
        tier: nextTier,
        metadata: {
          ...envelope.metadata,
          salience: envelope.metadata.salience * 0.9, // Slight decay on promotion
        },
      };

      this.store(promoted);
      return true;
    }
    return false;
  }

  /**
   * Demotes a memory to the previous tier (or forgets if at sensory).
   */
  demote(id: string): boolean {
    for (let i = 1; i < TIER_ORDER.length; i++) {
      const currentTier = TIER_ORDER[i];
      const prevTier = TIER_ORDER[i - 1];
      const tierStore = this.stores.get(currentTier);
      if (!tierStore) continue;

      const envelope = tierStore.get(id);
      if (!envelope) continue;

      tierStore.delete(id);

      if (currentTier === 'working') {
        // Demote to sensory — likely to expire
        this.store({ ...envelope, tier: 'sensory' });
      } else {
        this.store({ ...envelope, tier: prevTier });
      }
      return true;
    }
    return false;
  }

  /**
   * Runs garbage collection: removes expired memories, demotes stale ones.
   */
  cleanup(): number {
    let removed = 0;
    const now = Date.now();

    for (const tier of TIER_ORDER) {
      const tierStore = this.stores.get(tier);
      if (!tierStore) continue;
      const config = TIER_CONFIG[tier];

      for (const [id, envelope] of tierStore) {
        // Remove expired
        if (config.ttlMs && now - envelope.createdAt > config.ttlMs) {
          tierStore.delete(id);
          this.accessLog.delete(id);
          removed++;
          continue;
        }

        // Demote if salience decayed too low (except collective)
        if (tier !== 'collective') {
          const decayedSalience = this.applyDecay(envelope, now);
          if (decayedSalience < 0.05) {
            tierStore.delete(id);
            this.accessLog.delete(id);
            removed++;
          }
        }
      }
    }

    return removed;
  }

  /**
   * Returns statistics for all tiers.
   */
  stats(): Record<MemoryTier, { count: number; avgSalience: number; avgConfidence: number }> {
    const stats = {} as Record<MemoryTier, { count: number; avgSalience: number; avgConfidence: number }>;

    for (const tier of TIER_ORDER) {
      const tierStore = this.stores.get(tier);
      if (!tierStore) {
        stats[tier] = { count: 0, avgSalience: 0, avgConfidence: 0 };
        continue;
      }

      const items = Array.from(tierStore.values());
      const count = items.length;
      const avgSalience = count > 0
        ? items.reduce((sum, e) => sum + e.metadata.salience, 0) / count
        : 0;
      const avgConfidence = count > 0
        ? items.reduce((sum, e) => sum + e.metadata.confidence, 0) / count
        : 0;

      stats[tier] = { count, avgSalience, avgConfidence };
    }

    return stats;
  }

  // --------------------------------------------------------------------------
  // Private helpers
  // --------------------------------------------------------------------------

  private evictLowestSalience(tier: MemoryTier): void {
    const tierStore = this.stores.get(tier);
    if (!tierStore || tierStore.size === 0) return;

    let lowestId: string | null = null;
    let lowestSalience = Infinity;

    for (const [id, envelope] of tierStore) {
      if (envelope.metadata.salience < lowestSalience) {
        lowestSalience = envelope.metadata.salience;
        lowestId = id;
      }
    }

    if (lowestId) {
      tierStore.delete(lowestId);
      this.accessLog.delete(lowestId);
    }
  }

  private computeRecency(envelope: MemoryEnvelope, now: number): number {
    const ageMs = now - envelope.createdAt;
    const halfLifeMs = 60000; // 1 minute half-life
    return Math.exp(-ageMs / halfLifeMs);
  }

  private applyDecay(envelope: MemoryEnvelope, now: number): number {
    const config = TIER_CONFIG[envelope.tier];
    const ageMs = now - envelope.createdAt;
    const decayFactor = Math.exp(-config.decayRate * (ageMs / 1000));
    return envelope.metadata.salience * decayFactor;
  }
}

// ============================================================================
// Memory Factory
// ============================================================================

let globalMemoryId = 0;

export const createMemory = (
  tier: MemoryTier,
  payload: unknown,
  metadata: Partial<MemoryMetadata> & { source: string },
  ttlMs?: number
): MemoryEnvelope => {
  const now = Date.now();
  return {
    id: `mem_${now}_${++globalMemoryId}`,
    tier,
    payload,
    metadata: {
      confidence: metadata.confidence ?? 0.5,
      salience: metadata.salience ?? 0.5,
      tags: metadata.tags ?? [],
      relations: metadata.relations ?? [],
      source: metadata.source,
    },
    createdAt: now,
    expiresAt: ttlMs ? now + ttlMs : null,
    accessCount: 0,
    lastAccessed: now,
  };
};

// ============================================================================
// Singleton Export
// ============================================================================

export const globalMemoryStore = new MemoryStore();
