import { supabase } from '@/lib/supabase';
import { CourtJuror, CourtJuryAssignment } from '@/types/courts';

export async function getJuryPool(houseId?: string): Promise<CourtJuror[]> {
  let q = supabase.from('court_jury_pool').select('*');
  if (houseId) q = q.eq('court_house_id', houseId);
  const { data, error } = await q.order('full_name');
  if (error) throw error;
  return data || [];
}

export async function createJuror(juror: Partial<CourtJuror>): Promise<CourtJuror> {
  const { data, error } = await supabase.from('court_jury_pool').insert(juror).select().single();
  if (error) throw error;
  return data;
}

export async function updateJuror(id: string, updates: Partial<CourtJuror>): Promise<CourtJuror> {
  const { data, error } = await supabase.from('court_jury_pool').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function getJuryAssignments(caseId?: string): Promise<CourtJuryAssignment[]> {
  let q = supabase.from('court_jury_assignments').select(`*, court_jury_pool:juror_id(*)`);
  if (caseId) q = q.eq('case_id', caseId);
  const { data, error } = await q.order('assigned_date');
  if (error) throw error;
  return (data || []).map((d: any) => ({ ...d, juror: d.court_jury_pool }));
}

export async function assignJuror(assignment: Partial<CourtJuryAssignment>): Promise<CourtJuryAssignment> {
  const { data, error } = await supabase.from('court_jury_assignments').insert(assignment).select().single();
  if (error) throw error;
  return data;
}

export async function removeJurorAssignment(id: string): Promise<void> {
  const { error } = await supabase.from('court_jury_assignments').delete().eq('id', id);
  if (error) throw error;
}
