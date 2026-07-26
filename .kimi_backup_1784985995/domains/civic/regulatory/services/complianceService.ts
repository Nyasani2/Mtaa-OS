import { supabase } from '@/lib/supabase/client';

export interface ComplianceReview {
  id: string;
  business_id: string;
  reviewer_id: string;
  review_type: string;
  status: 'pending' | 'in_progress' | 'completed' | 'escalated';
  findings: string | null;
  recommendations: string | null;
  score: number | null;
  reviewed_at: string | null;
  due_date: string;
  created_at: string;
}

export interface ComplianceReport {
  id: string;
  business_id: string;
  report_type: string;
  period: string;
  data: Record<string, any>;
  generated_by: string;
  generated_at: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
}

export interface ComplianceCheck {
  id: string;
  business_id: string;
  check_type: string;
  checklist: Record<string, boolean>;
  result: 'pass' | 'fail' | 'partial';
  notes: string | null;
  checked_by: string;
  checked_at: string;
  next_due: string | null;
}

export interface ComplianceRule {
  id: string;
  rule_code: string;
  title: string;
  description: string;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  effective_date: string;
  status: 'active' | 'inactive' | 'superseded';
  created_at: string;
}

export interface RegulatoryCompliance {
  id: string;
  business_id: string;
  compliance_type: string;
  status: 'compliant' | 'non_compliant' | 'under_review' | 'exempt';
  last_assessed: string | null;
  next_assessment: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export async function getComplianceReviews(filters?: {
  businessId?: string;
  status?: string;
  reviewerId?: string;
}): Promise<ComplianceReview[]> {
  let query = supabase
    .from('compliance_reviews')
    .select('*')
    .order('due_date', { ascending: true });

  if (filters?.businessId) query = query.eq('business_id', filters.businessId);
  if (filters?.status) query = query.eq('status', filters.status);
  if (filters?.reviewerId) query = query.eq('reviewer_id', filters.reviewerId);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getComplianceReports(businessId?: string): Promise<ComplianceReport[]> {
  let query = supabase
    .from('compliance_reports')
    .select('*')
    .order('generated_at', { ascending: false });

  if (businessId) query = query.eq('business_id', businessId);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getComplianceChecks(businessId?: string): Promise<ComplianceCheck[]> {
  let query = supabase
    .from('compliance_checks')
    .select('*')
    .order('checked_at', { ascending: false });

  if (businessId) query = query.eq('business_id', businessId);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getComplianceRules(category?: string): Promise<ComplianceRule[]> {
  let query = supabase
    .from('compliance_rules')
    .select('*')
    .eq('status', 'active')
    .order('severity', { ascending: false });

  if (category) query = query.eq('category', category);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getRegulatoryCompliance(businessId?: string): Promise<RegulatoryCompliance[]> {
  let query = supabase
    .from('regulatory_compliance')
    .select('*')
    .order('next_assessment', { ascending: true });

  if (businessId) query = query.eq('business_id', businessId);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function submitComplianceReview(review: Omit<ComplianceReview, 'id' | 'created_at'>): Promise<ComplianceReview> {
  const { data, error } = await supabase
    .from('compliance_reviews')
    .insert(review)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateComplianceReview(reviewId: string, updates: Partial<ComplianceReview>): Promise<void> {
  const { error } = await supabase
    .from('compliance_reviews')
    .update({ ...updates, reviewed_at: new Date().toISOString() })
    .eq('id', reviewId);

  if (error) throw error;
}

export async function runComplianceCheck(businessId: string, checkType: string, checklist: Record<string, boolean>): Promise<ComplianceCheck> {
  const result = Object.values(checklist).every(v => v === true) ? 'pass' : Object.values(checklist).some(v => v === true) ? 'partial' : 'fail';

  const { data, error } = await supabase
    .from('compliance_checks')
    .insert({
      business_id: businessId,
      check_type: checkType,
      checklist,
      result,
      checked_by: 'system',
      checked_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}
