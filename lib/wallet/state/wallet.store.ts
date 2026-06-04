// lib/wallet/state/wallet.store.ts
// Wallet state store

import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

export interface WalletState {
  balance: number;
  heldBalance: number;
  currency: string;
  transactions: WalletTransaction[];
  loading: boolean;
  error: string | null;

  loadWallet: (userId: string) => Promise<void>;
  loadTransactions: (userId: string, limit?: number) => Promise<void>;
  setBalance: (balance: number) => void;
  setError: (error: string | null) => void;
}

export interface WalletTransaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'payment' | 'earning' | 'refund' | 'escrow';
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed';
  description: string;
  created_at: string;
}

export const useWalletStore = create<WalletState>((set) => ({
  balance: 0,
  heldBalance: 0,
  currency: 'USD',
  transactions: [],
  loading: false,
  error: null,

  loadWallet: async (userId: string) => {
    set({ loading: true });
    const { data, error } = await supabase
      .from('wallets')
      .select('balance, held_balance, currency')
      .eq('user_id', userId)
      .single();

    if (error) {
      set({ error: error.message, loading: false });
      return;
    }

    set({
      balance: data?.balance || 0,
      heldBalance: data?.held_balance || 0,
      currency: data?.currency || 'USD',
      loading: false,
    });
  },

  loadTransactions: async (userId: string, limit: number = 20) => {
    set({ loading: true });
    const { data, error } = await supabase
      .from('wallet_transactions')
      .select('*')
      .eq('profile_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      set({ error: error.message, loading: false });
      return;
    }

    set({ transactions: (data || []) as WalletTransaction[], loading: false });
  },

  setBalance: (balance: number) => set({ balance }),
  setError: (error: string | null) => set({ error }),
}));
