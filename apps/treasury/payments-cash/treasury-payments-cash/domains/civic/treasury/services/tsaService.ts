import { supabase } from '@/lib/supabase/client'
import { TsaAccount, TsaTransaction } from '../types/payments.types'

export async function fetchTsaAccounts(): Promise<TsaAccount[]> {
  const { data, error } = await supabase.from('treasury_tsa_accounts').select('*').order('account_name')
  if (error) throw error
  return data || []
}

export async function fetchTsaAccount(id: string): Promise<TsaAccount> {
  const { data, error } = await supabase.from('treasury_tsa_accounts').select('*').eq('id', id).single()
  if (error) throw error
  return data
}

export async function fetchTsaTransactions(accountId?: string): Promise<TsaTransaction[]> {
  let q = supabase.from('treasury_tsa_transactions').select('*').order('transaction_date', { ascending: false })
  if (accountId) q = q.eq('account_id', accountId)
  const { data, error } = await q
  if (error) throw error
  return data || []
}

export async function createTsaTransaction(txn: Omit<TsaTransaction, 'id' | 'created_at'>): Promise<TsaTransaction> {
  const { data, error } = await supabase.from('treasury_tsa_transactions').insert(txn).select().single()
  if (error) throw error
  return data
}
