/**
 * ASIS Layer 6 — Offline Queue System
 * Queued withdrawals, delayed sync, temporary offline operation, retries
 * Africa-first: internet cannot be assumed permanent
 */

import { OfflineTransaction, OperationalState } from './types';
import { IOfflineSyncProvider } from './interfaces';
import { EventBus } from '../kernel/event-bus';

export class OfflineQueue implements IOfflineSyncProvider {
  const name = 'mtaa_offline_queue';
  private queue: OfflineTransaction[] = [];
  private maxRetries: number = 5;
  private retryDelays: number[] = [5000, 15000, 30000, 60000, 300000]; // 5s, 15s, 30s, 1m, 5m
  private eventBus: EventBus;
  private syncInProgress: boolean = false;

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
    this.startAutoSync();
  }

  /**
   * Queue transaction for later sync
   */
  async queue(transaction: Omit<OfflineTransaction, 'id' | 'status' | 'retryCount' | 'localTimestamp'>): Promise<void> {
    const queued: OfflineTransaction = {
      ...transaction,
      id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      status: 'queued',
      retryCount: 0,
      maxRetries: this.maxRetries,
      localTimestamp: new Date(),
    };

    this.queue.push(queued);

    this.eventBus.emit('offline:queued', {
      transactionId: queued.id,
      type: queued.type,
      amount: queued.amount,
      cashPointId: queued.cashPointId,
    });

    // Try immediate sync if online
    this.attemptSync();
  }

  /**
   * Get queued transactions
   */
  async getQueued(cashPointId?: string): Promise<OfflineTransaction[]> {
    let queued = this.queue.filter(t => t.status === 'queued' || t.status === 'failed');

    if (cashPointId) {
      queued = queued.filter(t => t.cashPointId === cashPointId);
    }

    return queued;
  }

  /**
   * Sync queued transactions
   */
  async sync(): Promise<{ synced: number; failed: number; pending: number }> {
    if (this.syncInProgress) {
      return { synced: 0, failed: 0, pending: this.queue.filter(t => t.status === 'queued').length };
    }

    this.syncInProgress = true;
    let synced = 0;
    let failed = 0;

    try {
      const toSync = this.queue.filter(t => t.status === 'queued' || t.status === 'failed');

      for (const transaction of toSync) {
        try {
          await this.processTransaction(transaction);
          transaction.status = 'synced';
          transaction.serverTimestamp = new Date();
          synced++;

          this.eventBus.emit('offline:synced', {
            transactionId: transaction.id,
            type: transaction.type,
          });
        } catch (error) {
          transaction.retryCount++;

          if (transaction.retryCount >= transaction.maxRetries) {
            transaction.status = 'failed';
            failed++;

            this.eventBus.emit('offline:failed', {
              transactionId: transaction.id,
              error: (error as Error).message,
            });
          } else {
            // Schedule retry
            this.scheduleRetry(transaction);
          }
        }
      }
    } finally {
      this.syncInProgress = false;
    }

    const pending = this.queue.filter(t => t.status === 'queued').length;
    return { synced, failed, pending };
  }

  /**
   * Cancel a queued transaction
   */
  cancel(transactionId: string): boolean {
    const transaction = this.queue.find(t => t.id === transactionId);
    if (!transaction || transaction.status === 'synced') return false;

    transaction.status = 'cancelled';

    this.eventBus.emit('offline:cancelled', {
      transactionId,
      type: transaction.type,
    });

    return true;
  }

  /**
   * Get queue stats
   */
  getStats(): { total: number; queued: number; synced: number; failed: number; cancelled: number } {
    return {
      total: this.queue.length,
      queued: this.queue.filter(t => t.status === 'queued').length,
      synced: this.queue.filter(t => t.status === 'synced').length,
      failed: this.queue.filter(t => t.status === 'failed').length,
      cancelled: this.queue.filter(t => t.status === 'cancelled').length,
    };
  }

  async health(): Promise<{ available: boolean; latency: number }> {
    return { available: true, latency: 0 };
  }

  private async processTransaction(transaction: OfflineTransaction): Promise<void> {
    // Scaffold: would call actual transaction processor
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Simulate occasional failure for testing
    if (Math.random() < 0.1) {
      throw new Error('Network unavailable');
    }
  }

  private scheduleRetry(transaction: OfflineTransaction): void {
    const delay = this.retryDelays[Math.min(transaction.retryCount, this.retryDelays.length - 1)];

    setTimeout(() => {
      if (transaction.status === 'queued' || transaction.status === 'failed') {
        this.attemptSync();
      }
    }, delay);
  }

  private attemptSync(): void {
    // Check if online (simplified)
    if (navigator?.onLine) {
      this.sync();
    }
  }

  private startAutoSync(): void {
    // Listen for online events
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.eventBus.emit('network:online', {});
        this.sync();
      });
    }

    // Periodic sync attempt
    setInterval(() => this.attemptSync(), 30000);
  }
}