// ============================================================
// MTAA OS V10 - Wallet Service
// 47 tables: wallet_accounts, wallet_transactions, etc.
// ============================================================

import { supabase } from '@/lib/supabase';

// ─── Types ───
export interface WalletAccount {
  id: string;
  user_id: string;
  balance: number;
  currency?: string;
  status: 'active' | 'frozen' | 'closed';
  created_at?: string;
}

export interface WalletTransaction {
  id: string;
  wallet_id: string;
  type: 'deposit' | 'withdrawal' | 'transfer' | 'payment' | 'refund';
  amount: number;
  currency?: string;
  description?: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  reference?: string;
  created_at?: string;
}

export interface WalletDeposit {
  id: string;
  wallet_id: string;
  amount: number;
  method: string;
  status: 'pending' | 'completed' | 'failed';
  transaction_id?: string;
  created_at?: string;
}

export interface WalletWithdrawal {
  id: string;
  wallet_id: string;
  amount: number;
  method: string;
  destination?: string;
  status: 'pending' | 'completed' | 'failed';
  created_at?: string;
}

export interface WalletTransfer {
  id: string;
  from_wallet_id: string;
  to_wallet_id: string;
  amount: number;
  description?: string;
  status: 'pending' | 'completed' | 'failed';
  created_at?: string;
}

export interface WalletPayment {
  id: string;
  wallet_id: string;
  amount: number;
  recipient_id?: string;
  description?: string;
  status: 'pending' | 'completed' | 'failed';
  created_at?: string;
}

export interface WalletSavings {
  id: string;
  wallet_id: string;
  goal_name: string;
  target_amount: number;
  current_amount: number;
  status?: string;
  created_at?: string;
}

export interface WalletEscrow {
  id: string;
  transaction_id: string;
  amount: number;
  status: 'pending' | 'released' | 'refunded' | 'disputed';
  created_at?: string;
  released_at?: string;
}

export interface WalletAgent {
  id: string;
  user_id: string;
  agent_code: string;
  commission_rate?: number;
  status: 'active' | 'inactive';
  created_at?: string;
}

export interface WalletFuliza {
  id: string;
  wallet_id: string;
  limit: number;
  used: number;
  status: 'active' | 'suspended';
  created_at?: string;
}

export interface WalletTax {
  id: string;
  wallet_id: string;
  tax_type: string;
  amount: number;
  status?: string;
  created_at?: string;
}

export interface WalletPartner {
  id: string;
  name: string;
  type: string;
  api_key?: string;
  status: 'active' | 'inactive';
  created_at?: string;
}

export interface WalletPartnerAdmin {
  id: string;
  partner_id: string;
  user_id: string;
  role?: string;
  created_at?: string;
}

export interface WalletOnboarding {
  id: string;
  user_id: string;
  step: string;
  status: 'in_progress' | 'completed';
  created_at?: string;
}

export interface WalletOperation {
  id: string;
  wallet_id: string;
  operation_type: string;
  amount: number;
  status?: string;
  created_at?: string;
}

export interface WalletReceiveRequest {
  id: string;
  wallet_id: string;
  amount: number;
  description?: string;
  status: 'pending' | 'completed' | 'cancelled';
  created_at?: string;
}

// ─── Helper ───
function handleError(err: any, fallback: any = null) {
  console.error('[WalletService]', err?.message || err);
  return fallback;
}

// ─── ACCOUNTS ───

export async function getWalletAccounts(): Promise<WalletAccount[]> {
  const { data, error } = await supabase.from('wallet_accounts').select('*');
  if (error) return handleError(error, []);
  return data || [];
}

export async function getWalletAccountById(id: string): Promise<WalletAccount | null> {
  const { data, error } = await supabase.from('wallet_accounts').select('*').eq('id', id).single();
  if (error) return handleError(error, null);
  return data;
}

export async function getWalletAccountByUserId(userId: string): Promise<WalletAccount | null> {
  const { data, error } = await supabase.from('wallet_accounts').select('*').eq('user_id', userId).single();
  if (error) return handleError(error, null);
  return data;
}

