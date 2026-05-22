import { supabase } from '@/lib/supabase';
import { CourtStaffAttendance } from '../types';

export class CourtAttendanceService {
  static async getAttendance(courtHouseId: string, date?: string): Promise<CourtStaffAttendance[]> {
    let query = supabase.from('court_staff_attendance').select('*').eq('court_house_id', courtHouseId);
    if (date) query = query.eq('shift_date', date);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  static async markAttendance(data: Partial<CourtStaffAttendance>): Promise<CourtStaffAttendance> {
    const { data: result, error } = await supabase.from('court_staff_attendance').insert(data).select().single();
    if (error) throw error;
    return result;
  }
}
