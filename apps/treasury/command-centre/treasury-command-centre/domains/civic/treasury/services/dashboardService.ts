import { supabase } from '@/lib/supabase/client'
import { TreasuryDashboard, TreasuryAlert, TreasuryTransaction } from '../types/command.types'

export async function fetchDashboardMetrics(): Promise<TreasuryDashboard> {
  const { data: budget, error: bErr } = await supabase
    .from('treasury_budget_cycles')
    .select('total_approved_amount')
    .eq('status', 'active')
    .single()
  if (bErr) throw bErr

  const { data: exp, error: eErr } = await supabase
    .from('treasury_expenditures')
    .select('amount')
    .eq('status', 'paid')
  if (eErr) throw eErr

  const { data: rev, error: rErr } = await supabase
    .from('treasury_revenue_collections')
    .select('amount')
    .eq('status', 'confirmed')
  if (rErr) throw rErr

  const { data: alerts, error: aErr } = await supabase
    .from('treasury_alerts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5)
  if (aErr) throw aErr

  const { data: txns, error: tErr } = await supabase
    .from('treasury_transactions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10)
  if (tErr) throw tErr

  const totalExp = (exp || []).reduce((s, r) => s + (r.amount || 0), 0)
  const totalRev = (rev || []).reduce((s, r) => s + (r.amount || 0), 0)

  return {
    total_budget: budget?.total_approved_amount || 0,
    total_expenditure: totalExp,
    total_revenue: totalRev,
    cash_balance: totalRev - totalExp,
    pending_approvals: 0,
    alerts: alerts || [],
    recent_transactions: txns || []
  }
}

export async function fetchAlerts(): Promise<TreasuryAlert[]> {
  const { data, error } = await supabase
    .from('treasury_alerts')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function dismissAlert(alertId: string): Promise<void> {
  const { error } = await supabase
    .from('treasury_alerts')
    .update({ dismissed: true, dismissed_at: new Date().toISOString() })
    .eq('id', alertId)
  if (error) throw error
}

export async function fetchTransactions(limit = 50): Promise<TreasuryTransaction[]> {
  const { data, error } = await supabase
    .from('treasury_transactions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data || []
}
