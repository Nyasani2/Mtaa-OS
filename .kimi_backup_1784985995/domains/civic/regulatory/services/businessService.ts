import { supabase } from '@/lib/supabase/client';

export interface Business {
  id: string;
  name: string;
  registration_number: string;
  tax_id: string | null;
  industry: string | null;
  status: 'active' | 'inactive' | 'suspended' | 'dissolved';
  incorporation_date: string | null;
  annual_revenue: number | null;
  employee_count: number | null;
  address: string | null;
  city: string | null;
  region: string | null;
  country: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  created_at: string;
  updated_at: string;
}

export interface BusinessProfile {
  id: string;
  business_id: string;
  description: string | null;
  logo_url: string | null;
  banner_url: string | null;
  social_links: Record<string, string> | null;
  verified: boolean;
  verified_at: string | null;
  created_at: string;
}

export interface BusinessOwner {
  id: string;
  business_id: string;
  user_id: string;
  ownership_percentage: number;
  role: string;
  is_primary: boolean;
  joined_at: string;
}

export interface BusinessBranch {
  id: string;
  business_id: string;
  name: string;
  address: string;
  city: string;
  region: string;
  country: string;
  phone: string | null;
  email: string | null;
  manager_name: string | null;
  status: 'active' | 'inactive';
  created_at: string;
}

export interface BusinessDocument {
  id: string;
  business_id: string;
  document_type: string;
  document_name: string;
  file_url: string;
  uploaded_by: string;
  verified: boolean;
  uploaded_at: string;
}

export async function searchBusinesses(query: string, filters?: {
  status?: string;
  region?: string;
  industry?: string;
}): Promise<Business[]> {
  let dbQuery = supabase
    .from('businesses')
    .select('*')
    .or(`name.ilike.%${query}%,registration_number.ilike.%${query}%,tax_id.ilike.%${query}%`)
    .order('name', { ascending: true });

  if (filters?.status) dbQuery = dbQuery.eq('status', filters.status);
  if (filters?.region) dbQuery = dbQuery.eq('region', filters.region);
  if (filters?.industry) dbQuery = dbQuery.eq('industry', filters.industry);

  const { data, error } = await dbQuery;
  if (error) throw error;
  return data || [];
}

export async function getBusinessById(businessId: string): Promise<Business | null> {
  const { data, error } = await supabase
    .from('businesses')
    .select('*')
    .eq('id', businessId)
    .single();

  if (error) return null;
  return data;
}

export async function getBusinessProfile(businessId: string): Promise<BusinessProfile | null> {
  const { data, error } = await supabase
    .from('business_profiles')
    .select('*')
    .eq('business_id', businessId)
    .single();

  if (error) return null;
  return data;
}

export async function getBusinessOwners(businessId: string): Promise<BusinessOwner[]> {
  const { data, error } = await supabase
    .from('business_owners')
    .select('*')
    .eq('business_id', businessId);

  if (error) throw error;
  return data || [];
}

export async function getBusinessBranches(businessId: string): Promise<BusinessBranch[]> {
  const { data, error } = await supabase
    .from('business_branches')
    .select('*')
    .eq('business_id', businessId)
    .eq('status', 'active');

  if (error) throw error;
  return data || [];
}

export async function getBusinessDocuments(businessId: string): Promise<BusinessDocument[]> {
  const { data, error } = await supabase
    .from('business_documents')
    .select('*')
    .eq('business_id', businessId)
    .order('uploaded_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getBusinessTransactions(businessId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('business_transactions')
    .select('*')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getBusinessStaff(businessId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('business_staff')
    .select('*')
    .eq('business_id', businessId);

  if (error) throw error;
  return data || [];
}

export async function registerBusiness(business: Omit<Business, 'id' | 'created_at' | 'updated_at'>): Promise<Business> {
  const { data, error } = await supabase
    .from('businesses')
    .insert(business)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateBusinessStatus(businessId: string, status: Business['status']): Promise<void> {
  const { error } = await supabase
    .from('businesses')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', businessId);

  if (error) throw error;
}
