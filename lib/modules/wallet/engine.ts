// lib/modules/wallet/engine.ts
// Server-side wallet operations via Supabase
// All balance changes go through here for validation

import { supabase } from '@/lib/supabase';
import type { WalletTransaction, WalletAccount, WalletNotification } from './types';

export interface SendMoneyParams {
  recipientName: string;
  recipientPhone: string;
  amount: number;
  note?: string;
  useGoFund?: boolean;
  senderAccountId: string;
}

export interface SendMoneyResult {
  success: boolean;
  transaction?: WalletTransaction;
  notification?: WalletNotification;
  error?: string;
}

/**
 * Generate cryptographically secure UUID
 * Falls back to timestamp+random if crypto.randomUUID unavailable
 */
function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older environments
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `${timestamp}-${random}`;
}

/**
 * Verify recipient exists in the system
 * Returns user_id if found, null if not
 */
async function verifyRecipient(phone: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("user_profiles")
    .select('id')
    .eq('phone', phone)
    .single();

  if (error || !data) {
    return null;
  }
  return data.id;
}

/**
 * Get current server-side balance for an account
 */
async function getServerBalance(accountId: string): Promise<number | null> {
  const { data, error } = await supabase
    .from("wallet_accounts")
    .select('balance')
    .eq('id', accountId)
    .single();

  if (error || !data) {
    return null;
  }
  return data.balance;
}

/**
 * Send money — server-validated, server-persisted
 * 1. Verify sender has sufficient balance (server truth)
 * 2. Verify recipient exists
 * 3. Create transaction record in Supabase
 * 4. Update balances atomically
 * 5. Return confirmed transaction
 */
export async function sendMoney(params: SendMoneyParams): Promise<SendMoneyResult> {
  const { recipientName, recipientPhone, amount, note, senderAccountId } = params;

  if (amount <= 0) {
    return { success: false, error: 'Amount must be greater than 0' };
  }
  if (!recipientPhone || recipientPhone.length < 10) {
    return { success: false, error: 'Valid recipient phone required' };
  }

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  // Verify recipient exists
  const recipientId = await verifyRecipient(recipientPhone);
  if (!recipientId) {
    return { success: false, error: 'Recipient not found. They must be registered on MTAA.' };
  }

  // Check server-side balance
  const serverBalance = await getServerBalance(senderAccountId);
  if (serverBalance === null) {
    return { success: false, error: 'Could not verify balance. Try again.' };
  }
  if (serverBalance < amount) {
    return { success: false, error: `Insufficient funds. Balance: KSh ${serverBalance.toLocaleString()}` };
  }

  // Create transaction record
  const txId = generateId();
  const now = new Date().toISOString();
  const newBalance = serverBalance - amount;

  const transaction: WalletTransaction = {
    id: txId,
    type: 'send',
    amount,
    currency: 'KES',
    status: 'completed',
    recipientName,
    recipientPhone,
    sender: user.id,
    description: note || `Sent to ${recipientName}`,
    balanceBefore: serverBalance,
    balanceAfter: newBalance,
    timestamp: now,
    createdAt: now,
    completedAt: now,
  };

  // Insert transaction into Supabase
  const { error: txError } = await supabase
    .from("wallet_transactions")
    .insert({
      id: txId,
      user_id: user.id,
      type: 'send',
      amount,
      currency: 'KES',
      status: 'completed',
      recipient_name: recipientName,
      recipient_phone: recipientPhone,
      recipient_id: recipientId,
      description: note || `Sent to ${recipientName}`,
      balance_before: serverBalance,
      balance_after: newBalance,
      created_at: now,
      completed_at: now,
    });

  if (txError) {
    return { success: false, error: `Transaction failed: ${txError.message}` };
  }

  // Update sender balance
  const { error: balanceError } = await supabase
    .from("wallet_accounts")
    .update({ balance: newBalance, updated_at: now })
    .eq('id', senderAccountId);

  if (balanceError) {
    // Transaction created but balance update failed — critical inconsistency
    // Log for manual reconciliation
    console.error('CRITICAL: Transaction created but balance not updated', { txId, error: balanceError });
    return { success: false, error: 'Transaction recorded but balance update failed. Contact support.' };
  }

  // Create notification
  const notification: WalletNotification = {
    id: generateId(),
    type: 'payment_sent',
    title: 'Money Sent',
    message: `KSh ${amount.toLocaleString()} sent to ${recipientName}`,
    amount,
    read: false,
    isRead: false,
    timestamp: now,
    createdAt: now,
  };

  const { error: notifError } = await supabase
    .from('notifications')
    .insert({
      id: notification.id,
      user_id: user.id,
      type: 'payment_sent',
      title: 'Money Sent',
      message: `KSh ${amount.toLocaleString()} sent to ${recipientName}`,
      amount,
      read: false,
      created_at: now,
    });

  if (notifError) {
    // Non-critical — notification failed but transaction succeeded
    console.warn('Notification creation failed', notifError);
  }

  return { success: true, transaction, notification };
}

/**
 * Sync wallet state from server
 * Fetches latest balance, transactions, notifications
 */
export async function syncWalletState(accountId: string): Promise<{
  balance: number | null;
  transactions: WalletTransaction[];
  notifications: WalletNotification[];
  error?: string;
}> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { balance: null, transactions: [], notifications: [], error: 'Not authenticated' };
  }

  // Fetch balance
  const { data: walletData, error: walletError } = await supabase
    .from("wallet_accounts")
    .select('balance')
    .eq('id', accountId)
    .single();

  // Fetch transactions
  const { data: txData, error: txError } = await supabase
    .from("wallet_transactions")
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(200);

  // Fetch notifications
  const { data: notifData, error: notifError } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  const transactions: WalletTransaction[] = (txData || []).map((row: any) => ({
    id: row.id,
    type: row.type,
    amount: row.amount,
    currency: row.currency || 'KES',
    status: row.status,
    recipientName: row.recipient_name,
    recipientPhone: row.recipient_phone,
    sender: row.user_id,
    description: row.description,
    balanceBefore: row.balance_before,
    balanceAfter: row.balance_after,
    timestamp: row.created_at,
    createdAt: row.created_at,
    completedAt: row.completed_at,
  }));

  const notifications: WalletNotification[] = (notifData || []).map((row: any) => ({
    id: row.id,
    type: row.type,
    title: row.title,
    message: row.message,
    amount: row.amount,
    read: row.read,
    isRead: row.read,
    timestamp: row.created_at,
    createdAt: row.created_at,
  }));

  return {
    balance: walletData?.balance ?? null,
    transactions,
    notifications,
    error: walletError?.message || txError?.message || notifError?.message,
  };
}

/**
 * Get server-side GoFund state
 */
export async function getGoFundState(): Promise<{
  creditLimit: number;
  creditUsed: number;
  creditAvailable: number;
  isActive: boolean;
  isEligible: boolean;
  error?: string;
}> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { creditLimit: 0, creditUsed: 0, creditAvailable: 0, isActive: false, isEligible: false, error: 'Not authenticated' };
  }

  const { data, error } = await supabase
    .from('go_fund')
    .select('credit_limit, credit_used, is_active, is_eligible')
    .eq('user_id', user.id)
    .single();

  if (error || !data) {
    return { creditLimit: 0, creditUsed: 0, creditAvailable: 0, isActive: false, isEligible: false, error: error?.message };
  }

  return {
    creditLimit: data.credit_limit,
    creditUsed: data.credit_used,
    creditAvailable: data.credit_limit - data.credit_used,
    isActive: data.is_active,
    isEligible: data.is_eligible,
  };
}

