import { create } from 'zustand';
import { supabase } from '@/lib/supabase'
import { Wallet, Transaction, AccountWallet, LedgerEvent } from '@/types';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || ''
const SUPABASE_ANON = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || ''

interface WalletState {
  wallets: Wallet[];
  transactions: Transaction[];
  ledgerEvents: LedgerEvent[];
  accountWallets: AccountWallet[];
  balance: number;
  isLoading: boolean;
  error: string | null;
  pendingMpesaTx: string | null;

  fetchWallets: () => Promise<void>;
  fetchTransactions: (walletId?: string) => Promise<void>;
  fetchLedgerEvents: (accountId?: string) => Promise<void>;
  fetchAccountWallets: (accountId: string) => Promise<void>;
  sendMoney: (recipientId: string, amount: number, currency: string) => Promise<void>;
  topUpCard: (amount: number, cardToken: string, provider?: string) => Promise<void>;
  topUpMpesa: (phone: string, amount: number) => Promise<void>;
  createWallet: (currency: string, type?: string) => Promise<void>;
  pollMpesaStatus: (checkoutRequestId: string) => Promise<boolean>;
}

export const useWalletStore = create<WalletState>((set, get) => ({
  wallets: [],
  transactions: [],
  ledgerEvents: [],
  accountWallets: [],
  balance: 0,
  isLoading: false,
  error: null,
  pendingMpesaTx: null,

  fetchWallets: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');
      const { data, error } = await supabase.from('wallets').select('*').eq('user_id', user.user.id).order('created_at', { ascending: false });
      if (error) throw error;
      const totalBalance = (data || []).reduce((sum, w) => sum + (w.balance || 0), 0);
      set({ wallets: data || [], balance: totalBalance, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  fetchTransactions: async (walletId?: string) => {
    set({ isLoading: true, error: null });
    try {
      let query = supabase.from('app_transactions').select('*').order('created_at', { ascending: false }).limit(50);
      if (walletId) query = query.eq('wallet_id', walletId);
      const { data, error } = await query;
      if (error) throw error;
      set({ transactions: data || [], isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  fetchLedgerEvents: async (accountId?: string) => {
    set({ isLoading: true, error: null });
    try {
      let query = supabase.from('ledger_events').select('*').order('created_at', { ascending: false }).limit(100);
      if (accountId) query = query.eq('account_id', accountId);
      const { data, error } = await query;
      if (error) throw error;
      set({ ledgerEvents: data || [], isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  fetchAccountWallets: async (accountId) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase.from('account_wallets').select('*, wallets(*)').eq('account_id', accountId);
      if (error) throw error;
      set({ accountWallets: data || [], isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  sendMoney: async (recipientId, amount, currency) => {
    set({ isLoading: true, error: null });
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');
      const { error } = await supabase.rpc('transfer_funds', {
        sender_id: user.user.id,
        recipient_id: recipientId,
        amount,
        currency_code: currency
      });
      if (error) throw error;
      await get().fetchWallets();
      await get().fetchTransactions();
      set({ isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  topUpCard: async (amount, cardToken, provider = 'stripe') => {
    set({ isLoading: true, error: null });
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');
      const primaryWallet = get().wallets[0];
      if (!primaryWallet) throw new Error('No wallet found. Create one first.');
      const res = await fetch(`${SUPABASE_URL}/functions/v1/card-payment`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${SUPABASE_ANON}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, userId: user.user.id, walletId: primaryWallet.id, cardToken, provider, currency: primaryWallet.currency || 'USD' })
      });
      const result = await res.json();
      if (!res.ok || result.error) throw new Error(result.error || 'Card payment failed');
      await get().fetchWallets();
      await get().fetchTransactions();
      set({ isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  topUpMpesa: async (phone, amount) => {
    set({ isLoading: true, error: null });
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');
      const primaryWallet = get().wallets[0];
      if (!primaryWallet) throw new Error('No wallet found. Create one first.');
      const res = await fetch(`${SUPABASE_URL}/functions/v1/mpesa-stk-push`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${SUPABASE_ANON}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, amount, userId: user.user.id, walletId: primaryWallet.id, description: 'Wallet top-up', isSandbox: false })
      });
      const result = await res.json();
      if (!res.ok || result.error) throw new Error(result.error || 'M-Pesa request failed');
      set({ pendingMpesaTx: result.checkoutRequestId, isLoading: false });
      setTimeout(() => { get().pollMpesaStatus(result.checkoutRequestId); }, 15000);
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  pollMpesaStatus: async (checkoutRequestId) => {
    const maxAttempts = 12;
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise(r => setTimeout(r, 5000));
      const { data: tx } = await supabase.from('app_transactions').select('status').eq('external_ref', checkoutRequestId).single();
      if (tx?.status === 'completed') {
        await get().fetchWallets();
        await get().fetchTransactions();
        set({ pendingMpesaTx: null });
        return true;
      }
      if (tx?.status === 'failed') {
        set({ pendingMpesaTx: null, error: 'M-Pesa payment failed' });
        return false;
      }
    }
    set({ pendingMpesaTx: null });
    return false;
  },

  createWallet: async (currency, type = 'personal') => {
    set({ isLoading: true, error: null });
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');
      const { error } = await supabase.from('wallets').insert({ user_id: user.user.id, currency, type, balance: 0, status: 'active' });
      if (error) throw error;
      await get().fetchWallets();
      set({ isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  }
}));
