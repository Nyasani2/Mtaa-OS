import { supabase } from '@/lib/supabase';
import { CourtStats } from '../types';

export class CourtStatsService {
  static async getStats(courtHouseId: string): Promise<CourtStats | null> {
    const { data, error } = await supabase.from('court_stats').select('*').eq('court_house_id', courtHouseId).single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  static async generateStats(courtHouseId: string): Promise<CourtStats> {
    const { data: cases } = await supabase.from('court_cases').select('status').eq('court_house_id', courtHouseId);
    const casesByStatus: Record<string, number> = {};
    (cases || []).forEach((c: any) => {
      casesByStatus[c.status] = (casesByStatus[c.status] || 0) + 1;
    });

    const { data: types } = await supabase.from('court_cases').select('case_type').eq('court_house_id', courtHouseId);
    const casesByType: Record<string, number> = {};
    (types || []).forEach((c: any) => {
      casesByType[c.case_type] = (casesByType[c.case_type] || 0) + 1;
    });

    const statsData = {
      court_house_id: courtHouseId,
      total_cases: (cases || []).length,
      pending_cases: casesByStatus['pending'] || 0,
      resolved_cases: casesByStatus['closed'] || 0,
      appealed_cases: casesByStatus['appealed'] || 0,
      avg_resolution_days: 0,
      cases_by_status: casesByStatus,
      cases_by_type: casesByType,
      updated_at: new Date().toISOString()
    };

    const { data: result, error } = await supabase.from('court_stats').upsert(statsData, { onConflict: 'court_house_id' }).select().single();
    if (error) throw error;
    return result;
  }
}
