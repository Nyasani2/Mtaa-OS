import { supabase } from '@/lib/supabase/client'
import { TreasuryTender } from '../types/procurement.types'

export async function fetchTenders(): Promise<TreasuryTender[]> {
  const { data, error } = await supabase.from('treasury_tenders').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function createTender(tender: Omit<TreasuryTender, 'id' | 'bid_count' | 'created_at'>): Promise<TreasuryTender> {
  const { data, error } = await supabase.from('treasury_tenders').insert({ ...tender, bid_count: 0 }).select().single()
  if (error) throw error
  return data
}

export async function publishTender(id: string): Promise<void> {
  const { error } = await supabase.from('treasury_tenders').update({
    status: 'published', publication_date: new Date().toISOString()
  }).eq('id', id)
  if (error) throw error
}

export async function awardTender(id: string): Promise<void> {
  const { error } = await supabase.from('treasury_tenders').update({ status: 'awarded' }).eq('id', id)
  if (error) throw error
}

export async function cancelTender(id: string): Promise<void> {
  const { error } = await supabase.from('treasury_tenders').update({ status: 'cancelled' }).eq('id', id)
  if (error) throw error
}
