import { supabase } from '@/lib/supabase';
import { CourtJuror, CourtJuryAssignment } from '../types';

export class CourtJuryService {
  static async getJurors(): Promise<CourtJuror[]> {
    const { data, error } = await supabase.from('court_jurors').select('*');
    if (error) throw error;
    return data || [];
  }

  static async getAssignments(caseId?: string): Promise<CourtJuryAssignment[]> {
    let query = supabase.from('court_jury_assignments').select('*, juror:court_jurors(*)');
    if (caseId) query = query.eq('case_id', caseId);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  static async assignJuror(data: Partial<CourtJuryAssignment>): Promise<CourtJuryAssignment> {
    const { data: result, error } = await supabase.from('court_jury_assignments').insert(data).select().maybeSingle();
    if (error) throw error;
    return result;
  }
}
