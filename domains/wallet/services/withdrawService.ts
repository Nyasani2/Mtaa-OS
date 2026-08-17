// domains/wallet/services/withdrawService.ts
// Withdraw service — handles all withdrawal operations

import { supabase } from '@/lib/supabase';

export interface WithdrawalRequest {
  amount: number;
  walletId: string;
  userId: string;
  method: 'mpesa' | 'bank' | 'agent';
  phoneNumber?: string;
  bankAccount?: string;
  agentId?: string;
}

export interface WithdrawalResult {
  success: boolean;
  transactionId?: string;
  error?: string;
  status?: string;
}

export const withdrawService = {
  async initiateWithdrawal(request: WithdrawalRequest): Promise<WithdrawalResult> {
    try {
      const { data, error } = await supabase
        .from('wallet_transactions')
        .insert({
          user_id: request.userId,
          wallet_id: request.walletId,
          amount: request.amount,
          type: 'withdrawal',
          status: 'pending',
          description: `Withdrawal via ${request.method}`,
          metadata: {
            method: request.method,
            phone_number: request.phoneNumber,
            bank_account: request.bankAccount,
            agent_id: request.agentId,
          },
        })
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return {
        success: true,
        transactionId: data.id,
        status: data.status,
      };
    } catch (err: any) {
      return { success: false, error: err.message || 'Withdrawal failed' };
    }
  },

  async getWithdrawalHistory(userId: string, limit: number = 20) {
    const { data, error } = await supabase
      .from('wallet_transactions')
      .select('*')
      .eq('user_id', userId)
      .eq('type', 'withdrawal')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  async checkBalance(userId: string, walletId: string): Promise<number> {
    const { data, error } = await supabase
      .from('wallet_accounts')
      .select('balance')
      .eq('user_id', userId)
      .eq('id', walletId)
      .single();

    if (error) throw error;
    return data?.balance || 0;
  },

  async cancelWithdrawal(transactionId: string, userId: string): Promise<WithdrawalResult> {
    const { data, error } = await supabase
      .from('wallet_transactions')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', transactionId)
      .eq('user_id', userId)
      .eq('status', 'pending')
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, transactionId: data.id, status: 'cancelled' };
  },
};

export default withdrawService;

