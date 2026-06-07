/**
 * ASIS Layer 4 — Memory Engine
 * Unified interface for all memory layers with privacy controls
 * 
 * Architecture: Composition over inheritance
 * Each memory layer is a separate store, not a class hierarchy
 */

import {
  MemoryLayer,
  MemoryEntry,
  MemoryQuery,
  MemoryStats,
  MemoryPriority,
  ContextScope,
  MemorySource,
} from '../types/memory.types';
import { PrivacySettings, ConsentStatus } from '../types/privacy.types';
import { ShortTermStore } from './stores/short-term-store';
import { LongTermStore } from './stores/long-term-store';
import { SemanticStore } from './stores/semantic-store';
import { PreferenceStore } from './stores/preference-store';
import { SecurityStore } from './stores/security-store';
import { PrivacyGate } from './privacy-gate';
import { MemoryIndexer } from './memory-indexer';
import { EventBus } from '../kernel/event-bus';

export interface MemoryEngineConfig {
  maxShortTermEntries: number;
  maxLongTermEntries: number;
  maxSemanticVectors: number;
  maxPreferenceEntries: number;
  maxSecurityEntries: number;
  defaultTTL: number; // minutes
  enableEncryption: boolean;
  compressionEnabled: boolean;
}

const DEFAULT_CONFIG: MemoryEngineConfig = {
  maxShortTermEntries: 500,
  maxLongTermEntries: 5000,
  maxSemanticVectors: 10000,
  maxPreferenceEntries: 1000,
  maxSecurityEntries: 2000,
  defaultTTL: 60,
  enableEncryption: true,
  compressionEnabled: true,
};

export class MemoryEngine {
  private config: MemoryEngineConfig;
  private stores: Map<MemoryLayer, MemoryStore>;
  private privacyGate: PrivacyGate;
  private indexer: MemoryIndexer;
  private eventBus: EventBus;
  private userId: string;

  constructor(
    userId: string,
    config: Partial<MemoryEngineConfig> = {},
    eventBus: EventBus
  ) {
    this.userId = userId;
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.eventBus = eventBus;
    this.privacyGate = new PrivacyGate(userId);
    this.indexer = new MemoryIndexer();
    this.stores = new Map();

    // Initialize stores — composition, not inheritance
    this.stores.set(MemoryLayer.SHORT_TERM, new ShortTermStore(this.config.maxShortTermEntries));
    this.stores.set(MemoryLayer.LONG_TERM, new LongTermStore(this.config.maxLongTermEntries));
    this.stores.set(MemoryLayer.SEMANTIC, new SemanticStore(this.config.maxSemanticVectors));
    this.stores.set(MemoryLayer.PREFERENCE, new PreferenceStore(this.config.maxPreferenceEntries));
    this.stores.set(MemoryLayer.SECURITY, new SecurityStore(this.config.maxSecurityEntries));

    this.startCleanupTimer();
  }

  /**
   * Store a memory entry with privacy validation
   */
  async store(
    layer: MemoryLayer,
    key: string,
    value: unknown,
    options: {
      priority?: MemoryPriority;
      scope?: ContextScope;
      ttl?: number;
      source?: MemorySource;
      tags?: string[];
      confidence?: number;
    } = {}
  ): Promise<MemoryEntry> {
    // Privacy gate: check consent
    const canStore = await this.privacyGate.canStore(layer, options.scope || ContextScope.GLOBAL);
    if (!canStore) {
      throw new MemoryPrivacyError(`Storage denied for layer ${layer} scope ${options.scope}`);
    }

    const entry: MemoryEntry = {
      id: this.generateId(),
      layer,
      key,
      value,
      priority: options.priority || MemoryPriority.NORMAL,
      contextScope: options.scope || ContextScope.GLOBAL,
      createdAt: new Date(),
      updatedAt: new Date(),
      expiresAt: options.ttl ? new Date(Date.now() + options.ttl * 60000) : undefined,
      source: options.source || { type: 'system' },
      confidence: options.confidence || 1.0,
      tags: options.tags || [],
      encrypted: this.config.enableEncryption,
      version: 1,
    };

    const store = this.stores.get(layer);
    if (!store) throw new Error(`Unknown memory layer: ${layer}`);

    await store.set(entry);
    this.indexer.index(entry);

    // Emit event for learning systems
    this.eventBus.emit('memory:stored', {
      userId: this.userId,
      entryId: entry.id,
      layer,
      scope: entry.contextScope,
    });

    return entry;
  }

  /**
   * Retrieve memories with scope filtering
   */
  async retrieve(query: MemoryQuery): Promise<MemoryEntry[]> {
    const allowedScopes = await this.privacyGate.getAllowedScopes();
    const targetLayers = Array.isArray(query.layer) ? query.layer : query.layer ? [query.layer] : Object.values(MemoryLayer);

    const results: MemoryEntry[] = [];

    for (const layer of targetLayers) {
      const store = this.stores.get(layer);
      if (!store) continue;

      const layerResults = await store.query(query);

      // Filter by allowed scopes
      const filtered = layerResults.filter(
        entry => allowedScopes.includes(entry.contextScope) || entry.contextScope === ContextScope.GLOBAL
      );

      results.push(...filtered);
    }

    // Sort and limit
    const sortKey = query.sortBy || 'updatedAt';
    const sortOrder = query.sortOrder || 'desc';
    results.sort((a, b) => {
      const aVal = a[sortKey].getTime();
      const bVal = b[sortKey].getTime();
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    });

    return results.slice(query.offset || 0, (query.offset || 0) + (query.limit || 50));
  }

