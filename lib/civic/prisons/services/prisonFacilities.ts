import { supabase } from '@/lib/supabase';
import { PrisonFacility } from '@/types/prisons';

export async function getFacilities(): Promise<PrisonFacility[]> {
  const { data, error } = await supabase.from('prison_facilities').select('*').order('name');
  if (error) throw error;
  return data || [];
}

export async function getFacility(id: string): Promise<PrisonFacility | null> {
  const { data, error } = await supabase.from('prison_facilities').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}

export async function createFacility(facility: Partial<PrisonFacility>): Promise<PrisonFacility> {
  const { data, error } = await supabase.from('prison_facilities').insert(facility).select().single();
  if (error) throw error;
  return data;
}

export async function updateFacility(id: string, updates: Partial<PrisonFacility>): Promise<PrisonFacility> {
  const { data, error } = await supabase.from('prison_facilities').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteFacility(id: string): Promise<void> {
  const { error } = await supabase.from('prison_facilities').delete().eq('id', id);
  if (error) throw error;
}
