// lib/identity/hooks/index.ts
// SINGLE SOURCE OF TRUTH for all identity/wallet hooks

export {
  useWallet,
  useWalletBalance,
  useWalletTransactions,
  useStreetsWallet,
  default as useWalletDefault,
} from './useWallet';

export type {
  WalletBalance,
  WalletTransaction,
  EscrowAccount,
  WalletState,
} from './useWallet';
