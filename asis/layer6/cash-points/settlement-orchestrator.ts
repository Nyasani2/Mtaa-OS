/**
 * ASIS Layer 6 — Settlement Orchestrator
 * Pending settlements, reconciliation scaffolding, batching, delayed support
 * NO real settlement execution — architecture only
 */

import { SettlementBatch, SettlementMode } from './types';
import { ISettlementProvider } from './interfaces';
import { EventBus } from '../kernel/event-bus';

export class SettlementOrchestrator implements ISettlementProvider {
  const name = 'mtaa_settlement_orchestrator';
  private batches: Map<string, SettlementBatch> = new Map();
  private pendingTransactions: Map<string, { batchId?: string; status: string }> = new Map();
  private eventBus: EventBus;

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
  }

  /**
   * Create settlement batch
   */
  async createBatch(transactions: string[], route: string): Promise<SettlementBatch> {
    const batch: SettlementBatch = {
      id: `batch_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      status: 'pending',
      transactions,
      totalAmount: 0, // Would calculate from transaction data
      currency: 'KES', // Would determine from route
      route,
      createdAt: new Date(),
      scheduledAt: new Date(Date.now() + 3600000), // Default: 1 hour delay
      reconciled: false,
    };

    this.batches.set(batch.id, batch);

    // Link transactions to batch
    for (const tx of transactions) {
      this.pendingTransactions.set(tx, { batchId: batch.id, status: 'pending' });
    }

    this.eventBus.emit('settlement:batch_created', {
      batchId: batch.id,
      transactionCount: transactions.length,
      route,
      scheduledAt: batch.scheduledAt,
    });

    return batch;
  }

  /**
   * Schedule batch for immediate or delayed settlement
   */
  async scheduleBatch(batchId: string, mode: SettlementMode, delayMinutes?: number): Promise<SettlementBatch> {
    const batch = this.batches.get(batchId);
    if (!batch) throw new SettlementError(`Batch ${batchId} not found`);

    switch (mode) {
      case SettlementMode.INSTANT:
        batch.scheduledAt = new Date();
        break;
      case SettlementMode.DELAYED:
        batch.scheduledAt = new Date(Date.now() + (delayMinutes || 60) * 60000);
        break;
      case SettlementMode.BATCHED:
        // Keep existing schedule or set to end of day
        batch.scheduledAt = new Date(Date.now() + 86400000);
        break;
      case SettlementMode.MANUAL:
        batch.status = 'pending';
        break;
    }

    this.eventBus.emit('settlement:batch_scheduled', {
      batchId,
      mode,
      scheduledAt: batch.scheduledAt,
    });

    return batch;
  }

  /**
   * Get batch status
   */
  async getBatchStatus(batchId: string): Promise<SettlementBatch> {
    const batch = this.batches.get(batchId);
    if (!batch) throw new SettlementError(`Batch ${batchId} not found`);
    return batch;
  }

  /**
   * Reconcile batch
   */
  async reconcile(batchId: string): Promise<{ matched: number; unmatched: number; discrepancies: string[] }> {
    const batch = this.batches.get(batchId);
    if (!batch) throw new SettlementError(`Batch ${batchId} not found`);

    // Scaffold reconciliation
    const matched = batch.transactions.length;
    const unmatched = 0;
    const discrepancies: string[] = [];

    batch.reconciled = true;
    batch.status = 'completed';
    batch.completedAt = new Date();

    this.eventBus.emit('settlement:batch_reconciled', {
      batchId,
      matched,
      unmatched,
      discrepancies,
    });

    return { matched, unmatched, discrepancies };
  }

  /**
   * Get pending batches
   */
  getPendingBatches(): SettlementBatch[] {
    return Array.from(this.batches.values()).filter(b => b.status === 'pending');
  }

  /**
   * Get batch for a transaction
   */
  getBatchForTransaction(transactionId: string): SettlementBatch | undefined {
    const pending = this.pendingTransactions.get(transactionId);
    if (pending?.batchId) {
      return this.batches.get(pending.batchId);
    }
    return undefined;
  }

  /**
   * Process due batches (called by scheduler)
   */
  async processDueBatches(): Promise<Array<{ batchId: string; processed: boolean; error?: string }>> {
    const now = new Date();
    const due = Array.from(this.batches.values()).filter(
      b => b.status === 'pending' && b.scheduledAt <= now
    );

    const results = [];
    for (const batch of due) {
      try {
        batch.status = 'processing';

        // Scaffold: would call actual settlement provider
        await this.simulateSettlement(batch);

        batch.status = 'completed';
        batch.completedAt = new Date();

        results.push({ batchId: batch.id, processed: true });

        this.eventBus.emit('settlement:batch_completed', {
          batchId: batch.id,
          transactionCount: batch.transactions.length,
        });
      } catch (error) {
        batch.status = 'failed';
        results.push({ batchId: batch.id, processed: false, error: (error as Error).message });
      }
    }

    return results;
  }

  async health(): Promise<{ available: boolean; latency: number }> {
    return { available: true, latency: 0 };
  }

  private async simulateSettlement(batch: SettlementBatch): Promise<void> {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

export class SettlementError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SettlementError';
  }
}