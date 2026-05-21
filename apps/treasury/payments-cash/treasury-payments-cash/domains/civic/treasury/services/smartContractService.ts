import { supabase } from '@/lib/supabase/client'
import { TreasurySmartContract } from '../types/payments.types'

export async function fetchSmartContracts(): Promise<TreasurySmartContract[]> {
  const { data, error } = await supabase.from('treasury_smart_contracts').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function createSmartContract(contract: Omit<TreasurySmartContract, 'id' | 'created_at'>): Promise<TreasurySmartContract> {
  const { data, error } = await supabase.from('treasury_smart_contracts').insert(contract).select().single()
  if (error) throw error
  return data
}

export async function deployContract(id: string, deployerId: string): Promise<void> {
  const { error } = await supabase.from('treasury_smart_contracts').update({
    status: 'deployed', deployed_at: new Date().toISOString(), deployed_by: deployerId
  }).eq('id', id)
  if (error) throw error
}

export async function updateContractStatus(id: string, status: TreasurySmartContract['status']): Promise<void> {
  const { error } = await supabase.from('treasury_smart_contracts').update({ status }).eq('id', id)
  if (error) throw error
}
