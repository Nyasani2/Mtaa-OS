// @ts-nocheck
import AsyncStorage from '@react-native-async-storage/async-storage';

interface CacheItem<T> { data: T; expiry: number; }

export class LocalCache {
  private prefix = 'asis_cache_';

  async get<T>(key: string): Promise<T | null> {
    try {
      const raw = await AsyncStorage.getItem(this.prefix + key);
      if (!raw) return null;
      const item: CacheItem<T> = JSON.parse(raw);
      if (Date.now() > item.expiry) {
        await AsyncStorage.removeItem(this.prefix + key);
        return null;
      }
      return item.data;
    } catch { return null; }
  }

  async set<T>(key: string, data: T, ttlMs = 300000): Promise<void> { // 5 min default
    try {
      const item: CacheItem<T> = { data, expiry: Date.now() + ttlMs };
      await AsyncStorage.setItem(this.prefix + key, JSON.stringify(item));
    } catch (e) { console.warn('Cache set failed', e); }
  }

  async clear(): Promise<void> {
    const keys = await AsyncStorage.getAllKeys();
    const asisKeys = keys.filter(k => k.startsWith(this.prefix));
    await AsyncStorage.multiRemove(asisKeys);
  }
}
export const localCache = new LocalCache();
