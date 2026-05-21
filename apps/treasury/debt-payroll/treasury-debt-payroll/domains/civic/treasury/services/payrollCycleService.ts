import { supabase } from '@/lib/supabase/client'
import { PayrollCycle } from '../types/debtPayroll.types'

export async function fetchPayrollCycles(): Promise<PayrollCycle[]> {
  const { data, error } = await supabase.from('treasury_payroll_cycles').select('*').order('period_start', { ascending: false })
  if (error) throw error
  return data || []
}

export async function createPayrollCycle(cycle: Omit<PayrollCycle, 'id' | 'total_gross_pay' | 'total_deductions' | 'total_net_pay' | 'employee_count' | 'created_at'>): Promise<PayrollCycle> {
  const { data, error } = await supabase.from('treasury_payroll_cycles').insert(cycle).select().single()
  if (error) throw error
  return data
}

export async function updatePayrollStatus(id: string, status: PayrollCycle['status']): Promise<void> {
  const updates: Record<string, string> = { status }
  if (status === 'paid') updates.paid_at = new Date().toISOString()
  const { error } = await supabase.from('treasury_payroll_cycles').update(updates).eq('id', id)
  if (error) throw error
}

export async function reversePayroll(id: string): Promise<void> {
  const { error } = await supabase.from('treasury_payroll_cycles').update({ status: 'reversed' }).eq('id', id)
  if (error) throw error
}
