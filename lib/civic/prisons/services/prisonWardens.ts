import { supabase } from '@/lib/supabase';
import { PrisonWarden } from '@/types/prisons';

export async function getWardens(facilityId?: string): Promise<PrisonWarden[]> {
  let q = supabase.from('prison_wardens').select('*');
  if (facilityId) q = q.eq('facility_id', facilityId);
  const { data, error } = await q.order('full_name');
  if (error) throw error;
  return data || [];
}

export async function createWarden(warden: Partial<PrisonWarden>): Promise<PrisonWarden> {
  const { data, error } = await supabase.from('prison_wardens').insert(warden).select().single();
  if (error) throw error;
  return data;
}

export async function updateWarden(id: string, updates: Partial<PrisonWarden>): Promise<PrisonWarden> {
  const { data, error } = await supabase.from('prison_wardens').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteWarden(id: string): Promise<void> {
  const { error } = await supabase.from('prison_wardens').delete().eq('id', id);
  if (error) throw error;
}
