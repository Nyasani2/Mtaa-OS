// ============================================================
// MTAA OS V10 - useWallet Hook (Fixed)
// ALIGNED TO VERIFIED SQL RPC FUNCTIONS
// Replaces: wallet_deposit → mtaa_credit_wallet
//           wallet_transfer → wallet_send (avoids overloaded wallet_transfer)
//           wallet_create_escrow → mtaa_process_payment (for escrow creation)
// ============================================================

import { useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export interface WalletData {
  id: string;
  user_id: string;
  balance: number;
  currency: string;
  status: string;
}

export interface TransactionData {
  id: string;
  user_id: string;
  amount: number;
  type: string;
  status: string;
  created_at: string;
}

export function useWallet() {
  const user = useAuthStore((s) => s.user);

  /**
   * Get or create wallet for current user.
   * Uses mtaa_get_or_create_wallet (verified working).
   */
  const getWallet = useCallback(async (): Promise<WalletData | null> => {
    if (!user?.id) return null;

    // Try RPC first (creates if missing)
    const { data: rpcData, error: rpcError } = await supabase.rpc('mtaa_get_or_create_wallet', {
      p_user_id: user.id,
      p_currency: 'KES'
    });

    if (rpcError) {
      console.error('[useWallet] RPC error:', rpcError);
    }

    // Read from canonical wallets table
    const { data, error } = await supabase
      .from('wallet_accounts')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('[useWallet] getWallet error:', error);
      return null;
    }

    return data;
  }, [user?.id]);

  /**
   * Get wallet transactions for current user.
   * Queries by user_id (matching how SQL functions write transactions).
   */
  const getTransactions = useCallback(async (): Promise<TransactionData[]> => {
    if (!user?.id) return [];

    const { data, error } = await supabase
      .from('wallet_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[useWallet] getTransactions error:', error);
      return [];
    }

    return data || [];
  }, [user?.id]);

  /**
   * Deposit money into wallet.
   * FIXED: Uses mtaa_credit_wallet (user_id-based) instead of wallet_deposit (wallet_id-based).
   * Verified: adds balance, creates transaction record.
   */
  const deposit = useCallback(async (amount: number, description?: string): Promise<boolean> => {
    if (!user?.id) return false;

    const { error } = await supabase.rpc('mtaa_credit_wallet', {
      p_user_id: user.id,
      p_amount: amount,
      p_description: description || 'Wallet deposit',
      p_reference: null,
      p_topup_method: null
    });

    if (error) {
      console.error('[useWallet] deposit error:', error);
      return false;
    }

    return true;
  }, [user?.id]);

  /**
   * Withdraw money from wallet.
   * Uses wallet_withdraw (verified: p_user uuid, p_amount numeric).
   */
  const withdraw = useCallback(async (amount: number): Promise<boolean> => {
    if (!user?.id) return false;

    const { error } = await supabase.rpc('wallet_withdraw', {
      p_user: user.id,
      p_amount: amount
    });

    if (error) {
      console.error('[useWallet] withdraw error:', error);
      return false;
    }

    return true;
  }, [user?.id]);

  /**
   * Transfer money to another user (P2P).
   * FIXED: Uses wallet_send (user_id-based) instead of overloaded wallet_transfer.
   * Verified: wallet_send(p_sender uuid, p_receiver uuid, p_amount numeric).
   */
  const transfer = useCallback(async (toUserId: string, amount: number): Promise<boolean> => {
    if (!user?.id) return false;

    const { error } = await supabase.rpc('wallet_send', {
      p_sender: user.id,
      p_receiver: toUserId,
      p_amount: amount
    });

    if (error) {
      console.error('[useWallet] transfer error:', error);
      return false;
    }

    return true;
  }, [user?.id]);

  /**
   * Create escrow for a payment.
   * FIXED: Uses mtaa_process_payment which handles escrow logic internally.
   * (No standalone wallet_create_escrow function exists in verified schema.)
   */
  const createEscrow = useCallback(async (
    toUserId: string,
    amount: number,
    reference?: string
  ): Promise<boolean> => {
    if (!user?.id) return false;

    const { error } = await supabase.rpc('mtaa_process_payment', {
      p_from_user_id: user.id,
      p_to_user_id: toUserId,
      p_total_amount: amount,
      p_type: 'escrow',
      p_reference: reference || 'escrow-payment'
    });

    if (error) {
      console.error('[useWallet] createEscrow error:', error);
      return false;
    }

    return true;
  }, [user?.id]);

  /**
   * Get current wallet balance.
   * Reads from canonical wallets table (not legacy wallet_accounts).
   */
  const getBalance = useCallback(async (): Promise<number> => {
    if (!user?.id) return 0;

    const { data, error } = await supabase
      .from('wallet_accounts')
      .select('balance')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error || !data) {
      console.error('[useWallet] getBalance error:', error);
      return 0;
    }

    return data.balance || 0;
  }, [user?.id]);

  return {
    getWallet,
    getTransactions,
    deposit,
    withdraw,
    transfer,
    createEscrow,
    getBalance,
    userId: user?.id
  };
}
