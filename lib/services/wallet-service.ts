import { supabase } from '@/lib/supabase';

export async function getWalletTransactions(userId: string) {
  const { data } = await supabase
    .from('wallet_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);
  return data || [];
}

export async function depositToWallet(userId: string, amount: number, description?: string, metadata?: any, method?: string) {
  const { error } = await supabase.from('wallet_transactions').insert({
    user_id: userId,
    amount,
    type: 'credit',
    status: 'completed',
    description: description || `Deposit via ${method || 'unknown'}`,
    currency: 'KES',
    metadata: metadata || {},
  });
  return !error;
}
