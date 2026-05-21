import { supabase } from '@/lib/supabase/client'
import { BudgetAllocation } from '../types/budget.types'

export async function fetchAllocations(cycleId?: string): Promise<BudgetAllocation[]> {
  let q = supabase.from('treasury_budget_allocations').select('*')
  if (cycleId) q = q.eq('cycle_id', cycleId)
  const { data, error } = await q.order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function fetchAllocation(id: string): Promise<BudgetAllocation> {
  const { data, error } = await supabase
    .from('treasury_budget_allocations')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function createAllocation(allocation: Omit<BudgetAllocation, 'id' | 'available_balance' | 'utilization_rate' | 'created_at'>): Promise<BudgetAllocation> {
  const { data, error } = await supabase
    .from('treasury_budget_allocations')
    .insert(allocation)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function reviseAllocation(id: string, revisedAmount: number): Promise<void> {
  const { error } = await supabase
    .from('treasury_budget_allocations')
    .update({ revised_amount: revisedAmount })
    .eq('id', id)
  if (error) throw error
}
