import { supabase } from '@/lib/supabase/client'
import { PayrollEntry } from '../types/debtPayroll.types'

export async function fetchPayrollEntries(cycleId: string): Promise<PayrollEntry[]> {
  const { data, error } = await supabase.from('treasury_payroll_entries').select('*').eq('cycle_id', cycleId)
  if (error) throw error
  return data || []
}

export async function createPayrollEntry(entry: Omit<PayrollEntry, 'id' | 'gross_pay' | 'total_deductions' | 'net_pay' | 'created_at'>): Promise<PayrollEntry> {
  const { data, error } = await supabase.from('treasury_payroll_entries').insert(entry).select().single()
  if (error) throw error
  return data
}

export async function verifyBiometric(entryId: string): Promise<void> {
  const { error } = await supabase.from('treasury_payroll_entries').update({
    biometric_verified: true, biometric_verified_at: new Date().toISOString()
  }).eq('id', entryId)
  if (error) throw error
}

export async function approveEntry(entryId: string): Promise<void> {
  const { error } = await supabase.from('treasury_payroll_entries').update({ status: 'approved' }).eq('id', entryId)
  if (error) throw error
}