export async function createWalletAccount(data: Partial<WalletAccount>): Promise<WalletAccount | null> {
  const { data: result, error } = await supabase.from('wallet_accounts').insert(data).select().single();
  if (error) return handleError(error, null);
  return result;
}

export async function updateWalletAccount(id: string, data: Partial<WalletAccount>): Promise<WalletAccount | null> {
  const { data: result, error } = await supabase.from('wallet_accounts').update(data).eq('id', id).select().single();
  if (error) return handleError(error, null);
  return result;
}

export async function deleteWalletAccount(id: string): Promise<boolean> {
  const { error } = await supabase.from('wallet_accounts').delete().eq('id', id);
  if (error) return handleError(error, false);
  return true;
}

export async function ensureWallet(userId: string): Promise<WalletAccount | null> {
  const existing = await getWalletAccountByUserId(userId);
  if (existing) return existing;
  return createWalletAccount({ user_id: userId, balance: 0, status: 'active' });
}

// ─── TRANSACTIONS ───

export async function getWalletTransactions(walletId?: string): Promise<WalletTransaction[]> {
  let query = supabase.from('wallet_transactions').select('*').order('created_at', { ascending: false });
  if (walletId) query = query.eq('wallet_id', walletId);
  const { data, error } = await query;
  if (error) return handleError(error, []);
  return data || [];
}

export async function getWalletTransactionById(id: string): Promise<WalletTransaction | null> {
  const { data, error } = await supabase.from('wallet_transactions').select('*').eq('id', id).single();
  if (error) return handleError(error, null);
  return data;
}

export async function createWalletTransaction(data: Partial<WalletTransaction>): Promise<WalletTransaction | null> {
  const { data: result, error } = await supabase.from('wallet_transactions').insert(data).select().single();
  if (error) return handleError(error, null);
  return result;
}

export async function updateWalletTransaction(id: string, data: Partial<WalletTransaction>): Promise<WalletTransaction | null> {
  const { data: result, error } = await supabase.from('wallet_transactions').update(data).eq('id', id).select().single();
  if (error) return handleError(error, null);
  return result;
}

export async function deleteWalletTransaction(id: string): Promise<boolean> {
  const { error } = await supabase.from('wallet_transactions').delete().eq('id', id);
  if (error) return handleError(error, false);
  return true;
}

// ─── DEPOSITS ───

export async function getWalletDeposits(walletId?: string): Promise<WalletDeposit[]> {
  let query = supabase.from('wallet_deposits').select('*').order('created_at', { ascending: false });
  if (walletId) query = query.eq('wallet_id', walletId);
  const { data, error } = await query;
  if (error) return handleError(error, []);
  return data || [];
}

export async function getWalletDepositById(id: string): Promise<WalletDeposit | null> {
  const { data, error } = await supabase.from('wallet_deposits').select('*').eq('id', id).single();
  if (error) return handleError(error, null);
  return data;
}

export async function createWalletDeposit(data: Partial<WalletDeposit>): Promise<WalletDeposit | null> {
  const { data: result, error } = await supabase.from('wallet_deposits').insert(data).select().single();
  if (error) return handleError(error, null);
  return result;
}

export async function updateWalletDeposit(id: string, data: Partial<WalletDeposit>): Promise<WalletDeposit | null> {
  const { data: result, error } = await supabase.from('wallet_deposits').update(data).eq('id', id).select().single();
  if (error) return handleError(error, null);
  return result;
}

export async function deleteWalletDeposit(id: string): Promise<boolean> {
  const { error } = await supabase.from('wallet_deposits').delete().eq('id', id);
  if (error) return handleError(error, false);
  return true;
}

export async function initiateDeposit(walletId: string, amount: number, method: string): Promise<WalletDeposit | null> {
  return createWalletDeposit({ wallet_id: walletId, amount, method, status: 'pending' });
}

// ─── WITHDRAWALS ───

export async function getWalletWithdrawals(walletId?: string): Promise<WalletWithdrawal[]> {
  let query = supabase.from('wallet_withdrawals').select('*').order('created_at', { ascending: false });
  if (walletId) query = query.eq('wallet_id', walletId);
  const { data, error } = await query;
  if (error) return handleError(error, []);
  return data || [];
}

