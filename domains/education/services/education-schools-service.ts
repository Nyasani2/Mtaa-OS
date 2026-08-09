import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export interface Institution {
  id: string;
  name: string;
  type: string;
  level: string;
  parent_id: string | null;
  address: string | null;
  district: string | null;
  county: string | null;
  state: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  logo_url: string | null;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

export async function getInstitutions(filters?: {
  country?: string;
  county?: string;
  district?: string;
  type?: string;
  level?: string;
  search?: string;
  is_active?: boolean;
  limit?: number;
  offset?: number;
}) {
  try {
    let query = supabase
      .from('education_institutions')
      .select('*')
      .order('name', { ascending: true });

    if (filters?.country) query = query.eq('country', filters.country);
    if (filters?.county) query = query.eq('county', filters.county);
    if (filters?.district) query = query.eq('district', filters.district);
    if (filters?.type) query = query.eq('type', filters.type);
    if (filters?.level) query = query.eq('level', filters.level);
    if (filters?.is_active !== undefined) query = query.eq('is_active', filters.is_active);
    if (filters?.search) query = query.ilike('name', `%${filters.search}%`);
    if (filters?.limit) query = query.limit(filters.limit);
    if (filters?.offset) query = query.range(filters.offset, filters.offset + (filters.limit || 20) - 1);

    const { data, error } = await query;
    if (error) throw error;
    return { data: (data || []) as Institution[], error: null };
  } catch (error: any) {
    console.error('getInstitutions error:', error);
    return { data: [], error };
  }
}

export async function getInstitutionById(id: string) {
  try {
    const { data, error } = await supabase
      .from('education_institutions')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return { data: data as Institution, error: null };
  } catch (error: any) {
    console.error('getInstitutionById error:', error);
    return { data: null, error };
  }
}

export async function createInstitution(institution: Partial<Institution>) {
  try {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('education_institutions')
      .insert([institution])
      .select()
      .single();
    if (error) throw error;
    return { data: data as Institution, error: null };
  } catch (error: any) {
    console.error('createInstitution error:', error);
    return { data: null, error };
  }
}

export async function updateInstitution(id: string, updates: Partial<Institution>) {
  try {
    const { data, error } = await supabase
      .from('education_institutions')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return { data: data as Institution, error: null };
  } catch (error: any) {
    console.error('updateInstitution error:', error);
    return { data: null, error };
  }
}

// Backward compatibility aliases
export const getSchools = getInstitutions;
export const getSchoolById = getInstitutionById;
export const createSchool = createInstitution;
export const updateSchool = updateInstitution;
