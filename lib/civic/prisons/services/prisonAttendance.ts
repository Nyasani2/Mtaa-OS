import { supabase } from '@/lib/supabase';
import { PrisonStaffAttendance } from '../types';

export class PrisonAttendanceService {
  static async getAttendance(facilityId: string, date?: string): Promise<PrisonStaffAttendance[]> {
    let query = supabase.from('prison_staff_attendance').select('*').eq('facility_id', facilityId);
    if (date) query = query.eq('shift_date', date);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  static async markAttendance(data: Partial<PrisonStaffAttendance>): Promise<PrisonStaffAttendance> {
    const { data: result, error } = await supabase.from('prison_staff_attendance').insert(data).select().maybeSingle();
    if (error) throw error;
    return result;
  }

  static async updateAttendance(id: string, data: Partial<PrisonStaffAttendance>): Promise<PrisonStaffAttendance> {
    const { data: result, error } = await supabase.from('prison_staff_attendance').update(data).eq('id', id).select().maybeSingle();
    if (error) throw error;
    return result;
  }
}
