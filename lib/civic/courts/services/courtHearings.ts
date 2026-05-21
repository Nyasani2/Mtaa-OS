import { supabase } from '@/lib/supabase';
import { CourtHearing } from '@/types/courts';

export async function getHearings(filters?: {
  case_id?: string;
  court_room_id?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
}): Promise<CourtHearing[]> {
  let q = supabase
    .from('court_hearings')
    .select(`*, court_rooms:court_room_id(*), court_judges:presiding_judge_id(*)`);

  if (filters?.case_id) q = q.eq('case_id', filters.case_id);
  if (filters?.court_room_id) q = q.eq('court_room_id', filters.court_room_id);
  if (filters?.status) q = q.eq('status', filters.status);
  if (filters?.date_from) q = q.gte('scheduled_date', filters.date_from);
  if (filters?.date_to) q = q.lte('scheduled_date', filters.date_to);

  const { data, error } = await q.order('scheduled_date');
  if (error) throw error;
  return (data || []).map((d: any) => ({
    ...d,
    court_room: d.court_rooms,
    presiding_judge: d.court_judges,
  }));
}

export async function createHearing(hearing: Partial<CourtHearing>): Promise<CourtHearing> {
  const { data, error } = await supabase.from('court_hearings').insert(hearing).select().single();
  if (error) throw error;
  return data;
}

export async function updateHearing(id: string, updates: Partial<CourtHearing>): Promise<CourtHearing> {
  const { data, error } = await supabase.from('court_hearings').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteHearing(id: string): Promise<void> {
  const { error } = await supabase.from('court_hearings').delete().eq('id', id);
  if (error) throw error;
}
