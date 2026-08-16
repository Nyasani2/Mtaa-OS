// lib/wallet/services/withdraw.service.ts
// Withdraw service — handles all withdrawal operations

import { supabase } from '@/lib/supabase/client';
import { useWalletStore } from '@/lib/wallet/state/wallet.store';
import { identityEngine } from '@/lib/kernel/identity';

export type WithdrawMethod = 'bank_transfer' | 'mobile_money' | 'crypto';

export interface BankDestination {
  bank_name: string;
  account_number: string;
  account_name: string;
  branch_code?: string;
}

export interface MobileMoneyDestination {
  mobile_network: string;
  phone_number: string;
}

export interface CryptoDestination {
  crypto_address: string;
  crypto_network: string;
}

export type WithdrawDestination = BankDestination | MobileMoneyDestination | CryptoDestination;

export interface WithdrawRequest {
  amount: number;
  currency: string;
  method: WithdrawMethod;
  destination: WithdrawDestination;
}

export interface WithdrawResult {
  success: boolean;
  transaction_id?: string;
  status?: string;
  amount?: number;
  fee?: number;
  net_amount?: number;
  message?: string;
  error?: string;
  code?: string;
  current_level?: number;
  required_level?: number;
}

export interface WithdrawTransaction {
  id: string;
  amount: number;
  fee: number;
  net_amount: number;
  currency: string;
  method: WithdrawMethod;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  destination: WithdrawDestination;
  created_at: string;
  completed_at?: string;
  metadata?: Record<string, any>;
}

class WithdrawService {
  private static instance: WithdrawService;

  static getInstance(): WithdrawService {
    if (!WithdrawService.instance) {
      WithdrawService.instance = new WithdrawService();
    }
    return WithdrawService.instance;
  }

  /**
   * Check if user has sufficient KYC level for withdrawals
   */
  async checkKycLevel(): Promise<{ 
    eligible: boolean; 
    currentLevel: number; 
    requiredLevel: number;
    profile?: any;
  }> {
    const user = await identityEngine.getUser();
    if (!user) {
      return { eligible: false, currentLevel: 0, requiredLevel: 2 };
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('kyc_level, kyc_verified_at, first_name, last_name, phone')
      .eq('id', user.id)
      .single();

    if (error || !profile) {
      return { eligible: false, currentLevel: 0, requiredLevel: 2 };
    }

    return {
      eligible: profile.kyc_level >= 2,
      currentLevel: profile.kyc_level,
      requiredLevel: 2,
      profile,
    };
  }

  /**
   * Get fee preview before submitting withdrawal
   */
  getFeePreview(amount: number, method: WithdrawMethod): {
    fee: number;
    netAmount: number;
    feeRate: number;
    minFee: number;
  } {
    const feeRates: Record<WithdrawMethod, number> = {
      bank_transfer: 0.015,
      mobile_money: 0.02,
      crypto: 0.01,
    };

    const minFees: Record<WithdrawMethod, number> = {
      bank_transfer: 50,
      mobile_money: 20,
      crypto: 100,
    };

    const rate = feeRates[method];
    const minFee = minFees[method];
    const calculatedFee = Math.round(amount * rate * 100) / 100;
    const fee = Math.max(calculatedFee, minFee);
    const netAmount = amount - fee;

    return { fee, netAmount, feeRate: rate, minFee };
  }

  /**
   * Submit withdrawal request
   */
  async requestWithdrawal(request: WithdrawRequest): Promise<WithdrawResult> {
    const user = await identityEngine.getUser();
    if (!user) {
      return { success: false, error: 'Not authenticated', code: 'AUTH_REQUIRED' };
    }

    // KYC gate
    const kyc = await this.checkKycLevel();
    if (!kyc.eligible) {
      return {
        success: false,
        error: 'KYC Level 2 required for withdrawals',
        code: 'KYC_INSUFFICIENT',
        current_level: kyc.currentLevel,
        required_level: kyc.requiredLevel,
      };
    }

    // Validate amount
    if (request.amount < 100) {
      return { success: false, error: 'Minimum withdrawal is 100', code: 'MIN_AMOUNT' };
    }

    const preview = this.getFeePreview(request.amount, request.method);
    if (preview.netAmount <= 0) {
      return { success: false, error: 'Amount too small after fees', code: 'AMOUNT_TOO_SMALL' };
    }

    // Call edge function
    const { data, error } = await supabase.functions.invoke('withdraw-request', {
      body: {
        user_id: user.id,
        amount: request.amount,
        currency: request.currency,
        method: request.method,
        destination: request.destination,
      },
    });

    if (error) {
      return { success: false, error: error.message, code: 'EDGE_FUNCTION_ERROR' };
    }

    if (data?.error) {
      return {
        success: false,
        error: data.error,
        code: data.code,
        current_level: data.current_level,
        required_level: data.required_level,
      };
    }

    // Refresh wallet balance in store
    const walletStore = useWalletStore.getState();
    await walletStore.refreshBalance?.();

    return {
      success: true,
      transaction_id: data.transaction_id,
      status: data.status,
      amount: data.amount,
      fee: data.fee,
      net_amount: data.net_amount,
      message: data.message,
    };
  }

  /**
   * Get user's withdrawal history
   */
  async getWithdrawalHistory(limit = 20): Promise<WithdrawTransaction[]> {
    const user = await identityEngine.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .eq('type', 'withdrawal')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Failed to fetch withdrawal history:', error);
      return [];
    }

    return (data || []).map((tx: any) => ({
      id: tx.id,
      amount: tx.amount,
      fee: tx.fee || 0,
      net_amount: tx.net_amount || tx.amount,
      currency: tx.currency,
      method: tx.method as WithdrawMethod,
      status: tx.status,
      destination: tx.destination || {},
      created_at: tx.created_at,

      metadata: tx.metadata,
    }));
  }

