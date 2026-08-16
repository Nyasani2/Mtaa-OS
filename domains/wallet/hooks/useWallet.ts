// domains/wallet/hooks/useWallet.ts
// BRIDGE — re-exports canonical wallet hooks for @/domains/wallet/hooks/useWallet imports
// Maps: useWalletStore, useWallet, useWalletTransactions, useWalletBalance, useWalletHistory, useWalletSend, useWalletAccount

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth/store/auth.store';

// ─── Types ───
export interface WalletBalance {
  available: number;
  pending: number;
  escrow: number;
  total: number;
  currency: string;
}

export interface WalletTransaction {
  id: string;
  user_id: string;
  wallet_id?: string | null;
  amount: number;
  type: string;
  status: string;
  currency?: string;
  description?: string | null;
  reference_id?: string | null;
  reference_type?: string | null;
  metadata?: any;
  balance_after?: number | null;
  completed_at?: string | null;
  failed_at?: string | null;
  provider?: string | null;
  reference?: string | null;
  type?: string | null;
  user_id?: string | null;
  created_at: string;
  updated_at?: string | null;
}

export interface WalletAccount {
  id: string;
  user_id: string;
  wallet_name?: string;
  wallet_type?: string;
  currency: string;
  balance: number;
  held_balance?: number;
  available_balance?: number;
  status: string;
  is_default?: boolean;
  daily_limit?: number;
  monthly_limit?: number;
  max_balance?: number;
  tier?: string;
  created_at?: string;
  updated_at?: string;
}

// ─── useWalletStore — Zustand-compatible hook ───
export function useWalletStore() {
  const user = useAuthStore((s) => s.user);
  const [balance, setBalanceState] = useState(0);
  const [currency, setCurrency] = useState('KES');
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { data, error: err } = await supabase
        .from('wallet_accounts')
        .select('balance, currency')
        .eq('user_id', user.id)
        .single();
      if (err) throw err;
      setBalanceState(data?.balance || 0);
      setCurrency(data?.currency || 'KES');
    } catch (e: any) {
      setError(e.message);
    }
  }, [user?.id]);

  const fetchTransactions = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { data, error: err } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (err) throw err;
      setTransactions(data || []);
    } catch (e: any) {
      setError(e.message);
    }
  }, [user?.id]);

  const setBalance = useCallback((val: number) => {
    setBalanceState(val);
  }, []);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    await Promise.all([fetchBalance(), fetchTransactions()]);
    setIsLoading(false);
  }, [fetchBalance, fetchTransactions]);

  useEffect(() => {
    refresh();
  }, [user?.id]);

  return {
    balance,
    setBalance,
    currency,
    transactions,
    isLoading,
    error,
    refresh,
  };
}

// ─── useWallet — canonical wrapper ───
export function useWallet() {
  const user = useAuthStore((s) => s.user);

  const getWallet = useCallback(async () => {
    if (!user?.id) return null;
    const { data, error } = await supabase
      .from('wallet_accounts')
      .select('*')
      .eq('user_id', user.id)
      .single();
    if (error) { console.error('[useWallet]', error); return null; }
    return data;
  }, [user?.id]);

  const getBalance = useCallback(async () => {
    if (!user?.id) return 0;
    const { data, error } = await supabase
      .from('wallet_accounts')
      .select('balance')
      .eq('user_id', user.id)
      .single();
    if (error) { console.error('[useWallet]', error); return 0; }
    return data?.balance || 0;
  }, [user?.id]);

  const getTransactions = useCallback(async () => {
    if (!user?.id) return [];
    const { data, error } = await supabase
      .from('wallet_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (error) { console.error('[useWallet]', error); return []; }
    return data || [];
  }, [user?.id]);

  const deposit = useCallback(async (amount: number, description?: string) => {
    if (!user?.id) return false;
    const { error } = await supabase.rpc('mtaa_credit_wallet', {
      p_user_id: user.id,
      p_amount: amount,
      p_description: description || 'Wallet deposit',
      p_reference: null,
      p_topup_method: null,
    });
    if (error) { console.error('[useWallet] deposit:', error); return false; }
    return true;
  }, [user?.id]);

  const withdraw = useCallback(async (amount: number) => {
    if (!user?.id) return false;
    const { error } = await supabase.rpc('wallet_withdraw', {
      p_user: user.id,
      p_amount: amount,
    });
    if (error) { console.error('[useWallet] withdraw:', error); return false; }
    return true;
  }, [user?.id]);

  const transfer = useCallback(async (toUserId: string, amount: number) => {
    if (!user?.id) return false;
    const { error } = await supabase.rpc('wallet_send', {
      p_sender: user.id,
      p_receiver: toUserId,
      p_amount: amount,
    });
    if (error) { console.error('[useWallet] transfer:', error); return false; }
    return true;
  }, [user?.id]);

  return {
    getWallet,
    getBalance,
    getTransactions,
    deposit,
    withdraw,
    transfer,
    userId: user?.id,
  };
}

// ─── useWalletTransactions — paginated transactions hook ───
export function useWalletTransactions(limit: number = 50) {
  const user = useAuthStore((s) => s.user);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);
      if (err) throw err;
      setTransactions(data || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, limit]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { transactions, isLoading, error, refresh };
}

// ─── useWalletBalance — dedicated balance hook ───
export function useWalletBalance() {
  const user = useAuthStore((s) => s.user);
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('wallet_accounts')
        .select('balance, currency, held_balance, pending_balance')
        .eq('user_id', user.id)
        .single();
      if (err) throw err;
      const bal = data?.balance || 0;
      const held = data?.held_balance || 0;
      const pending = data?.pending_balance || 0;
      setBalance({
        available: bal - held,
        pending,
        escrow: held,
        total: bal + pending,
        currency: data?.currency || 'KES',
      });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { balance, loading, error, refresh };
}

// ─── useWalletHistory — transaction history hook ───
export function useWalletHistory(options?: { limit?: number; type?: string }) {
  const user = useAuthStore((s) => s.user);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (options?.limit) query = query.limit(options.limit);
      if (options?.type) query = query.eq('type', options.type);
      const { data, error: err } = await query;
      if (err) throw err;
      setTransactions(data || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [user?.id, options?.limit, options?.type]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { transactions, loading, error, refresh };
}

// ─── useWalletSend — send/transfer hook ───
export function useWalletSend() {
  const user = useAuthStore((s) => s.user);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = useCallback(async (recipientId: string, amount: number, description?: string) => {
    if (!user?.id) return false;
    setSending(true);
    setError(null);
    try {
      const { error: err } = await supabase.rpc('wallet_send', {
        p_sender: user.id,
        p_receiver: recipientId,
        p_amount: amount,
      });
      if (err) throw err;
      return true;
    } catch (e: any) {
      setError(e.message);
      return false;
    } finally {
      setSending(false);
    }
  }, [user?.id]);

  return { send, sending, error };
}

// ─── useWalletAccount — account details hook ───
export function useWalletAccount() {
  const user = useAuthStore((s) => s.user);
  const [account, setAccount] = useState<WalletAccount | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('wallet_accounts')
        .select('*')
        .eq('user_id', user.id)
        .single();
      if (err) throw err;
      setAccount(data as WalletAccount);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { account, loading, error, refresh };
}

export default useWalletStore;
