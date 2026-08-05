import { supabase } from '@/lib/supabase';
import { CourtCase } from '../types';

export class CourtCasesService {
  static async getCases(courtHouseId?: string): Promise<CourtCase[]> {
    let query = supabase.from('court_cases').select('*, court_house:court_houses(*), assigned_judge:court_judges(*)');
    if (courtHouseId) query = query.eq('court_house_id', courtHouseId);
    const { data, error } = await query.order('filing_date', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  static async getCaseById(id: string): Promise<CourtCase | null> {
    const { data, error } = await supabase.from('court_cases')
      .select('*, court_house:court_houses(*), assigned_judge:court_judges(*)')
      .eq('id', id).maybeSingle();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  static async createCase(data: Partial<CourtCase>): Promise<CourtCase> {
    const { data: result, error } = await supabase.from('court_cases').insert(data).select().maybeSingle();
    if (error) throw error;
    return result;
  }

  static async updateCase(id: string, data: Partial<CourtCase>): Promise<CourtCase> {
    const { data: result, error } = await supabase.from('court_cases').update(data).eq('id', id).select().maybeSingle();
    if (error) throw error;
    return result;
  }
}
