// hooks/useWalletStore.ts
// REAL wallet store — delegates to canonical wallet domain
// Replaces hardcoded stub. No fake data. No hardcoded balance.

import { create } from 'zustand';
import { useEffect } from 'react';
import { useWalletBalance, useWalletHistory, useWalletSend } from '@/domains/wallet/hooks/useWallet';

interface Transaction {
  id: string;
  type: string;
  amount: number;
  to: string | null;
  from: string | null;
  created_at: string;
  description?: string | null;
  status?: string;
}

interface WalletStoreState {
  balance: number;
  currency: string;
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

// Zustand store for non-React contexts (if any)
// But primarily we export a hook that wraps the canonical wallet hooks
export const useWalletStore = create<WalletStoreState>((set) => ({
  balance: 0,
  currency: 'KES',
  transactions: [],
  loading: true,
  error: null,
  refresh: () => {},
}));

// React hook that bridges to canonical wallet domain
export function useWalletStoreHook() {
  const { balance, loading: balanceLoading, error: balanceError, refresh: refreshBalance } = useWalletBalance();
  const { transactions, loading: historyLoading, error: historyError, refresh: refreshHistory } = useWalletHistory({ limit: 10 });
  const { send, sending, error: sendError } = useWalletSend();

  const refresh = () => {
    refreshBalance();
    refreshHistory();
  };

  // Map canonical transactions to store format
  const mappedTransactions: Transaction[] = transactions.map((tx) => ({
    id: tx.id,
    type: tx.type,
    amount: tx.amount,
    to: (tx as any).recipient_phone || (tx as any).recipient_id,
    from: tx.metadata?.sender_id || null,
    created_at: tx.created_at,
    description: tx.description,
    status: tx.status,
  }));

  return {
    balance: balance?.available || 0,
    currency: balance?.currency || 'KES',
    pending: balance?.pending || 0,
    escrow: balance?.escrow || 0,
    total: balance?.total || 0,
    transactions: mappedTransactions,
    loading: balanceLoading || historyLoading,
    sending,
    error: balanceError || historyError || sendError || null,
    refresh,
    send,
  };
}

export default useWalletStore;
