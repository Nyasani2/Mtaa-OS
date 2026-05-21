import { supabase } from '@/lib/supabase';
import { CourtJudge } from '@/types/courts';

export async function getCourtJudges(houseId?: string): Promise<CourtJudge[]> {
  let q = supabase.from('court_judges').select('*');
  if (houseId) q = q.eq('court_house_id', houseId);
  const { data, error } = await q.order('full_name');
  if (error) throw error;
  return data || [];
}

export async function createCourtJudge(judge: Partial<CourtJudge>): Promise<CourtJudge> {
  const { data, error } = await supabase.from('court_judges').insert(judge).select().single();
  if (error) throw error;
  return data;
}

export async function updateCourtJudge(id: string, updates: Partial<CourtJudge>): Promise<CourtJudge> {
  const { data, error } = await supabase.from('court_judges').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteCourtJudge(id: string): Promise<void> {
  const { error } = await supabase.from('court_judges').delete().eq('id', id);
  if (error) throw error;
}
