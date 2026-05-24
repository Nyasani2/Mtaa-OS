/**
 * ASIS Layer 6 — Operational State System
 * ONLINE / OFFLINE / LOW_LIQUIDITY / SUSPENDED / MAINTENANCE
 * Cash points only appear publicly when ONLINE = true
 */

import { CashPoint, OperationalState } from './types';
import { CashPointEngine } from './cash-point-engine';
import { LiquidityManager } from './liquidity-manager';
import { EventBus } from '../kernel/event-bus';

export class OperationalStateManager {
  private engine: CashPointEngine;
  private liquidity: LiquidityManager;
  private eventBus: EventBus;
  private stateHistory: Map<string, Array<{ state: OperationalState; timestamp: Date; reason?: string }>> = new Map();

  constructor(engine: CashPointEngine, liquidity: LiquidityManager, eventBus: EventBus) {
    this.engine = engine;
    this.liquidity = liquidity;
    this.eventBus = eventBus;
  }

  /**
   * Transition cash point to new state
   */
  async transition(cashPointId: string, newState: OperationalState, reason?: string): Promise<boolean> {
    const point = await this.engine.getById(cashPointId);
    if (!point) return false;

    const oldState = point.status;
    if (oldState === newState) return true;

    // Validate transition
    if (!this.isValidTransition(oldState, newState)) {
      return false;
    }

    // Update state
    await this.engine.updateStatus(cashPointId, newState);

    // Record history
    const history = this.stateHistory.get(cashPointId) || [];
    history.push({ state: newState, timestamp: new Date(), reason });
    this.stateHistory.set(cashPointId, history.slice(-50));

    // Emit event
    this.eventBus.emit('cashpoint:state_transition', {
      cashPointId,
      oldState,
      newState,
      reason,
      timestamp: new Date(),
    });

    return true;
  }

  /**
   * Auto-detect state based on health checks
   */
  async autoDetectState(cashPointId: string): Promise<OperationalState> {
    const point = await this.engine.getById(cashPointId);
    if (!point) return OperationalState.OFFLINE;

    // Check last seen
    const minutesSinceSeen = (Date.now() - point.lastSeen.getTime()) / 60000;
    if (minutesSinceSeen > 60) {
      return OperationalState.OFFLINE;
    }

    // Check liquidity
    for (const currency of point.currencies) {
      const snapshot = await this.liquidity.getLiquidity(cashPointId, currency);
      if (snapshot && snapshot.healthScore < 0.2) {
        return OperationalState.LOW_LIQUIDITY;
      }
    }

    // Check if currently in maintenance window
    if (this.isInMaintenanceWindow(point)) {
      return OperationalState.MAINTENANCE;
    }

    return OperationalState.ONLINE;
  }

  /**
   * Get public-visible cash points (only ONLINE)
   */
  async getPublicCashPoints(country?: string): Promise<CashPoint[]> {
    const all = country 
      ? this.engine.getByCountry(country)
      : []; // Would need getAll method

    return all.filter(p => p.status === OperationalState.ONLINE);
  }

  /**
   * Get state history
   */
  getStateHistory(cashPointId: string): Array<{ state: OperationalState; timestamp: Date; reason?: string }> {
    return this.stateHistory.get(cashPointId) || [];
  }

  /**
   * Get uptime stats
   */
  getUptimeStats(cashPointId: string, days: number = 7): {
    uptime: number;
    downtime: number;
    transitions: number;
  } {
    const history = this.stateHistory.get(cashPointId) || [];
    const cutoff = new Date(Date.now() - days * 86400000);

    const relevant = history.filter(h => h.timestamp >= cutoff);
    const onlineTime = relevant.filter(h => h.state === OperationalState.ONLINE).length;
    const total = relevant.length;

    return {
      uptime: total > 0 ? (onlineTime / total) * 100 : 0,
      downtime: total > 0 ? ((total - onlineTime) / total) * 100 : 0,
      transitions: relevant.length,
    };
  }

  private isValidTransition(from: OperationalState, to: OperationalState): boolean {
    const validTransitions: Record<OperationalState, OperationalState[]> = {
      [OperationalState.ONLINE]: [OperationalState.OFFLINE, OperationalState.LOW_LIQUIDITY, OperationalState.SUSPENDED, OperationalState.MAINTENANCE],
      [OperationalState.OFFLINE]: [OperationalState.ONLINE, OperationalState.SUSPENDED, OperationalState.MAINTENANCE],
      [OperationalState.LOW_LIQUIDITY]: [OperationalState.ONLINE, OperationalState.OFFLINE, OperationalState.SUSPENDED],
      [OperationalState.SUSPENDED]: [OperationalState.OFFLINE, OperationalState.MAINTENANCE],
      [OperationalState.MAINTENANCE]: [OperationalState.OFFLINE, OperationalState.ONLINE],
    };

    return validTransitions[from]?.includes(to) || false;
  }

  private isInMaintenanceWindow(point: CashPoint): boolean {
    const now = new Date();
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const day = dayNames[now.getDay()];
    const schedule = point.operatingHours.schedule.find(s => s.day === day);

    if (!schedule || schedule.closed) return false;

    const currentTime = now.getHours() * 60 + now.getMinutes();
    const [openH, openM] = schedule.open.split(':').map(Number);
    const openMinutes = openH * 60 + openM;

    // Consider 1 hour before opening as maintenance
    return currentTime < openMinutes && currentTime >= openMinutes - 60;
  }
}
