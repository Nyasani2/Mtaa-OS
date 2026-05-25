// lib/civic/courts/services/courtRooms.ts
import { supabase } from '@/lib/supabase/client';
import { CourtRoom } from '@/types/courts';

export async function getCourtRooms(courtId?: string): Promise<CourtRoom[]> {
  let query = supabase.from('court_rooms').select('*');
  if (courtId) query = query.eq('court_id', courtId);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function getCourtRoomById(id: string): Promise<CourtRoom | null> {
  const { data, error } = await supabase.from('court_rooms').select('*').eq('id', id).single();
  if (error) return null;
  return data;
}
