import { supabase } from '@/lib/supabase/client';

export interface TaxRevenue {
  id: string;
  revenue_stream: string;
  amount: number;
  currency: string;
  period_start: string;
  period_end: string;
  collected_by: string;
  collection_date: string;
  region: string | null;
  status: 'projected' | 'collected' | 'disbursed';
  notes: string | null;
  created_at: string;
}

export interface TaxPayment {
  id: string;
  taxpayer_id: string;
  tax_type: string;
  amount: number;
  currency: string;
  period: string;
  due_date: string;
  paid_date: string | null;
  status: 'pending' | 'paid' | 'overdue' | 'waived';
  payment_method: string | null;
  reference_number: string | null;
  penalties: number;
  created_at: string;
}

export interface TaxRecord {
  id: string;
  taxpayer_id: string;
  tax_year: number;
  tax_type: string;
  declared_income: number;
  assessed_tax: number;
  paid_amount: number;
  balance: number;
  status: 'filed' | 'under_review' | 'assessed' | 'paid' | 'disputed';
  filed_at: string;
  assessed_at: string | null;
  created_at: string;
}

export interface TaxLiability {
  id: string;
  taxpayer_id: string;
  tax_type: string;
  amount: number;
  currency: string;
  period: string;
  due_date: string;
  status: 'active' | 'settled' | 'disputed' | 'waived';
  created_at: string;
}

export async function getTaxRevenue(filters?: {
  stream?: string;
  status?: string;
  region?: string;
  startDate?: string;
  endDate?: string;
}): Promise<TaxRevenue[]> {
  let query = supabase
    .from('regulatory_tax_revenue')
    .select('*')
    .order('collection_date', { ascending: false });

  if (filters?.stream) query = query.eq('revenue_stream', filters.stream);
  if (filters?.status) query = query.eq('status', filters.status);
  if (filters?.region) query = query.eq('region', filters.region);
  if (filters?.startDate) query = query.gte('collection_date', filters.startDate);
  if (filters?.endDate) query = query.lte('collection_date', filters.endDate);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getTaxPayments(taxpayerId?: string): Promise<TaxPayment[]> {
  let query = supabase
    .from('regulatory_tax_payments')
    .select('*')
    .order('due_date', { ascending: true });

  if (taxpayerId) {
    query = query.eq('taxpayer_id', taxpayerId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function makeTaxPayment(paymentId: string, paymentData: {
  paid_date: string;
  payment_method: string;
  reference_number: string;
}): Promise<void> {
  const { error } = await supabase
    .from('regulatory_tax_payments')
    .update({
      ...paymentData,
      status: 'paid',
    })
    .eq('id', paymentId);

  if (error) throw error;
}

export async function getTaxRecords(taxpayerId?: string): Promise<TaxRecord[]> {
  let query = supabase
    .from('tax_records')
    .select('*')
    .order('tax_year', { ascending: false });

  if (taxpayerId) {
    query = query.eq('taxpayer_id', taxpayerId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getTaxLiabilities(taxpayerId?: string): Promise<TaxLiability[]> {
  let query = supabase
    .from('tax_liabilities')
    .select('*')
    .eq('status', 'active')
    .order('due_date', { ascending: true });

  if (taxpayerId) {
    query = query.eq('taxpayer_id', taxpayerId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getTaxReports(): Promise<any[]> {
  const { data, error } = await supabase
    .from('tax_reports')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getTaxStatements(taxpayerId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('tax_statements')
    .select('*')
    .eq('taxpayer_id', taxpayerId)
    .order('period', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getTaxTransactions(taxpayerId?: string): Promise<any[]> {
  let query = supabase
    .from('tax_transactions')
    .select('*')
    .order('created_at', { ascending: false });

  if (taxpayerId) {
    query = query.eq('taxpayer_id', taxpayerId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}
