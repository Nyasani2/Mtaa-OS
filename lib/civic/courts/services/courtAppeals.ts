import { supabase } from '@/lib/supabase';
import { CourtAppeal } from '../types';

export class CourtAppealsService {
  static async getAppeals(courtHouseId?: string): Promise<CourtAppeal[]> {
    let query = supabase.from('court_appeals').select('*, original_case:court_cases(*), appellate_court:court_houses(*)');
    if (courtHouseId) query = query.eq('appellate_court_id', courtHouseId);
    const { data, error } = await query.order('filing_date', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  static async createAppeal(data: Partial<CourtAppeal>): Promise<CourtAppeal> {
    const { data: result, error } = await supabase.from('court_appeals').insert(data).select().single();
    if (error) throw error;
    return result;
  }
}
