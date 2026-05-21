import { supabase } from '@/lib/supabase';
import { PrisonCell } from '@/types/prisons';

export async function getCells(facilityId?: string): Promise<PrisonCell[]> {
  let q = supabase.from('prison_cells').select('*');
  if (facilityId) q = q.eq('facility_id', facilityId);
  const { data, error } = await q.order('cell_block').order('cell_number');
  if (error) throw error;
  return data || [];
}

export async function getCell(id: string): Promise<PrisonCell | null> {
  const { data, error } = await supabase.from('prison_cells').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}

export async function createCell(cell: Partial<PrisonCell>): Promise<PrisonCell> {
  const { data, error } = await supabase.from('prison_cells').insert(cell).select().single();
  if (error) throw error;
  return data;
}

export async function updateCell(id: string, updates: Partial<PrisonCell>): Promise<PrisonCell> {
  const { data, error } = await supabase.from('prison_cells').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteCell(id: string): Promise<void> {
  const { error } = await supabase.from('prison_cells').delete().eq('id', id);
  if (error) throw error;
}
