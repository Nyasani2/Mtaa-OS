// lib/services/escrow-service.ts
// Escrow Service -- integrates with wallet-operations edge function
// v1.0: Buyer-seller escrow with fund/release/dispute flow

import { supabase } from '@/lib/supabase';

export interface EscrowTransaction {
  id: string;
  booking_id?: string;
  payer_id: string;
  payee_id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'funded' | 'released' | 'disputed' | 'refunded';
  description?: string;
  created_at: string;
  released_at?: string;
  milestone_id?: string;
}

export interface EscrowAccount {
  id: string;
  user_id: string;
  balance: number;
  currency: string;
  is_active: boolean;
}

export async function fundEscrow(payload: {
  recipient_id: string;
  amount: number;
  currency?: string;
  description?: string;
  booking_id?: string;
}) {
  const { data, error } = await supabase.functions.invoke('wallet-operations', {
    body: { action: 'escrow_fund', ...payload },
  });
  if (error) throw error;
  return data;
}

export async function releaseEscrow(escrowId: string, releaseNote?: string) {
  const { data, error } = await supabase.functions.invoke('wallet-operations', {
    body: { action: 'escrow_release', escrow_id: escrowId, release_note: releaseNote },
  });
  if (error) throw error;
  return data;
}

export async function disputeEscrow(escrowId: string, reason: string) {
  const { data, error } = await supabase.functions.invoke('wallet-operations', {
    body: { action: 'escrow_dispute', escrow_id: escrowId, reason },
  });
  if (error) throw error;
  return data;
}

export async function getEscrowHistory(userId: string) {
  const { data, error } = await supabase.functions.invoke('wallet-operations', {
    body: { action: 'escrow_history', user_id: userId },
  });
  if (error) throw error;
  return data as { transactions: EscrowTransaction[] };
}

export async function getEscrowTransactions(userId: string, role: 'payer' | 'payee' = 'payer') {
  const column = role === 'payer' ? 'payer_id' : 'payee_id';
  const { data, error } = await supabase
    .from('escrow_transactions')
    .select('*')
    .eq(column, userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as EscrowTransaction[];
}

export async function getEscrowAccounts(userId: string) {
  const { data, error } = await supabase
    .from('escrow_accounts')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true);
  if (error) throw error;
  return data as EscrowAccount[];
}

export async function getEscrowById(escrowId: string) {
  const { data, error } = await supabase
    .from('escrow_transactions')
    .select('*')
    .eq('id', escrowId)
    .maybeSingle();
  if (error) throw error;
  return data as EscrowTransaction;
}

export async function getEscrowMilestones(escrowId: string) {
  const { data, error } = await supabase
    .from('escrow_milestones')
    .select('*')
    .eq('escrow_id', escrowId)
    .order('sequence_order', { ascending: true });
  if (error) throw error;
  return data;
}
