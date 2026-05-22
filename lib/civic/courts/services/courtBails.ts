import { supabase } from '@/lib/supabase';
import { CourtBail } from '../types';

export class CourtBailsService {
  static async getBails(caseId?: string): Promise<CourtBail[]> {
    let query = supabase.from('court_bails').select('*, party:court_parties(*)');
    if (caseId) query = query.eq('case_id', caseId);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  static async createBail(data: Partial<CourtBail>): Promise<CourtBail> {
    const { data: result, error } = await supabase.from('court_bails').insert(data).select().single();
    if (error) throw error;
    return result;
  }

  static async updateBailStatus(id: string, status: string): Promise<void> {
    const { error } = await supabase.from('court_bails').update({ status }).eq('id', id);
    if (error) throw error;
  }
}
