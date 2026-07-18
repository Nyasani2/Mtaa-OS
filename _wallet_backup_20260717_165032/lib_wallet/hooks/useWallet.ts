// lib/wallet/hooks/useWallet.ts
// Canonical wallet hook — reads from wallets table, uses verified RPCs
// Updated to match deposit.tsx expectations

import { useCallback, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export interface WalletData {
  id: string;
  user_id: string;
  balance: number;
  currency: string;
  status: string;
  wallet_name?: string;
  wallet_type?: string;
}

export function useWallet() {
  const user = useAuthStore((s) => s.user);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const getWallet = useCallback(async (): Promise<WalletData | null> => {
    if (!user?.id) return null;
    const { data, error } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', user.id)
      .single();
    if (error) {
      console.error('[useWallet] getWallet error:', error);
      return null;
    }
    return data;
  }, [user?.id]);

  const getBalance = useCallback(async (): Promise<number> => {
    if (!user?.id) return 0;
    const { data, error } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', user.id)
      .single();
    if (error || !data) return 0;
    return data.balance || 0;
  }, [user?.id]);

  /**
   * Get available balance (total balance minus held/reserved)
   */
  const getAvailableBalance = useCallback(async (): Promise<number> => {
    if (!user?.id) return 0;
    const { data, error } = await supabase
      .from('wallets')
      .select('balance, held_balance')
      .eq('user_id', user.id)
      .single();
    if (error || !data) return 0;
    return (data.balance || 0) - (data.held_balance || 0);
  }, [user?.id]);

  /**
   * Format balance for display (e.g., "KES 1,500.00")
   */
  const getFormattedBalance = useCallback(async (): Promise<string> => {
    const bal = await getBalance();
    return `KES ${bal.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }, [getBalance]);

  /**
   * Deposit money into wallet.
   * Uses mtaa_credit_wallet (user_id-based) instead of wallet_deposit (wallet_id-based).
   */
  const deposit = useCallback(async (
    amount: number,
    method?: string,
    phoneNumber?: string
  ): Promise<{ success: boolean; error?: string; instructions?: any }> => {
    if (!user?.id) return { success: false, error: 'Not authenticated' };
    setIsProcessing(true);
    setError(null);

    try {
      // For M-Pesa, use the credit wallet RPC
      const { error: rpcError } = await supabase.rpc('mtaa_credit_wallet', {
        p_user_id: user.id,
        p_amount: amount,
        p_description: `Deposit via ${method || 'unknown'}`,
        p_reference: phoneNumber || null,
        p_topup_method: method || null
      });

      if (rpcError) {
        setError(rpcError.message);
        return { success: false, error: rpcError.message };
      }

      // Return mock instructions for bank/crypto (real implementation would come from backend)
      let instructions = null;
      if (method === 'bank') {
        instructions = {
          bank_name: 'KCB Bank',
          account_name: 'MTAA Technologies Ltd',
          account_number: '1234567890',
          reference: `MTAA-${user.id.slice(0, 8)}`,
          instructions: 'Transfer the exact amount. Funds will reflect within 1-24 hours.'
        };
      } else if (method === 'crypto') {
        instructions = {
          network: 'TRC20',
          address: 'T' + user.id.replace(/-/g, '').slice(0, 33),
          instructions: 'Send USDT to the above address. Minimum 10 USDT.'
        };
      }

      return { success: true, instructions };
    } catch (err: any) {
      const msg = err.message || 'Deposit failed';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setIsProcessing(false);
    }
  }, [user?.id]);

  /**
   * Withdraw money from wallet.
   */
  const withdraw = useCallback(async (amount: number): Promise<boolean> => {
    if (!user?.id) return false;
    setIsProcessing(true);
    setError(null);

    const { error: rpcError } = await supabase.rpc('wallet_withdraw', {
      p_user: user.id,
      p_amount: amount
    });

    setIsProcessing(false);
    if (rpcError) {
      setError(rpcError.message);
      return false;
    }
    return true;
  }, [user?.id]);

  /**
   * Transfer money to another user (P2P).
   */
  const transfer = useCallback(async (
    toUserId: string,
    amount: number
  ): Promise<boolean> => {
    if (!user?.id) return false;
    setIsProcessing(true);
    setError(null);

    const { error: rpcError } = await supabase.rpc('wallet_send', {
      p_sender: user.id,
      p_receiver: toUserId,
      p_amount: amount
    });

    setIsProcessing(false);
    if (rpcError) {
      setError(rpcError.message);
      return false;
    }
    return true;
  }, [user?.id]);

  return {
    getWallet,
    getBalance,
    getAvailableBalance,
    getFormattedBalance,
    deposit,
    withdraw,
    transfer,
    isProcessing,
    error,
    clearError,
    userId: user?.id
  };
}

export function useWalletAccount() {
  const user = useAuthStore((s) => s.user);

  const getAccount = useCallback(async () => {
    if (!user?.id) return null;
    const { data, error } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', user.id)
      .single();
    if (error) return null;
    return {
      ...data,
      available_balance: (data?.balance || 0) - (data?.held_balance || 0)
    };
  }, [user?.id]);

  return { getAccount, userId: user?.id };
}

export default useWallet;
