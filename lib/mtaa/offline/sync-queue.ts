// lib/mtaa/offline/sync-queue.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface QueuedAction { id: string; type: string; payload: Record<string, unknown>; timestamp: number; retryCount: number; maxRetries: number; }

class SyncQueue {
  private readonly QUEUE_KEY = 'mtaa_sync_queue'; private processing = false;

  async enqueue(action: Omit<QueuedAction, 'id'|'timestamp'|'retryCount'>): Promise<void> {
    const queue = await this.getQueue();
    queue.push({ ...action, id: `${Date.now()}_${Math.random().toString(36).substr(2,9)}`, timestamp: Date.now(), retryCount: 0 });
    await this.saveQueue(queue);
  }

  async processQueue(processor: (action: QueuedAction) => Promise<boolean>): Promise<void> {
    if (this.processing) return; this.processing = true;
    const queue = await this.getQueue(); const remaining: QueuedAction[] = [];
    for (const action of queue) {
      try { const success = await processor(action); if (!success) { action.retryCount++; if (action.retryCount < action.maxRetries) remaining.push(action); } }
      catch { action.retryCount++; if (action.retryCount < action.maxRetries) remaining.push(action); }
    }
    await this.saveQueue(remaining); this.processing = false;
  }

  async getQueue(): Promise<QueuedAction[]> {
    try { const stored = await AsyncStorage.getItem(this.QUEUE_KEY); return stored ? JSON.parse(stored) : []; } catch { return []; }
  }

  private async saveQueue(queue: QueuedAction[]): Promise<void> {
    try { await AsyncStorage.setItem(this.QUEUE_KEY, JSON.stringify(queue)); } catch { /* ignore */ }
  }

  async clear(): Promise<void> { await AsyncStorage.removeItem(this.QUEUE_KEY); }
}
export const syncQueue = new SyncQueue();
