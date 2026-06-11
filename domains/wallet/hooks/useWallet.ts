// domains/wallet/hooks/useWallet.ts
// Core wallet operations — balance, send, receive, history
// Wired to: wallets, wallet_transactions, wallet_pending_transactions
// Auth: useAuthStore from @/lib/auth/useAuthStore (canonical)

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth/useAuthStore';

// ───────────────────────────────────────────────
// Types
// ───────────────────────────────────────────────

export interface WalletBalance {
  available: number;
  pending: number;
  escrow: number;
  total: number;
  currency: string;
  wallet_id: string;
}

export interface WalletTransaction {
  id: string;
  user_id: string;
  wallet_id: string | null;
  type: 'credit' | 'debit' | 'escrow' | 'refund' | 'subscription' | 'transfer';
  amount: number;
  balance_after: number | null;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  description: string | null;
  reference: string | null;
  recipient_id: string | null;
  recipient_name: string | null;
  recipient_phone: string | null;
  metadata: Record<string, any>;
  created_at: string;
  completed_at: string | null;
}

export interface SendPayload {
  recipient_id?: string;
  recipient_phone?: string;
  amount: number;
  currency?: string;
  description?: string;
  pin: string;
}

export interface ReceivePayload {
  amount?: number;
  currency?: string;
  description?: string;
  expires_in_minutes?: number;
}

export interface ReceiveRequest {
  request_id: string;
  qr_data: string;
  deep_link: string;
  amount: number;
  currency: string;
  expires_at: string;
}

// ───────────────────────────────────────────────
// useWalletBalance
// ───────────────────────────────────────────────

