import { supabase } from '@/lib/supabase';
import { PrisonIncident } from '../types';

export class PrisonIncidentsService {
  static async getIncidents(facilityId: string): Promise<PrisonIncident[]> {
    const { data, error } = await supabase.from('prison_incidents')
      .select('*, inmate:prison_inmates(*), reporter:prison_wardens(*)')
      .eq('facility_id', facilityId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  static async getIncidentById(id: string): Promise<PrisonIncident | null> {
    const { data, error } = await supabase.from('prison_incidents')
      .select('*, inmate:prison_inmates(*), reporter:prison_wardens(*)')
      .eq('id', id)
      .maybeSingle();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  static async createIncident(data: Partial<PrisonIncident>): Promise<PrisonIncident> {
    const { data: result, error } = await supabase.from('prison_incidents').insert(data).select().maybeSingle();
    if (error) throw error;
    return result;
  }

  static async updateIncident(id: string, data: Partial<PrisonIncident>): Promise<PrisonIncident> {
    const { data: result, error } = await supabase.from('prison_incidents').update(data).eq('id', id).select().maybeSingle();
    if (error) throw error;
    return result;
  }

  static async resolveIncident(id: string, resolutionNotes: string, resolvedBy: string): Promise<void> {
    const { error } = await supabase.from('prison_incidents').update({
      status: 'resolved',
      resolution_notes: resolutionNotes,
      resolved_by: resolvedBy,
      updated_at: new Date().toISOString()
    }).eq('id', id);
    if (error) throw error;
  }
}
