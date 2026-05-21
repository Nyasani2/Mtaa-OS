import { supabase } from '@/lib/supabase';
import { PrisonVisit } from '@/types/prisons';

export async function getVisits(filters?: {
  inmate_id?: string;
  facility_id?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
}): Promise<PrisonVisit[]> {
  let q = supabase.from('prison_visits').select(`*, prison_inmates:inmate_id(*)`);
  if (filters?.inmate_id) q = q.eq('inmate_id', filters.inmate_id);
  if (filters?.status) q = q.eq('status', filters.status);
  if (filters?.date_from) q = q.gte('scheduled_at', filters.date_from);
  if (filters?.date_to) q = q.lte('scheduled_at', filters.date_to);
  const { data, error } = await q.order('scheduled_at');
  if (error) throw error;
  return (data || []).map((d: any) => ({ ...d, inmate: d.prison_inmates }));
}

export async function createVisit(visit: Partial<PrisonVisit>): Promise<PrisonVisit> {
  const { data, error } = await supabase.from('prison_visits').insert(visit).select().single();
  if (error) throw error;
  return data;
}

export async function updateVisit(id: string, updates: Partial<PrisonVisit>): Promise<PrisonVisit> {
  const { data, error } = await supabase.from('prison_visits').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function checkInVisit(id: string): Promise<PrisonVisit> {
  const { data, error } = await supabase
    .from('prison_visits')
    .update({ status: 'checked_in', check_in: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function checkOutVisit(id: string): Promise<PrisonVisit> {
  const { data, error } = await supabase
    .from('prison_visits')
    .update({ status: 'completed', check_out: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}
