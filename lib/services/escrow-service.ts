import { supabase } from '@/lib/supabase';

export async function getEscrowTransactions(userId: string) {
  const { data } = await supabase
    .from('escrow_transactions')
    .select('*')
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
    .order('created_at', { ascending: false });
  return data || [];
}

export async function fundEscrow(params: any) {
  const { error } = await supabase.from('escrow_transactions').insert({
    ...params,
    status: 'funded',
  });
  if (error) throw error;
}

export async function releaseEscrow(id: string, reason: string) {
  const { error } = await supabase.from('escrow_transactions').update({
    status: 'released',
    released_at: new Date().toISOString(),
  }).eq('id', id);
  if (error) throw error;
}

export async function disputeEscrow(id: string, reason: string) {
  const { error } = await supabase.from('escrow_transactions').update({
    status: 'disputed',
  }).eq('id', id);
  if (error) throw error;
}
