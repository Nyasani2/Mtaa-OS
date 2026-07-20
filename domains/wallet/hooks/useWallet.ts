// domains/wallet/hooks/useWallet.ts
// Shim for shop wallet imports — re-exports from canonical wallet service

import { useCallback, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export function useWalletBalance() {
  const user = useAuthStore((s) => s.user);
  const [balance, setBalance] = useState({ available: 0, pending: 0, escrow: 0, currency: 'KES' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('wallets')
      .select('balance, held_balance, currency')
      .eq('user_id', user.id)
      .single();
    if (error) {
      setError(error.message);
    } else if (data) {
      setBalance({
        available: (data.balance || 0) - (data.held_balance || 0),
        pending: data.held_balance || 0,
        escrow: 0,
        currency: data.currency || 'KES'
      });
    }
    setLoading(false);
  }, [user?.id]);

  useEffect(() => { refresh(); }, [refresh]);

  return { balance, loading, error, refresh };
}

export function useWalletSend() {
  const user = useAuthStore((s) => s.user);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastTx, setLastTx] = useState<any>(null);

  const send = useCallback(async (params: { recipient_phone: string; amount: number; description?: string; pin?: string }) => {
    if (!user?.id) return { success: false, error: 'Not authenticated' };
    setSending(true);

    const { data: recipient } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('phone', params.recipient_phone)
      .single();

    if (!recipient?.id) {
      setSending(false);
      return { success: false, error: 'Recipient not found' };
    }

    const { error } = await supabase.rpc('wallet_send', {
      p_sender: user.id,
      p_receiver: recipient.id,
      p_amount: params.amount
    });

    setSending(false);
    if (error) {
      setError(error.message);
      return { success: false, error: error.message };
    }
    setLastTx({ id: Date.now() });
    return { success: true };
  }, [user?.id]);

  return { send, sending, error, lastTx };
}

export function useWalletReceive() {
  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const createRequest = useCallback(async (params: { amount?: number; description?: string }) => {
    setLoading(true);
    const req = {
      request_id: `req-${Date.now()}`,
      amount: params.amount || 0,
      currency: 'KES',
      description: params.description || '',
      deep_link: `mtaa://pay?amount=${params.amount || 0}`,
      status: 'pending'
    };
    setRequest(req);
    setLoading(false);
    return { success: true, request: req };
  }, []);

  const cancelRequest = useCallback((requestId: string) => {
    setRequest(null);
    return { success: true };
  }, []);

  return { request, createRequest, cancelRequest, loading };
}

export function useWalletHistory({ limit = 20 }: { limit?: number } = {}) {
  const user = useAuthStore((s) => s.user);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('wallet_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (!error) setTransactions(data || []);
    setLoading(false);
  }, [user?.id, limit]);

  useEffect(() => { refresh(); }, [refresh]);

  return { transactions, loading, refresh };
}

// ─── useWalletStore ─────────────────────────────────────────
// Added to fix: useWalletStore is not a function
// Provides wallet state management for components that expect a store pattern

export function useWalletStore() {
  const user = useAuthStore((s) => s.user);
  const [wallet, setWallet] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWallet = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      setError(error.message);
    } else {
      setWallet(data);
    }
    setLoading(false);
  }, [user?.id]);

  const fetchTransactions = useCallback(async (limit = 20) => {
    if (!user?.id) return;
    const { data, error } = await supabase
      .from('wallet_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (!error) setTransactions(data || []);
  }, [user?.id]);

  const deposit = useCallback(async (amount: number) => {
    if (!user?.id) return { success: false, error: 'Not authenticated' };
    const { error } = await supabase.rpc('wallet_deposit', {
      p_user_id: user.id,
      p_amount: amount
    });
    if (error) return { success: false, error: error.message };
    await fetchWallet();
    return { success: true };
  }, [user?.id, fetchWallet]);

  const withdraw = useCallback(async (amount: number) => {
    if (!user?.id) return { success: false, error: 'Not authenticated' };
    const { error } = await supabase.rpc('wallet_withdraw', {
      p_user_id: user.id,
      p_amount: amount
    });
    if (error) return { success: false, error: error.message };
    await fetchWallet();
    return { success: true };
  }, [user?.id, fetchWallet]);

  const transfer = useCallback(async (recipientId: string, amount: number) => {
    if (!user?.id) return { success: false, error: 'Not authenticated' };
    const { error } = await supabase.rpc('wallet_send', {
      p_sender: user.id,
      p_receiver: recipientId,
      p_amount: amount
    });
    if (error) return { success: false, error: error.message };
    await fetchWallet();
    await fetchTransactions();
    return { success: true };
  }, [user?.id, fetchWallet, fetchTransactions]);

  useEffect(() => {
    fetchWallet();
    fetchTransactions();
  }, [fetchWallet, fetchTransactions]);

  return {
    wallet,
    transactions,
    loading,
    error,
    fetchWallet,
    fetchTransactions,
    deposit,
    withdraw,
    transfer,
  };
}
