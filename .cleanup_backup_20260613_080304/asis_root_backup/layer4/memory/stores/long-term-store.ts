/**
 * ASIS Layer 4 — Long Term Memory Store
 * Persistent facts with SQLite/IndexedDB backing
 * Supports offline-first with local cache
 */

import { MemoryEntry, MemoryQuery, ContextScope } from '../../types/memory.types';
import { MemoryStore } from '../memory-engine';

export class LongTermStore implements MemoryStore {
  private cache: Map<string, MemoryEntry> = new Map();
  private db: IDBDatabase | null = null;
  private dbName = 'asis_long_term';
  private storeName = 'memories';
  private maxCacheSize: number;

  constructor(maxEntries: number) {
    this.maxCacheSize = Math.min(maxEntries, 100); // Keep cache small for mobile
    this.initDB();
  }

  private async initDB(): Promise<void> {
    if (typeof window === 'undefined') return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
          store.createIndex('key_scope', ['key', 'contextScope'], { unique: false });
          store.createIndex('layer', 'layer', { unique: false });
          store.createIndex('tags', 'tags', { unique: false, multiEntry: true });
        }
      };
    });
  }

  async set(entry: MemoryEntry): Promise<void> {
    const key = this.makeKey(entry.key, entry.contextScope);
    this.cache.set(key, entry);
    this.trimCache();

    if (this.db) {
      const tx = this.db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      await new Promise<void>((resolve, reject) => {
        const req = store.put(entry);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    }
  }

  async get(key: string, scope?: ContextScope): Promise<MemoryEntry | null> {
    const fullKey = this.makeKey(key, scope);

    // Check cache first
    const cached = this.cache.get(fullKey);
    if (cached) return cached;

    // Fallback to DB
    if (this.db) {
      const tx = this.db.transaction(this.storeName, 'readonly');
      const store = tx.objectStore(this.storeName);
      const index = store.index('key_scope');

      return new Promise((resolve, reject) => {
        const range = IDBKeyRange.only([key, scope || 'global']);
        const req = index.openCursor(range);
        let found: MemoryEntry | null = null;

        req.onsuccess = () => {
          const cursor = req.result;
          if (cursor) {
            found = cursor.value;
            cursor.continue();
          } else {
            if (found) this.cache.set(fullKey, found);
            resolve(found);
          }
        };
        req.onerror = () => reject(req.error);
      });
    }

    return null;
  }

  async query(query: MemoryQuery): Promise<MemoryEntry[]> {
    // Use cache for simple queries, DB for complex
    const results: MemoryEntry[] = [];

    for (const entry of this.cache.values()) {
      if (this.matchesQuery(entry, query)) results.push(entry);
    }

    if (this.db && results.length < (query.limit || 50)) {
      // Supplement from DB
      const tx = this.db.transaction(this.storeName, 'readonly');
      const store = tx.objectStore(this.storeName);

      return new Promise((resolve, reject) => {
        const req = store.openCursor();
        const dbResults: MemoryEntry[] = [];

        req.onsuccess = () => {
          const cursor = req.result;
          if (cursor && dbResults.length < (query.limit || 50)) {
            const entry = cursor.value;
            if (this.matchesQuery(entry, query) && !results.some(r => r.id === entry.id)) {
              dbResults.push(entry);
            }
            cursor.continue();
          } else {
            resolve([...results, ...dbResults]);
          }
        };
        req.onerror = () => reject(req.error);
      });
    }

    return results;
  }

  async delete(key: string, scope?: ContextScope): Promise<void> {
    const fullKey = this.makeKey(key, scope);
    this.cache.delete(fullKey);

    if (this.db) {
      const tx = this.db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      const index = store.index('key_scope');

      return new Promise((resolve, reject) => {
        const range = IDBKeyRange.only([key, scope || 'global']);
        const req = index.openCursor(range);

        req.onsuccess = () => {
          const cursor = req.result;
          if (cursor) {
            cursor.delete();
            cursor.continue();
          } else {
            resolve();
          }
        };
        req.onerror = () => reject(req.error);
      });
    }
  }

  async deleteByScope(scopes: ContextScope[]): Promise<number> {
    let deleted = 0;

    for (const [key, entry] of this.cache) {
      if (scopes.includes(entry.contextScope)) {
        this.cache.delete(key);
        deleted++;
      }
    }

    if (this.db) {
      const tx = this.db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);

      return new Promise((resolve, reject) => {
        const req = store.openCursor();

        req.onsuccess = () => {
          const cursor = req.result;
          if (cursor) {
            const entry = cursor.value;
            if (scopes.includes(entry.contextScope)) {
              cursor.delete();
              deleted++;
            }
            cursor.continue();
          } else {
            resolve(deleted);
          }
        };
        req.onerror = () => reject(req.error);
      });
    }

    return deleted;
  }

  async getStats(): Promise<{ count: number; bytes: number; oldest: Date; newest: Date }> {
    const all = Array.from(this.cache.values());
    const bytes = all.reduce((sum, e) => sum + JSON.stringify(e).length * 2, 0);

    return {
      count: all.length,
      bytes,
      oldest: all.length > 0 ? all.reduce((min, e) => e.createdAt < min ? e.createdAt : min, all[0].createdAt) : new Date(),
      newest: all.length > 0 ? all.reduce((max, e) => e.createdAt > max ? e.createdAt : max, all[0].createdAt) : new Date(),
    };
  }

  async export(scopes: ContextScope[]): Promise<MemoryEntry[]> {
    return Array.from(this.cache.values()).filter(
      e => scopes.includes(e.contextScope) || e.contextScope === ContextScope.GLOBAL
    );
  }

  async cleanup(): Promise<void> {
    // Long-term doesn't auto-expire, but we can compact
    this.trimCache();
  }

  private makeKey(key: string, scope?: ContextScope): string {
    return scope ? `${scope}:${key}` : key;
  }

  private trimCache(): void {
    while (this.cache.size > this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
  }

  private matchesQuery(entry: MemoryEntry, query: MemoryQuery): boolean {
    if (query.key && entry.key !== query.key) return false;
    if (query.keyPattern && !new RegExp(query.keyPattern).test(entry.key)) return false;
    if (query.tags && !query.tags.some(tag => entry.tags.includes(tag))) return false;
    if (query.minConfidence && entry.confidence < query.minConfidence) return false;
    if (query.after && entry.createdAt < query.after) return false;
    if (query.before && entry.createdAt > query.before) return false;
    return true;
  }
}
