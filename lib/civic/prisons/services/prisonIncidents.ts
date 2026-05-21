import { supabase } from '@/lib/supabase';
import { PrisonIncident } from '@/types/prisons';

export async function getIncidents(filters?: {
  facility_id?: string;
  inmate_id?: string;
  status?: string;
  severity?: string;
}): Promise<PrisonIncident[]> {
  let q = supabase
    .from('prison_incidents')
    .select(`*, prison_facilities:facility_id(*), prison_inmates:inmate_id(*), prison_wardens:reported_by(*)`);
  if (filters?.facility_id) q = q.eq('facility_id', filters.facility_id);
  if (filters?.inmate_id) q = q.eq('inmate_id', filters.inmate_id);
  if (filters?.status) q = q.eq('status', filters.status);
  if (filters?.severity) q = q.eq('severity', filters.severity);
  const { data, error } = await q.order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map((d: any) => ({ ...d, facility: d.prison_facilities, inmate: d.prison_inmates, reporter: d.prison_wardens }));
}

export async function createIncident(incident: Partial<PrisonIncident>): Promise<PrisonIncident> {
  const { data, error } = await supabase.from('prison_incidents').insert(incident).select().single();
  if (error) throw error;
  return data;
}

export async function updateIncident(id: string, updates: Partial<PrisonIncident>): Promise<PrisonIncident> {
  const { data, error } = await supabase.from('prison_incidents').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function resolveIncident(id: string, notes: string): Promise<PrisonIncident> {
  const { data, error } = await supabase
    .from('prison_incidents')
    .update({ status: 'resolved', resolved_at: new Date().toISOString(), resolution_notes: notes })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}
