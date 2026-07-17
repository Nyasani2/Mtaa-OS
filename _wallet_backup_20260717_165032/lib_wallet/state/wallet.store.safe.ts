// Safe wallet store wrapper - breaks self-import cycle
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface WalletState {
  balance: number;
  currency: string;
  transactions: any[];
  loading: boolean;
  error: string | null;
  setBalance: (balance: number) => void;
  addTransaction: (tx: any) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set) => ({
      balance: 0,
      currency: 'KES',
      transactions: [],
      loading: false,
      error: null,
      setBalance: (balance) => set({ balance }),
      addTransaction: (tx) => set((state) => ({ transactions: [tx, ...state.transactions] })),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      reset: () => set({ balance: 0, transactions: [], error: null }),
    }),
    {
      name: 'wallet-storage',
    }
  )
);
