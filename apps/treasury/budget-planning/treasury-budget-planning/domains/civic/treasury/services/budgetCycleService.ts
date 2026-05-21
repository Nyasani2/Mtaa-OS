import { supabase } from '@/lib/supabase/client'
import { BudgetCycle } from '../types/budget.types'

export async function fetchBudgetCycles(): Promise<BudgetCycle[]> {
  const { data, error } = await supabase
    .from('treasury_budget_cycles')
    .select('*')
    .order('fiscal_year', { ascending: false })
  if (error) throw error
  return data || []
}

export async function fetchBudgetCycle(id: string): Promise<BudgetCycle> {
  const { data, error } = await supabase
    .from('treasury_budget_cycles')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function createBudgetCycle(cycle: Omit<BudgetCycle, 'id' | 'created_at' | 'updated_at'>): Promise<BudgetCycle> {
  const { data, error } = await supabase
    .from('treasury_budget_cycles')
    .insert(cycle)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateBudgetCycleStatus(id: string, status: BudgetCycle['status']): Promise<void> {
  const { error } = await supabase
    .from('treasury_budget_cycles')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

export async function closeBudgetCycle(id: string): Promise<void> {
  const { error } = await supabase
    .from('treasury_budget_cycles')
    .update({ status: 'closed', updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}
