import { supabase } from '@/lib/supabase';
import { CourtPayroll } from '../types';

export class CourtPayrollService {
  static async getPayroll(courtHouseId?: string, period?: string): Promise<CourtPayroll[]> {
    let query = supabase.from('court_payroll').select('*');
    if (courtHouseId) query = query.eq('court_house_id', courtHouseId);
    if (period) query = query.eq('period_start', period);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  static async createPayroll(data: Partial<CourtPayroll>): Promise<CourtPayroll> {
    const { data: result, error } = await supabase.from('court_payroll').insert(data).select().maybeSingle();
    if (error) throw error;
    return result;
  }
}
