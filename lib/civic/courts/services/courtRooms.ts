import { supabase } from '@/lib/supabase';
import { CourtRoom } from '@/types/courts';

export async function getCourtRooms(houseId?: string): Promise<CourtRoom[]> {
  let q = supabase.from('court_rooms').select('*');
  if (houseId) q = q.eq('court_house_id', houseId);
  const { data, error } = await q.order('room_number');
  if (error) throw error;
  return data || [];
}

export async function createCourtRoom(room: Partial<CourtRoom>): Promise<CourtRoom> {
  const { data, error } = await supabase.from('court_rooms').insert(room).select().single();
  if (error) throw error;
  return data;
}

export async function updateCourtRoom(id: string, updates: Partial<CourtRoom>): Promise<CourtRoom> {
  const { data, error } = await supabase.from('court_rooms').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteCourtRoom(id: string): Promise<void> {
  const { error } = await supabase.from('court_rooms').delete().eq('id', id);
  if (error) throw error;
}