  /**
   * Cancel a pending withdrawal (if still pending)
   */
  async cancelWithdrawal(transactionId: string): Promise<{ success: boolean; error?: string }> {
    const user = await identityEngine.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    // First verify ownership and status
    const { data: tx, error: fetchError } = await supabase
      .from('transactions')
      .select('id, status, user_id')
      .eq('id', transactionId)
      .single();

    if (fetchError || !tx) {
      return { success: false, error: 'Transaction not found' };
    }

    if (tx.user_id !== user.id) {
      return { success: false, error: 'Not authorized' };
    }

    if (tx.status !== 'pending') {
      return { success: false, error: `Cannot cancel withdrawal with status: ${tx.status}` };
    }

    // Call fail_withdrawal RPC to return funds
    const { error: rpcError } = await supabase.rpc('fail_withdrawal', {
      p_transaction_id: transactionId,
      p_reason: 'User cancelled',
    });

    if (rpcError) {
      return { success: false, error: rpcError.message };
    }

    // Refresh wallet
    const walletStore = useWalletStore.getState();
    await walletStore.refreshBalance?.();

    return { success: true };
  }

  /**
   * Get daily withdrawal limit status
   */
  async getDailyLimitStatus(): Promise<{
    limit: number;
    used: number;
    remaining: number;
    percentage: number;
  }> {
    const user = await identityEngine.getUser();
    if (!user) {
      return { limit: 500000, used: 0, remaining: 500000, percentage: 0 };
    }

    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('transactions')
      .select('amount')
      .eq('user_id', user.id)
      .eq('type', 'withdrawal')
      .eq('status', 'completed')
      .gte('created_at', `${today}T00:00:00Z`);

    if (error) {
      return { limit: 500000, used: 0, remaining: 500000, percentage: 0 };
    }

    const used = (data || []).reduce((sum, t) => sum + (t.amount || 0), 0);
    const limit = 500000;
    const remaining = Math.max(0, limit - used);
    const percentage = Math.min(100, (used / limit) * 100);

    return { limit, used, remaining, percentage };
  }
}

export const withdrawService = WithdrawService.getInstance();
