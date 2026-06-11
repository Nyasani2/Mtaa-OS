// domains/streets/hooks/useWallet.ts
// Streets wallet hook — delegates to canonical wallet domain
// Previously broken: imported useWalletBalance from non-existent path
// Fixed: uses domains/wallet/hooks/useWallet

import { useState, useEffect, useCallback } from 'react';
import {
  useWalletBalance,
  useWalletSend,
  useWalletReceive,
  useWalletHistory,
  type WalletBalance,
  type WalletTransaction,
  type SendPayload,
  type ReceivePayload,
} from '@/domains/wallet/hooks/useWallet';

export interface StreetsWalletState {
  balance: WalletBalance | null;
  transactions: WalletTransaction[];
  loading: boolean;
  error: string | null;
}

export function useStreetsWallet() {
  const { balance, loading: balanceLoading, error: balanceError, refresh: refreshBalance } = useWalletBalance();
  const { send, sending, error: sendError, lastTx, clearError: clearSendError } = useWalletSend();
  const { request, createRequest, cancelRequest, loading: receiveLoading, error: receiveError, clearError: clearReceiveError } = useWalletReceive();
  const { transactions, loading: historyLoading, error: historyError, refresh: refreshHistory, hasMore, loadMore } = useWalletHistory({ limit: 20 });

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const errs = [balanceError, sendError, receiveError, historyError].filter(Boolean);
    setError(errs[0] || null);
  }, [balanceError, sendError, receiveError, historyError]);

  const clearError = useCallback(() => {
    setError(null);
    clearSendError();
    clearReceiveError();
  }, [clearSendError, clearReceiveError]);

  const refresh = useCallback(() => {
    refreshBalance();
    refreshHistory();
  }, [refreshBalance, refreshHistory]);

  return {
    // Balance
    balance,
    balanceLoading,
    // Send
    send,
    sending,
    lastTx,
    // Receive
    request,
    createRequest,
    cancelRequest,
    receiveLoading,
    // History
    transactions,
    historyLoading,
    hasMore,
    loadMore,
    // Unified
    loading: balanceLoading || sending || receiveLoading || historyLoading,
    error,
    clearError,
    refresh,
  };
}

// Backward-compatible export for files that import useWalletBalance from streets
export { useWalletBalance } from '@/domains/wallet/hooks/useWallet';
