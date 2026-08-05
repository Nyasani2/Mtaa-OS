import { supabase } from '@/lib/supabase';
import { PrisonPayroll } from '../types';

export class PrisonPayrollService {
  static async getPayroll(facilityId?: string, period?: string): Promise<PrisonPayroll[]> {
    let query = supabase.from('prison_payroll').select('*');
    if (facilityId) query = query.eq('facility_id', facilityId);
    if (period) query = query.eq('period_start', period);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  static async createPayroll(data: Partial<PrisonPayroll>): Promise<PrisonPayroll> {
    const { data: result, error } = await supabase.from('prison_payroll').insert(data).select().maybeSingle();
    if (error) throw error;
    return result;
  }

  static async processPayroll(id: string): Promise<void> {
    const { error } = await supabase.from('prison_payroll').update({ status: 'processed' }).eq('id', id);
    if (error) throw error;
  }
}
