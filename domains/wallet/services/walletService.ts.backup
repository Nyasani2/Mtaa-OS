// domains/wallet/services/walletService.ts
// Core wallet operations service
// All DB calls go through here. Hooks delegate to this service.
// Tables: wallets, wallet_transactions, wallet_pending_transactions, profiles

import { supabase } from '@/lib/supabase';

// ───────────────────────────────────────────────
// Types
// ───────────────────────────────────────────────

export interface Wallet {
  id: string;
  user_id: string;
  balance: number;
  currency: string;
  status: 'active' | 'frozen' | 'suspended' | 'closed';
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface WalletTransaction {
  id: string;
  user_id: string;
  wallet_id: string | null;
  type: 'credit' | 'debit' | 'escrow' | 'refund' | 'subscription' | 'transfer' | 'deposit' | 'withdrawal';
  transaction_type: string | null;
  amount: number;
  balance_after: number | null;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  description: string | null;
  reference: string | null;
  reference_id: string | null;
  reference_type: string | null;
  recipient_id: string | null;
  recipient_phone: string | null;
  provider: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  failed_at: string | null;
}

export interface BalanceResult {
  available: number;
  pending: number;
  escrow: number;
  total: number;
  currency: string;
  wallet_id: string;
}

export interface SendResult {
  success: boolean;
  tx?: WalletTransaction;
  error?: string;
}

export interface ReceiveRequestResult {
  success: boolean;
  request_id?: string;
  qr_data?: string;
  deep_link?: string;
  error?: string;
}

// ───────────────────────────────────────────────
// Wallet CRUD
// ───────────────────────────────────────────────

export async function getWallet(userId: string): Promise<Wallet | null> {
  const { data, error } = await supabase
    .from('wallets')
    .select('*')
    .eq('user_id', userId)
    .eq('is_default', true)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data as Wallet | null;
}

export async function getWalletById(walletId: string): Promise<Wallet | null> {
  const { data, error } = await supabase
    .from('wallets')
    .select('*')
    .eq('id', walletId)
    .single();
  if (error) throw error;
  return data as Wallet | null;
}

export async function createWallet(userId: string, currency = 'KES'): Promise<Wallet> {
  const { data, error } = await supabase
    .from('wallets')
    .insert({ user_id: userId, balance: 0, currency, status: 'active', is_default: true })
    .select()
    .single();
  if (error) throw error;
  return data as Wallet;
}

export async function ensureWallet(userId: string, currency = 'KES'): Promise<Wallet> {
  const existing = await getWallet(userId);
  if (existing) return existing;
  return createWallet(userId, currency);
}

// ───────────────────────────────────────────────
// Balance
// ───────────────────────────────────────────────

export async function getBalance(userId: string): Promise<BalanceResult> {
  const wallet = await getWallet(userId);
  if (!wallet) {
    return { available: 0, pending: 0, escrow: 0, total: 0, currency: 'KES', wallet_id: '' };
  }

  const { data: pendingData } = await supabase
    .from('wallet_transactions')
    .select('amount')
    .eq('user_id', userId)
    .eq('status', 'pending')
    .eq('type', 'debit');

  const pending = (pendingData || []).reduce((sum, t) => sum + (t.amount || 0), 0);

  const { data: escrowData } = await supabase
    .from('wallet_transactions')
    .select('amount')
    .eq('user_id', userId)
    .eq('status', 'pending')
    .eq('type', 'escrow');

  const escrow = (escrowData || []).reduce((sum, t) => sum + (t.amount || 0), 0);

  return {
    available: wallet.balance || 0,
    pending,
    escrow,
    total: (wallet.balance || 0) + pending + escrow,
    currency: wallet.currency || 'KES',
    wallet_id: wallet.id,
  };
}

// ───────────────────────────────────────────────
// Transactions
// ───────────────────────────────────────────────

export async function getTransactions(
  userId: string,
  options?: { type?: string; status?: string; limit?: number; offset?: number }
): Promise<WalletTransaction[]> {
  let query = supabase
    .from('wallet_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(options?.offset || 0, (options?.offset || 0) + (options?.limit || 50) - 1);

  if (options?.type) query = query.eq('type', options.type);
  if (options?.status) query = query.eq('status', options.status);

  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as WalletTransaction[];
}

export async function getTransactionById(txId: string): Promise<WalletTransaction | null> {
  const { data, error } = await supabase
    .from('wallet_transactions')
    .select('*')
    .eq('id', txId)
    .single();
  if (error) throw error;
  return data as WalletTransaction | null;
}

// ───────────────────────────────────────────────
// Send Money
// ───────────────────────────────────────────────

export async function sendMoney(
  senderId: string,
  payload: {
    recipient_id?: string;
    recipient_phone?: string;
    amount: number;
    currency?: string;
    description?: string;
  }
): Promise<SendResult> {
  if (!payload.amount || payload.amount <= 0) {
    return { success: false, error: 'Invalid amount' };
  }
  if (!payload.recipient_id && !payload.recipient_phone) {
    return { success: false, error: 'Recipient required' };
  }

  // Get sender wallet
  const senderWallet = await getWallet(senderId);
  if (!senderWallet) return { success: false, error: 'Sender wallet not found' };
  if (senderWallet.balance < payload.amount) {
    return { success: false, error: 'Insufficient balance' };
  }

  // Resolve recipient
  let recipientId = payload.recipient_id;
  if (!recipientId && payload.recipient_phone) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('phone', payload.recipient_phone)
      .single();
    if (profile) recipientId = profile.id;
  }

  const currency = payload.currency || senderWallet.currency || 'KES';

  // Create debit transaction
  const { data: tx, error: txErr } = await supabase
    .from('wallet_transactions')
    .insert({
      user_id: senderId,
      wallet_id: senderWallet.id,
      type: 'debit',
      transaction_type: 'transfer',
      amount: payload.amount,
      currency,
      status: 'completed',
      description: payload.description || 'Wallet transfer',
      recipient_id: recipientId || null,
      recipient_phone: payload.recipient_phone || null,
      balance_after: senderWallet.balance - payload.amount,
      metadata: { sender_id: senderId, method: 'wallet_transfer' },
    })
    .select()
    .single();

  if (txErr) return { success: false, error: txErr.message };

  // Update sender balance
  await supabase
    .from('wallets')
    .update({ balance: senderWallet.balance - payload.amount, updated_at: new Date().toISOString() })
    .eq('id', senderWallet.id);

  // Credit recipient if internal
  if (recipientId) {
    const recipientWallet = await getWallet(recipientId);
    if (recipientWallet) {
      await supabase
        .from('wallets')
        .update({ balance: recipientWallet.balance + payload.amount, updated_at: new Date().toISOString() })
        .eq('id', recipientWallet.id);

      await supabase.from('wallet_transactions').insert({
        user_id: recipientId,
        wallet_id: recipientWallet.id,
        type: 'credit',
        transaction_type: 'transfer',
        amount: payload.amount,
        currency,
        status: 'completed',
        description: `Received wallet transfer`,
        reference: tx.id,
        balance_after: recipientWallet.balance + payload.amount,
        metadata: { sender_id: senderId, original_tx: tx.id },
      });
    }
  }

  return { success: true, tx: tx as WalletTransaction };
}

// ───────────────────────────────────────────────
// Receive / Request Money
// ───────────────────────────────────────────────

export async function createReceiveRequest(
  userId: string,
  payload: { amount?: number; currency?: string; description?: string; expires_in_minutes?: number }
): Promise<ReceiveRequestResult> {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const amount = payload.amount || 0;
  const currency = payload.currency || 'KES';
  const expiresAt = new Date(Date.now() + (payload.expires_in_minutes || 30) * 60000).toISOString();

  const qrData = JSON.stringify({
    type: 'mtaa_wallet_request',
    request_id: requestId,
    user_id: userId,
    amount,
    currency,
    expires_at: expiresAt,
  });

  const deepLink = `mtaa://wallet/pay?to=${userId}&amount=${amount}&currency=${currency}&ref=${requestId}`;

  await supabase.from('wallet_pending_transactions').insert({
    user_id: userId,
    type: 'receive_request',
    amount,
    currency,
    status: 'pending',
    reference: requestId,
    metadata: { qr_data: qrData, deep_link: deepLink, expires_at: expiresAt },
  });

  return {
    success: true,
    request_id: requestId,
    qr_data: qrData,
    deep_link: deepLink,
  };
}

export async function cancelReceiveRequest(userId: string, requestId: string): Promise<void> {
  await supabase
    .from('wallet_pending_transactions')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('reference', requestId)
    .eq('user_id', userId);
}

// ───────────────────────────────────────────────
// Deposit / Withdrawal (placeholders for banking integration)
// ───────────────────────────────────────────────

export async function initiateDeposit(
  userId: string,
  amount: number,
  provider: string,
  providerRef: string
): Promise<SendResult> {
  const wallet = await getWallet(userId);
  if (!wallet) return { success: false, error: 'Wallet not found' };

  const { data: tx, error } = await supabase
    .from('wallet_transactions')
    .insert({
      user_id: userId,
      wallet_id: wallet.id,
      type: 'credit',
      transaction_type: 'deposit',
      amount,
      currency: wallet.currency,
      status: 'pending',
      description: `Deposit via ${provider}`,
      provider,
      reference: providerRef,
      balance_after: wallet.balance + amount,
      metadata: { provider, provider_ref: providerRef },
    })
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, tx: tx as WalletTransaction };
}

