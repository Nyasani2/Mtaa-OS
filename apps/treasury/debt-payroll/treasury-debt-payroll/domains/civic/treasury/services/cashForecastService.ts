import { supabase } from '@/lib/supabase/client'
import { CashForecast } from '../types/debtPayroll.types'

export async function fetchCashForecasts(): Promise<CashForecast[]> {
  const { data, error } = await supabase.from('treasury_cash_forecasts').select('*').order('forecast_period', { ascending: false })
  if (error) throw error
  return data || []
}

export async function createCashForecast(forecast: Omit<CashForecast, 'id' | 'variance' | 'variance_percentage' | 'created_at'>): Promise<CashForecast> {
  const { data, error } = await supabase.from('treasury_cash_forecasts').insert(forecast).select().single()
  if (error) throw error
  return data
}

export async function recordActualClosing(id: string, actualBalance: number): Promise<void> {
  const { error } = await supabase.from('treasury_cash_forecasts').update({ actual_closing_balance: actualBalance }).eq('id', id)
  if (error) throw error
}
