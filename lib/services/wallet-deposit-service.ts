// wallet-deposit-service.ts — MTAA Bank-to-Wallet Deposit System
import { supabase } from '@/lib/supabase';

const TIMEOUT = 15000;
function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([p, new Promise<T>((_, r) => setTimeout(() => r(new Error(`${label} timeout`)), ms))]);
}

// ─── DEPOSITS ───

export interface WalletDeposit {
  id: string;
  user_id: string | null;
  wallet_id: string | null;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'unclaimed' | 'pending_review';
  description: string;
  reference_type: string;
  reference_id: string;
  metadata: any;
  created_at: string;
  completed_at: string | null;
}

export interface DepositEvent {
  id: string;
  deposit_id: string;
  event_type: string;
  details: any;
  created_at: string;
}

/**
 * Get user's deposit history
 */
export async function getUserDeposits(userId: string, limit = 50): Promise<WalletDeposit[]> {
  const { data, error } = await withTimeout(
    supabase.from('wallet_deposits')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit),
    TIMEOUT, 'getUserDeposits'
  );
  if (error) throw error;
  return (data || []) as WalletDeposit[];
}

/**
 * Get unclaimed deposits for a phone number
 */
export async function getUnclaimedDeposits(phone: string): Promise<WalletDeposit[]> {
  const cleanPhone = phone.replace(/^\+254/, '0').replace(/^254/, '0');
  const { data, error } = await withTimeout(
    supabase.from('wallet_deposits')
      .select('*')
      .eq('status', 'unclaimed')
      .filter('metadata->>sender_phone', 'eq', cleanPhone)
      .order('created_at', { ascending: false }),
    TIMEOUT, 'getUnclaimedDeposits'
  );
  if (error) throw error;
  return (data || []) as WalletDeposit[];
}

/**
 * Claim an unclaimed deposit
 */
export async function claimDeposit(depositId: string, userId: string): Promise<boolean> {
  const { data, error } = await withTimeout(
    supabase.rpc('claim_unclaimed_deposit', { p_deposit_id: depositId, p_user_id: userId }),
    TIMEOUT, 'claimDeposit'
  );
  if (error) {
    console.error('[claimDeposit] Failed:', error);
    throw new Error(`Failed to claim deposit: ${error.message}`);
  }
  return data === true;
}

/**
 * Get deposit events for a specific deposit
 */
export async function getDepositEvents(depositId: string): Promise<DepositEvent[]> {
  const { data, error } = await withTimeout(
    supabase.from('wallet_deposit_events')
      .select('*')
      .eq('deposit_id', depositId)
      .order('created_at', { ascending: true }),
    TIMEOUT, 'getDepositEvents'
  );
  if (error) throw error;
  return (data || []) as DepositEvent[];
}

// ─── WITHDRAWALS ───

export interface WalletWithdrawal {
  id: string;
  user_id: string;
  wallet_id: string;
  amount: number;
  fee: number;
  net_amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  phone_number: string | null;
  till_number: string | null;
  mpesa_receipt: string | null;
  failure_reason: string | null;
  description: string;
  created_at: string;
  completed_at: string | null;
}

/**
 * Request a withdrawal to M-Pesa
 */
export async function requestWithdrawal(
  userId: string,
  amount: number,
  phoneNumber: string
): Promise<WalletWithdrawal> {
  const { data, error } = await withTimeout(
    supabase.functions.invoke('wallet-withdrawal', {
      body: { user_id: userId, amount, phone_number: phoneNumber },
    }),
    TIMEOUT * 2, 'requestWithdrawal'
  );

  if (error || !data?.success) {
    throw new Error(error?.message || data?.error || 'Withdrawal request failed');
  }

  return data as WalletWithdrawal;
}

/**
 * Get user's withdrawal history
 */
export async function getUserWithdrawals(userId: string, limit = 50): Promise<WalletWithdrawal[]> {
  const { data, error } = await withTimeout(
    supabase.from('wallet_withdrawals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit),
    TIMEOUT, 'getUserWithdrawals'
  );
  if (error) throw error;
  return (data || []) as WalletWithdrawal[];
}

/**
 * Cancel a pending withdrawal
 */
export async function cancelWithdrawal(withdrawalId: string): Promise<void> {
  const { error } = await withTimeout(
    supabase.from('wallet_withdrawals')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', withdrawalId)
      .eq('status', 'pending'),
    TIMEOUT, 'cancelWithdrawal'
  );
  if (error) throw error;
}

// ─── TILL NUMBERS ───

export const MTAA_TILL_NUMBERS = ['9767587', '9172229'];

/**
 * Get available till numbers for display
 */
export function getTillNumbers(): { number: string; label: string }[] {
  return [
    { number: '9767587', label: 'MTAA Deposit Till 1' },
    { number: '9172229', label: 'MTAA Deposit Till 2' },
  ];
}
