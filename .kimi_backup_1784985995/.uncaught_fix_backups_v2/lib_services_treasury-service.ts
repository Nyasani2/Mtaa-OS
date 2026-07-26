/**
 * MTAA OS V10 — Treasury Service
 * Tables: treasury_revenue, treasury_expenditure, treasury_budgets, treasury_transactions, treasury_categories
 */
import { supabase } from '@/lib/supabase/client';

export interface TreasuryRevenue {
  id: string;
  collector_id: string;
  payer_id: string;
  category_id: string | null;
  amount: number;
  currency: string;
  description: string | null;
  reference: string | null;
  status: 'pending' | 'verified' | 'rejected';
  payment_method: string | null;
  created_at: string;
  updated_at: string;
}

export interface TreasuryExpenditure {
  id: string;
  requester_id: string;
  approver_id: string | null;
  category_id: string | null;
  amount: number;
  currency: string;
  description: string;
  justification: string | null;
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'paid';
  created_at: string;
  updated_at: string;
}

export interface TreasuryBudget {
  id: string;
  fiscal_year: string;
  department: string;
  allocated_amount: number;
  spent_amount: number;
  currency: string;
  status: 'active' | 'closed' | 'draft';
  created_at: string;
  updated_at: string;
}

// ── REVENUE ───────────────────────────────────────────────

export async function fetchTreasuryRevenue(options: {
  collectorId?: string;
  payerId?: string;
  status?: string;
  categoryId?: string;
  limit?: number;
  offset?: number;
} = {}) {
  const { collectorId, payerId, status, categoryId, limit = 20, offset = 0 } = options;
  let q = supabase.from('treasury_revenue').select('*');

  if (collectorId) q = q.eq('collector_id', collectorId);
  if (payerId) q = q.eq('payer_id', payerId);
  if (status) q = q.eq('status', status);
  if (categoryId) q = q.eq('category_id', categoryId);

  const { data, error } = await q.order('created_at', { ascending: false }).range(offset, offset + limit - 1);
  if (error) throw error;
  return (data ?? []) as TreasuryRevenue[];
}

export async function createTreasuryRevenue(payload: Partial<TreasuryRevenue>) {
  const { data, error } = await supabase.from('treasury_revenue').insert(payload).select().single();
  if (error) throw error;
  return data as TreasuryRevenue;
}

export async function verifyRevenue(id: string, approverId: string) {
  const { data, error } = await supabase
    .from('treasury_revenue')
    .update({ status: 'verified', updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as TreasuryRevenue;
}

// ── EXPENDITURE ───────────────────────────────────────────

export async function fetchTreasuryExpenditure(options: {
  requesterId?: string;
  approverId?: string;
  status?: string;
  limit?: number;
  offset?: number;
} = {}) {
  const { requesterId, approverId, status, limit = 20, offset = 0 } = options;
  let q = supabase.from('treasury_expenditure').select('*');

  if (requesterId) q = q.eq('requester_id', requesterId);
  if (approverId) q = q.eq('approver_id', approverId);
  if (status) q = q.eq('status', status);

  const { data, error } = await q.order('created_at', { ascending: false }).range(offset, offset + limit - 1);
  if (error) throw error;
  return (data ?? []) as TreasuryExpenditure[];
}

export async function createExpenditureRequest(payload: Partial<TreasuryExpenditure>) {
  const { data, error } = await supabase.from('treasury_expenditure').insert(payload).select().single();
  if (error) throw error;
  return data as TreasuryExpenditure;
}

export async function approveExpenditure(id: string, approverId: string) {
  const { data, error } = await supabase
    .from('treasury_expenditure')
    .update({ status: 'approved', approver_id: approverId, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as TreasuryExpenditure;
}

export async function rejectExpenditure(id: string, approverId: string) {
  const { data, error } = await supabase
    .from('treasury_expenditure')
    .update({ status: 'rejected', approver_id: approverId, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as TreasuryExpenditure;
}

// ── BUDGETS ────────────────────────────────────────────────

export async function fetchTreasuryBudgets(fiscalYear?: string) {
  let q = supabase.from('treasury_budgets').select('*');
  if (fiscalYear) q = q.eq('fiscal_year', fiscalYear);
  const { data, error } = await q.order('department');
  if (error) throw error;
  return (data ?? []) as TreasuryBudget[];
}

export async function createTreasuryBudget(payload: Partial<TreasuryBudget>) {
  const { data, error } = await supabase.from('treasury_budgets').insert(payload).select().single();
  if (error) throw error;
  return data as TreasuryBudget;
}

// ── CATEGORIES ────────────────────────────────────────────

export async function fetchTreasuryCategories() {
  const { data, error } = await supabase.from('treasury_categories').select('*').order('name');
  if (error) throw error;
  return data ?? [];
}
