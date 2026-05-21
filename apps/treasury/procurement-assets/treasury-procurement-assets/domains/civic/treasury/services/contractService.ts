import { supabase } from '@/lib/supabase/client'
import { TreasuryContract } from '../types/procurement.types'

export async function fetchContracts(): Promise<TreasuryContract[]> {
  const { data, error } = await supabase.from('treasury_contracts').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function createContract(contract: Omit<TreasuryContract, 'id' | 'payment_progress' | 'time_progress' | 'created_at'>): Promise<TreasuryContract> {
  const { data, error } = await supabase.from('treasury_contracts').insert({ ...contract, payment_progress: 0, time_progress: 0 }).select().single()
  if (error) throw error
  return data
}

export async function updateContractProgress(id: string, paymentProgress: number, timeProgress: number): Promise<void> {
  const { error } = await supabase.from('treasury_contracts').update({ payment_progress: paymentProgress, time_progress: timeProgress }).eq('id', id)
  if (error) throw error
}

export async function ratePerformance(id: string, rating: number): Promise<void> {
  const { error } = await supabase.from('treasury_contracts').update({ performance_rating: rating }).eq('id', id)
  if (error) throw error
}

export async function updateContractStatus(id: string, status: TreasuryContract['status']): Promise<void> {
  const { error } = await supabase.from('treasury_contracts').update({ status }).eq('id', id)
  if (error) throw error
}
