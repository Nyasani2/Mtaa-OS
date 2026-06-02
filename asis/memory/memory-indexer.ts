/**
 * ASIS Layer 4 — Memory Indexer
 * Fast lookup indexes for memory entries
 * Lightweight, mobile-optimized
 */

import { MemoryEntry, MemoryLayer, ContextScope } from '../types/memory.types';

export class MemoryIndexer {
  private indexByTag: Map<string, Set<string>> = new Map();
  private indexByScope: Map<ContextScope, Set<string>> = new Map();
  private indexByLayer: Map<MemoryLayer, Set<string>> = new Map();
  private indexByKey: Map<string, string> = new Map();

  /**
   * Index a memory entry
   */
  index(entry: MemoryEntry): void {
    // Index by ID for key lookup
    this.indexByKey.set(this.makeKey(entry.key, entry.contextScope), entry.id);

    // Index by layer
    if (!this.indexByLayer.has(entry.layer)) {
      this.indexByLayer.set(entry.layer, new Set());
    }
    this.indexByLayer.get(entry.layer)!.add(entry.id);

    // Index by scope
    if (!this.indexByScope.has(entry.contextScope)) {
      this.indexByScope.set(entry.contextScope, new Set());
    }
    this.indexByScope.get(entry.contextScope)!.add(entry.id);

    // Index by tags
    for (const tag of entry.tags) {
      if (!this.indexByTag.has(tag)) {
        this.indexByTag.set(tag, new Set());
      }
      this.indexByTag.get(tag)!.add(entry.id);
    }
  }

  /**
   * Remove from index
   */
  remove(entryId: string): void {
    // Remove from all indexes
    for (const [tag, set] of this.indexByTag) {
      set.delete(entryId);
    }
    for (const [scope, set] of this.indexByScope) {
      set.delete(entryId);
    }
    for (const [layer, set] of this.indexByLayer) {
      set.delete(entryId);
    }

    // Remove from key index
    for (const [key, id] of this.indexByKey) {
      if (id === entryId) {
        this.indexByKey.delete(key);
      }
    }
  }

  /**
   * Find by tag
   */
  findByTag(tag: string): Set<string> {
    return this.indexByTag.get(tag) || new Set();
  }

  /**
   * Find by scope
   */
  findByScope(scope: ContextScope): Set<string> {
    return this.indexByScope.get(scope) || new Set();
  }

  /**
   * Find by layer
   */
  findByLayer(layer: MemoryLayer): Set<string> {
    return this.indexByLayer.get(layer) || new Set();
  }

  /**
   * Find by key
   */
  findByKey(key: string, scope?: ContextScope): string | undefined {
    return this.indexByKey.get(this.makeKey(key, scope));
  }

  /**
   * Intersection search
   */
  intersect(...sets: Set<string>[]): Set<string> {
    if (sets.length === 0) return new Set();
    const result = new Set(sets[0]);
    for (let i = 1; i < sets.length; i++) {
      for (const id of result) {
        if (!sets[i].has(id)) {
          result.delete(id);
        }
      }
    }
    return result;
  }

  /**
   * Union search
   */
  union(...sets: Set<string>[]): Set<string> {
    const result = new Set<string>();
    for (const set of sets) {
      for (const id of set) {
        result.add(id);
      }
    }
    return result;
  }

  /**
   * Get index stats
   */
  getStats(): { tags: number; scopes: number; layers: number; keys: number } {
    return {
      tags: this.indexByTag.size,
      scopes: this.indexByScope.size,
      layers: this.indexByLayer.size,
      keys: this.indexByKey.size,
    };
  }

  private makeKey(key: string, scope?: ContextScope): string {
    return scope ? `${scope}:${key}` : key;
  }
}
