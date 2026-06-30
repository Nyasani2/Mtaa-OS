// lib/services/tax-service.ts
// Tax Service -- integrates with calculate-tax and process-tax-payment edge functions
// v1.0: Taxpayer registration, liability tracking, payment processing

import { supabase } from '@/lib/supabase';

export interface TaxRecord {
  id: string;
  taxpayer_id: string;
  tax_type: string;
  tax_period: string;
  amount_due: number;
  amount_paid: number;
  balance: number;
  status: 'draft' | 'filed' | 'paid' | 'overdue' | 'waived';
  filed_at?: string;
  due_date: string;
}

export interface Taxpayer {
  id: string;
  user_id: string;
  taxpayer_number: string;
  tax_type: string;
  jurisdiction: string;
  status: 'active' | 'inactive' | 'suspended';
  registered_at: string;
}

export async function calculateTax(payload: {
  module: string;
  amount: number;
  country?: string;
  tax_type?: string;
}) {
  const { data, error } = await supabase.functions.invoke('calculate-tax', {
    body: payload,
  });
  if (error) throw error;
  return data;
}

export async function processTaxPayment(payload: {
  tax_record_id: string;
  amount: number;
  payment_method: 'wallet' | 'mpesa' | 'bank';
  reference?: string;
}) {
  const { data, error } = await supabase.functions.invoke('process-tax-payment', {
    body: payload,
  });
  if (error) throw error;
  return data;
}

export async function generateTaxpayerId(payload: {
  user_id: string;
  tax_type: string;
  jurisdiction?: string;
}) {
  const { data, error } = await supabase.functions.invoke('generate-taxpayer-id', {
    body: payload,
  });
  if (error) throw error;
  return data;
}

export async function getTaxpayerByUser(userId: string) {
  const { data, error } = await supabase
    .from('revenue_taxpayers')
    .select('*')
    .eq('user_id', userId)
    .single();
  if (error) throw error;
  return data as Taxpayer;
}

export async function getTaxRecords(taxpayerId: string) {
  const { data, error } = await supabase
    .from('tax_records')
    .select('*')
    .eq('taxpayer_id', taxpayerId)
    .order('due_date', { ascending: false });
  if (error) throw error;
  return data as TaxRecord[];
}

export async function getTaxLiabilities(userId: string) {
  const { data, error } = await supabase
    .from('tax_liabilities')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function getRevenuePayments(taxpayerId: string) {
  const { data, error } = await supabase
    .from('revenue_payments')
    .select('*')
    .eq('taxpayer_id', taxpayerId)
    .order('paid_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function getPlatformFeesForModule(module: string) {
  const { data, error } = await supabase
    .from('platform_fees')
    .select('*')
    .eq('module', module)
    .eq('active', true)
    .single();
  if (error) throw error;
  return data;
}
