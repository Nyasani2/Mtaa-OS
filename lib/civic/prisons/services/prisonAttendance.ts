import { supabase } from '@/lib/supabase';
import { PrisonStaffAttendance } from '@/types/prisons';

export async function getAttendance(filters?: {
  facility_id?: string;
  staff_id?: string;
  shift_date?: string;
}): Promise<PrisonStaffAttendance[]> {
  let q = supabase.from('prison_staff_attendance').select('*');
  if (filters?.facility_id) q = q.eq('facility_id', filters.facility_id);
  if (filters?.staff_id) q = q.eq('staff_id', filters.staff_id);
  if (filters?.shift_date) q = q.eq('shift_date', filters.shift_date);
  const { data, error } = await q.order('shift_date', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function clockIn(record: Partial<PrisonStaffAttendance>): Promise<PrisonStaffAttendance> {
  const insert = { ...record, clock_in: new Date().toISOString() };
  const { data, error } = await supabase.from('prison_staff_attendance').insert(insert).select().single();
  if (error) throw error;
  return data;
}

export async function clockOut(id: string): Promise<PrisonStaffAttendance> {
  const clockOut = new Date().toISOString();
  const { data: existing } = await supabase.from('prison_staff_attendance').select('clock_in').eq('id', id).single();
  const hours = existing?.clock_in
    ? parseFloat(((new Date(clockOut).getTime() - new Date(existing.clock_in).getTime()) / 3600000).toFixed(2))
    : null;
  const { data, error } = await supabase
    .from('prison_staff_attendance')
    .update({ clock_out: clockOut, hours_worked: hours })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}
