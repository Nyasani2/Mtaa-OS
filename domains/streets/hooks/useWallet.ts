// domains/streets/hooks/useWallet.ts
// COMPATIBILITY SHIM — re-exports unified wallet hook
// TODO: Migrate all imports to @/lib/identity/hooks and delete this file

export {
  useWallet,
  useWalletBalance,
  useWalletTransactions,
  useStreetsWallet,
  default,
} from '@/lib/identity/hooks/useWallet';

export type {
  WalletBalance,
  WalletTransaction,
  EscrowAccount,
  WalletState,
} from '@/lib/identity/hooks/useWallet';
