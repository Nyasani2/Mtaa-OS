/**
 * ASIS Layer 4 — Short Term Memory Store
 * Session/contextual memory with aggressive TTL
 * Optimized for low-memory African devices
 */

import { MemoryEntry, MemoryQuery, MemoryLayer, MemoryPriority, ContextScope } from '../../types/memory.types';
import { MemoryStore } from '../memory-engine';

export class ShortTermStore implements MemoryStore {
  private entries: Map<string, MemoryEntry> = new Map();
  private maxEntries: number;

  constructor(maxEntries: number) {
    this.maxEntries = maxEntries;
  }

  async set(entry: MemoryEntry): Promise<void> {
    // Evict lowest priority oldest entries if at capacity
    if (this.entries.size >= this.maxEntries) {
      this.evictLowestPriority();
    }

    const key = this.makeKey(entry.key, entry.contextScope);
    this.entries.set(key, entry);
  }

  async get(key: string, scope?: ContextScope): Promise<MemoryEntry | null> {
    const fullKey = this.makeKey(key, scope);
    const entry = this.entries.get(fullKey);

    if (!entry) return null;
    if (entry.expiresAt && entry.expiresAt < new Date()) {
      this.entries.delete(fullKey);
      return null;
    }

    return entry;
  }

  async query(query: MemoryQuery): Promise<MemoryEntry[]> {
    const results: MemoryEntry[] = [];

    for (const entry of this.entries.values()) {
      if (entry.expiresAt && entry.expiresAt < new Date()) continue;
      if (query.key && entry.key !== query.key) continue;
      if (query.keyPattern && !new RegExp(query.keyPattern).test(entry.key)) continue;
      if (query.tags && !query.tags.some(tag => entry.tags.includes(tag))) continue;
      if (query.minConfidence && entry.confidence < query.minConfidence) continue;
      if (query.after && entry.createdAt < query.after) continue;
      if (query.before && entry.createdAt > query.before) continue;

      results.push(entry);
    }

    return results;
  }

  async delete(key: string, scope?: ContextScope): Promise<void> {
    this.entries.delete(this.makeKey(key, scope));
  }

  async deleteByScope(scopes: ContextScope[]): Promise<number> {
    let deleted = 0;
    for (const [key, entry] of this.entries) {
      if (scopes.includes(entry.contextScope)) {
        this.entries.delete(key);
        deleted++;
      }
    }
    return deleted;
  }

  async getStats(): Promise<{ count: number; bytes: number; oldest: Date; newest: Date }> {
    const valid = Array.from(this.entries.values()).filter(e => !e.expiresAt || e.expiresAt >= new Date());
    const bytes = valid.reduce((sum, e) => sum + JSON.stringify(e).length * 2, 0);

    return {
      count: valid.length,
      bytes,
      oldest: valid.length > 0 ? valid.reduce((min, e) => e.createdAt < min ? e.createdAt : min, valid[0].createdAt) : new Date(),
      newest: valid.length > 0 ? valid.reduce((max, e) => e.createdAt > max ? e.createdAt : max, valid[0].createdAt) : new Date(),
    };
  }

  async export(scopes: ContextScope[]): Promise<MemoryEntry[]> {
    return Array.from(this.entries.values()).filter(
      e => scopes.includes(e.contextScope) || e.contextScope === ContextScope.GLOBAL
    );
  }

  async cleanup(): Promise<void> {
    const now = new Date();
    for (const [key, entry] of this.entries) {
      if (entry.expiresAt && entry.expiresAt < now) {
        this.entries.delete(key);
      }
    }
  }

  private makeKey(key: string, scope?: ContextScope): string {
    return scope ? `${scope}:${key}` : key;
  }

  private evictLowestPriority(): void {
    let lowest: { key: string; score: number } | null = null;
    const now = Date.now();

    for (const [key, entry] of this.entries) {
      const age = now - entry.createdAt.getTime();
      const score = entry.priority * 1000000 - age; // Lower score = more evictable
      if (!lowest || score < lowest.score) {
        lowest = { key, score };
      }
    }

    if (lowest) {
      this.entries.delete(lowest.key);
    }
  }
}
