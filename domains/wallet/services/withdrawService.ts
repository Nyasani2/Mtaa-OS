// domains/wallet/services/withdrawService.ts
// Wallet withdrawal service for MTAA Commerce
// Imported by: app/(commerce)/marketplace/checkout.tsx

import { supabase } from '@/lib/supabase';

export interface WithdrawalRequest {
  userId: string;
  amount: number;
  currency?: string;
  method: 'bank_transfer' | 'mobile_money' | 'cash' | 'crypto';
  destinationAccount?: string;
  destinationBank?: string;
  description?: string;
}

export interface WithdrawalResult {
  success: boolean;
  transactionId?: string;
  reference?: string;
  message: string;
  newBalance?: number;
}

/**
 * Request a withdrawal from wallet
 */
export async function requestWithdrawal(req: WithdrawalRequest): Promise<WithdrawalResult> {
  try {
    const { data, error } = await supabase.rpc('wallet_withdraw', {
      p_user: req.userId,
      p_amount: req.amount,
    });

    if (error) {
      return {
        success: false,
        message: error.message || 'Withdrawal failed',
      };
    }

    // Create withdrawal transaction record
    const { data: txData, error: txError } = await supabase
      .from('wallet_transactions')
      .insert({
        user_id: req.userId,
        amount: -req.amount,
        type: 'debit',
        status: 'completed',
        description: req.description || `Withdrawal via ${req.method}`,
        reference_type: 'withdrawal',
        metadata: {
          method: req.method,
          destination_account: req.destinationAccount,
          destination_bank: req.destinationBank,
        },
      })
      .select()
      .single();

    if (txError) {
      console.error('[withdrawService] tx record failed:', txError);
    }

    return {
      success: true,
      transactionId: txData?.id,
      reference: txData?.reference,
      message: 'Withdrawal processed successfully',
    };
  } catch (e: any) {
    return {
      success: false,
      message: e.message || 'Unexpected error during withdrawal',
    };
  }
}

/**
 * Get withdrawal history for a user
 */
export async function getWithdrawalHistory(userId: string, limit: number = 20): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('wallet_transactions')
      .select('*')
      .eq('user_id', userId)
      .eq('reference_type', 'withdrawal')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (e: any) {
    console.error('[withdrawService] getHistory:', e);
    return [];
  }
}

/**
 * Check if withdrawal amount is within limits
 */
export async function checkWithdrawalLimits(userId: string, amount: number): Promise<{
  allowed: boolean;
  dailyLimit?: number;
  monthlyLimit?: number;
  dailyUsed?: number;
  monthlyUsed?: number;
  message?: string;
}> {
  try {
    // Get wallet limits
    const { data: wallet, error } = await supabase
      .from('wallet_accounts')
      .select('daily_limit, monthly_limit, balance')
      .eq('user_id', userId)
      .single();

    if (error) throw error;

    if (!wallet) {
      return { allowed: false, message: 'Wallet not found' };
    }

    if ((wallet.balance || 0) < amount) {
      return { allowed: false, message: 'Insufficient balance' };
    }

    // Get today's withdrawals
    const today = new Date().toISOString().split('T')[0];
    const { data: dailyTx, error: dailyErr } = await supabase
      .from('wallet_transactions')
      .select('amount')
      .eq('user_id', userId)
      .eq('reference_type', 'withdrawal')
      .gte('created_at', today)
      .lt('amount', 0);

    if (dailyErr) throw dailyErr;
    const dailyUsed = (dailyTx || []).reduce((sum: number, tx: any) => sum + Math.abs(tx.amount || 0), 0);

    // Get this month's withdrawals
    const monthStart = today.substring(0, 7) + '-01';
    const { data: monthlyTx, error: monthlyErr } = await supabase
      .from('wallet_transactions')
      .select('amount')
      .eq('user_id', userId)
      .eq('reference_type', 'withdrawal')
      .gte('created_at', monthStart)
      .lt('amount', 0);

    if (monthlyErr) throw monthlyErr;
    const monthlyUsed = (monthlyTx || []).reduce((sum: number, tx: any) => sum + Math.abs(tx.amount || 0), 0);

    const dailyLimit = wallet.daily_limit || 100000;
    const monthlyLimit = wallet.monthly_limit || 1000000;

    if (dailyUsed + amount > dailyLimit) {
      return {
        allowed: false,
        dailyLimit,
        dailyUsed,
        message: `Daily withdrawal limit exceeded. Limit: ${dailyLimit}, Used: ${dailyUsed}`,
      };
    }

    if (monthlyUsed + amount > monthlyLimit) {
      return {
        allowed: false,
        monthlyLimit,
        monthlyUsed,
        message: `Monthly withdrawal limit exceeded. Limit: ${monthlyLimit}, Used: ${monthlyUsed}`,
      };
    }

    return {
      allowed: true,
      dailyLimit,
      monthlyLimit,
      dailyUsed,
      monthlyUsed,
    };
  } catch (e: any) {
    return { allowed: false, message: e.message };
  }
}

export default {
  requestWithdrawal,
  getWithdrawalHistory,
  checkWithdrawalLimits,
};
