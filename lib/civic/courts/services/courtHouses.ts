import { supabase } from '@/lib/supabase';
import { CourtHouse } from '../types';

export class CourtHousesService {
  static async getHouses(): Promise<CourtHouse[]> {
    const { data, error } = await supabase.from('court_houses').select('*');
    if (error) throw error;
    return data || [];
  }

  static async getHouseById(id: string): Promise<CourtHouse | null> {
    const { data, error } = await supabase.from('court_houses').select('*').eq('id', id).maybeSingle();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }
}
