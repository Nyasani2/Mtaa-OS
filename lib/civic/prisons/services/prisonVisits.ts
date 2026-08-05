import { supabase } from '@/lib/supabase';
import { PrisonVisit } from '../types';

export class PrisonVisitsService {
  static async getVisits(facilityId?: string, inmateId?: string): Promise<PrisonVisit[]> {
    let query = supabase.from('prison_visits').select('*, inmate:prison_inmates(*)');
    if (facilityId) query = query.eq('facility_id', facilityId);
    if (inmateId) query = query.eq('inmate_id', inmateId);
    const { data, error } = await query.order('scheduled_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  static async getVisitById(id: string): Promise<PrisonVisit | null> {
    const { data, error } = await supabase.from('prison_visits')
      .select('*, inmate:prison_inmates(*)')
      .eq('id', id)
      .maybeSingle();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  static async createVisit(data: Partial<PrisonVisit>): Promise<PrisonVisit> {
    const { data: result, error } = await supabase.from('prison_visits').insert(data).select().maybeSingle();
    if (error) throw error;
    return result;
  }

  static async updateVisit(id: string, data: Partial<PrisonVisit>): Promise<PrisonVisit> {
    const { data: result, error } = await supabase.from('prison_visits').update(data).eq('id', id).select().maybeSingle();
    if (error) throw error;
    return result;
  }

  static async checkInVisit(id: string): Promise<void> {
    const { error } = await supabase.from('prison_visits').update({
      status: 'checked_in',
      check_in: new Date().toISOString()
    }).eq('id', id);
    if (error) throw error;
  }

  static async checkOutVisit(id: string): Promise<void> {
    const { error } = await supabase.from('prison_visits').update({
      status: 'completed',
      check_out: new Date().toISOString()
    }).eq('id', id);
    if (error) throw error;
  }
}
