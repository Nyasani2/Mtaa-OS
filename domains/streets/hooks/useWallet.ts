import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface WalletBalance {
  available: number;
  escrow: number;
  pending: number;
  currency: string;
}

export interface WalletTransaction {
  id: string;
  type: 'credit' | 'debit' | 'escrow' | 'release';
  amount: number;
  description: string;
  status: 'completed' | 'pending' | 'failed';
  created_at: string;
}

export function useStreetsWallet() {
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchBalance = useCallback(async () => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;

    const { data, error } = await supabase
      .from('wallet_balances')
      .select('*')
      .eq('user_id', user.user.id)
      .single();

    if (error) {
      console.error('[useStreetsWallet] fetchBalance error:', error);
      return;
    }

    setBalance(data);
  }, []);

  const fetchTransactions = useCallback(async (limit = 20) => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;

    const { data, error } = await supabase
      .from('wallet_transactions')
      .select('*')
      .eq('user_id', user.user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[useStreetsWallet] fetchTransactions error:', error);
      return;
    }

    setTransactions(data || []);
  }, []);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([fetchBalance(), fetchTransactions()]);
    setIsLoading(false);
  }, [fetchBalance, fetchTransactions]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    balance,
    transactions,
    isLoading,
    refresh,
    fetchBalance,
    fetchTransactions,
  };
}

// CRITICAL: Compatibility export for components still calling useWallet()
export const useWallet = useStreetsWallet;

// Also export the balance hook for direct use
export function useWalletBalance() {
  const { balance, isLoading, fetchBalance } = useStreetsWallet();
  return { balance, isLoading, refresh: fetchBalance };
}
