import { supabase } from '@/lib/supabase';
import { CourtJudgment } from '../types';

export class CourtJudgmentsService {
  static async getJudgments(caseId?: string): Promise<CourtJudgment[]> {
    let query = supabase.from('court_judgments').select('*, case:court_cases(*), judge:court_judges(*)');
    if (caseId) query = query.eq('case_id', caseId);
    const { data, error } = await query.order('delivered_date', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  static async createJudgment(data: Partial<CourtJudgment>): Promise<CourtJudgment> {
    const { data: result, error } = await supabase.from('court_judgments').insert(data).select().maybeSingle();
    if (error) throw error;
    return result;
  }
}
