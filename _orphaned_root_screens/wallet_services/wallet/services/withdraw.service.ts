// lib/wallet/services/withdraw.service.ts
// Wallet withdrawal service — bank transfer, mobile money, crypto

import { supabase } from '@/lib/supabase';

// ─── Types ─────────────────────────────────────────────────────────

export interface WithdrawalMethod {
  id: string;
  user_id: string;
  type: 'bank' | 'mobile_money' | 'crypto' | 'paypal';
  label: string;
  is_default: boolean;
  details: Record<string, any>;
  verified: boolean;
  created_at: string;
}

export interface WithdrawalRequest {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  method_id: string;
  method_type: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  fee: number;
  net_amount: number;
  reference: string;
  failure_reason: string | null;
  processed_at: string | null;
  created_at: string;
}

export interface WithdrawalSummary {
  pending: number;
  completedToday: number;
  availableBalance: number;
  currency: string;
}

// ─── Service ───────────────────────────────────────────────────────

class WithdrawService {
  private static instance: WithdrawService;

  static getInstance(): WithdrawService {
    if (!WithdrawService.instance) {
      WithdrawService.instance = new WithdrawService();
    }
    return WithdrawService.instance;
  }

  // ─── Methods ─────────────────────────────────────────────────────

  async getMethods(userId: string): Promise<WithdrawalMethod[]> {
    const { data, error } = await supabase
      .from('withdrawal_methods')
      .select('*')
      .eq('user_id', userId)
      .order('is_default', { ascending: false });

    if (error) {
      console.error('[WithdrawService] getMethods error:', error);
      return [];
    }
    return (data || []) as WithdrawalMethod[];
  }

  async addMethod(userId: string, method: Omit<WithdrawalMethod, 'id' | 'user_id' | 'created_at'>): Promise<{ success: boolean; method?: WithdrawalMethod; error?: string }> {
    const { data, error } = await supabase
      .from('withdrawal_methods')
      .insert({ ...method, user_id: userId })
      .select()
      .single();

    if (error) {
      console.error('[WithdrawService] addMethod error:', error);
      return { success: false, error: error.message };
    }
    return { success: true, method: data as WithdrawalMethod };
  }

  async deleteMethod(methodId: string): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase
      .from('withdrawal_methods')
      .delete()
      .eq('id', methodId);

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  }

  // ─── Withdrawals ───────────────────────────────────────────────

  async requestWithdrawal(userId: string, amount: number, methodId: string): Promise<{ success: boolean; request?: WithdrawalRequest; error?: string }> {
    // Get method details
    const { data: method } = await supabase
      .from('withdrawal_methods')
      .select('*')
      .eq('id', methodId)
      .single();

    if (!method) {
      return { success: false, error: 'Withdrawal method not found' };
    }

    // Check balance
    const { data: wallet } = await supabase
      .from('wallets')
      .select('balance, currency')
      .eq('user_id', userId)
      .single();

    if (!wallet || wallet.balance < amount) {
      return { success: false, error: 'Insufficient balance' };
    }

    // Calculate fee (2% platform fee, min $1)
    const fee = Math.max(amount * 0.02, 1);
    const netAmount = amount - fee;

    // Create request
    const { data, error } = await supabase
      .from('withdrawal_requests')
      .insert({
        user_id: userId,
        amount,
        currency: wallet.currency || 'USD',
        method_id: methodId,
        method_type: method.type,
        status: 'pending',
        fee,
        net_amount: netAmount,
        reference: `WD-${Date.now()}`,
      })
      .select()
      .single();

    if (error) {
      console.error('[WithdrawService] requestWithdrawal error:', error);
      return { success: false, error: error.message };
    }

    // Hold balance
    await supabase
      .from('wallets')
      .update({ balance: wallet.balance - amount, held_balance: (wallet.held_balance || 0) + amount })
      .eq('user_id', userId);

    return { success: true, request: data as WithdrawalRequest };
  }

  async getWithdrawals(userId: string, limit: number = 20): Promise<WithdrawalRequest[]> {
    const { data, error } = await supabase
      .from('withdrawal_requests')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[WithdrawService] getWithdrawals error:', error);
      return [];
    }
    return (data || []) as WithdrawalRequest[];
  }

  async cancelWithdrawal(requestId: string): Promise<{ success: boolean; error?: string }> {
    const { data: req } = await supabase
      .from('withdrawal_requests')
      .select('status, user_id, amount')
      .eq('id', requestId)
      .single();

    if (!req || req.status !== 'pending') {
      return { success: false, error: 'Cannot cancel this withdrawal' };
    }

    // Release held balance
    const { data: wallet } = await supabase
      .from('wallets')
      .select('balance, held_balance')
      .eq('user_id', req.user_id)
      .single();

    if (wallet) {
      await supabase
        .from('wallets')
        .update({
          balance: wallet.balance + req.amount,
          held_balance: Math.max(0, (wallet.held_balance || 0) - req.amount),
        })
        .eq('user_id', req.user_id);
    }

    const { error } = await supabase
      .from('withdrawal_requests')
      .update({ status: 'cancelled' })
      .eq('id', requestId);

    if (error) return { success: false, error: error.message };
    return { success: true };
  }

  // ─── Summary ─────────────────────────────────────────────────────

  async getSummary(userId: string): Promise<WithdrawalSummary> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [{ data: pending }, { data: completed }, { data: wallet }] = await Promise.all([
      supabase.from('withdrawal_requests').select('amount').eq('user_id', userId).eq('status', 'pending'),
      supabase.from('withdrawal_requests').select('amount').eq('user_id', userId).eq('status', 'completed').gte('created_at', today.toISOString()),
      supabase.from('wallets').select('balance, currency').eq('user_id', userId).single(),
    ]);

    return {
      pending: (pending || []).reduce((s, r) => s + (r.amount || 0), 0),
      completedToday: (completed || []).reduce((s, r) => s + (r.amount || 0), 0),
      availableBalance: (wallet?.balance || 0) - ((wallet?.held_balance || 0)),
      currency: wallet?.currency || 'USD',
    };
  }
}

export const withdrawService = WithdrawService.getInstance();
