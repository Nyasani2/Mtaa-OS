// domains/wallet/hooks/index.ts
// Barrel export for wallet domain hooks
// Imported by: property/booking.tsx, property/payment.tsx, shop/[id]/wallet.tsx, and others

export {
  useWalletStore,
  useWallet,
  useWalletTransactions,
  useWalletBalance,
  useWalletHistory,
  useWalletSend,
  useWalletAccount,
} from './useWallet';

export type {
  WalletBalance,
  WalletTransaction,
  WalletAccount,
} from './useWallet';
