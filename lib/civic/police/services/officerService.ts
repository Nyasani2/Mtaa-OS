import { supabase } from '@/lib/supabase';
import { PoliceOfficer, DutyStatus } from '../types/police.types';

export interface OfficerStats {
  totalCases: number;
  openCases: number;
  closedCases: number;
  incidentsHandled: number;
  responseTimeAvg: number;
}

export class OfficerService {
  async getOfficers(filters?: { stationId?: string; status?: DutyStatus; rank?: string } | string) {
    let query = supabase.from('police_officers').select('*');
    if (typeof filters === 'string') {
      query = query.eq('station_id', filters);
    } else if (filters) {
      if (filters.stationId) query = query.eq('station_id', filters.stationId);
      if (filters.status) query = query.eq('duty_status', filters.status);
      if (filters.rank) query = query.eq('rank', filters.rank);
    }
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data as PoliceOfficer[];
  }

  async getOfficerById(id: string) {
    const { data, error } = await supabase.from('police_officers').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data as PoliceOfficer;
  }

  async getOfficerByUserId(userId: string) {
    const { data, error } = await supabase.from('police_officers').select('*').eq('user_id', userId).maybeSingle();
    if (error) throw error;
    return data as PoliceOfficer;
  }

  async createOfficer(officer: Omit<PoliceOfficer, 'id' | 'created_at'>) {
    const { data, error } = await supabase.from('police_officers').insert(officer).select().maybeSingle();
    if (error) throw error;
    return data as PoliceOfficer;
  }

  async updateOfficer(id: string, updates: Partial<PoliceOfficer>) {
    const { data, error } = await supabase.from('police_officers').update(updates).eq('id', id).select().maybeSingle();
    if (error) throw error;
    return data as PoliceOfficer;
  }

  async getOfficerStats(officerId: string): Promise<OfficerStats> {
    const { data, error } = await supabase.rpc('get_officer_stats', { p_officer_id: officerId });
    if (error) throw error;
    return data as OfficerStats;
  }

  async updateOfficerStatus(id: string, status: DutyStatus | string) {
    const { data, error } = await supabase.from('police_officers')
      .update({ duty_status: status as DutyStatus, updated_at: new Date().toISOString() }).eq('id', id).select().maybeSingle();
    if (error) throw error;
    return data as PoliceOfficer;
  }

  async updateDutyStatus(id: string, status: DutyStatus | string) {
    return this.updateOfficerStatus(id, status);
  }
}

export const officerService = new OfficerService();
