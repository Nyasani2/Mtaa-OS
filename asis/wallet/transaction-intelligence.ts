// asis/wallet/transaction-intelligence.ts
// ASIS Wallet Transaction Intelligence Engine
// Imported by: lib/system/adapters/asis-adapter.ts

import { supabase } from '@/lib/supabase';

export interface TransactionInsight {
  pattern: string;
  confidence: number;
  description: string;
  recommendation?: string;
  metadata?: Record<string, any>;
}

export interface SpendingPattern {
  category: string;
  totalSpent: number;
  transactionCount: number;
  averageAmount: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  percentageOfTotal: number;
}

export interface FinancialHealthScore {
  score: number; // 0-100
  factors: { name: string; impact: number; description: string }[];
  summary: string;
}

export class TransactionIntelligence {
  /**
   * Analyze user's transaction patterns
   */
  async analyzePatterns(userId: string, days: number = 30): Promise<TransactionInsight[]> {
    try {
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - days);

      const { data: transactions, error } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', fromDate.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;
      const txs = transactions || [];
      const insights: TransactionInsight[] = [];

      // Pattern 1: Spending frequency
      const dailyCounts: Record<string, number> = {};
      txs.forEach((tx: any) => {
        const day = tx.created_at?.split('T')[0];
        if (day) dailyCounts[day] = (dailyCounts[day] || 0) + 1;
      });
      const avgDaily = Object.values(dailyCounts).reduce((a: number, b: number) => a + b, 0) / days;
      if (avgDaily > 3) {
        insights.push({
          pattern: 'high_frequency',
          confidence: 0.85,
          description: `You make an average of ${avgDaily.toFixed(1)} transactions per day`,
          recommendation: 'Consider batching smaller purchases to reduce fees',
        });
      }

      // Pattern 2: Weekend vs weekday spending
      const weekendTxs = txs.filter((tx: any) => {
        const day = new Date(tx.created_at).getDay();
        return day === 0 || day === 6;
      });
      if (weekendTxs.length > txs.length * 0.4) {
        insights.push({
          pattern: 'weekend_spender',
          confidence: 0.75,
          description: `${((weekendTxs.length / txs.length) * 100).toFixed(0)}% of your transactions happen on weekends`,
        });
      }

      // Pattern 3: Large transactions
      const amounts = txs.map((tx: any) => tx.amount || 0);
      const avgAmount = amounts.reduce((a: number, b: number) => a + b, 0) / amounts.length;
      const largeTxs = txs.filter((tx: any) => (tx.amount || 0) > avgAmount * 3);
      if (largeTxs.length > 0) {
        insights.push({
          pattern: 'large_transactions',
          confidence: 0.9,
          description: `${largeTxs.length} transactions were significantly above your average of ${avgAmount.toFixed(0)}`,
          recommendation: 'Review large transactions for budgeting',
        });
      }

      return insights;
    } catch (e) {
      console.error('[TransactionIntelligence] analyzePatterns:', e);
      return [];
    }
  }

  /**
   * Get spending breakdown by category
   */
  async getSpendingPatterns(userId: string, days: number = 30): Promise<SpendingPattern[]> {
    try {
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - days);

      const { data: transactions, error } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', userId)
        .lt('amount', 0) // Only debits
        .gte('created_at', fromDate.toISOString());

      if (error) throw error;

      const categories: Record<string, { total: number; count: number }> = {};
      let grandTotal = 0;

      (transactions || []).forEach((tx: any) => {
        const category = tx.metadata?.category || tx.description || 'Other';
        const amount = Math.abs(tx.amount || 0);
        if (!categories[category]) categories[category] = { total: 0, count: 0 };
        categories[category].total += amount;
        categories[category].count += 1;
        grandTotal += amount;
      });

      return Object.entries(categories).map(([category, data]) => ({
        category,
        totalSpent: data.total,
        transactionCount: data.count,
        averageAmount: data.total / data.count,
        trend: 'stable',
        percentageOfTotal: grandTotal > 0 ? (data.total / grandTotal) * 100 : 0,
      }));
    } catch (e) {
      console.error('[TransactionIntelligence] getSpendingPatterns:', e);
      return [];
    }
  }

  /**
   * Calculate financial health score
   */
  async calculateHealthScore(userId: string): Promise<FinancialHealthScore> {
    try {
      const { data: wallet, error } = await supabase
        .from('wallet_accounts')
        .select('balance, monthly_limit, daily_limit')
        .eq('user_id', userId)
        .single();

      if (error) throw error;

      const factors: FinancialHealthScore['factors'] = [];
      let score = 50;

      // Balance factor
      if (wallet.balance > 1000) {
        score += 15;
        factors.push({ name: 'balance', impact: 15, description: 'Healthy wallet balance' });
      } else {
        score -= 10;
        factors.push({ name: 'balance', impact: -10, description: 'Low wallet balance' });
      }

      // Transaction diversity (simplified)
      const { count, error: countErr } = await supabase
        .from('wallet_transactions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (!countErr && count && count > 10) {
        score += 10;
        factors.push({ name: 'activity', impact: 10, description: 'Active transaction history' });
      }

      // Limit utilization
      if (wallet.monthly_limit && wallet.monthly_limit > 0) {
        const { data: monthlyTx } = await supabase
          .from('wallet_transactions')
          .select('amount')
          .eq('user_id', userId)
          .gte('created_at', new Date().toISOString().substring(0, 7) + '-01');
        const monthlySpent = (monthlyTx || []).reduce((sum: number, tx: any) => sum + Math.abs(tx.amount || 0), 0);
        const utilization = monthlySpent / wallet.monthly_limit;
        if (utilization < 0.3) {
          score += 10;
          factors.push({ name: 'utilization', impact: 10, description: 'Low limit utilization' });
        } else if (utilization > 0.8) {
          score -= 10;
          factors.push({ name: 'utilization', impact: -10, description: 'High limit utilization' });
        }
      }

      return {
        score: Math.min(Math.max(score, 0), 100),
        factors,
        summary: score > 70 ? 'Healthy' : score > 40 ? 'Fair' : 'Needs Attention',
      };
    } catch (e) {
      console.error('[TransactionIntelligence] calculateHealthScore:', e);
      return { score: 50, factors: [], summary: 'Unable to calculate' };
    }
  }
}

export default TransactionIntelligence;
