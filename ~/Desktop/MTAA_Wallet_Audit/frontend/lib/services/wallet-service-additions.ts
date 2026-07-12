import { supabase } from '@/lib/supabase';

export async function getWalletBalance(userId: string) {
  const { data, error } = await supabase
    .from('wallet_balances')
    .select('*')
    .eq('user_id', userId)
    .single();
  if (error) throw error;
  return data;
}

export async function getWalletTransactions(userId: string) {
  const { data, error } = await supabase
    .from('wallet_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function createWalletTransaction(params: any) {
  const { data, error } = await supabase
    .from('wallet_transactions')
    .insert(params)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateWalletBalance(userId: string, amount: number) {
  const { data, error } = await supabase
    .from('wallet_balances')
    .update({ balance: amount, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}
