import { supabase } from '@/lib/supabase/client';

// institutionService.ts - Education Institution Service
// FIXED: import path corrected from @/lib/supabase to @/lib/supabase/client

export interface Institution {
  id: string;
  name: string;
  slug?: string;
  type: 'ecd' | 'primary' | 'jss' | 'sss' | 'tvet' | 'university' | 'international';
  category: 'public' | 'private' | 'mission' | 'community';
  registration_number?: string;
  kra_pin?: string;
  ministry_approved: boolean;
  address?: string;
  city?: string;
  county?: string;
  sub_county?: string;
  ward?: string;
  country: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  email?: string;
  website?: string;
  logo_url?: string;
  cover_image_url?: string;
  gallery?: string[];
  head_teacher_id?: string;
  head_teacher_name?: string;
  head_teacher_phone?: string;
  levels_offered?: string[];
  boarding: boolean;
  day_school: boolean;
  mixed_gender: boolean;
  capacity?: number;
  status: 'pending' | 'active' | 'suspended' | 'closed';
  verification_status: 'unverified' | 'pending' | 'verified' | 'rejected';
  settings?: Record<string, any>;
  meta_data?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export async function getInstitutions(filters?: {
  type?: string;
  county?: string;
  status?: string;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  let query = supabase.from('education_institutions').select('*', { count: 'exact' });

  if (filters?.type) query = query.eq('type', filters.type);
  if (filters?.county) query = query.eq('county', filters.county);
  if (filters?.status) query = query.eq('status', filters.status);
  if (filters?.search) {
    query = query.or(`name.ilike.%${filters.search}%,registration_number.ilike.%${filters.search}%`);
  }

  const limit = filters?.limit ?? 20;
  const offset = filters?.offset ?? 0;
  query = query.range(offset, offset + limit - 1).order('name');

  const { data, error, count } = await query;
  if (error) throw error;
  return { data: data as Institution[], count };
}

export async function getInstitutionById(id: string) {
  const { data, error } = await supabase
    .from('education_institutions')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data as Institution;
}

export async function getInstitutionBySlug(slug: string) {
  const { data, error } = await supabase
    .from('education_institutions')
    .select('*')
    .eq('slug', slug)
    .single();
  if (error) throw error;
  return data as Institution;
}

export async function createInstitution(institution: Omit<Institution, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('education_institutions')
    .insert(institution)
    .select()
    .single();
  if (error) throw error;
  return data as Institution;
}

export async function updateInstitution(id: string, updates: Partial<Institution>) {
  const { data, error } = await supabase
    .from('education_institutions')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Institution;
}

export async function deleteInstitution(id: string) {
  const { error } = await supabase.from('education_institutions').delete().eq('id', id);
  if (error) throw error;
}
