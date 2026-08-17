import { useWalletStore } from '@/lib/stores/wallet-store';

export { useWalletStore } from '@/lib/stores/wallet-store';

export function useWallet() {
  return useWalletStore();
}

export function useWalletBalance() {
  return useWalletStore((state) => ({
    balance: state.balance ?? 0,
    heldBalance: state.heldBalance ?? 0,
    currency: state.currency ?? 'KES',
    loading: state.loading ?? false,
    error: state.error ?? null,
  }));
}

export function useWalletSend() {
  return useWalletStore((state) => ({
    send: state.send,
    loading: state.loading ?? false,
    error: state.error ?? null,
    lastTransaction: state.lastTransaction ?? null,
  }));
}

export function useWalletReceive() {
  return useWalletStore((state) => ({
    receive: state.receive,
    loading: state.loading ?? false,
    error: state.error ?? null,
  }));
}

export function useWalletHistory() {
  return useWalletStore((state) => ({
    transactions: state.transactions ?? [],
    loading: state.loading ?? false,
    error: state.error ?? null,
    loadTransactions: state.loadTransactions,
  }));
}
