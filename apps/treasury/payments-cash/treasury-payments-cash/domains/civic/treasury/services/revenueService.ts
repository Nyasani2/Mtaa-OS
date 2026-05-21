import { supabase } from '@/lib/supabase/client'
import { RevenueCollection } from '../types/payments.types'

export async function fetchRevenueCollections(source?: string): Promise<RevenueCollection[]> {
  let q = supabase.from('treasury_revenue_collections').select('*').order('collection_date', { ascending: false })
  if (source) q = q.eq('source', source)
  const { data, error } = await q
  if (error) throw error
  return data || []
}

export async function createRevenueCollection(rev: Omit<RevenueCollection, 'id' | 'created_at'>): Promise<RevenueCollection> {
  const { data, error } = await supabase.from('treasury_revenue_collections').insert(rev).select().single()
  if (error) throw error
  return data
}

export async function confirmRevenueCollection(id: string): Promise<void> {
  const { error } = await supabase.from('treasury_revenue_collections').update({
    status: 'confirmed', confirmed_at: new Date().toISOString()
  }).eq('id', id)
  if (error) throw error
}
