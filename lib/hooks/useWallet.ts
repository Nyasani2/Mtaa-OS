// lib/hooks/useWallet.ts
// Wallet hook — bridges auth store + wallet store
// Ensures userId is always available for wallet operations

import { useEffect, useCallback } from 'react';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { useWalletStore } from '@/lib/stores/wallet-store';

export function useWallet() {
  const { user, isAuthenticated } = useAuthStore();
  const wallet = useWalletStore();

  const userId = user?.id || null;

  // Inject userId into window for wallet store access
  useEffect(() => {
    if (userId && typeof window !== 'undefined') {
      (window as any).__MTAA_USER_ID__ = userId;
    }
  }, [userId]);

  // Auto-load wallet on auth
  useEffect(() => {
    if (userId && isAuthenticated) {
      wallet.loadWallet(userId);
      wallet.loadTransactions(userId, 20);
    }
  }, [userId, isAuthenticated]);

  const send = useCallback(
    (payload: { recipient_id?: string; recipient_phone?: string; amount: number; description?: string }) => {
      if (!userId) return Promise.resolve({ success: false, error: 'Not authenticated' });
      return wallet.send({ ...payload });
    },
    [userId, wallet]
  );

  const receive = useCallback(
    (payload?: { amount?: number; description?: string; expires_in_minutes?: number }) => {
      if (!userId) return Promise.resolve({ success: false, error: 'Not authenticated' });
      return wallet.receive(payload);
    },
    [userId, wallet]
  );

  const deposit = useCallback(
    (payload: { amount: number; provider: string; providerRef: string }) => {
      if (!userId) return Promise.resolve({ success: false, error: 'Not authenticated' });
      return wallet.deposit(payload);
    },
    [userId, wallet]
  );

  const withdraw = useCallback(
    (payload: { amount: number; provider: string; accountRef: string }) => {
      if (!userId) return Promise.resolve({ success: false, error: 'Not authenticated' });
      return wallet.withdraw(payload);
    },
    [userId, wallet]
  );

  return {
    // Auth
    userId,
    isAuthenticated,
    user,

    // Wallet state
    balance: wallet.balance,
    heldBalance: wallet.heldBalance,
    currency: wallet.currency,
    transactions: wallet.transactions,
    loading: wallet.loading,
    error: wallet.error,
    lastTransaction: wallet.lastTransaction,

    // Actions
    loadWallet: wallet.loadWallet,
    loadTransactions: wallet.loadTransactions,
    send,
    receive,
    deposit,
    withdraw,
    clearError: wallet.clearError,
  };
}