export async function getWalletWithdrawalById(id: string): Promise<WalletWithdrawal | null> {
  const { data, error } = await supabase.from('wallet_withdrawals').select('*').eq('id', id).single();
  if (error) return handleError(error, null);
  return data;
}

export async function createWalletWithdrawal(data: Partial<WalletWithdrawal>): Promise<WalletWithdrawal | null> {
  const { data: result, error } = await supabase.from('wallet_withdrawals').insert(data).select().single();
  if (error) return handleError(error, null);
  return result;
}

export async function updateWalletWithdrawal(id: string, data: Partial<WalletWithdrawal>): Promise<WalletWithdrawal | null> {
  const { data: result, error } = await supabase.from('wallet_withdrawals').update(data).eq('id', id).select().single();
  if (error) return handleError(error, null);
  return result;
}

export async function deleteWalletWithdrawal(id: string): Promise<boolean> {
  const { error } = await supabase.from('wallet_withdrawals').delete().eq('id', id);
  if (error) return handleError(error, false);
  return true;
}

export async function initiateWithdrawal(walletId: string, amount: number, method: string, destination?: string): Promise<WalletWithdrawal | null> {
  return createWalletWithdrawal({ wallet_id: walletId, amount, method, destination, status: 'pending' });
}

// ─── TRANSFERS ───

export async function getWalletTransfers(): Promise<WalletTransfer[]> {
  const { data, error } = await supabase.from('wallet_transfers').select('*').order('created_at', { ascending: false });
  if (error) return handleError(error, []);
  return data || [];
}

export async function getWalletTransferById(id: string): Promise<WalletTransfer | null> {
  const { data, error } = await supabase.from('wallet_transfers').select('*').eq('id', id).single();
  if (error) return handleError(error, null);
  return data;
}

export async function createWalletTransfer(data: Partial<WalletTransfer>): Promise<WalletTransfer | null> {
  const { data: result, error } = await supabase.from('wallet_transfers').insert(data).select().single();
  if (error) return handleError(error, null);
  return result;
}

export async function updateWalletTransfer(id: string, data: Partial<WalletTransfer>): Promise<WalletTransfer | null> {
  const { data: result, error } = await supabase.from('wallet_transfers').update(data).eq('id', id).select().single();
  if (error) return handleError(error, null);
  return result;
}

export async function deleteWalletTransfer(id: string): Promise<boolean> {
  const { error } = await supabase.from('wallet_transfers').delete().eq('id', id);
  if (error) return handleError(error, false);
  return true;
}

export async function sendMoney(fromWalletId: string, toWalletId: string, amount: number, description?: string): Promise<WalletTransfer | null> {
  return createWalletTransfer({ from_wallet_id: fromWalletId, to_wallet_id: toWalletId, amount, description, status: 'completed' });
}

// ─── PAYMENTS ───

export async function getWalletPayments(walletId?: string): Promise<WalletPayment[]> {
  let query = supabase.from('wallet_payments').select('*').order('created_at', { ascending: false });
  if (walletId) query = query.eq('wallet_id', walletId);
  const { data, error } = await query;
  if (error) return handleError(error, []);
  return data || [];
}

export async function getWalletPaymentById(id: string): Promise<WalletPayment | null> {
  const { data, error } = await supabase.from('wallet_payments').select('*').eq('id', id).single();
  if (error) return handleError(error, null);
  return data;
}

export async function createWalletPayment(data: Partial<WalletPayment>): Promise<WalletPayment | null> {
  const { data: result, error } = await supabase.from('wallet_payments').insert(data).select().single();
  if (error) return handleError(error, null);
  return result;
}

export async function updateWalletPayment(id: string, data: Partial<WalletPayment>): Promise<WalletPayment | null> {
  const { data: result, error } = await supabase.from('wallet_payments').update(data).eq('id', id).select().single();
  if (error) return handleError(error, null);
  return result;
}

export async function deleteWalletPayment(id: string): Promise<boolean> {
  const { error } = await supabase.from('wallet_payments').delete().eq('id', id);
  if (error) return handleError(error, false);
  return true;
}

// ─── RECEIVE REQUESTS ───

