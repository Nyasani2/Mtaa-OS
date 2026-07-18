// Safe wallet store wrapper - breaks self-import cycle
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/lib/supabase';

export interface WalletTransaction {
  id: string;
  user_id: string;
  type: 'top_up' | 'withdrawal' | 'transfer' | 'payment' | 'refund' | 'escrow' | 'commission';
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  description: string;
  recipient_id?: string;
  recipient_name?: string;
  reference?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

interface WalletState {
  balance: number;
  currency: string;
  transactions: WalletTransaction[];
  recentTransactions: WalletTransaction[];
  loading: boolean;
  error: string | null;
  setBalance: (balance: number) => void;
  addTransaction: (tx: WalletTransaction) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  fetchTransactions: () => Promise<void>;
  fetchRecentTransactions: (limit?: number) => Promise<void>;
  fetchBalance: () => Promise<void>;
  reset: () => void;
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
      balance: 0,
      currency: 'KES',
      transactions: [],
      recentTransactions: [],
      loading: false,
      error: null,

      setBalance: (balance) => set({ balance }),

      addTransaction: (tx) => set((state) => ({
        transactions: [tx, ...state.transactions],
        recentTransactions: [tx, ...state.recentTransactions].slice(0, 10),
      })),

      setLoading: (loading) => set({ loading }),

      setError: (error) => set({ error }),

      fetchTransactions: async () => {
        set({ loading: true, error: null });
        try {
          const { data: userData } = await supabase.auth.getUser();
          if (!userData.user) {
            set({ transactions: [], loading: false });
            return;
          }

          const { data, error } = await supabase
            .from('wallet_transactions')
            .select('*')
            .eq('user_id', userData.user.id)
            .order('created_at', { ascending: false })
            .limit(100);

          if (error) {
            // If table doesn't exist, don't crash
            if (error.message?.includes('does not exist') || error.code === '42P01') {
              set({ transactions: [], loading: false, error: null });
              return;
            }
            throw error;
          }

          set({
            transactions: (data || []) as WalletTransaction[],
            loading: false,
            error: null,
          });
        } catch (err: any) {
          set({
            transactions: [],
            loading: false,
            error: err?.message || 'Failed to load transactions',
          });
        }
      },

      fetchRecentTransactions: async (limit = 10) => {
        set({ loading: true, error: null });
        try {
          const { data: userData } = await supabase.auth.getUser();
          if (!userData.user) {
            set({ recentTransactions: [], loading: false });
            return;
          }

          const { data, error } = await supabase
            .from('wallet_transactions')
            .select('*')
            .eq('user_id', userData.user.id)
            .order('created_at', { ascending: false })
            .limit(limit);

          if (error) {
            if (error.message?.includes('does not exist') || error.code === '42P01') {
              set({ recentTransactions: [], loading: false, error: null });
              return;
            }
            throw error;
          }

          set({
            recentTransactions: (data || []) as WalletTransaction[],
            loading: false,
            error: null,
          });
        } catch (err: any) {
          set({
            recentTransactions: [],
            loading: false,
            error: err?.message || 'Failed to load recent transactions',
          });
        }
      },

      fetchBalance: async () => {
        try {
          const { data: userData } = await supabase.auth.getUser();
          if (!userData.user) return;

          const { data, error } = await supabase
            .from('wallets')
            .select('balance, currency')
            .eq('user_id', userData.user.id)
            .single();

          if (error) {
            if (error.message?.includes('does not exist') || error.code === '42P01') {
              return;
            }
            throw error;
          }

          if (data) {
            set({
              balance: data.balance || 0,
              currency: data.currency || 'KES',
            });
          }
        } catch (err) {
          // Silently fail for balance fetch
        }
      },

      reset: () => set({
        balance: 0,
        transactions: [],
        recentTransactions: [],
        error: null,
      }),
    }),
    {
      name: 'wallet-storage',
      partialize: (state) => ({
        balance: state.balance,
        currency: state.currency,
      }),
    }
  )
);

export default useWalletStore;
