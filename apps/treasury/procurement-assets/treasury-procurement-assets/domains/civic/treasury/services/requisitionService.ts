import { supabase } from '@/lib/supabase/client'
import { ProcurementRequisition } from '../types/procurement.types'

export async function fetchRequisitions(): Promise<ProcurementRequisition[]> {
  const { data, error } = await supabase.from('treasury_procurement_requisitions').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function createRequisition(req: Omit<ProcurementRequisition, 'id' | 'status' | 'created_at'>): Promise<ProcurementRequisition> {
  const { data, error } = await supabase.from('treasury_procurement_requisitions').insert({ ...req, status: 'draft' }).select().single()
  if (error) throw error
  return data
}

export async function submitRequisition(id: string): Promise<void> {
  const { error } = await supabase.from('treasury_procurement_requisitions').update({
    status: 'submitted', submitted_at: new Date().toISOString()
  }).eq('id', id)
  if (error) throw error
}

export async function approveRequisition(id: string, approverId: string): Promise<void> {
  const { error } = await supabase.from('treasury_procurement_requisitions').update({
    status: 'approved', approved_at: new Date().toISOString(), approved_by: approverId
  }).eq('id', id)
  if (error) throw error
}

export async function convertToTender(id: string): Promise<void> {
  const { error } = await supabase.from('treasury_procurement_requisitions').update({ status: 'converted_to_tender' }).eq('id', id)
  if (error) throw error
}
