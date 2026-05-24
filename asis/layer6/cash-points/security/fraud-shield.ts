/**
 * ASIS Layer 6 — Fraud Shield
 * KYC verification, suspicious routing, abnormal liquidity, fake agents, duplicates
 * Lightweight — does NOT overbuild
 */

import { CashPoint, OperationalState, AgentVerification } from '../types';
import { CashPointEngine } from '../cash-point-engine';
import { EventBus } from '../../kernel/event-bus';

export class FraudShield {
  private engine: CashPointEngine;
  private eventBus: EventBus;
  private suspiciousAgents: Map<string, { flags: string[]; score: number; lastFlag: Date }> = new Map();

  constructor(engine: CashPointEngine, eventBus: EventBus) {
    this.engine = engine;
    this.eventBus = eventBus;
  }

  /**
   * Verify agent KYC
   */
  async verifyAgentKyc(agentId: string, verification: AgentVerification): Promise<boolean> {
    const point = await this.engine.getById(agentId);
    if (!point) return false;

    // Basic checks
    if (verification.kycLevel < 1) {
      this.flagAgent(agentId, 'insufficient_kyc', 20);
      return false;
    }

    if (!verification.backgroundCheck) {
      this.flagAgent(agentId, 'no_background_check', 15);
    }

    if (!verification.trainingCompleted) {
      this.flagAgent(agentId, 'no_training', 10);
    }

    if (verification.suspensionCount > 0) {
      this.flagAgent(agentId, 'previous_suspension', 25);
    }

    // Check for duplicate registrations
    const duplicates = await this.findDuplicates(agentId, point.phone, point.operatorName);
    if (duplicates.length > 0) {
      this.flagAgent(agentId, 'duplicate_registration', 30);
    }

    return true;
  }

  /**
   * Detect suspicious routing patterns
   */
  async detectSuspiciousRouting(agentId: string, recentTransactions: Array<{ amount: number; timestamp: Date }>): Promise<{
    suspicious: boolean;
    reason?: string;
    riskScore: number;
  }> {
    if (recentTransactions.length < 3) {
      return { suspicious: false, riskScore: 0 };
    }

    // Check for round-trip patterns (deposit then immediate withdrawal)
    const timeWindow = 300000; // 5 minutes
    let roundTrips = 0;

    for (let i = 1; i < recentTransactions.length; i++) {
      const timeDiff = recentTransactions[i].timestamp.getTime() - recentTransactions[i - 1].timestamp.getTime();
      if (timeDiff < timeWindow) {
        roundTrips++;
      }
    }

    if (roundTrips >= 3) {
      this.flagAgent(agentId, 'round_trip_pattern', 40);
      return { suspicious: true, reason: 'Round-trip transaction pattern detected', riskScore: 40 };
    }

    // Check for velocity
    const oneHourAgo = new Date(Date.now() - 3600000);
    const recentHour = recentTransactions.filter(t => t.timestamp > oneHourAgo);
    const totalAmount = recentHour.reduce((sum, t) => sum + t.amount, 0);

    if (recentHour.length > 20 || totalAmount > 500000) {
      this.flagAgent(agentId, 'high_velocity', 35);
      return { suspicious: true, reason: 'Unusually high transaction velocity', riskScore: 35 };
    }

    return { suspicious: false, riskScore: 0 };
  }

  /**
   * Detect abnormal liquidity movement
   */
  async detectAbnormalLiquidity(agentId: string, liquidityHistory: Array<{ amount: number; timestamp: Date }>): Promise<{
    abnormal: boolean;
    reason?: string;
  }> {
    if (liquidityHistory.length < 5) return { abnormal: false };

    // Check for sudden large changes
    const recent = liquidityHistory.slice(-5);
    const changes = [];

    for (let i = 1; i < recent.length; i++) {
      changes.push(Math.abs(recent[i].amount - recent[i - 1].amount));
    }

    const avgChange = changes.reduce((sum, c) => sum + c, 0) / changes.length;
    const maxChange = Math.max(...changes);

    if (maxChange > avgChange * 5) {
      this.flagAgent(agentId, 'abnormal_liquidity', 30);
      return { abnormal: true, reason: 'Sudden large liquidity change detected' };
    }

    return { abnormal: false };
  }

  /**
   * Detect fake cash points
   */
  async detectFakeCashPoint(cashPoint: CashPoint): Promise<{
    fake: boolean;
    reason?: string;
  }> {
    const flags: string[] = [];

    // Check for generic names
    const genericNames = ['test', 'fake', 'demo', 'sample', 'agent', 'cash'];
    if (genericNames.some(n => cashPoint.name.toLowerCase().includes(n))) {
      flags.push('Generic or suspicious name');
    }

    // Check for invalid phone
    if (!this.isValidPhone(cashPoint.phone, cashPoint.country)) {
      flags.push('Invalid phone number format');
    }

    // Check for impossible location
    if (Math.abs(cashPoint.location.lat) > 90 || Math.abs(cashPoint.location.lng) > 180) {
      flags.push('Invalid coordinates');
    }

    // Check for duplicate location (too close to existing)
    const nearby = await this.engine.findNearby(cashPoint.location.lat, cashPoint.location.lng, 0.05);
    if (nearby.length > 2) {
      flags.push('Too many agents at same location');
    }

    if (flags.length >= 2) {
      this.flagAgent(cashPoint.id, 'suspicious_registration', 50);
      return { fake: true, reason: flags.join('; ') };
    }

    return { fake: false };
  }

  /**
   * Find duplicate agents
   */
  async findDuplicates(agentId: string, phone: string, operatorName: string): Promise<CashPoint[]> {
    const all = []; // Would get all from engine
    const duplicates: CashPoint[] = [];

    for (const point of all) {
      if (point.id === agentId) continue;

      if (point.phone === phone || point.operatorName === operatorName) {
        duplicates.push(point);
      }
    }

    return duplicates;
  }

  /**
   * Get fraud score for agent
   */
  getFraudScore(agentId: string): number {
    return this.suspiciousAgents.get(agentId)?.score || 0;
  }

  /**
   * Get flags for agent
   */
  getFlags(agentId: string): string[] {
    return this.suspiciousAgents.get(agentId)?.flags || [];
  }

  private flagAgent(agentId: string, flag: string, score: number): void {
    const existing = this.suspiciousAgents.get(agentId) || { flags: [], score: 0, lastFlag: new Date() };

    if (!existing.flags.includes(flag)) {
      existing.flags.push(flag);
    }
    existing.score = Math.min(100, existing.score + score);
    existing.lastFlag = new Date();

    this.suspiciousAgents.set(agentId, existing);

    this.eventBus.emit('fraud:agent_flagged', {
      agentId,
      flag,
      score: existing.score,
      timestamp: new Date(),
    });

    // Auto-suspend if score too high
    if (existing.score >= 80) {
      this.eventBus.emit('fraud:auto_suspend', { agentId, score: existing.score });
    }
  }

  private isValidPhone(phone: string, country: string): boolean {
    const patterns: Record<string, RegExp> = {
      Kenya: /^\+254[0-9]{9}$/,
      Uganda: /^\+256[0-9]{9}$/,
      Tanzania: /^\+255[0-9]{9}$/,
      Nigeria: /^\+234[0-9]{10}$/,
      Ghana: /^\+233[0-9]{9}$/,
    };

    const pattern = patterns[country];
    if (!pattern) return true; // Unknown country, allow

    return pattern.test(phone);
  }
}
