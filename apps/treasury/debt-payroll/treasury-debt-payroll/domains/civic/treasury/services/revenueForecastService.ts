import { supabase } from '@/lib/supabase/client'
import { RevenueForecast } from '../types/debtPayroll.types'

export async function fetchRevenueForecasts(): Promise<RevenueForecast[]> {
  const { data, error } = await supabase.from('treasury_revenue_forecasts').select('*').order('forecast_period', { ascending: false })
  if (error) throw error
  return data || []
}

export async function createRevenueForecast(forecast: Omit<RevenueForecast, 'id' | 'variance' | 'created_at'>): Promise<RevenueForecast> {
  const { data, error } = await supabase.from('treasury_revenue_forecasts').insert(forecast).select().single()
  if (error) throw error
  return data
}

export async function recordActualRevenue(id: string, actualRevenue: number): Promise<void> {
  const { error } = await supabase.from('treasury_revenue_forecasts').update({ actual_revenue: actualRevenue }).eq('id', id)
  if (error) throw error
}
