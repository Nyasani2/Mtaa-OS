import { create } from 'zustand';

interface WalletState {
  balance: number;
  currency: string;
  transactions: any[];
  loading: boolean;
  error: string | null;
  fetchBalance: () => Promise<void>;
  sendTransaction: (to: string, amount: number) => Promise<void>;
}

export const useWalletStore = create<WalletState>((set, get) => ({
  balance: 0,
  currency: 'USD',
  transactions: [],
  loading: false,
  error: null,
  fetchBalance: async () => {
    set({ loading: true });
    try {
      set({ loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },
  sendTransaction: async (to, amount) => {
    set({ loading: true });
    try {
      set({ loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },
}));