export async function getWalletReceiveRequests(): Promise<WalletReceiveRequest[]> {
  const { data, error } = await supabase.from('wallet_receive_requests').select('*');
  if (error) return handleError(error, []);
  return data || [];
}

export async function getWalletReceiveRequestById(id: string): Promise<WalletReceiveRequest | null> {
  const { data, error } = await supabase.from('wallet_receive_requests').select('*').eq('id', id).single();
  if (error) return handleError(error, null);
  return data;
}

export async function createReceiveRequest(data: Partial<WalletReceiveRequest>): Promise<WalletReceiveRequest | null> {
  const { data: result, error } = await supabase.from('wallet_receive_requests').insert(data).select().single();
  if (error) return handleError(error, null);
  return result;
}

export async function updateReceiveRequest(id: string, data: Partial<WalletReceiveRequest>): Promise<WalletReceiveRequest | null> {
  const { data: result, error } = await supabase.from('wallet_receive_requests').update(data).eq('id', id).select().single();
  if (error) return handleError(error, null);
  return result;
}

export async function deleteReceiveRequest(id: string): Promise<boolean> {
  const { error } = await supabase.from('wallet_receive_requests').delete().eq('id', id);
  if (error) return handleError(error, false);
  return true;
}

// ─── SAVINGS ───

export async function getWalletSavings(): Promise<WalletSavings[]> {
  const { data, error } = await supabase.from('wallet_savings').select('*');
  if (error) return handleError(error, []);
  return data || [];
}

export async function getWalletSavingsById(id: string): Promise<WalletSavings | null> {
  const { data, error } = await supabase.from('wallet_savings').select('*').eq('id', id).single();
  if (error) return handleError(error, null);
  return data;
}

export async function createWalletSavings(data: Partial<WalletSavings>): Promise<WalletSavings | null> {
  const { data: result, error } = await supabase.from('wallet_savings').insert(data).select().single();
  if (error) return handleError(error, null);
  return result;
}

export async function updateWalletSavings(id: string, data: Partial<WalletSavings>): Promise<WalletSavings | null> {
  const { data: result, error } = await supabase.from('wallet_savings').update(data).eq('id', id).select().single();
  if (error) return handleError(error, null);
  return result;
}

export async function deleteWalletSavings(id: string): Promise<boolean> {
  const { error } = await supabase.from('wallet_savings').delete().eq('id', id);
  if (error) return handleError(error, false);
  return true;
}

// ─── ESCROW ───

export async function getWalletEscrows(): Promise<WalletEscrow[]> {
  const { data, error } = await supabase.from('wallet_escrow').select('*');
  if (error) return handleError(error, []);
  return data || [];
}

export async function getWalletEscrowById(id: string): Promise<WalletEscrow | null> {
  const { data, error } = await supabase.from('wallet_escrow').select('*').eq('id', id).single();
  if (error) return handleError(error, null);
  return data;
}

export async function createWalletEscrow(data: Partial<WalletEscrow>): Promise<WalletEscrow | null> {
  const { data: result, error } = await supabase.from('wallet_escrow').insert(data).select().single();
  if (error) return handleError(error, null);
  return result;
}

export async function updateWalletEscrow(id: string, data: Partial<WalletEscrow>): Promise<WalletEscrow | null> {
  const { data: result, error } = await supabase.from('wallet_escrow').update(data).eq('id', id).select().single();
  if (error) return handleError(error, null);
  return result;
}

export async function deleteWalletEscrow(id: string): Promise<boolean> {
  const { error } = await supabase.from('wallet_escrow').delete().eq('id', id);
  if (error) return handleError(error, false);
  return true;
}

// ─── AGENTS ───

export async function getWalletAgents(): Promise<WalletAgent[]> {
  const { data, error } = await supabase.from('wallet_agents').select('*');
  if (error) return handleError(error, []);
  return data || [];
}

export async function getWalletAgentById(id: string): Promise<WalletAgent | null> {
  const { data, error } = await supabase.from('wallet_agents').select('*').eq('id', id).single();
  if (error) return handleError(error, null);
  return data;
}

export async function createWalletAgent(data: Partial<WalletAgent>): Promise<WalletAgent | null> {
  const { data: result, error } = await supabase.from('wallet_agents').insert(data).select().single();
  if (error) return handleError(error, null);
  return result;
}

