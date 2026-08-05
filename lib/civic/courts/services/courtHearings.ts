import { supabase } from '@/lib/supabase';
import { CourtHearing } from '../types';

export class CourtHearingsService {
  static async getHearings(courtHouseId?: string, caseId?: string): Promise<CourtHearing[]> {
    let query = supabase.from('court_hearings').select('*, case:court_cases(*), court_room:court_rooms(*), presiding_judge:court_judges(*)');
    if (courtHouseId) query = query.eq('court_room_id', courtHouseId);
    if (caseId) query = query.eq('case_id', caseId);
    const { data, error } = await query.order('scheduled_date', { ascending: true });
    if (error) throw error;
    return data || [];
  }

  static async createHearing(data: Partial<CourtHearing>): Promise<CourtHearing> {
    const { data: result, error } = await supabase.from('court_hearings').insert(data).select().maybeSingle();
    if (error) throw error;
    return result;
  }

  static async updateHearing(id: string, data: Partial<CourtHearing>): Promise<CourtHearing> {
    const { data: result, error } = await supabase.from('court_hearings').update(data).eq('id', id).select().maybeSingle();
    if (error) throw error;
    return result;
  }

  static async getCourtRooms(courtHouseId: string): Promise<any[]> {
    const { data, error } = await supabase.from('court_rooms').select('*').eq('court_house_id', courtHouseId);
    if (error) throw error;
    return data || [];
  }
}
