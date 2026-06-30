// lib/services/treasury-service.ts
// Treasury Service -- integrates with treasury-router edge function
// v1.0: Revenue collection, expenditure tracking, budget monitoring

import { supabase } from '@/lib/supabase';

export interface TreasuryRevenue {
  id: string;
  source: string;
  amount: number;
  currency: string;
  collected_at: string;
  status: 'pending' | 'confirmed' | 'reconciled';
  metadata?: Record<string, any>;
}

export interface TreasuryExpenditure {
  id: string;
  category: string;
  amount: number;
  description: string;
  spent_at: string;
  approved_by?: string;
  status: 'pending' | 'approved' | 'spent' | 'reconciled';
}

export interface TreasuryBudget {
  id: string;
  fiscal_year: number;
  department: string;
  allocated: number;
  spent: number;
  remaining: number;
  currency: string;
}

export async function getTreasuryDashboard() {
  const { data, error } = await supabase.functions.invoke('treasury-router', {
    body: { action: 'dashboard' },
  });
  if (error) throw error;
  return data;
}

export async function getRevenueCollections(params?: { startDate?: string; endDate?: string; limit?: number }) {
  const { data, error } = await supabase.functions.invoke('treasury-router', {
    body: { action: 'revenue_collections', ...params },
  });
  if (error) throw error;
  return data as { collections: TreasuryRevenue[]; total: number };
}

export async function getExpenditures(params?: { category?: string; status?: string; limit?: number }) {
  const { data, error } = await supabase.functions.invoke('treasury-router', {
    body: { action: 'expenditures', ...params },
  });
  if (error) throw error;
  return data as { expenditures: TreasuryExpenditure[]; total: number };
}

export async function getBudgets(fiscalYear?: number) {
  const { data, error } = await supabase.functions.invoke('treasury-router', {
    body: { action: 'budgets', fiscalYear },
  });
  if (error) throw error;
  return data as { budgets: TreasuryBudget[] };
}

export async function recordRevenue(payload: {
  source: string;
  amount: number;
  currency?: string;
  metadata?: Record<string, any>;
}) {
  const { data, error } = await supabase.functions.invoke('treasury-router', {
    body: { action: 'record_revenue', ...payload },
  });
  if (error) throw error;
  return data;
}

export async function requestExpenditure(payload: {
  category: string;
  amount: number;
  description: string;
  requested_by: string;
}) {
  const { data, error } = await supabase.functions.invoke('treasury-router', {
    body: { action: 'request_expenditure', ...payload },
  });
  if (error) throw error;
  return data;
}

export async function getPlatformFees() {
  const { data, error } = await supabase
    .from('platform_fees')
    .select('*')
    .eq('active', true);
  if (error) throw error;
  return data;
}

export async function getMtaaTreasury() {
  const { data, error } = await supabase
    .from('mtaa_treasury')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  if (error) throw error;
  return data;
}

export async function getTreasuryRevenueCollectionsDirect(limit = 50) {
  const { data, error } = await supabase
    .from('treasury_revenue_collections')
    .select('*')
    .order('collected_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data as TreasuryRevenue[];
}

export async function getTreasuryExpendituresDirect(limit = 50) {
  const { data, error } = await supabase
    .from('treasury_expenditures')
    .select('*')
    .order('spent_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data as TreasuryExpenditure[];
}

export async function getTreasuryBudgetsDirect(fiscalYear?: number) {
  let q = supabase
    .from('treasury_budgets')
    .select('*')
    .order('fiscal_year', { ascending: false });
  if (fiscalYear) q = q.eq('fiscal_year', fiscalYear);
  const { data, error } = await q;
  if (error) throw error;
  return data as TreasuryBudget[];
}
