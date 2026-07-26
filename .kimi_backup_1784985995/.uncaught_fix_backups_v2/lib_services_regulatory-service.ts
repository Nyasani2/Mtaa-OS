/**
 * MTAA OS V10 — Regulatory Service
 * Tables: regulatory_businesses, regulatory_compliance, regulatory_tax_records, regulatory_audits
 */
import { supabase } from '@/lib/supabase/client';

export interface RegulatoryBusiness {
  id: string;
  owner_id: string;
  name: string;
  registration_number: string | null;
  business_type: string;
  status: 'pending' | 'active' | 'suspended' | 'revoked';
  tax_id: string | null;
  address: string | null;
  country_code: string;
  created_at: string;
  updated_at: string;
}

export interface RegulatoryCompliance {
  id: string;
  business_id: string;
  requirement: string;
  status: 'compliant' | 'non_compliant' | 'pending_review';
  due_date: string | null;
  completed_at: string | null;
  notes: string | null;
  created_at: string;
}

export interface RegulatoryTaxRecord {
  id: string;
  business_id: string;
  tax_year: string;
  amount_due: number;
  amount_paid: number;
  currency: string;
  status: 'pending' | 'partial' | 'paid' | 'overdue';
  due_date: string;
  created_at: string;
  updated_at: string;
}

// ── BUSINESSES ────────────────────────────────────────────

export async function searchRegulatoryBusinesses(query: string, countryCode?: string) {
  let q = supabase.from('regulatory_businesses').select('*');
  if (query) q = q.or(`name.ilike.%${query}%,registration_number.ilike.%${query}%`);
  if (countryCode) q = q.eq('country_code', countryCode);
  const { data, error } = await q.order('name').limit(50);
  if (error) throw error;
  return (data ?? []) as RegulatoryBusiness[];
}

export async function fetchRegulatoryBusinessById(id: string) {
  const { data, error } = await supabase.from('regulatory_businesses').select('*').eq('id', id).single();
  if (error) throw error;
  return data as RegulatoryBusiness;
}

export async function fetchMyBusinesses(ownerId: string) {
  const { data, error } = await supabase
    .from('regulatory_businesses')
    .select('*')
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as RegulatoryBusiness[];
}

export async function registerBusiness(payload: Partial<RegulatoryBusiness>) {
  const { data, error } = await supabase.from('regulatory_businesses').insert(payload).select().single();
  if (error) throw error;
  return data as RegulatoryBusiness;
}

export async function updateBusinessStatus(id: string, status: RegulatoryBusiness['status']) {
  const { data, error } = await supabase
    .from('regulatory_businesses')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as RegulatoryBusiness;
}

// ── COMPLIANCE ──────────────────────────────────────────

export async function fetchBusinessCompliance(businessId: string) {
  const { data, error } = await supabase
    .from('regulatory_compliance')
    .select('*')
    .eq('business_id', businessId)
    .order('due_date', { ascending: true });
  if (error) throw error;
  return (data ?? []) as RegulatoryCompliance[];
}

export async function updateComplianceStatus(id: string, status: RegulatoryCompliance['status'], notes?: string) {
  const { data, error } = await supabase
    .from('regulatory_compliance')
    .update({
      status,
      notes: notes ?? null,
      completed_at: status === 'compliant' ? new Date().toISOString() : null,
    })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as RegulatoryCompliance;
}

// ── TAX ───────────────────────────────────────────────────

export async function fetchBusinessTaxRecords(businessId: string) {
  const { data, error } = await supabase
    .from('regulatory_tax_records')
    .select('*')
    .eq('business_id', businessId)
    .order('tax_year', { ascending: false });
  if (error) throw error;
  return (data ?? []) as RegulatoryTaxRecord[];
}

export async function recordTaxPayment(businessId: string, taxYear: string, amount: number, currency: string = 'KES') {
  const { data: existing } = await supabase
    .from('regulatory_tax_records')
    .select('*')
    .eq('business_id', businessId)
    .eq('tax_year', taxYear)
    .single();

  if (existing) {
    const newPaid = (existing.amount_paid ?? 0) + amount;
    const status = newPaid >= existing.amount_due ? 'paid' : newPaid > 0 ? 'partial' : 'pending';
    const { data, error } = await supabase
      .from('regulatory_tax_records')
      .update({ amount_paid: newPaid, status, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
      .select()
      .single();
    if (error) throw error;
    return data as RegulatoryTaxRecord;
  } else {
    const { data, error } = await supabase
      .from('regulatory_tax_records')
      .insert({ business_id: businessId, tax_year: taxYear, amount_due: amount, amount_paid: amount, currency, status: 'paid', due_date: new Date().toISOString() })
      .select()
      .single();
    if (error) throw error;
    return data as RegulatoryTaxRecord;
  }
}
