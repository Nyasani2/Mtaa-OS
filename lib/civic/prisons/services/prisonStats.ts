import { supabase } from '@/lib/supabase';
import { PrisonStats } from '../types';

export class PrisonStatsService {
  static async getStats(facilityId: string): Promise<PrisonStats | null> {
    const { data, error } = await supabase.from('prison_stats').select('*').eq('facility_id', facilityId).maybeSingle();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  static async generateStats(facilityId: string): Promise<PrisonStats> {
    const { data: inmates } = await supabase.from('prison_inmates').select('status').eq('facility_id', facilityId);
    const { data: cells } = await supabase.from('prison_cells').select('current_occupancy,capacity').eq('facility_id', facilityId);
    const { data: wardens } = await supabase.from('prison_wardens').select('*').eq('facility_id', facilityId).eq('is_active', true);
    const { data: incidents } = await supabase.from('prison_incidents').select('*').eq('facility_id', facilityId).gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString());
    const { data: visits } = await supabase.from('prison_visits').select('*').eq('facility_id', facilityId).gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString());

    const inmatesByStatus: Record<string, number> = {};
    (inmates || []).forEach((i: any) => {
      inmatesByStatus[i.status] = (inmatesByStatus[i.status] || 0) + 1;
    });

    const totalInmates = (inmates || []).length;
    const totalCells = (cells || []).length;
    const totalCapacity = (cells || []).reduce((sum: number, c: any) => sum + (c.capacity || 0), 0);
    const occupancyRate = totalCapacity > 0 ? Math.round((totalInmates / totalCapacity) * 100) : 0;

    const statsData = {
      facility_id: facilityId,
      total_inmates: totalInmates,
      total_cells: totalCells,
      occupancy_rate: occupancyRate,
      active_wardens: (wardens || []).length,
      incidents_this_month: (incidents || []).length,
      visits_this_month: (visits || []).length,
      inmates_by_status: inmatesByStatus,
      updated_at: new Date().toISOString()
    };

    const { data: result, error } = await supabase.from('prison_stats').upsert(statsData, { onConflict: 'facility_id' }).select().maybeSingle();
    if (error) throw error;
    return result;
  }
}
