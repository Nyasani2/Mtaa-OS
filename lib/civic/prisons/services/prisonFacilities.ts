import { supabase } from '@/lib/supabase';
import { PrisonFacility } from '../types';

export class PrisonFacilitiesService {
  static async getFacilities(): Promise<PrisonFacility[]> {
    const { data, error } = await supabase.from('prison_facilities').select('*');
    if (error) throw error;
    return data || [];
  }

  static async getFacilityById(id: string): Promise<PrisonFacility | null> {
    const { data, error } = await supabase.from('prison_facilities').select('*').eq('id', id).maybeSingle();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  static async createFacility(data: Partial<PrisonFacility>): Promise<PrisonFacility> {
    const { data: result, error } = await supabase.from('prison_facilities').insert(data).select().maybeSingle();
    if (error) throw error;
    return result;
  }

  static async updateFacility(id: string, data: Partial<PrisonFacility>): Promise<PrisonFacility> {
    const { data: result, error } = await supabase.from('prison_facilities').update(data).eq('id', id).select().maybeSingle();
    if (error) throw error;
    return result;
  }
}