export function useWalletBalance() {
  const { user, isAuthenticated } = useAuthStore();
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = useCallback(async () => {
    if (!isAuthenticated || !user?.id) {
      setBalance(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // Fetch default wallet
      const { data: wallet, error: wErr } = await supabase
        .from('wallets')
        .select('id, balance, currency, status, is_default')
        .eq('user_id', user.id)
        .eq('is_default', true)
        .single();

      if (wErr && wErr.code !== 'PGRST116') throw wErr;

      if (!wallet) {
        setBalance({ available: 0, pending: 0, escrow: 0, total: 0, currency: 'KES', wallet_id: '' });
        setLoading(false);
        return;
      }

      // Fetch pending transactions sum
      const { data: pendingData } = await supabase
        .from('wallet_transactions')
        .select('amount')
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .eq('type', 'debit');

      const pending = (pendingData || []).reduce((sum, t) => sum + (t.amount || 0), 0);

      // Fetch escrow sum
      const { data: escrowData } = await supabase
        .from('wallet_transactions')
        .select('amount')
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .eq('type', 'escrow');

      const escrow = (escrowData || []).reduce((sum, t) => sum + (t.amount || 0), 0);

      setBalance({
        available: wallet.balance || 0,
        pending,
        escrow,
        total: (wallet.balance || 0) + pending + escrow,
        currency: wallet.currency || 'KES',
        wallet_id: wallet.id,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load wallet balance');
    } finally {
      setLoading(false);
    }
  }, [user?.id, isAuthenticated]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  // Realtime subscription for balance updates
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel(`wallet_balance_${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'wallet_transactions', filter: `user_id=eq.${user.id}` },
        () => fetchBalance()
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id, fetchBalance]);

  return { balance, loading, error, refresh: fetchBalance };
}

// ───────────────────────────────────────────────
// useWalletSend
// ───────────────────────────────────────────────

export function useWalletSend() {
  const { user, isAuthenticated, verifyPIN } = useAuthStore();
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastTx, setLastTx] = useState<WalletTransaction | null>(null);

  const send = useCallback(async (payload: SendPayload): Promise<{ success: boolean; tx?: WalletTransaction; error?: string }> => {
    if (!isAuthenticated || !user?.id) {
      return { success: false, error: 'Not authenticated' };
    }
    if (!payload.amount || payload.amount <= 0) {
      return { success: false, error: 'Invalid amount' };
    }
    if (!payload.recipient_id && !payload.recipient_phone) {
      return { success: false, error: 'Recipient required' };
    }

    // Verify PIN
    const pinCheck = await verifyPIN(payload.pin);
    if (!pinCheck.valid) {
      return { success: false, error: pinCheck.error || 'Invalid PIN' };
    }

    setSending(true);
    setError(null);

    try {
      // Get sender wallet
      const { data: senderWallet } = await supabase
        .from('wallets')
        .select('id, balance, currency')
        .eq('user_id', user.id)
        .eq('is_default', true)
        .single();

      if (!senderWallet) throw new Error('Wallet not found');
      if ((senderWallet.balance || 0) < payload.amount) {
        throw new Error('Insufficient balance');
      }

      // Resolve recipient
      let recipientId = payload.recipient_id;
      if (!recipientId && payload.recipient_phone) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('phone', payload.recipient_phone)
          .single();
        if (profile) recipientId = profile.id;
      }

      // Create transaction record
      const { data: tx, error: txErr } = await supabase
        .from('wallet_transactions')
        .insert({
          user_id: user.id,
          wallet_id: senderWallet.id,
          type: 'debit',
          transaction_type: 'transfer',
          amount: payload.amount,
          currency: payload.currency || senderWallet.currency || 'KES',
          status: 'completed',
          description: payload.description || 'Wallet transfer',
          recipient_id: recipientId || null,
          recipient_phone: payload.recipient_phone || null,
          balance_after: (senderWallet.balance || 0) - payload.amount,
          metadata: { sender_id: user.id, method: 'wallet_transfer' },
        })
        .select()
        .single();

      if (txErr) throw txErr;

      // Update sender balance
      await supabase
        .from('wallets')
        .update({ balance: (senderWallet.balance || 0) - payload.amount, updated_at: new Date().toISOString() })
        .eq('id', senderWallet.id);

      // Credit recipient if internal
      if (recipientId) {
        const { data: recipientWallet } = await supabase
          .from('wallets')
          .select('id, balance')
          .eq('user_id', recipientId)
          .eq('is_default', true)
          .single();

        if (recipientWallet) {
          await supabase
            .from('wallets')
            .update({ balance: (recipientWallet.balance || 0) + payload.amount, updated_at: new Date().toISOString() })
            .eq('id', recipientWallet.id);

          await supabase.from('wallet_transactions').insert({
            user_id: recipientId,
            wallet_id: recipientWallet.id,
            type: 'credit',
            transaction_type: 'transfer',
            amount: payload.amount,
            currency: payload.currency || senderWallet.currency || 'KES',
            status: 'completed',
            description: `Received from ${user.display_name || user.email || 'wallet user'}`,
            reference: tx.id,
            balance_after: (recipientWallet.balance || 0) + payload.amount,
            metadata: { sender_id: user.id, original_tx: tx.id },
          });
        }
      }

      setLastTx(tx as WalletTransaction);
      return { success: true, tx: tx as WalletTransaction };
    } catch (err: any) {
      setError(err.message || 'Transfer failed');
      return { success: false, error: err.message || 'Transfer failed' };
    } finally {
      setSending(false);
    }
  }, [user?.id, isAuthenticated, verifyPIN]);

  return { send, sending, error, lastTx, clearError: () => setError(null) };
}

// ───────────────────────────────────────────────
// useWalletReceive
// ────────────────────────────────────────────

export function useWalletReceive() {
  const { user, isAuthenticated } = useAuthStore();
  const [request, setRequest] = useState<ReceiveRequest | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createRequest = useCallback(async (payload: ReceivePayload = {}): Promise<{ success: boolean; request?: ReceiveRequest; error?: string }> => {
    if (!isAuthenticated || !user?.id) {
      return { success: false, error: 'Not authenticated' };
    }
    setLoading(true);
    setError(null);

    try {
      const requestId = `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const amount = payload.amount || 0;
      const currency = payload.currency || 'KES';
      const expiresAt = new Date(Date.now() + (payload.expires_in_minutes || 30) * 60000).toISOString();

      const qrData = JSON.stringify({
        type: 'mtaa_wallet_request',
        request_id: requestId,
        user_id: user.id,
        amount,
        currency,
        expires_at: expiresAt,
      });

      const deepLink = `mtaa://wallet/pay?to=${user.id}&amount=${amount}&currency=${currency}&ref=${requestId}`;

      // Store pending request
      await supabase.from('wallet_pending_transactions').insert({
        user_id: user.id,
        type: 'receive_request',
        amount,
        currency,
        status: 'pending',
        reference: requestId,
        metadata: { qr_data: qrData, deep_link: deepLink, expires_at: expiresAt },
      });

      const req: ReceiveRequest = {
        request_id: requestId,
        qr_data: qrData,
        deep_link: deepLink,
        amount,
        currency,
        expires_at: expiresAt,
      };

      setRequest(req);
      return { success: true, request: req };
    } catch (err: any) {
      setError(err.message || 'Failed to create receive request');
      return { success: false, error: err.message || 'Failed to create receive request' };
    } finally {
      setLoading(false);
    }
  }, [user?.id, isAuthenticated]);

  const cancelRequest = useCallback(async (requestId: string) => {
    if (!user?.id) return;
    await supabase
      .from('wallet_pending_transactions')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('reference', requestId)
      .eq('user_id', user.id);
    setRequest(null);
  }, [user?.id]);

  return { request, createRequest, cancelRequest, loading, error, clearError: () => setError(null) };
}

// ───────────────────────────────────────────────
// useWalletHistory
// ───────────────────────────────────────────────

export function useWalletHistory(filters?: { type?: string; status?: string; limit?: number; offset?: number }) {
  const { user, isAuthenticated } = useAuthStore();
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const limit = filters?.limit || 50;
  const offset = filters?.offset || 0;

  const fetchHistory = useCallback(async (append = false) => {
    if (!isAuthenticated || !user?.id) {
      setTransactions([]);
      return;
    }
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (filters?.type) query = query.eq('type', filters.type);
      if (filters?.status) query = query.eq('status', filters.status);

      const { data, error: sbErr } = await query;
      if (sbErr) throw sbErr;

      const txs = (data || []) as WalletTransaction[];
      setTransactions(prev => append ? [...prev, ...txs] : txs);
      setHasMore(txs.length === limit);
    } catch (err: any) {
      setError(err.message || 'Failed to load transaction history');
    } finally {
      setLoading(false);
    }
  }, [user?.id, isAuthenticated, filters?.type, filters?.status, limit, offset]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Realtime updates
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel(`wallet_history_${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'wallet_transactions', filter: `user_id=eq.${user.id}` },
        (payload) => {
          setTransactions(prev => [payload.new as WalletTransaction, ...prev]);
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  const loadMore = () => fetchHistory(true);

  return { transactions, loading, error, hasMore, refresh: () => fetchHistory(false), loadMore };
}
