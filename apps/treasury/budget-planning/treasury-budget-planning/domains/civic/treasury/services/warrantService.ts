import { supabase } from '@/lib/supabase/client'
import { BudgetWarrant } from '../types/budget.types'

export async function fetchWarrants(allocationId?: string): Promise<BudgetWarrant[]> {
  let q = supabase.from('treasury_budget_warrants').select('*')
  if (allocationId) q = q.eq('allocation_id', allocationId)
  const { data, error } = await q.order('issued_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function issueWarrant(warrant: Omit<BudgetWarrant, 'id' | 'spent_amount' | 'remaining_amount' | 'issued_at'>): Promise<BudgetWarrant> {
  const { data, error } = await supabase
    .from('treasury_budget_warrants')
    .insert({ ...warrant, issued_at: new Date().toISOString() })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function cancelWarrant(id: string): Promise<void> {
  const { error } = await supabase
    .from('treasury_budget_warrants')
    .update({ status: 'cancelled' })
    .eq('id', id)
  if (error) throw error
}

export async function checkWarrantExpiry(): Promise<void> {
  await supabase.rpc('check_warrant_expiry')
}