export async function updateWalletAgent(id: string, data: Partial<WalletAgent>): Promise<WalletAgent | null> {
  const { data: result, error } = await supabase.from('wallet_agents').update(data).eq('id', id).select().single();
  if (error) return handleError(error, null);
  return result;
}

export async function deleteWalletAgent(id: string): Promise<boolean> {
  const { error } = await supabase.from('wallet_agents').delete().eq('id', id);
  if (error) return handleError(error, false);
  return true;
}

// ─── FULIZA ───

export async function getWalletFuliza(): Promise<WalletFuliza[]> {
  const { data, error } = await supabase.from('wallet_fuliza').select('*');
  if (error) return handleError(error, []);
  return data || [];
}

export async function getWalletFulizaById(id: string): Promise<WalletFuliza | null> {
  const { data, error } = await supabase.from('wallet_fuliza').select('*').eq('id', id).single();
  if (error) return handleError(error, null);
  return data;
}

export async function createWalletFuliza(data: Partial<WalletFuliza>): Promise<WalletFuliza | null> {
  const { data: result, error } = await supabase.from('wallet_fuliza').insert(data).select().single();
  if (error) return handleError(error, null);
  return result;
}

export async function updateWalletFuliza(id: string, data: Partial<WalletFuliza>): Promise<WalletFuliza | null> {
  const { data: result, error } = await supabase.from('wallet_fuliza').update(data).eq('id', id).select().single();
  if (error) return handleError(error, null);
  return result;
}

export async function deleteWalletFuliza(id: string): Promise<boolean> {
  const { error } = await supabase.from('wallet_fuliza').delete().eq('id', id);
  if (error) return handleError(error, false);
  return true;
}

// ─── TAX ───

export async function getWalletTaxes(): Promise<WalletTax[]> {
  const { data, error } = await supabase.from('wallet_tax').select('*');
  if (error) return handleError(error, []);
  return data || [];
}

export async function getWalletTaxById(id: string): Promise<WalletTax | null> {
  const { data, error } = await supabase.from('wallet_tax').select('*').eq('id', id).single();
  if (error) return handleError(error, null);
  return data;
}

export async function createWalletTax(data: Partial<WalletTax>): Promise<WalletTax | null> {
  const { data: result, error } = await supabase.from('wallet_tax').insert(data).select().single();
  if (error) return handleError(error, null);
  return result;
}

export async function updateWalletTax(id: string, data: Partial<WalletTax>): Promise<WalletTax | null> {
  const { data: result, error } = await supabase.from('wallet_tax').update(data).eq('id', id).select().single();
  if (error) return handleError(error, null);
  return result;
}

export async function deleteWalletTax(id: string): Promise<boolean> {
  const { error } = await supabase.from('wallet_tax').delete().eq('id', id);
  if (error) return handleError(error, false);
  return true;
}

// ─── PARTNERS ───

export async function getWalletPartners(): Promise<WalletPartner[]> {
  const { data, error } = await supabase.from('wallet_partners').select('*');
  if (error) return handleError(error, []);
  return data || [];
}

export async function getWalletPartnerById(id: string): Promise<WalletPartner | null> {
  const { data, error } = await supabase.from('wallet_partners').select('*').eq('id', id).single();
  if (error) return handleError(error, null);
  return data;
}

export async function createWalletPartner(data: Partial<WalletPartner>): Promise<WalletPartner | null> {
  const { data: result, error } = await supabase.from('wallet_partners').insert(data).select().single();
  if (error) return handleError(error, null);
  return result;
}

export async function updateWalletPartner(id: string, data: Partial<WalletPartner>): Promise<WalletPartner | null> {
  const { data: result, error } = await supabase.from('wallet_partners').update(data).eq('id', id).select().single();
  if (error) return handleError(error, null);
  return result;
}

export async function deleteWalletPartner(id: string): Promise<boolean> {
  const { error } = await supabase.from('wallet_partners').delete().eq('id', id);
  if (error) return handleError(error, false);
  return true;
}

// ─── PARTNER ADMINS ───

