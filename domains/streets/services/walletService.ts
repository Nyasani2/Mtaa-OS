// lib/streets/services/walletService.ts
// MTAA Streets — Wallet Service (delegates to wallet domain, bridges to Streets UI)

import { supabase } from '@/lib/supabase';

export interface WalletTransaction {
  id: string;
  user_id: string;
  type: 'deposit' | 'withdrawal' | 'payment' | 'refund' | 'tip' | 'ad_spend' | 'shop_sale';
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed';
  description: string;
  reference_id?: string;
  created_at: string;
}

export async function fetchWalletBalance(userId: string): Promise<{ balance: number; currency: string }> {
  const { data, error } = await supabase
    .from('wallets')
    .select('balance, currency')
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    return { balance: 0, currency: 'USD' };
  }

  return { balance: data.balance || 0, currency: data.currency || 'USD' };
}

export async function fetchWalletTransactions(
  userId: string,
  page: number = 0,
  limit: number = 20
): Promise<WalletTransaction[]> {
  const { data, error } = await supabase
    .from('wallet_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(page * limit, (page + 1) * limit - 1);

  if (error) throw error;
  return (data || []) as WalletTransaction[];
}

export async function tipUser(
  senderId: string,
  recipientId: string,
  amount: number,
  postId?: string
): Promise<void> {
  const { error } = await supabase.rpc('process_tip', {
    p_sender_id: senderId,
    p_recipient_id: recipientId,
    p_amount: amount,
    p_post_id: postId || null,
  });
  if (error) throw error;
}

export async function deposit(userId: string, amount: number, paymentMethod: string): Promise<void> {
  const { error } = await supabase.rpc('process_deposit', {
    p_user_id: userId,
    p_amount: amount,
    p_payment_method: paymentMethod,
  });
  if (error) throw error;
}

export async function withdraw(userId: string, amount: number, destination: string): Promise<void> {
  const { error } = await supabase.rpc('process_withdrawal', {
    p_user_id: userId,
    p_amount: amount,
    p_destination: destination,
  });
  if (error) throw error;
}
