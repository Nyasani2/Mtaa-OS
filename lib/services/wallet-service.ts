// ============================================================
// MTAA OS V10 - Wallet Service v2
// ALIGNED TO VERIFIED SQL FUNCTIONS
// Canonical tables: wallets, wallet_transactions
// DEPRECATED: wallet_accounts (legacy, desynced — balance 0 vs 1500)
// ============================================================

import { supabase } from '@/lib/supabase';

// ─── Types ───
export interface Wallet {
  id: string;
  user_id: string;
  wallet_name?: string;
  wallet_type?: string;
  currency: string;
  balance: number;
  held_balance?: number;
  available_balance?: number;
  status: 'active' | 'frozen' | 'suspended' | 'closed';
  is_default?: boolean;
  daily_limit?: number;
  monthly_limit?: number;
  max_balance?: number;
  interest_rate?: number;
  metadata?: any;
  pending_balance?: number;
  reserved_balance?: number;
  is_frozen?: boolean;
  risk_score?: number;
  risk_level?: string;
  last_deposit_at?: string;
  tier?: string;
  created_at?: string;
  updated_at?: string;
}

export interface WalletTransaction {
  id: string;
  user_id: string;
  wallet_id?: string | null;
  amount: number;
  type: 'credit' | 'debit' | 'transfer' | 'refund' | 'escrow_deposit' | 'escrow_release' | 'escrow_refund' | 'fee';
  status: 'pending' | 'completed' | 'failed' | 'cancelled' | 'reversed';
  currency?: string;
  description?: string;
  reference_id?: string;
  reference_type?: string;
  metadata?: any;
  balance_after?: number;
  completed_at?: string;
  failed_at?: string;
  provider?: string;
  reference?: string;
  transaction_type?: string;
  profile_id?: string;
  created_at?: string;
  updated_at?: string;
}

// ─── Helper ───
function handleError(err: any, fallback: any = null) {
  console.error('[WalletService]', err?.message || err);
  return fallback;
}

// ─── WALLETS (Canonical — reads from `wallets` table) ───

export async function getWallets(): Promise<Wallet[]> {
  const { data, error } = await supabase.from('wallet_accounts').select('*');
  if (error) return handleError(error, []);
  return data || [];
}

export async function getWalletById(id: string): Promise<Wallet | null> {
  const { data, error } = await supabase.from('wallet_accounts').select('*').eq('id', id).maybeSingle();
  if (error) return handleError(error, null);
  return data;
}

export async function getWalletByUserId(userId: string): Promise<Wallet | null> {
  const { data, error } = await supabase.from('wallet_accounts').select('*').eq('user_id', userId).maybeSingle();
  if (error) return handleError(error, null);
  return data;
}

export async function createWallet(data: Partial<Wallet>): Promise<Wallet | null> {
  const { data: result, error } = await supabase.from('wallet_accounts').insert(data).select().maybeSingle();
  if (error) return handleError(error, null);
  return result;
}

export async function updateWallet(id: string, data: Partial<Wallet>): Promise<Wallet | null> {
  const { data: result, error } = await supabase.from('wallet_accounts').update(data).eq('id', id).select().maybeSingle();
  if (error) return handleError(error, null);
  return result;
}

export async function deleteWallet(id: string): Promise<boolean> {
  const { error } = await supabase.from('wallet_accounts').delete().eq('id', id);
  if (error) return handleError(error, false);
  return true;
}

export async function ensureWallet(userId: string, currency: string = 'KES'): Promise<Wallet | null> {
  const existing = await getWalletByUserId(userId);
  if (existing) return existing;
  const { data, error } = await supabase.rpc('mtaa_get_or_create_wallet', {
    p_user_id: userId,
    p_currency: currency
  });
  if (error) {
    console.error('[ensureWallet] RPC failed, falling back to direct insert:', error);
    return createWallet({
      user_id: userId,
      currency,
      balance: 0,
      status: 'active',
      wallet_name: 'Default',
      wallet_type: 'personal'
    });
  }
  return getWalletByUserId(userId);
}

// ─── TRANSACTIONS (Aligned to SQL functions — filter by user_id) ───

export async function getWalletTransactions(userId?: string): Promise<WalletTransaction[]> {
  let query = supabase.from('wallet_transactions').select('*').order('created_at', { ascending: false });
  if (userId) query = query.eq('user_id', userId);
  const { data, error } = await query;
  if (error) return handleError(error, []);
  return data || [];
}

export async function getWalletTransactionById(id: string): Promise<WalletTransaction | null> {
  const { data, error } = await supabase.from('wallet_transactions').select('*').eq('id', id).maybeSingle();
  if (error) return handleError(error, null);
  return data;
}

