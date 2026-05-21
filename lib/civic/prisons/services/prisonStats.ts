import { supabase } from '@/lib/supabase';
import { PrisonStats } from '@/types/prisons';

export async function getPrisonStats(): Promise<PrisonStats> {
  const { data: inmates, error: e1 } = await supabase.from('prison_inmates').select('status, risk_level, facility_id');
  if (e1) throw e1;
  const { data: facilities, error: e2 } = await supabase.from('prison_facilities').select('capacity, current_population');
  if (e2) throw e2;
  const { data: cells, error: e3 } = await supabase.from('prison_cells').select('capacity, current_occupancy');
  if (e3) throw e3;
  const { data: movements, error: e4 } = await supabase.from('prison_movements').select('occurred_at');
  if (e4) throw e4;
  const { data: visits, error: e5 } = await supabase.from('prison_visits').select('scheduled_at');
  if (e5) throw e5;
  const { data: incidents, error: e6 } = await supabase.from('prison_incidents').select('status');
  if (e6) throw e6;
  const { data: parole, error: e7 } = await supabase.from('prison_parole_reviews').select('decision');
  if (e7) throw e7;
  const { data: wardens, error: e8 } = await supabase.from('prison_wardens').select('id');
  if (e8) throw e8;
  const { data: payroll, error: e9 } = await supabase.from('prison_payroll').select('status');
  if (e9) throw e9;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const inmatesByStatus: Record<string, number> = {};
  const inmatesByRisk: Record<string, number> = {};
  inmates?.forEach((i: any) => {
    inmatesByStatus[i.status] = (inmatesByStatus[i.status] || 0) + 1;
    inmatesByRisk[i.risk_level] = (inmatesByRisk[i.risk_level] || 0) + 1;
  });

  const totalCapacity = facilities?.reduce((s: number, f: any) => s + (f.capacity || 0), 0) || 0;
  const currentPop = facilities?.reduce((s: number, f: any) => s + (f.current_population || 0), 0) || 0;

  return {
    total_inmates: inmates?.length || 0,
    inmates_by_status: inmatesByStatus,
    inmates_by_risk: inmatesByRisk,
    total_facilities: facilities?.length || 0,
    total_cells: cells?.length || 0,
    total_capacity: totalCapacity,
    current_population: currentPop,
    occupancy_rate: totalCapacity > 0 ? Math.round((currentPop / totalCapacity) * 100) : 0,
    total_movements: movements?.length || 0,
    movements_this_month: movements?.filter((m: any) => new Date(m.occurred_at) >= monthStart).length || 0,
    total_visits: visits?.length || 0,
    visits_this_week: visits?.filter((v: any) => new Date(v.scheduled_at) >= weekStart).length || 0,
    total_incidents: incidents?.length || 0,
    open_incidents: incidents?.filter((i: any) => i.status === 'open' || i.status === 'under_investigation').length || 0,
    total_parole_reviews: parole?.length || 0,
    paroles_granted: parole?.filter((p: any) => p.decision === 'granted').length || 0,
    total_wardens: wardens?.length || 0,
    total_payroll: payroll?.length || 0,
    payroll_pending: payroll?.filter((p: any) => p.status === 'pending').length || 0,
  };
}
