import { create } from 'zustand';

interface WalletState {
  balance: number;
  currency: string;
  isLoading: boolean;
  error: string | null;
  fetchBalance: () => Promise<void>;
  setBalance: (amount: number) => void;
}

export const useWalletStore = create<WalletState>((set) => ({
  balance: 0,
  currency: 'KES',
  isLoading: false,
  error: null,
  fetchBalance: async () => {
    set({ isLoading: true, error: null });
    try {
      set({ isLoading: false });
    } catch (err: any) {
      set({ isLoading: false, error: err.message });
    }
  },
  setBalance: (amount: number) => set({ balance: amount }),
}));
