// lib/services/wallet-service.ts
// Wallet service — delegates to wallet-operations edge function
// v2: Added sendMoney, createReceiveRequest, ensureWallet, getTransactions wrappers
// Removed hook import (services must not import hooks)

import { supabase } from '@/lib/supabase';

export type WalletAction = 
  | 'deposit' | 'transfer' | 'withdraw' | 'execute' | 'balance' | 'history'
  | 'send' | 'receive' | 'ensure_wallet';

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

export interface WalletSendParams {
  action: 'send';
  userId: string;
  recipient_id?: string;
  recipient_phone?: string;
  amount: number;
  currency: string;
  description?: string;
}

export interface WalletReceiveParams {
  action: 'receive';
  userId: string;
  amount?: number;
  currency: string;
  description?: string;
  expires_in_minutes?: number;
}

export interface WalletEnsureParams {
  action: 'ensure_wallet';
  userId: string;
  currency: string;
}

export type WalletParams = 
  | WalletDepositParams 
  | WalletTransferParams 
  | WalletWithdrawParams 
  | WalletExecuteParams 
  | WalletBalanceParams 
  | WalletHistoryParams
  | WalletSendParams
  | WalletReceiveParams
  | WalletEnsureParams;

export async function walletOperation(params: WalletParams) {
  const { data, error } = await supabase.functions.invoke('wallet-operations', {
    body: params,
  });
  if (error) throw error;
  return data;
}

// ─── Core edge-function wrappers ───

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

// ─── v2: Added wrappers for wallet-store compatibility ───

/** Send money to another user/phone */
export async function sendMoney(
  userId: string,
  payload: {
    recipient_id?: string;
    recipient_phone?: string;
    amount: number;
    description?: string;
  }
): Promise<{ success: boolean; tx?: { id: string }; error?: string }> {
  try {
    const result = await walletOperation({
      action: 'send',
      userId,
      ...payload,
      currency: 'KES',
    } as WalletSendParams);
    return result;
  } catch (err: any) {
    return { success: false, error: err?.message || 'Send failed' };
  }
}

/** Create a receive request (QR/deep link) */
export async function createReceiveRequest(
  userId: string,
  payload: {
    amount?: number;
    description?: string;
    expires_in_minutes?: number;
  } = {}
): Promise<{ success: boolean; request_id?: string; qr_data?: string; deep_link?: string; error?: string }> {
  try {
    const result = await walletOperation({
      action: 'receive',
      userId,
      ...payload,
      currency: 'KES',
    } as WalletReceiveParams);
    return result;
  } catch (err: any) {
    return { success: false, error: err?.message || 'Receive request failed' };
  }
}

/** Initiate deposit via provider */
export async function initiateDeposit(
  userId: string,
  amount: number,
  provider: string,
  providerRef: string
): Promise<{ success: boolean; tx?: { id: string }; error?: string }> {
  try {
    const result = await walletOperation({
      action: 'deposit',
      amount,
      currency: 'KES',
      method: provider as any,
      phoneNumber: providerRef,
      accountId: userId,
    } as WalletDepositParams);
    return result;
  } catch (err: any) {
    return { success: false, error: err?.message || 'Deposit failed' };
  }
}

/** Initiate withdrawal to provider */
export async function initiateWithdrawal(
  userId: string,
  amount: number,
  provider: string,
  accountRef: string
): Promise<{ success: boolean; tx?: { id: string }; error?: string }> {
  try {
    const result = await walletOperation({
      action: 'withdraw',
      amount,
      currency: 'KES',
      method: provider as any,
      destination: accountRef,
      accountId: userId,
    } as WalletWithdrawParams);
    return result;
  } catch (err: any) {
    return { success: false, error: err?.message || 'Withdrawal failed' };
  }
}

/** Ensure wallet exists for user */
export async function ensureWallet(
  userId: string,
  currency: string = 'KES'
): Promise<{ success: boolean; error?: string }> {
  try {
    await walletOperation({
      action: 'ensure_wallet',
      userId,
      currency,
    } as WalletEnsureParams);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Wallet ensure failed' };
  }
}

/** Get transactions (alias for getHistory with compatible return type) */
export async function getTransactions(
  userId: string,
  options: { limit?: number; offset?: number; type?: 'all' | 'deposit' | 'transfer' | 'withdraw' } = {}
): Promise<any[]> {
  const result = await getHistory({
    accountId: userId,
    limit: options.limit ?? 20,
    offset: options.offset ?? 0,
    type: options.type ?? 'all',
  });
  return result?.transactions ?? result ?? [];
}
