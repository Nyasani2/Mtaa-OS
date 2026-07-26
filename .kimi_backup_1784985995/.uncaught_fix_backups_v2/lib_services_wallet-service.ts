/**
 * MTAA OS V10 — Wallet Service V3
 * Tables: wallet_transactions, wallet_accounts, wallet_investments, wallet_sacco, wallet_gofund, wallet_cards
 */
import { supabase } from '@/lib/supabase/client';

export interface WalletAccount {
  id: string;
  user_id: string;
  wallet_id: string;
  account_type: string;
  currency: string;
  balance: number;
  available_balance: number;
  hold_balance: number;
  status: 'active' | 'frozen' | 'closed';
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface WalletTransaction {
  id: string;
  user_id: string;
  wallet_id: string;
  amount: number;
  type: string;
  status: 'pending' | 'completed' | 'failed';
  description: string | null;
  reference_id: string | null;
  reference_type: string | null;
  balance_after: number | null;
  completed_at: string | null;
  failed_at: string | null;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface WalletInvestment {
  id: string;
  user_id: string;
  name: string;
  type: string;
  amount_invested: number;
  current_value: number;
  currency: string;
  status: 'active' | 'matured' | 'withdrawn';
  maturity_date: string | null;
  return_rate: number | null;
  created_at: string;
  updated_at: string;
}

// ── ACCOUNTS ──────────────────────────────────────────────

export async function fetchWalletAccounts(userId: string) {
  const { data, error } = await supabase
    .from('wallet_accounts')
    .select('*')
    .eq('user_id', userId)
    .order('is_default', { ascending: false });
  if (error) throw error;
  return (data ?? []) as WalletAccount[];
}

export async function fetchWalletAccountById(id: string) {
  const { data, error } = await supabase.from('wallet_accounts').select('*').eq('id', id).single();
  if (error) throw error;
  return data as WalletAccount;
}

// ── TRANSACTIONS ──────────────────────────────────────────

export async function fetchWalletTransactions(userId: string, options: { limit?: number; offset?: number; type?: string } = {}) {
  const { limit = 20, offset = 0, type } = options;
  let q = supabase.from('wallet_transactions').select('*').eq('user_id', userId);
  if (type) q = q.eq('type', type);
  const { data, error } = await q.order('created_at', { ascending: false }).range(offset, offset + limit - 1);
  if (error) throw error;
  return (data ?? []) as WalletTransaction[];
}

export async function sendWalletTransfer(payload: {
  sender_id: string;
  receiver_id: string;
  amount: number;
  currency: string;
  description?: string;
}) {
  const { data, error } = await supabase.rpc('wallet_transfer', payload);
  if (error) throw error;
  return data;
}

export async function depositToWallet(userId: string, amount: number, currency: string = 'KES', provider: string = 'mpesa') {
  const { data, error } = await supabase.rpc('wallet_deposit', {
    p_user_id: userId,
    p_amount: amount,
    p_currency: currency,
    p_provider: provider,
  });
  if (error) throw error;
  return data;
}

export async function withdrawFromWallet(userId: string, amount: number, currency: string = 'KES', provider: string = 'mpesa') {
  const { data, error } = await supabase.rpc('wallet_withdraw', {
    p_user_id: userId,
    p_amount: amount,
    p_currency: currency,
    p_provider: provider,
  });
  if (error) throw error;
  return data;
}

// ── INVESTMENTS ───────────────────────────────────────────

export async function fetchWalletInvestments(userId: string) {
  const { data, error } = await supabase
    .from('wallet_investments')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as WalletInvestment[];
}

export async function createInvestment(userId: string, payload: Partial<WalletInvestment>) {
  const { data, error } = await supabase
    .from('wallet_investments')
    .insert({ ...payload, user_id: userId, status: 'active' })
    .select()
    .single();
  if (error) throw error;
  return data as WalletInvestment;
}

export async function withdrawInvestment(investmentId: string) {
  const { data, error } = await supabase
    .from('wallet_investments')
    .update({ status: 'withdrawn', updated_at: new Date().toISOString() })
    .eq('id', investmentId)
    .select()
    .single();
  if (error) throw error;
  return data as WalletInvestment;
}

// ── SACCO ─────────────────────────────────────────────────

export async function fetchWalletSacco(userId: string) {
  const { data, error } = await supabase.from('wallet_sacco').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createSaccoContribution(userId: string, amount: number, saccoName: string) {
  const { data, error } = await supabase.from('wallet_sacco').insert({
    user_id: userId, amount, sacco_name: saccoName, status: 'active', created_at: new Date().toISOString(),
  }).select().single();
  if (error) throw error;
  return data;
}

// ── GOFUND ────────────────────────────────────────────────

export async function fetchWalletGoFund(userId: string) {
  const { data, error } = await supabase.from('wallet_gofund').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createGoFundCampaign(userId: string, payload: any) {
  const { data, error } = await supabase.from('wallet_gofund').insert({ ...payload, user_id: userId }).select().single();
  if (error) throw error;
  return data;
}

// ── CARDS ─────────────────────────────────────────────────

export async function fetchWalletCards(userId: string) {
  const { data, error } = await supabase.from('wallet_cards').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function addWalletCard(userId: string, payload: any) {
  const { data, error } = await supabase.from('wallet_cards').insert({ ...payload, user_id: userId }).select().single();
  if (error) throw error;
  return data;
}
