/**
 * ASIS Layer 4 — Preference Memory Store
 * User preferences with confidence scoring
 * Supports A/B test variant tracking
 */

import { MemoryEntry, MemoryQuery, ContextScope, UserPreference, PreferenceCategory } from '../../types/memory.types';
import { MemoryStore } from '../memory-engine';

export class PreferenceStore implements MemoryStore {
  private preferences: Map<string, UserPreference> = new Map();
  private maxEntries: number;

  constructor(maxEntries: number) {
    this.maxEntries = maxEntries;
  }

  async set(entry: MemoryEntry): Promise<void> {
    // Convert memory entry to preference
    const pref: UserPreference = {
      id: entry.id,
      category: entry.tags[0] || 'general',
      key: entry.key,
      value: entry.value,
      confidence: entry.confidence,
      source: entry.source.type === 'explicit' ? 'explicit' : 'implicit',
      updatedAt: entry.updatedAt,
      sampleSize: 1,
    };

    const existing = this.preferences.get(entry.key);
    if (existing) {
      // Bayesian update for confidence
      const totalSamples = existing.sampleSize + 1;
      const newConfidence = (existing.confidence * existing.sampleSize + entry.confidence) / totalSamples;
      pref.sampleSize = totalSamples;
      pref.confidence = newConfidence;
    }

    this.preferences.set(entry.key, pref);
  }

  async get(key: string, scope?: ContextScope): Promise<MemoryEntry | null> {
    const pref = this.preferences.get(key);
    if (!pref) return null;

    return {
      id: pref.id,
      layer: 'preference' as any,
      key: pref.key,
      value: pref.value,
      priority: 2,
      contextScope: scope || ContextScope.GLOBAL,
      createdAt: pref.updatedAt,
      updatedAt: pref.updatedAt,
      source: { type: pref.source },
      confidence: pref.confidence,
      tags: [pref.category],
      encrypted: false,
      version: 1,
    };
  }

  async query(query: MemoryQuery): Promise<MemoryEntry[]> {
    const results: MemoryEntry[] = [];

    for (const pref of this.preferences.values()) {
      if (query.key && pref.key !== query.key) continue;
      if (query.tags && !query.tags.some(tag => pref.category === tag)) continue;
      if (query.minConfidence && pref.confidence < query.minConfidence) continue;

      results.push({
        id: pref.id,
        layer: 'preference' as any,
        key: pref.key,
        value: pref.value,
        priority: 2,
        contextScope: ContextScope.GLOBAL,
        createdAt: pref.updatedAt,
        updatedAt: pref.updatedAt,
        source: { type: pref.source },
        confidence: pref.confidence,
        tags: [pref.category],
        encrypted: false,
        version: 1,
      });
    }

    return results;
  }

  async delete(key: string, scope?: ContextScope): Promise<void> {
    this.preferences.delete(key);
  }

  async deleteByScope(scopes: ContextScope[]): Promise<number> {
    // Preferences are global scope only
    return 0;
  }

  async getStats(): Promise<{ count: number; bytes: number; oldest: Date; newest: Date }> {
    const all = Array.from(this.preferences.values());
    const bytes = all.reduce((sum, p) => sum + JSON.stringify(p).length * 2, 0);

    return {
      count: all.length,
      bytes,
      oldest: all.length > 0 ? all.reduce((min, p) => p.updatedAt < min ? p.updatedAt : min, all[0].updatedAt) : new Date(),
      newest: all.length > 0 ? all.reduce((max, p) => p.updatedAt > max ? p.updatedAt : max, all[0].updatedAt) : new Date(),
    };
  }

  async export(scopes: ContextScope[]): Promise<MemoryEntry[]> {
    return this.query({});
  }

  async cleanup(): Promise<void> {
    // Preferences don't auto-expire
  }

  getCategories(): PreferenceCategory[] {
    const categories = new Map<string, PreferenceCategory>();

    for (const pref of this.preferences.values()) {
      if (!categories.has(pref.category)) {
        categories.set(pref.category, {
          name: pref.category,
          description: '',
          scope: ContextScope.GLOBAL,
          editable: true,
          deletable: true,
          entries: [],
        });
      }
      categories.get(pref.category)!.entries.push(pref);
    }

    return Array.from(categories.values());
  }
}