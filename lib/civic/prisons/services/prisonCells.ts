import { supabase } from '@/lib/supabase';
import { PrisonCell } from '../types';

export class PrisonCellsService {
  static async getCells(facilityId: string): Promise<PrisonCell[]> {
    const { data, error } = await supabase.from('prison_cells').select('*').eq('facility_id', facilityId);
    if (error) throw error;
    return data || [];
  }

  static async getCellById(id: string): Promise<PrisonCell | null> {
    const { data, error } = await supabase.from('prison_cells').select('*').eq('id', id).single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  static async createCell(data: Partial<PrisonCell>): Promise<PrisonCell> {
    const { data: result, error } = await supabase.from('prison_cells').insert(data).select().single();
    if (error) throw error;
    return result;
  }

  static async updateCell(id: string, data: Partial<PrisonCell>): Promise<PrisonCell> {
    const { data: result, error } = await supabase.from('prison_cells').update(data).eq('id', id).select().single();
    if (error) throw error;
    return result;
  }

  static async deleteCell(id: string): Promise<void> {
    const { error } = await supabase.from('prison_cells').delete().eq('id', id);
    if (error) throw error;
  }
}
