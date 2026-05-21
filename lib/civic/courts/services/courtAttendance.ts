import { supabase } from '@/lib/supabase';
import { CourtStaffAttendance } from '@/types/courts';

export async function getAttendance(filters?: {
  court_house_id?: string;
  staff_id?: string;
  shift_date?: string;
}): Promise<CourtStaffAttendance[]> {
  let q = supabase.from('court_staff_attendance').select('*');
  if (filters?.court_house_id) q = q.eq('court_house_id', filters.court_house_id);
  if (filters?.staff_id) q = q.eq('staff_id', filters.staff_id);
  if (filters?.shift_date) q = q.eq('shift_date', filters.shift_date);
  const { data, error } = await q.order('shift_date', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function clockIn(record: Partial<CourtStaffAttendance>): Promise<CourtStaffAttendance> {
  const insert = { ...record, clock_in: new Date().toISOString() };
  const { data, error } = await supabase.from('court_staff_attendance').insert(insert).select().single();
  if (error) throw error;
  return data;
}

export async function clockOut(id: string): Promise<CourtStaffAttendance> {
  const clockOut = new Date().toISOString();
  const { data: existing } = await supabase.from('court_staff_attendance').select('clock_in').eq('id', id).single();
  const hours = existing?.clock_in
    ? parseFloat(((new Date(clockOut).getTime() - new Date(existing.clock_in).getTime()) / 3600000).toFixed(2))
    : null;

  const { data, error } = await supabase
    .from('court_staff_attendance')
    .update({ clock_out: clockOut, hours_worked: hours })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}
