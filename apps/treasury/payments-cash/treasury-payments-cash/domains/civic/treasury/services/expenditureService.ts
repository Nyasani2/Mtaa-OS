import { supabase } from '@/lib/supabase/client'
import { TreasuryExpenditure } from '../types/payments.types'

export async function fetchExpenditures(status?: string): Promise<TreasuryExpenditure[]> {
  let q = supabase.from('treasury_expenditures').select('*')
  if (status) q = q.eq('status', status)
  const { data, error } = await q.order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function fetchExpenditure(id: string): Promise<TreasuryExpenditure> {
  const { data, error } = await supabase.from('treasury_expenditures').select('*').eq('id', id).single()
  if (error) throw error
  return data
}

export async function createExpenditure(exp: Omit<TreasuryExpenditure, 'id' | 'created_at'>): Promise<TreasuryExpenditure> {
  const { data, error } = await supabase.from('treasury_expenditures').insert(exp).select().single()
  if (error) throw error
  return data
}

export async function approveExpenditure(id: string, approverId: string): Promise<void> {
  const { error } = await supabase.from('treasury_expenditures').update({
    status: 'approved', approved_by: approverId
  }).eq('id', id)
  if (error) throw error
}

export async function processExpenditure(id: string): Promise<void> {
  const { error } = await supabase.from('treasury_expenditures').update({
    status: 'processed', processed_at: new Date().toISOString()
  }).eq('id', id)
  if (error) throw error
}

export async function markPaid(id: string): Promise<void> {
  const { error } = await supabase.from('treasury_expenditures').update({
    status: 'paid', paid_at: new Date().toISOString()
  }).eq('id', id)
  if (error) throw error
}
