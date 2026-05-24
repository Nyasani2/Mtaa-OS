/**
 * ASIS Layer 6 — Liquidity Manager
 * Float estimation, health scoring, route viability, low-liquidity warnings
 * NO real treasury systems — estimation and monitoring only
 */

import { CashPoint, LiquiditySnapshot, OperationalState } from './types';
import { CashPointEngine } from './cash-point-engine';
import { EventBus } from '../kernel/event-bus';

export class LiquidityManager {
  private engine: CashPointEngine;
  private eventBus: EventBus;
  private snapshots: Map<string, Map<string, LiquiditySnapshot>> = new Map(); // cpId -> currency -> snapshot
  private healthThreshold: number = 0.3; // Below 30% = low liquidity

  constructor(engine: CashPointEngine, eventBus: EventBus) {
    this.engine = engine;
    this.eventBus = eventBus;
  }

  /**
   * Get liquidity snapshot for a cash point
   */
  async getLiquidity(cashPointId: string, currency: string): Promise<LiquiditySnapshot | null> {
    const point = await this.engine.getById(cashPointId);
    if (!point) return null;

    const available = point.liquidity[currency] || 0;
    const reserved = this.getReserved(cashPointId, currency);
    const pending = this.getPending(cashPointId, currency);
    const effectiveLiquidity = Math.max(0, available - reserved - pending);

    // Calculate health score (0-1)
    const typicalMax = point.maxAmount * 2; // Assume typical max float
    const healthScore = Math.min(1, effectiveLiquidity / typicalMax);

    // Determine trend
    const previous = this.getPreviousSnapshot(cashPointId, currency);
    let trend: LiquiditySnapshot['trend'] = 'stable';
    if (previous) {
      const ratio = effectiveLiquidity / previous.available;
      if (ratio > 1.1) trend = 'increasing';
      else if (ratio < 0.9) trend = 'decreasing';
    }

    const snapshot: LiquiditySnapshot = {
      cashPointId,
      currency,
      available: effectiveLiquidity,
      reserved,
      pending,
      healthScore,
      lastUpdated: new Date(),
      trend,
    };

    this.storeSnapshot(cashPointId, currency, snapshot);

    // Check for low liquidity
    if (healthScore < this.healthThreshold && point.status !== OperationalState.LOW_LIQUIDITY) {
      this.eventBus.emit('cashpoint:low_liquidity', {
        cashPointId,
        currency,
        healthScore,
        available: effectiveLiquidity,
      });
    }

    return snapshot;
  }

  /**
   * Check if cash point can handle a withdrawal
   */
  async canFulfill(cashPointId: string, currency: string, amount: number): Promise<{
    canFulfill: boolean;
    snapshot: LiquiditySnapshot | null;
    shortfall: number;
  }> {
    const snapshot = await this.getLiquidity(cashPointId, currency);
    if (!snapshot) {
      return { canFulfill: false, snapshot: null, shortfall: amount };
    }

    const shortfall = Math.max(0, amount - snapshot.available);
    return {
      canFulfill: shortfall === 0,
      snapshot,
      shortfall,
    };
  }

  /**
   * Reserve liquidity for a withdrawal
   */
  async reserve(cashPointId: string, currency: string, amount: number, ttlMinutes: number = 30): Promise<boolean> {
    const point = await this.engine.getById(cashPointId);
    if (!point) return false;

    const available = point.liquidity[currency] || 0;
    const reserved = this.getReserved(cashPointId, currency);

    if (available - reserved < amount) return false;

    // Add reservation
    const reservations = this.getReservations(cashPointId, currency);
    reservations.push({ amount, expiresAt: new Date(Date.now() + ttlMinutes * 60000) });

    // Auto-expire after TTL
    setTimeout(() => {
      this.release(cashPointId, currency, amount);
    }, ttlMinutes * 60000);

    return true;
  }

  /**
   * Release reservation
   */
  async release(cashPointId: string, currency: string, amount: number): Promise<void> {
    const reservations = this.getReservations(cashPointId, currency);
    const idx = reservations.findIndex(r => r.amount === amount);
    if (idx >= 0) {
      reservations.splice(idx, 1);
    }
  }

