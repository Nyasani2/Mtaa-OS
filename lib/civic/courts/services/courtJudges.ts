import { supabase } from '@/lib/supabase';
import { CourtJudge } from '../types';

export class CourtJudgesService {
  static async getJudges(courtHouseId?: string): Promise<CourtJudge[]> {
    let query = supabase.from('court_judges').select('*');
    if (courtHouseId) query = query.eq('court_house_id', courtHouseId);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  static async getJudgeById(id: string): Promise<CourtJudge | null> {
    const { data, error } = await supabase.from('court_judges').select('*').eq('id', id).single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }
}
