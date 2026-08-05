import { supabase } from '@/lib/supabase';
import { PrisonWarden } from '../types';

export class PrisonWardensService {
  static async getWardens(facilityId?: string): Promise<PrisonWarden[]> {
    let query = supabase.from('prison_wardens').select('*');
    if (facilityId) query = query.eq('facility_id', facilityId);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  static async getWardenById(id: string): Promise<PrisonWarden | null> {
    const { data, error } = await supabase.from('prison_wardens').select('*').eq('id', id).maybeSingle();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  static async createWarden(data: Partial<PrisonWarden>): Promise<PrisonWarden> {
    const { data: result, error } = await supabase.from('prison_wardens').insert(data).select().maybeSingle();
    if (error) throw error;
    return result;
  }

  static async updateWarden(id: string, data: Partial<PrisonWarden>): Promise<PrisonWarden> {
    const { data: result, error } = await supabase.from('prison_wardens').update(data).eq('id', id).select().maybeSingle();
    if (error) throw error;
    return result;
  }

  static async deactivateWarden(id: string): Promise<void> {
    const { error } = await supabase.from('prison_wardens').update({ is_active: false }).eq('id', id);
    if (error) throw error;
  }
}
