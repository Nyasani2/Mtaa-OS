import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/hooks/useAuthStore';

export type WalletAction = 
  | 'deposit' | 'transfer' | 'withdraw' | 'execute' | 'balance' | 'history';

export interface WalletDepositParams {
  action: 'deposit';
  amount: number;
  currency: string;
  method: 'mpesa' | 'card' | 'bank';
  phoneNumber?: string;
  accountId: string;
}

export interface WalletTransferParams {
  action: 'transfer';
  amount: number;
  currency: string;
  recipientId: string;
  recipientType: 'wallet' | 'phone' | 'till' | 'paybill';
  description?: string;
  senderAccountId: string;
}

export interface WalletWithdrawParams {
  action: 'withdraw';
  amount: number;
  currency: string;
  method: 'mpesa' | 'bank';
  destination: string;
  accountId: string;
}

export interface WalletExecuteParams {
  action: 'execute';
  operation: 'lock' | 'unlock' | 'freeze' | 'unfreeze' | 'set_limit' | 'update_pin';
  accountId: string;
  payload?: Record<string, any>;
}

export interface WalletBalanceParams {
  action: 'balance';
  accountId: string;
}

export interface WalletHistoryParams {
  action: 'history';
  accountId: string;
  limit?: number;
  offset?: number;
  type?: 'all' | 'deposit' | 'transfer' | 'withdraw';
}

export type WalletParams = 
  | WalletDepositParams 
  | WalletTransferParams 
  | WalletWithdrawParams 
  | WalletExecuteParams 
  | WalletBalanceParams 
  | WalletHistoryParams;

export async function walletOperation(params: WalletParams) {
  const { data, error } = await supabase.functions.invoke('wallet-operations', {
    body: params,
  });
  if (error) throw error;
  return data;
}

// Convenience wrappers
export const deposit = (p: Omit<WalletDepositParams, 'action'>) => 
  walletOperation({ action: 'deposit', ...p } as WalletDepositParams);

export const transfer = (p: Omit<WalletTransferParams, 'action'>) => 
  walletOperation({ action: 'transfer', ...p } as WalletTransferParams);

export const withdraw = (p: Omit<WalletWithdrawParams, 'action'>) => 
  walletOperation({ action: 'withdraw', ...p } as WalletWithdrawParams);

export const executeWallet = (p: Omit<WalletExecuteParams, 'action'>) => 
  walletOperation({ action: 'execute', ...p } as WalletExecuteParams);

export const getBalance = (p: Omit<WalletBalanceParams, 'action'>) => 
  walletOperation({ action: 'balance', ...p } as WalletBalanceParams);

export const getHistory = (p: Omit<WalletHistoryParams, 'action'>) => 
  walletOperation({ action: 'history', ...p } as WalletHistoryParams);
