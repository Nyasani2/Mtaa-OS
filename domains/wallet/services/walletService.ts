// @ts-nocheck
import { supabase } from '@/lib/supabase';
import type { WalletAccount, WalletTransaction } from '@/types/database.types';

export async function getWallet(userId: string): Promise<WalletAccount | null> {
  const { data, error } = await supabase
    .from("wallet_accounts")
    .select('*')
    .eq('user_id', userId)
    .eq('is_default', true)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data as WalletAccount | null;
}

export async function getBalance(userId: string, currency = 'KES') {
  const wallet = await getWallet(userId);
  if (!wallet) return { available: 0, pending: 0, hold: 0, total: 0, currency, wallet_id: '' };
  
  return {
    available: wallet.available_balance || 0,
    hold: wallet.hold_balance || 0,
    total: wallet.balance || 0,
    currency: wallet.currency || currency,
    wallet_id: wallet.id,
  };
}

export async function getTransactions(userId: string, limit = 50): Promise<WalletTransaction[]> {
  const { data, error } = await supabase
    .from('wallet_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data || []) as WalletTransaction[];
}

// Legacy wrapper for UI components that haven't migrated to RPCs yet
export async function sendMoneyLegacy(senderId: string, recipientId: string, amount: number, currency: string, description: string) {
  // In production, replace this with a call to an RPC like `mtaa_atomic_transfer`
  const senderWallet = await getWallet(senderId);
  if (!senderWallet || senderWallet.available_balance < amount) {
    return { success: false, error: 'Insufficient balance' };
  }

  const recipientWallet = await getWallet(recipientId);
  if (!recipientWallet) return { success: false, error: 'Recipient not found' };

  // Debit Sender
  await supabase.rpc('mtaa_wallet_debit', {
    p_user_id: senderId, p_amount: amount, p_currency: currency, p_description: description, p_transaction_type: 'transfer'
  });

  // Credit Recipient
  await supabase.rpc('mtaa_wallet_credit', {
    p_user_id: recipientId, p_amount: amount, p_currency: currency, p_description: `Received: ${description}`, p_transaction_type: 'transfer'
  });

  return { success: true };
}
