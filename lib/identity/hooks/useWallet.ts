// MTAA Identity Engine — Wallet Hook
// Fixes: _useWallet.useWallet is not a function
// This is a CALLED hook, not an object with methods

import { useIdentity } from './useIdentity';

export function useWallet() {
  const { wallet, identity, refresh } = useIdentity();

  return {
    // Core wallet data
    balance: wallet.balance,
    currency: wallet.currency,
    escrowBalance: wallet.escrow_balance,
    savingsBalance: wallet.savings_balance,
    creditScore: wallet.credit_score,
    pendingIn: wallet.pending_in,
    pendingOut: wallet.pending_out,
    lastTransaction: wallet.last_transaction,
    isLoading: wallet.isLoading,

    // Identity link
    userId: identity.user_id,
    userName: identity.full_name || identity.username,

    // Actions
    refresh,

    // Helpers
    formattedBalance: `${wallet.currency} ${wallet.balance.toLocaleString()}`,
    hasBalance: wallet.balance > 0,
    hasEscrow: wallet.escrow_balance > 0,
    hasSavings: wallet.savings_balance > 0,
  };
}

// Default export for compatibility
export default useWallet;
