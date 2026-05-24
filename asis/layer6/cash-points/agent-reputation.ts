/**
 * ASIS Layer 6 — Agent Reputation System
 * Reliability, liquidity consistency, customer ratings, disputes, fraud
 * Explainable scoring — ASIS can say why an agent is recommended
 */

import { ReputationScore, CashPoint } from './types';
import { IReputationProvider, ReputationSummary } from './interfaces';
import { CashPointEngine } from './cash-point-engine';

export class AgentReputation implements IReputationProvider {
  name = 'mtaa_agent_reputation';
  private scores: Map<string, ReputationScore> = new Map();
  private ratings: Map<string, Array<{ userId: string; rating: number; comment?: string; date: Date }>> = new Map();
  private disputes: Map<string, Array<{ type: string; resolved: boolean; date: Date }>> = new Map();
  private engine: CashPointEngine;

  constructor(engine: CashPointEngine) {
    this.engine = engine;
  }

  /**
   * Get agent reputation with explanation
   */
  async getReputation(agentId: string): Promise<ReputationSummary> {
    const score = this.scores.get(agentId);
    const cashPoint = await this.engine.getById(agentId);

    if (!score) {
      return {
        agentId,
        overall: 3.0,
        reliability: 3.0,
        liquidityConsistency: 3.0,
        customerRating: 3.0,
        disputeRate: 0,
        fraudFlags: 0,
        totalTransactions: 0,
        successfulTransactions: 0,
        explanation: 'New agent. Limited transaction history.',
      };
    }

    const explanation = this.generateExplanation(score, cashPoint);

    return {
      agentId,
      overall: score.overall,
      reliability: score.reliability,
      liquidityConsistency: score.liquidityConsistency,
      customerRating: score.customerRating,
      disputeRate: score.disputeRate,
      fraudFlags: score.fraudFlags,
      totalTransactions: score.totalTransactions,
      successfulTransactions: score.successfulTransactions,
      explanation,
    };
  }

  /**
   * Record transaction outcome
   */
  async recordTransaction(agentId: string, success: boolean, amount: number, currency: string): Promise<void> {
    const score = this.getOrCreateScore(agentId);
    score.totalTransactions++;

    if (success) {
      score.successfulTransactions++;
      // Boost reliability on success
      score.reliability = this.updateWeighted(score.reliability, 5, 0.1);
    } else {
      // Penalize reliability on failure
      score.reliability = this.updateWeighted(score.reliability, 1, 0.15);
    }

    score.overall = this.calculateOverall(score);
    score.lastUpdated = new Date();
  }

  /**
   * Record customer rating
   */
  async recordRating(agentId: string, userId: string, rating: number, comment?: string): Promise<void> {
    const score = this.getOrCreateScore(agentId);

    const ratings = this.ratings.get(agentId) || [];
    ratings.push({ userId, rating, comment, date: new Date() });
    this.ratings.set(agentId, ratings.slice(-50)); // Keep last 50

    // Update customer rating (weighted average)
    const avgRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
    score.customerRating = avgRating;
    score.overall = this.calculateOverall(score);
    score.lastUpdated = new Date();
  }

  /**
   * Record dispute
   */
  async recordDispute(agentId: string, disputeType: string, resolved: boolean): Promise<void> {
    const score = this.getOrCreateScore(agentId);

    const disputes = this.disputes.get(agentId) || [];
    disputes.push({ type: disputeType, resolved, date: new Date() });
    this.disputes.set(agentId, disputes.slice(-20));

    // Calculate dispute rate
    const totalDisputes = disputes.length;
    const resolvedDisputes = disputes.filter(d => d.resolved).length;
    score.disputeRate = totalDisputes > 0 ? (totalDisputes - resolvedDisputes) / totalDisputes : 0;

    // Penalize for unresolved disputes
    if (!resolved) {
      score.overall = Math.max(1, score.overall - 0.5);
    }

    score.lastUpdated = new Date();
  }

  /**
   * Record fraud flag
   */
  recordFraudFlag(agentId: string, flag: string): void {
    const score = this.getOrCreateScore(agentId);
    score.fraudFlags++;
    score.overall = Math.max(1, score.overall - 1.0);
    score.lastUpdated = new Date();
  }

  /**
   * Update liquidity consistency score
   */
  updateLiquidityConsistency(agentId: string, healthScore: number): void {
    const score = this.getOrCreateScore(agentId);
    score.liquidityConsistency = this.updateWeighted(score.liquidityConsistency, healthScore * 5, 0.05);
    score.overall = this.calculateOverall(score);
    score.lastUpdated = new Date();
  }

  async health(): Promise<{ available: boolean; latency: number }> {
    return { available: true, latency: 0 };
  }

  private getOrCreateScore(agentId: string): ReputationScore {
    if (!this.scores.has(agentId)) {
      this.scores.set(agentId, {
        overall: 3.0,
        reliability: 3.0,
        liquidityConsistency: 3.0,
        customerRating: 3.0,
        disputeRate: 0,
        fraudFlags: 0,
        totalTransactions: 0,
        successfulTransactions: 0,
        lastUpdated: new Date(),
      });
    }
    return this.scores.get(agentId)!;
  }

  private calculateOverall(score: ReputationScore): number {
    const weights = {
      reliability: 0.3,
      liquidityConsistency: 0.2,
      customerRating: 0.3,
      disputeRate: -0.15,
      fraudFlags: -0.5,
    };

    let overall = 3.0;
    overall += (score.reliability - 3) * weights.reliability;
    overall += (score.liquidityConsistency - 3) * weights.liquidityConsistency;
    overall += (score.customerRating - 3) * weights.customerRating;
    overall += score.disputeRate * weights.disputeRate * 5;
    overall += score.fraudFlags * weights.fraudFlags;

    return Math.max(1, Math.min(5, overall));
  }

  private updateWeighted(current: number, newValue: number, weight: number): number {
    return current * (1 - weight) + newValue * weight;
  }

  private generateExplanation(score: ReputationScore, cashPoint: CashPoint | null): string {
    const parts: string[] = [];

    if (score.totalTransactions === 0) {
      return 'New agent. No transaction history yet.';
    }

    const successRate = score.totalTransactions > 0
      ? (score.successfulTransactions / score.totalTransactions * 100).toFixed(0)
      : '0';

    parts.push(`${successRate}% success rate over ${score.totalTransactions} transactions.`);

    if (score.customerRating >= 4.5) {
      parts.push('Highly rated by customers.');
    } else if (score.customerRating >= 4.0) {
      parts.push('Well rated by customers.');
    } else if (score.customerRating < 3.0) {
      parts.push('Mixed customer reviews.');
    }

    if (score.fraudFlags > 0) {
      parts.push(`${score.fraudFlags} fraud flags on record.`);
    }

    if (score.disputeRate > 0.05) {
      parts.push('Higher than average dispute rate.');
    }

    if (cashPoint?.verified) {
      parts.push('Verified by MTAA.');
    }

    return parts.join(' ');
  }
}
