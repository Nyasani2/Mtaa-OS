// lib/mtaa/offline/cache-manager.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

interface CacheEntry<T> { data: T; timestamp: number; ttlMs: number; }

class CacheManager {
  private memoryCache = new Map<string, CacheEntry<any>>();
  private readonly DEFAULT_TTL_MS = 300000;

  async get<T>(key: string): Promise<T|null> {
    const memEntry = this.memoryCache.get(key);
    if (memEntry && !this.isExpired(memEntry)) return memEntry.data;
    try {
      const stored = await AsyncStorage.getItem(`cache:${key}`);
      if (stored) {
        const entry: CacheEntry<T> = JSON.parse(stored);
        if (!this.isExpired(entry)) { this.memoryCache.set(key, entry); return entry.data; }
      }
    } catch { /* storage read failed */ }
    return null;
  }

  async set<T>(key: string, data: T, ttlMs?: number): Promise<void> {
    const entry: CacheEntry<T> = { data, timestamp: Date.now(), ttlMs: ttlMs || this.DEFAULT_TTL_MS };
    this.memoryCache.set(key, entry);
    try { await AsyncStorage.setItem(`cache:${key}`, JSON.stringify(entry)); } catch { /* ignore */ }
  }

  async invalidate(key: string): Promise<void> {
    this.memoryCache.delete(key);
    try { await AsyncStorage.removeItem(`cache:${key}`); } catch { /* ignore */ }
  }

  async invalidatePattern(pattern: string): Promise<void> {
    Array.from(this.memoryCache.keys()).filter(k => k.includes(pattern)).forEach(k => this.memoryCache.delete(k));
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      await AsyncStorage.multiRemove(allKeys.filter(k => k.startsWith('cache:') && k.includes(pattern)));
    } catch { /* ignore */ }
  }

  private isExpired(entry: CacheEntry<any>): boolean { return Date.now() - entry.timestamp > entry.ttlMs; }
}
export const cacheManager = new CacheManager();
