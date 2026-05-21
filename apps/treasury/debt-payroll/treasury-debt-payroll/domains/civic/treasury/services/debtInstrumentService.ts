import { supabase } from '@/lib/supabase/client'
import { DebtInstrument, DebtPayment } from '../types/debtPayroll.types'

export async function fetchDebtInstruments(): Promise<DebtInstrument[]> {
  const { data, error } = await supabase.from('treasury_debt_instruments').select('*').order('maturity_date')
  if (error) throw error
  return data || []
}

export async function fetchDebtInstrument(id: string): Promise<DebtInstrument> {
  const { data, error } = await supabase.from('treasury_debt_instruments').select('*').eq('id', id).single()
  if (error) throw error
  return data
}

export async function createDebtInstrument(inst: Omit<DebtInstrument, 'id' | 'outstanding_principal' | 'total_interest_paid' | 'created_at'>): Promise<DebtInstrument> {
  const { data, error } = await supabase.from('treasury_debt_instruments').insert(inst).select().single()
  if (error) throw error
  return data
}

export async function updateDebtStatus(id: string, status: DebtInstrument['status']): Promise<void> {
  const { error } = await supabase.from('treasury_debt_instruments').update({ status }).eq('id', id)
  if (error) throw error
}

export async function fetchDebtPayments(instrumentId: string): Promise<DebtPayment[]> {
  const { data, error } = await supabase.from('treasury_debt_payments').select('*').eq('instrument_id', instrumentId).order('payment_date')
  if (error) throw error
  return data || []
}

export async function schedulePayments(instrumentId: string): Promise<void> {
  const { error } = await supabase.rpc('schedule_debt_payments', { p_instrument_id: instrumentId })
  if (error) throw error
}
