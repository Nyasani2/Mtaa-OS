// lib/mtaa/offline/state-persistence.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface PersistedState { key: string; data: unknown; version: number; timestamp: number; }

class StatePersistence {
  private readonly PREFIX = 'mtaa_state_'; private readonly CURRENT_VERSION = 1;

  async save<T>(key: string, data: T): Promise<void> {
    await AsyncStorage.setItem(`${this.PREFIX}${key}`, JSON.stringify({ key, data, version: this.CURRENT_VERSION, timestamp: Date.now() }));
  }

  async load<T>(key: string): Promise<T|null> {
    try {
      const stored = await AsyncStorage.getItem(`${this.PREFIX}${key}`);
      if (!stored) return null;
      const state: PersistedState = JSON.parse(stored);
      if (state.version !== this.CURRENT_VERSION) return null;
      return state.data as T;
    } catch { return null; }
  }

  async remove(key: string): Promise<void> { await AsyncStorage.removeItem(`${this.PREFIX}${key}`); }
  async clearAll(): Promise<void> {
    const keys = await AsyncStorage.getAllKeys();
    await AsyncStorage.multiRemove(keys.filter(k => k.startsWith(this.PREFIX)));
  }
}
export const statePersistence = new StatePersistence();
