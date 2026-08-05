import { supabase } from '@/lib/supabase';
import { PrisonProcurement } from '../types';

export class PrisonProcurementService {
  static async getProcurements(facilityId?: string): Promise<PrisonProcurement[]> {
    let query = supabase.from('prison_procurements').select('*');
    if (facilityId) query = query.eq('facility_id', facilityId);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  static async createProcurement(data: Partial<PrisonProcurement>): Promise<PrisonProcurement> {
    const { data: result, error } = await supabase.from('prison_procurements').insert(data).select().maybeSingle();
    if (error) throw error;
    return result;
  }

  static async approveProcurement(id: string, approvedBy: string): Promise<void> {
    const { error } = await supabase.from('prison_procurements').update({
      status: 'approved',
      approved_by: approvedBy
    }).eq('id', id);
    if (error) throw error;
  }
}