  /**
   * Update liquidity from agent report
   */
  async update(cashPointId: string, currency: string, amount: number): Promise<void> {
    const point = await this.engine.getById(cashPointId);
    if (!point) return;

    point.liquidity[currency] = amount;
    point.lastSeen = new Date();

    // Update status based on liquidity
    const snapshot = await this.getLiquidity(cashPointId, currency);
    if (snapshot && snapshot.healthScore < this.healthThreshold) {
      if (point.status === OperationalState.ONLINE) {
        await this.engine.updateStatus(cashPointId, OperationalState.LOW_LIQUIDITY);
      }
    } else if (snapshot && snapshot.healthScore >= this.healthThreshold) {
      if (point.status === OperationalState.LOW_LIQUIDITY) {
        await this.engine.updateStatus(cashPointId, OperationalState.ONLINE);
      }
    }
  }

  /**
   * Get liquidity health for all cash points
   */
  async getNetworkHealth(): Promise<{
    totalCashPoints: number;
    healthy: number;
    lowLiquidity: number;
    offline: number;
    byCurrency: Record<string, { total: number; healthy: number; avgHealth: number }>;
  }> {
    const allPoints = Array.from((this.engine as any).cashPoints?.values() || []);
    const byCurrency: Record<string, { total: number; healthy: number; avgHealth: number }> = {};

    let healthy = 0;
    let lowLiquidity = 0;
    let offline = 0;

    for (const point of allPoints) {
      if (point.status === OperationalState.OFFLINE) offline++;
      else if (point.status === OperationalState.LOW_LIQUIDITY) lowLiquidity++;
      else healthy++;

      for (const currency of point.currencies) {
        if (!byCurrency[currency]) {
          byCurrency[currency] = { total: 0, healthy: 0, avgHealth: 0 };
        }
        byCurrency[currency].total++;

        const snapshot = await this.getLiquidity(point.id, currency);
        if (snapshot) {
          byCurrency[currency].avgHealth += snapshot.healthScore;
          if (snapshot.healthScore >= this.healthThreshold) {
            byCurrency[currency].healthy++;
          }
        }
      }
    }

    // Average health scores
    for (const currency of Object.keys(byCurrency)) {
      const data = byCurrency[currency];
      data.avgHealth = data.total > 0 ? data.avgHealth / data.total : 0;
    }

    return {
      totalCashPoints: allPoints.length,
      healthy,
      lowLiquidity,
      offline,
      byCurrency,
    };
  }

  /**
   * Get balancing suggestions for agents
   */
  async getBalancingSuggestions(cashPointId: string): Promise<Array<{
    currency: string;
    action: 'add' | 'reduce' | 'maintain';
    suggestedAmount: number;
    reason: string;
  }>> {
    const point = await this.engine.getById(cashPointId);
    if (!point) return [];

    const suggestions = [];

    for (const currency of point.currencies) {
      const snapshot = await this.getLiquidity(cashPointId, currency);
      if (!snapshot) continue;

      if (snapshot.healthScore < 0.2) {
        suggestions.push({
          currency,
          action: 'add',
          suggestedAmount: point.maxAmount * 0.5,
          reason: `Critical liquidity: only ${snapshot.healthScore.toFixed(0)}% of typical float remaining`,
        });
      } else if (snapshot.healthScore > 0.9) {
        suggestions.push({
          currency,
          action: 'reduce',
          suggestedAmount: point.liquidity[currency] * 0.3,
          reason: 'Excess liquidity. Consider redistributing to nearby agents.',
        });
      } else {
        suggestions.push({
          currency,
          action: 'maintain',
          suggestedAmount: 0,
          reason: `Liquidity healthy at ${snapshot.healthScore.toFixed(0)}%`,
        });
      }
    }

    return suggestions;
  }

  private getReserved(cashPointId: string, currency: string): number {
    return this.getReservations(cashPointId, currency)
      .filter(r => r.expiresAt > new Date())
      .reduce((sum, r) => sum + r.amount, 0);
  }

  private getPending(cashPointId: string, currency: string): number {
    // Would integrate with transaction queue
    return 0;
  }

  private getReservations(cashPointId: string, currency: string): Array<{ amount: number; expiresAt: Date }> {
    const key = `${cashPointId}_${currency}`;
    // Store in a global reservations map (simplified)
    return [];
  }

  private getPreviousSnapshot(cashPointId: string, currency: string): LiquiditySnapshot | null {
    const cpSnapshots = this.snapshots.get(cashPointId);
    return cpSnapshots?.get(currency) || null;
  }

  private storeSnapshot(cashPointId: string, currency: string, snapshot: LiquiditySnapshot): void {
    if (!this.snapshots.has(cashPointId)) {
      this.snapshots.set(cashPointId, new Map());
    }
    this.snapshots.get(cashPointId)!.set(currency, snapshot);
  }
}