  /**
   * Get a single memory by key
   */
  async get(layer: MemoryLayer, key: string, scope?: ContextScope): Promise<MemoryEntry | null> {
    const store = this.stores.get(layer);
    if (!store) return null;

    const entry = await store.get(key, scope);
    if (!entry) return null;

    const allowedScopes = await this.privacyGate.getAllowedScopes();
    if (!allowedScopes.includes(entry.contextScope) && entry.contextScope !== ContextScope.GLOBAL) {
      return null;
    }

    return entry;
  }

  /**
   * Update existing memory
   */
  async update(
    layer: MemoryLayer,
    key: string,
    value: unknown,
    scope?: ContextScope
  ): Promise<MemoryEntry | null> {
    const store = this.stores.get(layer);
    if (!store) return null;

    const existing = await store.get(key, scope);
    if (!existing) return null;

    const allowedScopes = await this.privacyGate.getAllowedScopes();
    if (!allowedScopes.includes(existing.contextScope)) {
      throw new MemoryPrivacyError('Update denied: scope not allowed');
    }

    const updated: MemoryEntry = {
      ...existing,
      value,
      updatedAt: new Date(),
      version: existing.version + 1,
    };

    await store.set(updated);
    this.indexer.index(updated);

    this.eventBus.emit('memory:updated', {
      userId: this.userId,
      entryId: updated.id,
      layer,
    });

    return updated;
  }

  /**
   * Delete memory entry
   */
  async delete(layer: MemoryLayer, key: string, scope?: ContextScope): Promise<boolean> {
    const store = this.stores.get(layer);
    if (!store) return false;

    const entry = await store.get(key, scope);
    if (!entry) return false;

    const allowedScopes = await this.privacyGate.getAllowedScopes();
    if (!allowedScopes.includes(entry.contextScope)) {
      throw new MemoryPrivacyError('Delete denied: scope not allowed');
    }

    await store.delete(key, scope);
    this.indexer.remove(entry.id);

    this.eventBus.emit('memory:deleted', {
      userId: this.userId,
      entryId: entry.id,
      layer,
    });

    return true;
  }

  /**
   * Get memory statistics
   */
  async getStats(): Promise<MemoryStats> {
    const stats: MemoryStats = {
      totalEntries: 0,
      byLayer: {} as Record<MemoryLayer, number>,
      byScope: {} as Record<ContextScope, number>,
      storageBytes: 0,
      oldestEntry: new Date(),
      newestEntry: new Date(0),
    };

    for (const [layer, store] of this.stores) {
      const storeStats = await store.getStats();
      stats.byLayer[layer] = storeStats.count;
      stats.totalEntries += storeStats.count;
      stats.storageBytes += storeStats.bytes;

      if (storeStats.oldest < stats.oldestEntry) stats.oldestEntry = storeStats.oldest;
      if (storeStats.newest > stats.newestEntry) stats.newestEntry = storeStats.newest;
    }

    return stats;
  }

  /**
   * Export all user-owned memory
   */
  async export(scopes?: ContextScope[]): Promise<Record<string, unknown>> {
    const allowedScopes = await this.privacyGate.getAllowedScopes();
    const targetScopes = scopes || allowedScopes;

    const export_: Record<string, unknown> = {
      userId: this.userId,
      exportedAt: new Date().toISOString(),
      version: '1.0',
      memories: {},
    };

    for (const [layer, store] of this.stores) {
      const entries = await store.export(targetScopes);
      export_.memories[layer] = entries;
    }

    return export_;
  }

  /**
   * Bulk delete by scope
   */
  async deleteByScope(scopes: ContextScope[]): Promise<number> {
    let deleted = 0;
    for (const [layer, store] of this.stores) {
      deleted += await store.deleteByScope(scopes);
    }
    return deleted;
  }

  private generateId(): string {
    return `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private startCleanupTimer(): void {
    // Run cleanup every 5 minutes
    setInterval(() => this.cleanup(), 300000);
  }

  private async cleanup(): Promise<void> {
    for (const [layer, store] of this.stores) {
      await store.cleanup();
    }
  }
}

// Abstract store interface — no inheritance, just contracts
export interface MemoryStore {
  set(entry: MemoryEntry): Promise<void>;
  get(key: string, scope?: ContextScope): Promise<MemoryEntry | null>;
  query(query: MemoryQuery): Promise<MemoryEntry[]>;
  delete(key: string, scope?: ContextScope): Promise<void>;
  deleteByScope(scopes: ContextScope[]): Promise<number>;
  getStats(): Promise<{ count: number; bytes: number; oldest: Date; newest: Date }>;
  export(scopes: ContextScope[]): Promise<MemoryEntry[]>;
  cleanup(): Promise<void>;
}

export class MemoryPrivacyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MemoryPrivacyError';
  }
}