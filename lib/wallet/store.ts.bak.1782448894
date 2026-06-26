// lib/wallet/store.ts
import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

export interface WalletAccount {
  id: string;
  user_id: string;
  account_type: 'personal' | 'business' | 'escrow' | 'sub_wallet';
  account_name: string;
  currency: string;
  balance: number;
  available_balance: number;
  held_balance: number;
  status: 'active' | 'frozen' | 'suspended' | 'closed';
  is_verified: boolean;
  kyc_level: number;
  daily_limit: number;
  monthly_limit: number;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface WalletTransaction {
  id: string;
  wallet_id: string;
  account_id: string;
  transaction_type: 'deposit' | 'withdrawal' | 'transfer' | 'payment' | 'refund' | 'escrow' | 'fee' | 'commission';
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled' | 'reversed';
  description?: string;
  reference_code: string;
  recipient_account_id?: string;
  recipient_wallet_id?: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface WalletPaymentMethod {
  id: string;
  account_id: string;
  method_type: 'mobile_money' | 'bank_transfer' | 'card' | 'crypto' | 'cash';
  provider: string;
  account_number?: string;
  account_name?: string;
  phone_number?: string;
  is_default: boolean;
  is_verified: boolean;
  status: 'active' | 'inactive' | 'pending_verification';
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface WalletEscrow {
  id: string;
  transaction_id: string;
  payer_account_id: string;
  payee_account_id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'funded' | 'released' | 'disputed' | 'refunded' | 'cancelled';
  release_conditions: Record<string, any>;
  dispute_reason?: string;
  released_at?: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

interface WalletState {
  accounts: WalletAccount[];
  transactions: WalletTransaction[];
  paymentMethods: WalletPaymentMethod[];
  escrows: WalletEscrow[];
  selectedAccount: WalletAccount | null;
  isLoading: boolean;
  error: string | null;
  // Actions
  loadAccounts: (userId: string) => Promise<void>;
  loadTransactions: (accountId: string) => Promise<void>;
  loadPaymentMethods: (accountId: string) => Promise<void>;
  loadEscrows: (accountId: string) => Promise<void>;
  selectAccount: (account: WalletAccount | null) => void;
  createAccount: (account: Omit<WalletAccount, 'id' | 'created_at' | 'updated_at'>) => Promise<WalletAccount>;
  deposit: (accountId: string, amount: number, methodId: string) => Promise<void>;
  withdraw: (accountId: string, amount: number, methodId: string) => Promise<void>;
  transfer: (fromAccountId: string, toAccountId: string, amount: number, description?: string) => Promise<void>;
  addPaymentMethod: (method: Omit<WalletPaymentMethod, 'id' | 'created_at' | 'updated_at'>) => Promise<WalletPaymentMethod>;
  createEscrow: (escrow: Omit<WalletEscrow, 'id' | 'created_at' | 'updated_at'>) => Promise<WalletEscrow>;
  releaseEscrow: (escrowId: string) => Promise<void>;
  clearError: () => void;
}

export const useWalletStore = create<WalletState>((set, get) => ({
  accounts: [],
  transactions: [],
  paymentMethods: [],
  escrows: [],
  selectedAccount: null,
  isLoading: false,
  error: null,

  loadAccounts: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase.from('accounts').select('*').eq('user_id', userId).order('created_at', { ascending: false });
      if (error) throw error;
      set({ accounts: data as WalletAccount[] || [] });
    } catch (err: any) {
      set({ error: err.message });
    } finally {
      set({ isLoading: false });
    }
  },

  loadTransactions: async (accountId: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase.from('transactions').select('*').eq('account_id', accountId).order('created_at', { ascending: false }).limit(50);
      if (error) throw error;
      set({ transactions: data as WalletTransaction[] || [] });
    } catch (err: any) {
      set({ error: err.message });
    } finally {
      set({ isLoading: false });
    }
  },

  loadPaymentMethods: async (accountId: string) => {
    try {
      const { data, error } = await supabase.from('payment_methods').select('*').eq('account_id', accountId).eq('status', 'active');
      if (error) throw error;
      set({ paymentMethods: data as WalletPaymentMethod[] || [] });
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  loadEscrows: async (accountId: string) => {
    try {
      const { data, error } = await supabase.from('escrow_accounts').select('*').or(`payer_account_id.eq.${accountId},payee_account_id.eq.${accountId}`).order('created_at', { ascending: false });
      if (error) throw error;
      set({ escrows: data as WalletEscrow[] || [] });
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  selectAccount: (account) => set({ selectedAccount: account }),

  createAccount: async (account) => {
    const { data, error } = await supabase.from('accounts').insert(account).select().single();
    if (error) throw error;
    const newAccount = data as WalletAccount;
    set(state => ({ accounts: [newAccount, ...state.accounts] }));
    return newAccount;
  },

  deposit: async (accountId, amount, methodId) => {
    const { error } = await supabase.rpc('process_deposit', {
      p_account_id: accountId,
      p_amount: amount,
      p_payment_method_id: methodId,
    });
    if (error) throw error;
    await get().loadTransactions(accountId);
    await get().loadAccounts(get().selectedAccount?.user_id || '');
  },

  withdraw: async (accountId, amount, methodId) => {
    const { error } = await supabase.rpc('process_withdrawal', {
      p_account_id: accountId,
      p_amount: amount,
      p_payment_method_id: methodId,
    });
    if (error) throw error;
    await get().loadTransactions(accountId);
    await get().loadAccounts(get().selectedAccount?.user_id || '');
  },

  transfer: async (fromAccountId, toAccountId, amount, description) => {
    const { error } = await supabase.rpc('process_transfer', {
      p_from_account_id: fromAccountId,
      p_to_account_id: toAccountId,
      p_amount: amount,
      p_description: description || 'Transfer',
    });
    if (error) throw error;
    await get().loadTransactions(fromAccountId);
    await get().loadAccounts(get().selectedAccount?.user_id || '');
  },

  addPaymentMethod: async (method) => {
    const { data, error } = await supabase.from('payment_methods').insert(method).select().single();
    if (error) throw error;
    const newMethod = data as WalletPaymentMethod;
    set(state => ({ paymentMethods: [...state.paymentMethods, newMethod] }));
    return newMethod;
  },

  createEscrow: async (escrow) => {
    const { data, error } = await supabase.from('escrow_accounts').insert(escrow).select().single();
    if (error) throw error;
    const newEscrow = data as WalletEscrow;
    set(state => ({ escrows: [newEscrow, ...state.escrows] }));
    return newEscrow;
  },

  releaseEscrow: async (escrowId) => {
    const { error } = await supabase.rpc('release_escrow', { p_escrow_id: escrowId });
    if (error) throw error;
    const accountId = get().selectedAccount?.id || '';
    if (accountId) await get().loadEscrows(accountId);
  },

  clearError: () => set({ error: null }),
}));
