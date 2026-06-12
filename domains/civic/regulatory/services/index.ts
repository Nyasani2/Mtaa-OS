import { supabase } from '@/lib/supabase';
import { CountryCode, TaxRevenue, BusinessRegistration, TaxPayment, ComplianceReport } from '../types';

export async function getTaxRevenue(country: CountryCode, period?: string) {
  let q = supabase.from('regulatory_tax_revenue').select('*').eq('country_code', country);
  if (period) q = q.eq('period', period);
  const { data, error } = await q.order('collected_at', { ascending: false });
  if (error) throw error;
  return data as TaxRevenue[];
}

export async function getBusinessRegistrations(country: CountryCode, search?: string) {
  let q = supabase.from('regulatory_businesses').select('*').eq('country_code', country);
  if (search) q = q.ilike('business_name', `%${search}%`);
  const { data, error } = await q.order('registered_at', { ascending: false }).limit(50);
  if (error) throw error;
  return data as BusinessRegistration[];
}

export async function getTaxPayments(country: CountryCode, status?: string) {
  let q = supabase.from('regulatory_tax_payments').select('*').eq('country_code', country);
  if (status) q = q.eq('status', status);
  const { data, error } = await q.order('due_date', { ascending: true });
  if (error) throw error;
  return data as TaxPayment[];
}

export async function getComplianceReport(country: CountryCode, period: string) {
  const { data, error } = await supabase
    .from('regulatory_compliance')
    .select('*')
    .eq('country_code', country)
    .eq('period', period)
    .single();
  if (error) throw error;
  return data as ComplianceReport;
}

export async function getRevenueSummary(country: CountryCode) {
  const { data, error } = await supabase
    .rpc('get_regulatory_summary', { p_country: country });
  if (error) throw error;
  return data;
}