export async function getWalletPartnerAdmins(): Promise<WalletPartnerAdmin[]> {
  const { data, error } = await supabase.from('wallet_partner_admins').select('*');
  if (error) return handleError(error, []);
  return data || [];
}

export async function createWalletPartnerAdmin(data: Partial<WalletPartnerAdmin>): Promise<WalletPartnerAdmin | null> {
  const { data: result, error } = await supabase.from('wallet_partner_admins').insert(data).select().single();
  if (error) return handleError(error, null);
  return result;
}

export async function updateWalletPartnerAdmin(id: string, data: Partial<WalletPartnerAdmin>): Promise<WalletPartnerAdmin | null> {
  const { data: result, error } = await supabase.from('wallet_partner_admins').update(data).eq('id', id).select().single();
  if (error) return handleError(error, null);
  return result;
}

export async function deleteWalletPartnerAdmin(id: string): Promise<boolean> {
  const { error } = await supabase.from('wallet_partner_admins').delete().eq('id', id);
  if (error) return handleError(error, false);
  return true;
}

// ─── ONBOARDING ───

export async function getWalletOnboardings(): Promise<WalletOnboarding[]> {
  const { data, error } = await supabase.from('wallet_onboarding').select('*');
  if (error) return handleError(error, []);
  return data || [];
}

export async function getWalletOnboardingById(id: string): Promise<WalletOnboarding | null> {
  const { data, error } = await supabase.from('wallet_onboarding').select('*').eq('id', id).single();
  if (error) return handleError(error, null);
  return data;
}

export async function createWalletOnboarding(data: Partial<WalletOnboarding>): Promise<WalletOnboarding | null> {
  const { data: result, error } = await supabase.from('wallet_onboarding').insert(data).select().single();
  if (error) return handleError(error, null);
  return result;
}

export async function updateWalletOnboarding(id: string, data: Partial<WalletOnboarding>): Promise<WalletOnboarding | null> {
  const { data: result, error } = await supabase.from('wallet_onboarding').update(data).eq('id', id).select().single();
  if (error) return handleError(error, null);
  return result;
}

export async function deleteWalletOnboarding(id: string): Promise<boolean> {
  const { error } = await supabase.from('wallet_onboarding').delete().eq('id', id);
  if (error) return handleError(error, false);
  return true;
}

// ─── OPERATIONS ───

export async function getWalletOperations(): Promise<WalletOperation[]> {
  const { data, error } = await supabase.from('wallet_operations').select('*');
  if (error) return handleError(error, []);
  return data || [];
}

export async function getWalletOperationById(id: string): Promise<WalletOperation | null> {
  const { data, error } = await supabase.from('wallet_operations').select('*').eq('id', id).single();
  if (error) return handleError(error, null);
  return data;
}

export async function createWalletOperation(data: Partial<WalletOperation>): Promise<WalletOperation | null> {
  const { data: result, error } = await supabase.from('wallet_operations').insert(data).select().single();
  if (error) return handleError(error, null);
  return result;
}

export async function updateWalletOperation(id: string, data: Partial<WalletOperation>): Promise<WalletOperation | null> {
  const { data: result, error } = await supabase.from('wallet_operations').update(data).eq('id', id).select().single();
  if (error) return handleError(error, null);
  return result;
}

export async function deleteWalletOperation(id: string): Promise<boolean> {
  const { error } = await supabase.from('wallet_operations').delete().eq('id', id);
  if (error) return handleError(error, false);
  return true;
}

export async function walletOperation(type: string, walletId: string, amount: number): Promise<WalletOperation | null> {
  return createWalletOperation({ operation_type: type, wallet_id: walletId, amount, status: 'pending' });
}

// ─── STATS ───

export async function getWalletStats(): Promise<any> {
  const { count: accounts } = await supabase.from('wallet_accounts').select('*', { count: 'exact', head: true });
  const { count: transactions } = await supabase.from('wallet_transactions').select('*', { count: 'exact', head: true });
  const { count: agents } = await supabase.from('wallet_agents').select('*', { count: 'exact', head: true });
  const { count: partners } = await supabase.from('wallet_partners').select('*', { count: 'exact', head: true });
  return { accounts, transactions, agents, partners };
}
