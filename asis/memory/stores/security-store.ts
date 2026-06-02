/**
 * ASIS Layer 4 — Security Memory Store
 * Audit logs, auth events, policy violations
 * Retention: 90 days, immutable after write
 */

import { MemoryEntry, MemoryQuery, ContextScope, MemoryPriority } from '../../types/memory.types';
import { MemoryStore } from '../memory-engine';

export class SecurityStore implements MemoryStore {
  private entries: MemoryEntry[] = [];
  private maxEntries: number;
  private retentionDays: number = 90;

  constructor(maxEntries: number) {
    this.maxEntries = maxEntries;
  }

  async set(entry: MemoryEntry): Promise<void> {
    // Security entries are append-only, immutable
    entry.priority = MemoryPriority.CRITICAL;
    entry.encrypted = true;

    this.entries.push(entry);

    if (this.entries.length > this.maxEntries) {
      this.entries = this.entries.slice(-this.maxEntries);
    }
  }

  async get(key: string, scope?: ContextScope): Promise<MemoryEntry | null> {
    return this.entries.find(e => e.key === key && (!scope || e.contextScope === scope)) || null;
  }

  async query(query: MemoryQuery): Promise<MemoryEntry[]> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - this.retentionDays);

    return this.entries.filter(e => {
      if (e.createdAt < cutoff) return false;
      if (query.key && e.key !== query.key) return false;
      if (query.after && e.createdAt < query.after) return false;
      if (query.before && e.createdAt > query.before) return false;
      if (query.tags && !query.tags.some(tag => e.tags.includes(tag))) return false;
      return true;
    });
  }

  async delete(key: string, scope?: ContextScope): Promise<void> {
    // Security entries are immutable — mark as expired instead
    const entry = this.entries.find(e => e.key === key);
    if (entry) {
      entry.expiresAt = new Date();
    }
  }

  async deleteByScope(scopes: ContextScope[]): Promise<number> {
    // Security entries cannot be bulk deleted
    return 0;
  }

  async getStats(): Promise<{ count: number; bytes: number; oldest: Date; newest: Date }> {
    const valid = this.entries.filter(e => !e.expiresAt || e.expiresAt >= new Date());
    const bytes = valid.reduce((sum, e) => sum + JSON.stringify(e).length * 2, 0);

    return {
      count: valid.length,
      bytes,
      oldest: valid.length > 0 ? valid[0].createdAt : new Date(),
      newest: valid.length > 0 ? valid[valid.length - 1].createdAt : new Date(),
    };
  }

  async export(scopes: ContextScope[]): Promise<MemoryEntry[]> {
    // Security exports require admin scope
    if (!scopes.includes(ContextScope.ADMIN)) return [];
    return this.entries.filter(e => !e.expiresAt || e.expiresAt >= new Date());
  }

  async cleanup(): Promise<void> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - this.retentionDays);
    this.entries = this.entries.filter(e => e.createdAt >= cutoff);
  }
}
