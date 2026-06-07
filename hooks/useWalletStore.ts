import { create } from 'zustand';

interface Transaction {
  id: string;
  type: string;
  amount: number;
  to: string | null;
  from: string | null;
  created_at: string;
}

interface WalletState {
  balance: number;
  currency: string;
  transactions: Transaction[];
  send: (to: string, amount: number) => Promise<void>;
  receive: (from: string, amount: number) => Promise<void>;
}

export const useWalletStore = create<WalletState>((set) => ({
  balance: 1000.00,
  currency: 'KES',
  transactions: [
    { id: '1', type: 'deposit', amount: 1000, to: null, from: 'bank', created_at: '2026-06-01' },
  ],
  send: async (to, amount) => {
    set((state) => ({
      balance: state.balance - amount,
      transactions: [
        { id: Date.now().toString(), type: 'send', amount: -amount, to, from: null, created_at: new Date().toISOString() },
        ...state.transactions,
      ],
    }));
  },
  receive: async (from, amount) => {
    set((state) => ({
      balance: state.balance + amount,
      transactions: [
        { id: Date.now().toString(), type: 'receive', amount, to: null, from, created_at: new Date().toISOString() },
        ...state.transactions,
      ],
    }));
  },
}));

export default useWalletStore;
