import { supabase } from '@/lib/supabase/client'
import { BankReconciliation } from '../types/payments.types'

export async function fetchReconciliations(accountId?: string): Promise<BankReconciliation[]> {
  let q = supabase.from('treasury_bank_reconciliations').select('*').order('created_at', { ascending: false })
  if (accountId) q = q.eq('tsa_account_id', accountId)
  const { data, error } = await q
  if (error) throw error
  return data || []
}

export async function createReconciliation(rec: Omit<BankReconciliation, 'id' | 'created_at'>): Promise<BankReconciliation> {
  const { data, error } = await supabase.from('treasury_bank_reconciliations').insert(rec).select().single()
  if (error) throw error
  return data
}

export async function resolveReconciliation(id: string, resolverId: string): Promise<void> {
  const { error } = await supabase.from('treasury_bank_reconciliations').update({
    status: 'resolved', reconciled_by: resolverId, reconciled_at: new Date().toISOString()
  }).eq('id', id)
  if (error) throw error
}