export async function confirmDeposit(txId: string): Promise<SendResult> {
  const tx = await getTransactionById(txId);
  if (!tx) return { success: false, error: 'Transaction not found' };
  if (tx.status !== 'pending') return { success: false, error: 'Transaction not pending' };

  const wallet = await getWalletById(tx.wallet_id!);
  if (!wallet) return { success: false, error: 'Wallet not found' };

  await supabase
    .from('wallet_transactions')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('id', txId);

  await supabase
    .from('wallets')
    .update({ balance: wallet.balance + tx.amount, updated_at: new Date().toISOString() })
    .eq('id', wallet.id);

  return { success: true };
}

export async function initiateWithdrawal(
  userId: string,
  amount: number,
  provider: string,
  accountRef: string
): Promise<SendResult> {
  const wallet = await getWallet(userId);
  if (!wallet) return { success: false, error: 'Wallet not found' };
  if (wallet.balance < amount) return { success: false, error: 'Insufficient balance' };

  const { data: tx, error } = await supabase
    .from('wallet_transactions')
    .insert({
      user_id: userId,
      wallet_id: wallet.id,
      type: 'debit',
      transaction_type: 'withdrawal',
      amount,
      currency: wallet.currency,
      status: 'pending',
      description: `Withdrawal to ${provider}`,
      provider,
      reference: accountRef,
      balance_after: wallet.balance - amount,
      metadata: { provider, account_ref: accountRef },
    })
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, tx: tx as WalletTransaction };
}

