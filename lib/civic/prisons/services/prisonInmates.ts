import { supabase } from '@/lib/supabase';
import { PrisonInmate } from '@/types/prisons';
import { generateInmateNumber } from '@/lib/utils';

export async function getInmates(filters?: {
  facility_id?: string;
  status?: string;
  parole_status?: string;
  risk_level?: string;
  cell_block?: string;
  search?: string;
}): Promise<PrisonInmate[]> {
  let q = supabase
    .from('prison_inmates')
    .select(`*, prison_facilities:facility_id(*), prison_cells!inner(*)`);

  if (filters?.facility_id) q = q.eq('facility_id', filters.facility_id);
  if (filters?.status) q = q.eq('status', filters.status);
  if (filters?.parole_status) q = q.eq('parole_status', filters.parole_status);
  if (filters?.risk_level) q = q.eq('risk_level', filters.risk_level);
  if (filters?.cell_block) q = q.eq('cell_block', filters.cell_block);
  if (filters?.search) q = q.or(`full_name.ilike.%${filters.search}%,inmate_number.ilike.%${filters.search}%`);

  const { data, error } = await q.order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map((d: any) => ({ ...d, facility: d.prison_facilities, cell: d.prison_cells }));
}

export async function getInmate(id: string): Promise<PrisonInmate | null> {
  const { data, error } = await supabase
    .from('prison_inmates')
    .select(`*, prison_facilities:facility_id(*)`)
    .eq('id', id)
    .single();
  if (error) throw error;
  if (!data) return null;
  return { ...data, facility: data.prison_facilities };
}

export async function createInmate(inmate: Partial<PrisonInmate>): Promise<PrisonInmate> {
  const insert = { ...inmate, inmate_number: inmate.inmate_number || generateInmateNumber() };
  const { data, error } = await supabase.from('prison_inmates').insert(insert).select().single();
  if (error) throw error;
  return data;
}

export async function updateInmate(id: string, updates: Partial<PrisonInmate>): Promise<PrisonInmate> {
  const { data, error } = await supabase.from('prison_inmates').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteInmate(id: string): Promise<void> {
  const { error } = await supabase.from('prison_inmates').delete().eq('id', id);
  if (error) throw error;
}

export async function assignCell(inmateId: string, cellBlock: string, cellNumber: string): Promise<PrisonInmate> {
  const { data, error } = await supabase
    .from('prison_inmates')
    .update({ cell_block: cellBlock, cell_number: cellNumber })
    .eq('id', inmateId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function releaseInmate(id: string): Promise<PrisonInmate> {
  const { data, error } = await supabase
    .from('prison_inmates')
    .update({ status: 'released', release_date: new Date().toISOString().split('T')[0] })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function transferInmate(id: string, toFacilityId: string, reason: string): Promise<PrisonInmate> {
  const { data, error } = await supabase
    .from('prison_inmates')
    .update({ status: 'transferred', facility_id: toFacilityId, cell_block: null, cell_number: null })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}
