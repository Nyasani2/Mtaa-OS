import { supabase } from '@/lib/supabase';
import { PrisonMovement } from '../types';

export class PrisonMovementsService {
  static async getMovements(facilityId?: string): Promise<PrisonMovement[]> {
    let query = supabase.from('prison_movements').select('*, inmate:prison_inmates(*)');
    if (facilityId) query = query.or(`from_facility_id.eq.${facilityId},to_facility_id.eq.${facilityId}`);
    const { data, error } = await query.order('occurred_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  static async createMovement(data: Partial<PrisonMovement>): Promise<PrisonMovement> {
    const { data: result, error } = await supabase.from('prison_movements').insert(data).select().single();
    if (error) throw error;
    return result;
  }

  static async updateMovementStatus(id: string, status: string): Promise<void> {
    const { error } = await supabase.from('prison_movements').update({ status }).eq('id', id);
    if (error) throw error;
  }
}