export async function confirmWithdrawal(txId: string): Promise<SendResult> {
  const tx = await getTransactionById(txId);
  if (!tx) return { success: false, error: 'Transaction not found' };
  if (tx.status !== 'pending') return { success: false, error: 'Transaction not pending' };

  const wallet = await getWalletById(tx.wallet_id!);
  if (!wallet) return { success: false, error: 'Wallet not found' };

  await supabase
    .from('wallet_transactions')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('id', txId);

  await supabase
    .from('wallets')
    .update({ balance: wallet.balance - tx.amount, updated_at: new Date().toISOString() })
    .eq('id', wallet.id);

  return { success: true };
}

// ───────────────────────────────────────────────
// Analytics / Reporting
// ───────────────────────────────────────────────

export async function getTransactionSummary(userId: string, period: 'today' | 'week' | 'month' | 'year'): Promise<{
  total_in: number;
  total_out: number;
  net: number;
  count: number;
}> {
  const now = new Date();
  let startDate: string;
  switch (period) {
    case 'today': startDate = new Date(now.setHours(0, 0, 0, 0)).toISOString(); break;
    case 'week': startDate = new Date(now.setDate(now.getDate() - 7)).toISOString(); break;
    case 'month': startDate = new Date(now.setMonth(now.getMonth() - 1)).toISOString(); break;
    case 'year': startDate = new Date(now.setFullYear(now.getFullYear() - 1)).toISOString(); break;
  }

  const { data, error } = await supabase
    .from('wallet_transactions')
    .select('type, amount')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .gte('created_at', startDate!);

  if (error) throw error;

  const txs = data || [];
  const total_in = txs.filter(t => t.type === 'credit' || t.type === 'refund').reduce((s, t) => s + (t.amount || 0), 0);
  const total_out = txs.filter(t => t.type === 'debit' || t.type === 'withdrawal').reduce((s, t) => s + (t.amount || 0), 0);

  return { total_in, total_out, net: total_in - total_out, count: txs.length };
}
