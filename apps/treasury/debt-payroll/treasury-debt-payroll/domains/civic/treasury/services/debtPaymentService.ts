import { supabase } from '@/lib/supabase/client'
import { DebtPayment } from '../types/debtPayroll.types'

export async function fetchUpcomingPayments(days = 90): Promise<DebtPayment[]> {
  const future = new Date()
  future.setDate(future.getDate() + days)
  const { data, error } = await supabase
    .from('treasury_debt_payments')
    .select('*, treasury_debt_instruments(creditor_name, instrument_type)')
    .eq('status', 'scheduled')
    .lte('payment_date', future.toISOString())
    .order('payment_date')
  if (error) throw error
  return data || []
}

export async function recordPayment(paymentId: string): Promise<void> {
  const { error } = await supabase.from('treasury_debt_payments').update({
    status: 'paid', paid_at: new Date().toISOString()
  }).eq('id', paymentId)
  if (error) throw error
}

export async function waivePayment(paymentId: string): Promise<void> {
  const { error } = await supabase.from('treasury_debt_payments').update({ status: 'waived' }).eq('id', paymentId)
  if (error) throw error
}
