import { supabase } from '@/lib/supabase/client'
import { ApprovalHierarchy, Delegation } from '../types/budget.types'

export async function fetchApprovalHierarchy(module?: string): Promise<ApprovalHierarchy[]> {
  let q = supabase.from('treasury_approval_hierarchy').select('*').eq('is_active', true)
  if (module) q = q.eq('module', module)
  const { data, error } = await q
  if (error) throw error
  return data || []
}

export async function createApprovalHierarchy(hierarchy: Omit<ApprovalHierarchy, 'id' | 'created_at'>): Promise<ApprovalHierarchy> {
  const { data, error } = await supabase
    .from('treasury_approval_hierarchy')
    .insert(hierarchy)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function fetchDelegations(): Promise<Delegation[]> {
  const { data, error } = await supabase
    .from('treasury_delegations')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function createDelegation(delegation: Omit<Delegation, 'id' | 'created_at'>): Promise<Delegation> {
  const { data, error } = await supabase
    .from('treasury_delegations')
    .insert(delegation)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function toggleDelegation(id: string, isActive: boolean): Promise<void> {
  const { error } = await supabase
    .from('treasury_delegations')
    .update({ is_active: isActive })
    .eq('id', id)
  if (error) throw error
}
