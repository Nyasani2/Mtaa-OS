/**
 * ASIS Layer 5 — Transaction Intelligence
 * Pattern detection, recommendations, financial insights
 */

import { Transfer, WalletAccount, BehaviorEvent } from './types';
import { WalletAssistant } from './wallet-assistant';
import { MemoryOrchestrator } from '../memory/memory-orchestrator';
import { EventBus } from '../kernel/event-bus';

export interface SpendingPattern {
  category: string;
  totalAmount: number;
  transactionCount: number;
  averageAmount: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  percentageOfTotal: number;
}

export interface FinancialInsight {
  type: 'spending' | 'saving' | 'anomaly' | 'opportunity' | 'warning';
  title: string;
  description: string;
  severity: 'info' | 'positive' | 'warning' | 'critical';
  action?: string;
  actionParams?: Record<string, unknown>;
}

export class TransactionIntelligence {
  private assistant: WalletAssistant;
  private memory: MemoryOrchestrator;
  private eventBus: EventBus;

  constructor(assistant: WalletAssistant, memory: MemoryOrchestrator, eventBus: EventBus) {
    this.assistant = assistant;
    this.memory = memory;
    this.eventBus = eventBus;
  }

  /**
   * Analyze spending patterns
   */
  async analyzeSpending(userId: string, days: number = 30): Promise<SpendingPattern[]> {
    // Get transfers from memory
    const transfers = await this.memory.retrieve({
      layer: 'long_term' as any,
      tags: ['transfer', 'completed'],
      after: new Date(Date.now() - days * 86400000),
      limit: 1000,
    });

    const patterns = new Map<string, { total: number; count: number; amounts: number[] }>();

    for (const mem of transfers) {
      const tx = mem.value as Transfer;
      const category = this.categorizeTransfer(tx);

      if (!patterns.has(category)) {
        patterns.set(category, { total: 0, count: 0, amounts: [] });
      }

      const p = patterns.get(category)!;
      p.total += tx.amount;
      p.count++;
      p.amounts.push(tx.amount);
    }

    const totalSpent = Array.from(patterns.values()).reduce((sum, p) => sum + p.total, 0);

    return Array.from(patterns.entries()).map(([category, data]) => ({
      category,
      totalAmount: data.total,
      transactionCount: data.count,
      averageAmount: data.total / data.count,
      trend: 'stable', // Would compare to previous period
      percentageOfTotal: totalSpent > 0 ? (data.total / totalSpent) * 100 : 0,
    }));
  }

  /**
   * Generate financial insights
   */
  async generateInsights(userId: string): Promise<FinancialInsight[]> {
    const insights: FinancialInsight[] = [];
    const patterns = await this.analyzeSpending(userId, 30);

    // High spending category
    const highest = patterns.sort((a, b) => b.totalAmount - a.totalAmount)[0];
    if (highest && highest.percentageOfTotal > 40) {
      insights.push({
        type: 'spending',
        title: `${highest.category} is your biggest expense`,
        description: `You spent ${highest.percentageOfTotal.toFixed(0)}% of your money on ${highest.category} this month.`,
        severity: 'info',
      });
    }

    // Frequent small transfers → suggest bulk
    const smallTx = patterns.find(p => p.averageAmount < 500 && p.transactionCount > 10);
    if (smallTx) {
      insights.push({
        type: 'opportunity',
        title: 'Bundle your transfers',
        description: `You made ${smallTx.transactionCount} small transfers to ${smallTx.category}. Bundling could save fees.`,
        severity: 'positive',
        action: 'show_bundle_options',
      });
    }

    // Low balance warning
    // Would check actual balance

    // Unusual pattern
    const anomaly = await this.assistant.detectAnomaly(userId, 'rapid_transfers');
    if (anomaly.anomaly) {
      insights.push({
        type: 'warning',
        title: 'Unusual activity detected',
        description: anomaly.warning!,
        severity: 'warning',
        action: 'review_recent',
      });
    }

    return insights;
  }

  /**
   * Recommend optimal transfer timing
   */
  async recommendTiming(userId: string, amount: number, currency: string): Promise<{ bestTime: string; reason: string }> {
    // Simple heuristic: weekday mornings have better FX rates
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();

    if (day === 0 || day === 6) {
      return {
        bestTime: 'Monday morning',
        reason: 'Weekend rates are less favorable. Monday morning typically offers better rates.',
      };
    }

    if (hour < 9 || hour > 17) {
      return {
        bestTime: 'During business hours (9 AM - 5 PM)',
        reason: 'FX markets are most active during business hours, giving better rates.',
      };
    }

    return {
      bestTime: 'Now',
      reason: 'Current market conditions are favorable for this transfer.',
    };
  }

  /**
   * Predict next likely transfer
   */
  async predictNextTransfer(userId: string): Promise<{ recipient?: string; amount?: number; confidence: number }> {
    // Get recent patterns from memory
    const patterns = await this.memory.retrieve({
      layer: 'long_term' as any,
      tags: ['behavior_pattern'],
      limit: 50,
    });

    // Find most frequent transfer pattern
    const transferPatterns = patterns
      .map(p => p.value as any)
      .filter(p => p.pattern && p.pattern.includes('wallet'));

    if (transferPatterns.length === 0) {
      return { confidence: 0 };
    }

    const mostFrequent = transferPatterns.sort((a, b) => b.frequency - a.frequency)[0];

    return {
      confidence: mostFrequent.confidence,
    };
  }

  private categorizeTransfer(transfer: Transfer): string {
    // Simple categorization based on metadata
    if (transfer.metadata?.category) {
      return transfer.metadata.category as string;
    }

    if (transfer.amount < 1000) return 'Small transfers';
    if (transfer.amount < 10000) return 'Regular transfers';
    if (transfer.amount < 50000) return 'Large transfers';
    return 'Major transfers';
  }
}