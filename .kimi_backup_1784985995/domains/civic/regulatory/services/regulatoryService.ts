import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export interface DashboardStats {
  totalBusinesses: number;
  totalTaxRevenue: number;
  totalTaxPayments: number;
  pendingCompliance: number;
  recentAudits: number;
  activeFlags: number;
}

export interface AuditLog {
  id: string;
  action: string;
  table_name: string;
  record_id: string;
  old_data: Record<string, any> | null;
  new_data: Record<string, any> | null;
  performed_by: string;
  performed_at: string;
  ip_address: string | null;
}

export interface RegulatoryFlag {
  id: string;
  entity_type: string;
  entity_id: string;
  flag_type: string;
  reason: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'resolved' | 'escalated';
  created_by: string;
  created_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
}

export interface RegulatoryReport {
  id: string;
  report_type: string;
  title: string;
  description: string | null;
  data: Record<string, any>;
  generated_by: string;
  generated_at: string;
  status: 'draft' | 'published' | 'archived';
}

export interface CBKReport {
  id: string;
  report_period: string;
  institution_type: string;
  total_transactions: number;
  total_value: number;
  suspicious_count: number;
  flagged_count: number;
  submitted_by: string;
  submitted_at: string;
  status: 'pending' | 'approved' | 'rejected';
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const { data: businesses } = await supabase
    .from('businesses')
    .select('id', { count: 'exact', head: true });

  const { data: revenue } = await supabase
    .from('regulatory_tax_revenue')
    .select('amount');

  const { data: payments } = await supabase
    .from('regulatory_tax_payments')
    .select('amount');

  const { data: compliance } = await supabase
    .from('compliance_reviews')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending');

  const { data: audits } = await supabase
    .from('audit_logs')
    .select('id', { count: 'exact', head: true })
    .gte('performed_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

  const { data: flags } = await supabase
    .from('regulatory_flags')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'open');

  const totalRevenue = revenue?.reduce((sum, r) => sum + (r.amount || 0), 0) || 0;
  const totalPayments = payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

  return {
    totalBusinesses: businesses?.length ?? 0,
    totalTaxRevenue: totalRevenue,
    totalTaxPayments: totalPayments,
    pendingCompliance: compliance?.length ?? 0,
    recentAudits: audits?.length ?? 0,
    activeFlags: flags?.length ?? 0,
  };
}

export async function getAuditLogs(limit = 50, offset = 0): Promise<AuditLog[]> {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .order('performed_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return data || [];
}

export async function getRegulatoryFlags(status?: string): Promise<RegulatoryFlag[]> {
  let query = supabase
    .from('regulatory_flags')
    .select('*')
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function createRegulatoryFlag(flag: Omit<RegulatoryFlag, 'id' | 'created_at'>): Promise<RegulatoryFlag> {
  const { data, error } = await supabase
    .from('regulatory_flags')
    .insert(flag)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function resolveFlag(flagId: string, resolution: { resolved_by: string; resolution_notes?: string }): Promise<void> {
  const { error } = await supabase
    .from('regulatory_flags')
    .update({
      status: 'resolved',
      resolved_at: new Date().toISOString(),
      resolved_by: resolution.resolved_by,
      ...resolution,
    })
    .eq('id', flagId);

  if (error) throw error;
}

export async function getRegulatoryReports(reportType?: string): Promise<RegulatoryReport[]> {
  let query = supabase
    .from('regulatory_reports')
    .select('*')
    .order('generated_at', { ascending: false });

  if (reportType) {
    query = query.eq('report_type', reportType);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function generateReport(report: Omit<RegulatoryReport, 'id' | 'generated_at'>): Promise<RegulatoryReport> {
  const { data, error } = await supabase
    .from('regulatory_reports')
    .insert({ ...report, generated_at: new Date().toISOString() })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getCBKReports(): Promise<CBKReport[]> {
  const { data, error } = await supabase
    .from('cbk_reports')
    .select('*')
    .order('submitted_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function submitCBKReport(report: Omit<CBKReport, 'id' | 'submitted_at' | 'status'>): Promise<CBKReport> {
  const { data, error } = await supabase
    .from('cbk_reports')
    .insert({ ...report, submitted_at: new Date().toISOString(), status: 'pending' })
    .select()
    .single();

  if (error) throw error;
  return data;
}
