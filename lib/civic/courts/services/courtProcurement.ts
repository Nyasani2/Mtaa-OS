import { supabase } from '@/lib/supabase';
import { CourtProcurement } from '../types';

export class CourtProcurementService {
  static async getProcurements(courtHouseId?: string): Promise<CourtProcurement[]> {
    let query = supabase.from('court_procurements').select('*');
    if (courtHouseId) query = query.eq('court_house_id', courtHouseId);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  static async createProcurement(data: Partial<CourtProcurement>): Promise<CourtProcurement> {
    const { data: result, error } = await supabase.from('court_procurements').insert(data).select().single();
    if (error) throw error;
    return result;
  }
}