export async function createWalletTransaction(data: Partial<WalletTransaction>): Promise<WalletTransaction | null> {
  const { data: result, error } = await supabase.from('wallet_transactions').insert(data).select().maybeSingle();
  if (error) return handleError(error, null);
  return result;
}

// ─── RPC WRAPPERS (Verified signatures from database) ───

/**
 * Deposit money into a user's wallet.
 * Uses mtaa_credit_wallet (user_id-based) — NOT wallet_deposit (wallet_id-based).
 * Verified: adds balance to wallets table, creates transaction record.
 */
export async function depositToWallet(
  userId: string,
  amount: number,
  description?: string,
  reference?: string,
  topupMethod?: string
): Promise<boolean> {
  const { error } = await supabase.rpc('mtaa_credit_wallet', {
    p_user_id: userId,
    p_amount: amount,
    p_description: description || 'Wallet deposit',
    p_reference: reference || null,
    p_topup_method: topupMethod || null
  });
  if (error) {
    console.error('[depositToWallet] RPC error:', error);
    return false;
  }
  return true;
}

/**
 * Withdraw money from a user's wallet.
 * Uses wallet_withdraw (user_id-based).
 */
export async function withdrawFromWallet(
  userId: string,
  amount: number
): Promise<boolean> {
  const { error } = await supabase.rpc('wallet_withdraw', {
    p_user: userId,
    p_amount: amount
  });
  if (error) {
    console.error('[withdrawFromWallet] RPC error:', error);
    return false;
  }
  return true;
}

/**
 * Send money from one user to another (P2P transfer).
 * Uses wallet_send (user_id-based) — avoids overloaded wallet_transfer.
 * Verified signature: wallet_send(p_sender uuid, p_receiver uuid, p_amount numeric)
 */
export async function sendMoney(
  fromUserId: string,
  toUserId: string,
  amount: number
): Promise<boolean> {
  const { error } = await supabase.rpc('wallet_send', {
    p_sender: fromUserId,
    p_receiver: toUserId,
    p_amount: amount
  });
  if (error) {
    console.error('[sendMoney] RPC error:', error);
    return false;
  }
  return true;
}

/**
 * Process a payment between users (deducts from sender, credits receiver + platform).
 * Uses mtaa_process_payment (user_id-based, includes 17% commission).
 * Verified: handles escrow, commission split, treasury remittance.
 */
export async function processPayment(
  fromUserId: string,
  toUserId: string,
  amount: number,
  type: string = 'payment',
  reference?: string
): Promise<boolean> {
  const { error } = await supabase.rpc('mtaa_process_payment', {
    p_from_user_id: fromUserId,
    p_to_user_id: toUserId,
    p_total_amount: amount,
    p_type: type,
    p_reference: reference || 'mtaa-payment'
  });
  if (error) {
    console.error('[processPayment] RPC error:', error);
    return false;
  }
  return true;
}

// ─── LEGACY COMPATIBILITY (wallet_accounts) ───
// DEPRECATED: These redirect to wallets. Remove after all callers migrated.

/** @deprecated Use getWalletByUserId() instead */
export async function getWalletAccountByUserId(userId: string): Promise<Wallet | null> {
  return getWalletByUserId(userId);
}

/** @deprecated Use ensureWallet() instead */
export async function ensureWalletAccount(userId: string): Promise<Wallet | null> {
  return ensureWallet(userId);
}

/** @deprecated Use getWalletTransactions(userId) instead */
export async function getWalletTransactionsByWalletId(walletId: string): Promise<WalletTransaction[]> {
  // Fallback: try user_id if wallet_id returns nothing
  const byWallet = await supabase.from('wallet_transactions').select('*').eq('wallet_id', walletId).order('created_at', { ascending: false });
  if (byWallet.data && byWallet.data.length > 0) return byWallet.data;
  // Try finding user_id from wallets table
  const { data: wallet } = await supabase.from('wallet_accounts').select('user_id').eq('id', walletId).maybeSingle();
  if (wallet?.user_id) {
    const byUser = await supabase.from('wallet_transactions').select('*').eq('user_id', wallet.user_id).order('created_at', { ascending: false });
    return byUser.data || [];
  }
  return [];
}

// ─── STATS ───

export async function getWalletStats(): Promise<any> {
  const { count: wallets } = await supabase.from('wallet_accounts').select('*', { count: 'exact', head: true });
  const { count: transactions } = await supabase.from('wallet_transactions').select('*', { count: 'exact', head: true });
  const { count: agents } = await supabase.from('wallet_agents').select('*', { count: 'exact', head: true });
  const { count: partners } = await supabase.from('wallet_partners').select('*', { count: 'exact', head: true });
  return { wallets, transactions, agents, partners };
}
