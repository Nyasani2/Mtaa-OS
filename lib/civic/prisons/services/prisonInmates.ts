import { supabase } from '@/lib/supabase';
import { PrisonInmate } from '../types';

export class PrisonInmatesService {
  static async getInmates(facilityId?: string): Promise<PrisonInmate[]> {
    let query = supabase.from('prison_inmates').select('*, facility:prison_facilities(*)');
    if (facilityId) query = query.eq('facility_id', facilityId);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  static async getInmateById(id: string): Promise<PrisonInmate | null> {
    const { data, error } = await supabase.from('prison_inmates')
      .select('*, facility:prison_facilities(*)')
      .eq('id', id)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  static async createInmate(data: Partial<PrisonInmate>): Promise<PrisonInmate> {
    const { data: result, error } = await supabase.from('prison_inmates').insert(data).select().single();
    if (error) throw error;
    return result;
  }

  static async updateInmate(id: string, data: Partial<PrisonInmate>): Promise<PrisonInmate> {
    const { data: result, error } = await supabase.from('prison_inmates').update(data).eq('id', id).select().single();
    if (error) throw error;
    return result;
  }

  static async transferInmate(inmateId: string, toFacilityId: string, authorizedBy: string): Promise<void> {
    const { error } = await supabase.from('prison_inmates').update({
      facility_id: toFacilityId,
      status: 'transferred'
    }).eq('id', inmateId);
    if (error) throw error;

    await supabase.from('prison_movements').insert({
      inmate_id: inmateId,
      from_facility_id: toFacilityId,
      to_facility_id: toFacilityId,
      movement_type: 'transfer',
      status: 'completed',
      occurred_at: new Date().toISOString(),
      authorized_by: authorizedBy
    });
  }
}
