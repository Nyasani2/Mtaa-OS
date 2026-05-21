
import { supabase } from '@/lib/supabase';
import { Institution } from '../types/education.types';

export async function getInstitutions(filters?: { county?: string; type?: string }) {
  let query = supabase.from('education_institutions').select('*');
  if (filters?.county) query = query.eq('county', filters.county);
  if (filters?.type) query = query.eq('type', filters.type);
  const { data, error } = await query.order('name');
  if (error) throw error;
  return data as Institution[];
}

export async function getInstitution(id: string) {
  const { data, error } = await supabase
    .from('education_institutions')
    .select('*, education_teachers(*), education_classes(*)')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function registerInstitution(institution: Partial<Institution>) {
  const { data, error } = await supabase
    .from('education_institutions')
    .insert(institution)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateInstitution(id: string, updates: Partial<Institution>) {
  const { data, error } = await supabase
    .from('education_institutions')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}
