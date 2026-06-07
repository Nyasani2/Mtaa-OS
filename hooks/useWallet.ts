// hooks/useWallet.ts
// Real wallet hook — connects to Supabase tables and edge functions
// Multi-country support, generates receipts and notifications

import { create } from 'zustand';
import { useAuthStore } from '@/lib/auth/useAuthStore';
import { supabase } from '@/lib/supabase/client';

export interface WalletTransaction {
  id: string;
  transaction_type: string;
  direction: 'credit' | 'debit';
  amount: number;
  currency: string;
  status: string;
  description: string;
  reference: string;
  counterparty_wallet_id?: string;
  counterparty_phone?: string;
  metadata?: Record<string, any>;
  created_at: string;
  completed_at?: string;
}

export interface WalletAccount {
  id: string;
  user_id: string;
  account_id: string;
  wallet_name: string;
  wallet_type: string;
  currency: string;
  balance: number;
  available_balance: number;
  held_balance: number;
  status: string;
  is_default: boolean;
  daily_limit: number;
  monthly_limit: number;
  created_at: string;
  updated_at: string;
}

export interface WalletReceipt {
  id: string;
  user_id: string;
  wallet_id: string;
  transaction_type: string;
  amount: number;
  currency: string;
  status: string;
  reference: string;
  description: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface WalletState {
  account: WalletAccount | null;
  transactions: WalletTransaction[];
  receipts: WalletReceipt[];
  isLoading: boolean;
  error: string | null;
  isProcessing: boolean;

  // Actions
  loadAccount: () => Promise<void>;
  loadTransactions: (limit?: number) => Promise<void>;
  loadReceipts: (limit?: number) => Promise<void>;
  deposit: (amount: number, method: string, phoneNumber?: string, metadata?: Record<string, any>) => Promise<{ success: boolean; depositId?: string; error?: string }>;
  withdraw: (amount: number, method: string, destination: Record<string, any>, metadata?: Record<string, any>) => Promise<{ success: boolean; transactionId?: string; error?: string }>;
  transfer: (amount: number, recipientPhone: string, description?: string) => Promise<{ success: boolean; transactionId?: string; error?: string }>;
  getBalance: () => number;
  getAvailableBalance: () => number;
  getFormattedBalance: () => string;
  clearError: () => void;
}

export const useWallet = create<WalletState>((set, get) => ({
  account: null,
  transactions: [],
  receipts: [],
  isLoading: false,
  error: null,
  isProcessing: false,

  loadAccount: async () => {
    const { user, isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated || !user) {
      set({ account: null, error: 'Not authenticated' });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('wallets')
        .select('id, user_id, account_id, wallet_name, wallet_type, currency, balance, available_balance, held_balance, status, is_default, daily_limit, monthly_limit, created_at, updated_at')
        .eq('user_id', user.id)
        .eq('is_default', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No default wallet — try any active wallet
          const { data: anyWallet, error: anyErr } = await supabase
            .from('wallets')
            .select('id, user_id, account_id, wallet_name, wallet_type, currency, balance, available_balance, held_balance, status, is_default, daily_limit, monthly_limit, created_at, updated_at')
            .eq('user_id', user.id)
            .eq('status', 'active')
            .order('created_at', { ascending: true })
            .limit(1)
            .single();

          if (anyErr) throw anyErr;
          set({ account: anyWallet as WalletAccount });
          return;
        }
        throw error;
      }

      set({ account: data as WalletAccount });
    } catch (err: any) {
      set({ error: err.message });
    } finally {
      set({ isLoading: false });
    }
  },

  loadTransactions: async (limit = 50) => {
    const { user, isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated || !user) return;

    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('wallet_transactions')
        .select('id, transaction_type, direction, amount, currency, status, description, reference, counterparty_wallet_id, counterparty_phone, metadata, created_at, completed_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      set({ transactions: (data || []) as WalletTransaction[] });
    } catch (err: any) {
      set({ error: err.message });
    } finally {
      set({ isLoading: false });
    }
  },

  loadReceipts: async (limit = 50) => {
    const { user, isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated || !user) return;

    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('wallet_receipts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      set({ receipts: (data || []) as WalletReceipt[] });
    } catch (err: any) {
      set({ error: err.message });
    } finally {
      set({ isLoading: false });
    }
  },

  deposit: async (amount: number, method: string, phoneNumber?: string, metadata?: Record<string, any>) => {
    const { user, isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated || !user) {
      set({ error: 'Not authenticated' });
      return { success: false, error: 'Not authenticated' };
    }

    set({ isProcessing: true, error: null });
    try {
      const { data, error } = await supabase.functions.invoke('wallet-deposit', {
        body: {
          user_id: user.id,
          amount,
          currency: get().account?.currency || 'KES',
          method,
          phone_number: phoneNumber,
          metadata,
        },
      });

      if (error) throw error;

      // Refresh account and transactions
      await get().loadAccount();
      await get().loadTransactions();
      await get().loadReceipts();

      set({ isProcessing: false });
      return { success: true, depositId: data?.deposit_id };
    } catch (err: any) {
      set({ error: err.message, isProcessing: false });
      return { success: false, error: err.message };
    }
  },

  withdraw: async (amount: number, method: string, destination: Record<string, any>, metadata?: Record<string, any>) => {
    const { user, isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated || !user) {
      set({ error: 'Not authenticated' });
      return { success: false, error: 'Not authenticated' };
    }

    set({ isProcessing: true, error: null });
    try {
      const { data, error } = await supabase.functions.invoke('withdraw', {
        body: {
          user_id: user.id,
          amount,
          currency: get().account?.currency || 'KES',
          method,
          destination,
          metadata,
        },
      });

      if (error) throw error;

      await get().loadAccount();
      await get().loadTransactions();
      await get().loadReceipts();

      set({ isProcessing: false });
      return { success: true, transactionId: data?.transaction_id };
    } catch (err: any) {
      set({ error: err.message, isProcessing: false });
      return { success: false, error: err.message };
    }
  },

  transfer: async (amount: number, recipientPhone: string, description?: string) => {
    const { user, isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated || !user) {
      set({ error: 'Not authenticated' });
      return { success: false, error: 'Not authenticated' };
    }

    set({ isProcessing: true, error: null });
    try {
      const { data, error } = await supabase.functions.invoke('wallet-transfer', {
        body: {
          sender_id: user.id,
          recipient_phone: recipientPhone,
          amount,
          description: description || 'Wallet transfer',
          currency_code: get().account?.currency || 'KES',
        },
      });

      if (error) throw error;

      await get().loadAccount();
      await get().loadTransactions();
      await get().loadReceipts();

      set({ isProcessing: false });
      return { success: true, transactionId: data?.transaction_id };
    } catch (err: any) {
      set({ error: err.message, isProcessing: false });
      return { success: false, error: err.message };
    }
  },

  getBalance: () => get().account?.balance || 0,
  getAvailableBalance: () => get().account?.available_balance || 0,
  getFormattedBalance: () => {
    const balance = get().account?.available_balance || 0;
    const currency = get().account?.currency || 'KES';
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency,
    }).format(balance);
  },
  clearError: () => set({ error: null }),
}));

export default useWallet;
