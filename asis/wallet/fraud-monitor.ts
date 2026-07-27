// asis/wallet/fraud-monitor.ts
// ASIS Wallet Fraud Monitor
// Imported by: lib/system/adapters/asis-adapter.ts

import { supabase } from '@/lib/supabase';

export interface FraudCheckResult {
  isFraudulent: boolean;
  riskScore: number; // 0-100
  flags: FraudFlag[];
  recommendation: 'allow' | 'review' | 'block';
  confidence: number;
}

export interface FraudFlag {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  metadata?: Record<string, any>;
}

export interface TransactionContext {
  userId: string;
  amount: number;
  currency: string;
  recipientId?: string;
  recipientPhone?: string;
  deviceId?: string;
  ipAddress?: string;
  location?: { lat: number; lng: number };
  timestamp: string;
  previousTransactionsCount: number;
  averageTransactionAmount: number;
}

export class FraudMonitor {
  private static readonly RISK_THRESHOLDS = {
    allow: 30,
    review: 70,
    block: 100,
  };

  /**
   * Analyze a transaction for fraud indicators
   */
  async analyzeTransaction(context: TransactionContext): Promise<FraudCheckResult> {
    const flags: FraudFlag[] = [];
    let riskScore = 0;

    // Check 1: Unusual amount
    if (context.amount > context.averageTransactionAmount * 5) {
      flags.push({
        type: 'unusual_amount',
        severity: 'medium',
        description: `Amount ${context.amount} is ${(context.amount / context.averageTransactionAmount).toFixed(1)}x higher than average`,
      });
      riskScore += 20;
    }

    // Check 2: Velocity (too many transactions)
    if (context.previousTransactionsCount > 10) {
      flags.push({
        type: 'high_velocity',
        severity: 'low',
        description: `${context.previousTransactionsCount} transactions in recent period`,
      });
      riskScore += 10;
    }

    // Check 3: Large amount for new user
    if (context.previousTransactionsCount < 3 && context.amount > 10000) {
      flags.push({
        type: 'new_user_large_tx',
        severity: 'high',
        description: 'Large transaction from new user',
      });
      riskScore += 30;
    }

    // Check 4: Round numbers (potential testing)
    if (context.amount % 1000 === 0 && context.amount > 1000) {
      flags.push({
        type: 'round_amount',
        severity: 'low',
        description: 'Round number amount detected',
      });
      riskScore += 5;
    }

    // Determine recommendation
    let recommendation: FraudCheckResult['recommendation'] = 'allow';
    if (riskScore >= FraudMonitor.RISK_THRESHOLDS.review) {
      recommendation = 'review';
    }
    if (riskScore >= FraudMonitor.RISK_THRESHOLDS.block) {
      recommendation = 'block';
    }

    return {
      isFraudulent: riskScore >= FraudMonitor.RISK_THRESHOLDS.review,
      riskScore: Math.min(riskScore, 100),
      flags,
      recommendation,
      confidence: Math.min(flags.length * 0.2 + 0.5, 0.95),
    };
  }

  /**
   * Report confirmed fraud
   */
  async reportFraud(userId: string, transactionId: string, reason: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('wallet_fraud_reports').insert({
        user_id: userId,
        transaction_id: transactionId,
        reason,
        status: 'reported',
      });
      if (error) throw error;
      return true;
    } catch (e) {
      console.error('[FraudMonitor] reportFraud:', e);
      return false;
    }
  }

  /**
   * Get user's risk profile
   */
  async getRiskProfile(userId: string): Promise<{ score: number; flags: FraudFlag[] }> {
    try {
      const { data, error } = await supabase
        .from('wallet_risk_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return {
        score: data?.risk_score || 0,
        flags: data?.flags || [],
      };
    } catch (e) {
      console.error('[FraudMonitor] getRiskProfile:', e);
      return { score: 0, flags: [] };
    }
  }
}

export default FraudMonitor;
