import { supabase } from '@/lib/supabase/client'
import { BudgetCommitment, BudgetLiquidation } from '../types/budget.types'

export async function fetchCommitments(warrantId?: string): Promise<BudgetCommitment[]> {
  let q = supabase.from('treasury_budget_commitments').select('*')
  if (warrantId) q = q.eq('warrant_id', warrantId)
  const { data, error } = await q.order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function createCommitment(commitment: Omit<BudgetCommitment, 'id' | 'liquidated_amount' | 'remaining_amount' | 'created_at'>): Promise<BudgetCommitment> {
  const { data, error } = await supabase
    .from('treasury_budget_commitments')
    .insert(commitment)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function liquidateCommitment(liquidation: Omit<BudgetLiquidation, 'id'>): Promise<BudgetLiquidation> {
  const { data, error } = await supabase
    .from('treasury_budget_liquidations')
    .insert(liquidation)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function cancelCommitment(id: string): Promise<void> {
  const { error } = await supabase
    .from('treasury_budget_commitments')
    .update({ status: 'cancelled' })
    .eq('id', id)
  if (error) throw error
}
