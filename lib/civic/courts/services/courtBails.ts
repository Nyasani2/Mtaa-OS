import { supabase } from '@/lib/supabase';
import { CourtBail } from '@/types/courts';

export async function getBails(filters?: { case_id?: string; status?: string }): Promise<CourtBail[]> {
  let q = supabase.from('court_bails').select(`*, court_parties:party_id(*)`);
  if (filters?.case_id) q = q.eq('case_id', filters.case_id);
  if (filters?.status) q = q.eq('status', filters.status);
  const { data, error } = await q.order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map((d: any) => ({ ...d, party: d.court_parties }));
}

export async function createBail(bail: Partial<CourtBail>): Promise<CourtBail> {
  const { data, error } = await supabase.from('court_bails').insert(bail).select().single();
  if (error) throw error;
  return data;
}

export async function updateBail(id: string, updates: Partial<CourtBail>): Promise<CourtBail> {
  const { data, error } = await supabase.from('court_bails').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function postBail(id: string, postedBy: string): Promise<CourtBail> {
  const { data, error } = await supabase
    .from('court_bails')
    .update({
      status: 'posted',
      posted_date: new Date().toISOString(),
      posted_by: postedBy,
    })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function releaseOnBail(id: string): Promise<CourtBail> {
  const { data, error } = await supabase
    .from('court_bails')
    .update({
      status: 'released',
      release_date: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}
