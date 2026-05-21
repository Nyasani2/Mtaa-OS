import { supabase } from '@/lib/supabase';
import { CourtCase, CourtParty } from '@/types/courts';
import { generateCaseNumber } from '@/lib/utils';

export async function getCases(filters?: {
  status?: string;
  case_type?: string;
  court_house_id?: string;
  assigned_judge_id?: string;
  search?: string;
}): Promise<CourtCase[]> {
  let q = supabase
    .from('court_cases')
    .select(`
      *,
      court_houses:court_house_id(*),
      court_rooms:court_room_id(*),
      court_judges:assigned_judge_id(*),
      court_parties(*),
      court_hearings(*),
      court_judgments(*),
      court_fines(*),
      court_bails(*)
    `);

  if (filters?.status) q = q.eq('status', filters.status);
  if (filters?.case_type) q = q.eq('case_type', filters.case_type);
  if (filters?.court_house_id) q = q.eq('court_house_id', filters.court_house_id);
  if (filters?.assigned_judge_id) q = q.eq('assigned_judge_id', filters.assigned_judge_id);
  if (filters?.search) q = q.ilike('case_number', `%${filters.search}%`);

  const { data, error } = await q.order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map((d: any) => ({
    ...d,
    court_house: d.court_houses,
    court_room: d.court_rooms,
    assigned_judge: d.court_judges,
    parties: d.court_parties,
    hearings: d.court_hearings,
    judgments: d.court_judgments,
    fines: d.court_fines,
    bails: d.court_bails,
  }));
}

export async function getCase(id: string): Promise<CourtCase | null> {
  const { data, error } = await supabase
    .from('court_cases')
    .select(`
      *,
      court_houses:court_house_id(*),
      court_rooms:court_room_id(*),
      court_judges:assigned_judge_id(*),
      court_parties(*),
      court_hearings(*),
      court_judgments(*, court_judges:judge_id(*)),
      court_fines(*),
      court_bails(*, court_parties:party_id(*))
    `)
    .eq('id', id)
    .single();
  if (error) throw error;
  if (!data) return null;
  return {
    ...data,
    court_house: data.court_houses,
    court_room: data.court_rooms,
    assigned_judge: data.court_judges,
    parties: data.court_parties,
    hearings: data.court_hearings,
    judgments: data.court_judgments?.map((j: any) => ({ ...j, judge: j.court_judges })),
    fines: data.court_fines,
    bails: data.court_bails?.map((b: any) => ({ ...b, party: b.court_parties })),
  };
}

export async function createCase(caseData: Partial<CourtCase>): Promise<CourtCase> {
  const insert = {
    ...caseData,
    case_number: caseData.case_number || generateCaseNumber(),
  };
  const { data, error } = await supabase.from('court_cases').insert(insert).select().single();
  if (error) throw error;
  return data;
}

export async function updateCase(id: string, updates: Partial<CourtCase>): Promise<CourtCase> {
  const { data, error } = await supabase.from('court_cases').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteCase(id: string): Promise<void> {
  const { error } = await supabase.from('court_cases').delete().eq('id', id);
  if (error) throw error;
}

export async function addParty(party: Partial<CourtParty>): Promise<CourtParty> {
  const { data, error } = await supabase.from('court_parties').insert(party).select().single();
  if (error) throw error;
  return data;
}

export async function removeParty(id: string): Promise<void> {
  const { error } = await supabase.from('court_parties').delete().eq('id', id);
  if (error) throw error;
}
