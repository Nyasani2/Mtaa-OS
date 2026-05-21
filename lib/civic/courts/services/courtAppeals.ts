import { supabase } from '@/lib/supabase';
import { CourtAppeal } from '@/types/courts';

export async function getAppeals(): Promise<CourtAppeal[]> {
  const { data, error } = await supabase
    .from('court_appeals')
    .select(`
      *,
      original_case:original_case_id(*),
      original_judgment:original_judgment_id(*),
      appellate_court:appellate_court_id(*)
    `)
    .order('filing_date', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createAppeal(appeal: Partial<CourtAppeal>): Promise<CourtAppeal> {
  const { data, error } = await supabase.from('court_appeals').insert(appeal).select().single();
  if (error) throw error;
  return data;
}

export async function updateAppeal(id: string, updates: Partial<CourtAppeal>): Promise<CourtAppeal> {
  const { data, error } = await supabase.from('court_appeals').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
}
