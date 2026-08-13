/**
 * ASIS v7 Knowledge Store
 * Persistent storage for user knowledge graph and collective patterns
 * Uses AsyncStorage for local persistence
 * Supabase for collective pattern sharing
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { KnowledgeGraph, CollectivePattern, Observation } from '../types';

const STORAGE_KEYS = {
  USER_KNOWLEDGE: 'asis_v7_user_knowledge',
  COLLECTIVE_PATTERNS: 'asis_v7_collective_patterns',
  SESSION_HISTORY: 'asis_v7_session_history',
  USER_PREFERENCES: 'asis_v7_user_preferences',
};

export class KnowledgeStore {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  async saveKnowledgeGraph(graph: KnowledgeGraph): Promise<void> {
    try {
      const key = `${STORAGE_KEYS.USER_KNOWLEDGE}_${this.userId}`;
      await AsyncStorage.setItem(key, JSON.stringify(graph));
    } catch (error) {
      console.warn('[ASIS Store] Failed to save knowledge graph:', error);
    }
  }

  async loadKnowledgeGraph(): Promise<KnowledgeGraph | null> {
    try {
      const key = `${STORAGE_KEYS.USER_KNOWLEDGE}_${this.userId}`;
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.warn('[ASIS Store] Failed to load knowledge graph:', error);
      return null;
    }
  }

  async saveCollectivePatterns(patterns: CollectivePattern[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.COLLECTIVE_PATTERNS, JSON.stringify(patterns));
    } catch (error) {
      console.warn('[ASIS Store] Failed to save patterns:', error);
    }
  }

  async loadCollectivePatterns(): Promise<CollectivePattern[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.COLLECTIVE_PATTERNS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.warn('[ASIS Store] Failed to load patterns:', error);
      return [];
    }
  }

  async appendSessionHistory(observation: Observation): Promise<void> {
    try {
      const key = `${STORAGE_KEYS.SESSION_HISTORY}_${this.userId}`;
      const existing = await AsyncStorage.getItem(key);
      const history: Observation[] = existing ? JSON.parse(existing) : [];
      history.push(observation);
      if (history.length > 100) history.shift();
      await AsyncStorage.setItem(key, JSON.stringify(history));
    } catch (error) {
      console.warn('[ASIS Store] Failed to append history:', error);
    }
  }

  async loadSessionHistory(): Promise<Observation[]> {
    try {
      const key = `${STORAGE_KEYS.SESSION_HISTORY}_${this.userId}`;
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.warn('[ASIS Store] Failed to load history:', error);
      return [];
    }
  }

  async savePreference(key: string, value: any): Promise<void> {
    try {
      const storageKey = `${STORAGE_KEYS.USER_PREFERENCES}_${this.userId}`;
      const existing = await AsyncStorage.getItem(storageKey);
      const prefs = existing ? JSON.parse(existing) : {};
      prefs[key] = value;
      await AsyncStorage.setItem(storageKey, JSON.stringify(prefs));
    } catch (error) {
      console.warn('[ASIS Store] Failed to save preference:', error);
    }
  }

  async loadPreference(key: string): Promise<any | null> {
    try {
      const storageKey = `${STORAGE_KEYS.USER_PREFERENCES}_${this.userId}`;
      const data = await AsyncStorage.getItem(storageKey);
      const prefs = data ? JSON.parse(data) : {};
      return prefs[key] ?? null;
    } catch (error) {
      console.warn('[ASIS Store] Failed to load preference:', error);
      return null;
    }
  }

  async clearAll(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const asisKeys = keys.filter((k: any) => k.startsWith('asis_v7_'));
      await AsyncStorage.multiRemove(asisKeys);
    } catch (error) {
      console.warn('[ASIS Store] Failed to clear data:', error);
    }
  }

  async getStorageStats(): Promise<{
    knowledgeGraphSize: number;
    patternsCount: number;
    historyCount: number;
    totalSize: number;
  }> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const asisKeys = keys.filter((k: any) => k.startsWith('asis_v7_'));
      const items = await AsyncStorage.multiGet(asisKeys);
      let totalSize = 0;
      let knowledgeGraphSize = 0;
      let patternsCount = 0;
      let historyCount = 0;

      for (const [key, value] of items) {
        if (value) {
          const size = new Blob([value]).size;
          totalSize += size;
          if (key.includes('user_knowledge')) knowledgeGraphSize = size;
          if (key.includes('collective_patterns')) {
            const patterns = JSON.parse(value);
            patternsCount = patterns.length;
          }
          if (key.includes('session_history')) {
            const history = JSON.parse(value);
            historyCount = history.length;
          }
        }
      }

      return { knowledgeGraphSize, patternsCount, historyCount, totalSize };
    } catch {
      return { knowledgeGraphSize: 0, patternsCount: 0, historyCount: 0, totalSize: 0 };
    }
  }
}

const storeInstances = new Map<string, KnowledgeStore>();

export function getKnowledgeStore(userId: string): KnowledgeStore {
  if (!storeInstances.has(userId)) {
    storeInstances.set(userId, new KnowledgeStore(userId));
  }
  return storeInstances.get(userId)!;
}
