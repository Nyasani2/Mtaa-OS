import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export interface WalletAccount {
  id: string;
  user_id: string;
  wallet_id: string;
  account_type: string;
  currency: string;
  balance: number;
  available_balance: number;
  hold_balance: number;
  status: string;
  is_default: boolean;
}

export interface WalletTransaction {
  id: string;
  user_id: string;
  wallet_id: string;
  amount: number;
  type: string;
  status: string;
  description: string;
  reference_id: string;
  reference_type: string;
  balance_after: number;
  completed_at: string;
  created_at: string;
  currency: string;
}

export interface RegulatoryStatus {
  kyc_verified: boolean;
  kyc_level: string;
  aml_status: string;
  sanctions_check: string;
  pep_status: string;
  last_reviewed: string;
  documents_verified: number;
  documents_required: number;
}

interface WalletState {
  accounts: WalletAccount[];
  transactions: WalletTransaction[];
  regulatory: RegulatoryStatus | null;
  loading: boolean;
  error: string | null;
  fetchAccounts: () => Promise<void>;
  fetchTransactions: () => Promise<void>;
  fetchRegulatory: () => Promise<void>;
  transfer: (toWalletId: string, amount: number, currency: string) => Promise<boolean>;
  deposit: (amount: number, currency: string, provider: string) => Promise<boolean>;
  withdraw: (amount: number, currency: string, destination: string) => Promise<boolean>;
}

export const useWalletStore = create<WalletState>((set, get) => ({
  accounts: [],
  transactions: [],
  regulatory: null,
  loading: false,
  error: null,

  fetchAccounts: async () => {
    const { user } = useAuthStore.getState();
    if (!user) return;
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('wallet_accounts')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false });
      if (error) throw error;
      set({ accounts: data || [], loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  fetchTransactions: async () => {
    const { user } = useAuthStore.getState();
    if (!user) return;
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      set({ transactions: data || [], loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  fetchRegulatory: async () => {
    const { user } = useAuthStore.getState();
    if (!user) return;
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('wallet_regulatory')
        .select('*')
        .eq('user_id', user.id)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      set({ regulatory: data || null, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  transfer: async (toWalletId, amount, currency) => {
    const { user } = useAuthStore.getState();
    if (!user) return false;
    set({ loading: true, error: null });
    try {
      const { error } = await supabase.rpc('wallet_transfer', {
        p_from_user_id: user.id,
        p_to_wallet_id: toWalletId,
        p_amount: amount,
        p_currency: currency,
      });
      if (error) throw error;
      await get().fetchAccounts();
      await get().fetchTransactions();
      set({ loading: false });
      return true;
    } catch (err: any) {
      set({ error: err.message, loading: false });
      return false;
    }
  },

  deposit: async (amount, currency, provider) => {
    const { user } = useAuthStore.getState();
    if (!user) return false;
    set({ loading: true, error: null });
    try {
      const { error } = await supabase.rpc('wallet_deposit', {
        p_user_id: user.id,
        p_amount: amount,
        p_currency: currency,
        p_provider: provider,
      });
      if (error) throw error;
      await get().fetchAccounts();
      set({ loading: false });
      return true;
    } catch (err: any) {
      set({ error: err.message, loading: false });
      return false;
    }
  },

  withdraw: async (amount, currency, destination) => {
    const { user } = useAuthStore.getState();
    if (!user) return false;
    set({ loading: true, error: null });
    try {
      const { error } = await supabase.rpc('wallet_withdraw', {
        p_user_id: user.id,
        p_amount: amount,
        p_currency: currency,
        p_destination: destination,
      });
      if (error) throw error;
      await get().fetchAccounts();
      await get().fetchTransactions();
      set({ loading: false });
      return true;
    } catch (err: any) {
      set({ error: err.message, loading: false });
      return false;
    }
  },
}));
