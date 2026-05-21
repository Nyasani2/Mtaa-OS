import { supabase } from '@/lib/supabase';
import { PrisonMovement } from '@/types/prisons';

export async function getMovements(filters?: {
  inmate_id?: string;
  facility_id?: string;
  movement_type?: string;
}): Promise<PrisonMovement[]> {
  let q = supabase.from('prison_movements').select(`*, prison_inmates:inmate_id(*)`);
  if (filters?.inmate_id) q = q.eq('inmate_id', filters.inmate_id);
  if (filters?.facility_id) q = q.or(`from_facility_id.eq.${filters.facility_id},to_facility_id.eq.${filters.facility_id}`);
  if (filters?.movement_type) q = q.eq('movement_type', filters.movement_type);
  const { data, error } = await q.order('occurred_at', { ascending: false });
  if (error) throw error;
  return (data || []).map((d: any) => ({ ...d, inmate: d.prison_inmates }));
}

export async function createMovement(movement: Partial<PrisonMovement>): Promise<PrisonMovement> {
  const { data, error } = await supabase.from('prison_movements').insert(movement).select().single();
  if (error) throw error;
  return data;
}
