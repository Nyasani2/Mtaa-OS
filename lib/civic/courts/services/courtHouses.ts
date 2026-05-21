import { supabase } from '@/lib/supabase';
import { CourtHouse } from '@/types/courts';

export async function getCourtHouses(): Promise<CourtHouse[]> {
  const { data, error } = await supabase
    .from('court_houses')
    .select('*')
    .order('name');
  if (error) throw error;
  return data || [];
}

export async function getCourtHouse(id: string): Promise<CourtHouse | null> {
  const { data, error } = await supabase
    .from('court_houses')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function createCourtHouse(house: Partial<CourtHouse>): Promise<CourtHouse> {
  const { data, error } = await supabase
    .from('court_houses')
    .insert(house)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateCourtHouse(id: string, updates: Partial<CourtHouse>): Promise<CourtHouse> {
  const { data, error } = await supabase
    .from('court_houses')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteCourtHouse(id: string): Promise<void> {
  const { error } = await supabase.from('court_houses').delete().eq('id', id);
  if (error) throw error;
}
