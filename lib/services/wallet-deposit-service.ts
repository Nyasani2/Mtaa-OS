import { supabase } from '@/lib/supabase';
import { withTimeout } from '@/lib/hooks/withTimeout';
const QUERY_TIMEOUT = 10000;
export async function getDeposits(userId: string, limit: number = 20) {
  const query = supabase.from('wallet_deposits').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(limit).then(r => r);
  const { data, error } = await withTimeout(query, QUERY_TIMEOUT, 'getDeposits');
  if (error) throw error; return data;
}
export async function getDepositsByPhone(phone: string, limit: number = 20) {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const query = supabase.from('wallet_deposits').select('*').filter('metadata->>sender_phone', 'eq', cleanPhone).order('created_at', { ascending: false }).limit(limit).then(r => r);
  const { data, error } = await withTimeout(query, QUERY_TIMEOUT, 'getDepositsByPhone');
  if (error) throw error; return data;
}
export async function claimUnclaimedDeposit(depositId: string, userId: string) {
  const query = supabase.rpc('claim_unclaimed_deposit', { p_deposit_id: depositId, p_user_id: userId }).then(r => r);
  const { data, error } = await withTimeout(query, QUERY_TIMEOUT, 'claimDeposit');
  if (error) throw error; return data;
}
export async function getDepositEvents(depositId: string) {
  const query = supabase.from('wallet_deposit_events').select('*').eq('deposit_id', depositId).order('created_at', { ascending: true }).then(r => r);
  const { data, error } = await withTimeout(query, QUERY_TIMEOUT, 'getDepositEvents');
  if (error) throw error; return data;
}
export async function getWithdrawals(userId: string, limit: number = 20) {
  const query = supabase.from('wallet_withdrawals').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(limit).then(r => r);
  const { data, error } = await withTimeout(query, QUERY_TIMEOUT, 'getWithdrawals');
  if (error) throw error; return data;
}
export async function cancelWithdrawal(withdrawalId: string) {
  const query = supabase.from('wallet_withdrawals').update({ status: 'cancelled', updated_at: new Date().toISOString() }).eq('id', withdrawalId).eq('status', 'pending').then(r => r);
  const { error } = await withTimeout(query, QUERY_TIMEOUT, 'cancelWithdrawal');
  if (error) throw error; return true;
}
