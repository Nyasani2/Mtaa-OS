import { supabase } from '@/lib/supabase';

export interface DriverScore {
  id: string;
  driver_id: string;
  vehicle_id?: string;
  period_start: string;
  period_end: string;
  overall_score: number;
  safety_score: number;
  smoothness_score: number;
  compliance_score: number;
  efficiency_score: number;
  incident_count: number;
  harsh_braking_count: number;
  harsh_acceleration_count: number;
  harsh_cornering_count: number;
  overspeed_count: number;
  total_distance_km: number;
  total_driving_hours: number;
  fatigue_alerts: number;
  phone_usage_count: number;
  seatbelt_violations: number;
  metadata: any;
  created_at: string;
  updated_at: string;
}

export interface ScoreBreakdown {
  category: string;
  score: number;
  weight: number;
  incidents: number;
  trend: 'up' | 'down' | 'stable';
}

export async function calculateDriverScore(
  driverId: string,
  periodStart: string,
  periodEnd: string,
  vehicleId?: string
): Promise<DriverScore> {
  // Fetch incidents in period
  const { data: incidents } = await supabase
    .from('incidents')
    .select('*')
    .eq('driver_id', driverId)
    .gte('created_at', periodStart)
    .lte('created_at', periodEnd);

  // Fetch recordings in period
  const { data: recordings } = await supabase
    .from('recordings')
    .select('*')
    .eq('driver_id', driverId)
    .gte('started_at', periodStart)
    .lte('started_at', periodEnd);

  const harshBraking = (incidents || []).filter(i => i.incident_type === 'harsh_braking').length;
  const harshAccel = (incidents || []).filter(i => i.incident_type === 'harsh_acceleration').length;
  const harshCorner = (incidents || []).filter(i => i.incident_type === 'harsh_cornering').length;
  const overspeed = (incidents || []).filter(i => i.incident_type === 'overspeed').length;
  const fatigue = (incidents || []).filter(i => i.incident_type === 'driver_fatigue').length;
  const totalIncidents = (incidents || []).length;

  const totalDistance = (recordings || []).reduce((sum: number, r: any) => sum + (r.avg_speed_kmh || 0) * ((r.duration_seconds || 0) / 3600), 0);
  const totalHours = (recordings || []).reduce((sum: number, r: any) => sum + (r.duration_seconds || 0) / 3600, 0);

  // Calculate scores (0-100)
  const safetyScore = Math.max(0, 100 - totalIncidents * 5 - harshBraking * 3 - harshAccel * 3);
  const smoothnessScore = Math.max(0, 100 - harshBraking * 4 - harshAccel * 4 - harshCorner * 3);
  const complianceScore = Math.max(0, 100 - overspeed * 5 - fatigue * 10);
  const efficiencyScore = totalHours > 0 ? Math.min(100, (totalDistance / totalHours) * 2) : 50;

  const overallScore = Math.round(
    (safetyScore * 0.4 + smoothnessScore * 0.25 + complianceScore * 0.2 + efficiencyScore * 0.15)
  );

  const scoreData = {
    driver_id: driverId,
    vehicle_id: vehicleId,
    period_start: periodStart,
    period_end: periodEnd,
    overall_score: overallScore,
    safety_score: Math.round(safetyScore),
    smoothness_score: Math.round(smoothnessScore),
    compliance_score: Math.round(complianceScore),
    efficiency_score: Math.round(efficiencyScore),
    incident_count: totalIncidents,
    harsh_braking_count: harshBraking,
    harsh_acceleration_count: harshAccel,
    harsh_cornering_count: harshCorner,
    overspeed_count: overspeed,
    total_distance_km: Math.round(totalDistance * 10) / 10,
    total_driving_hours: Math.round(totalHours * 10) / 10,
    fatigue_alerts: fatigue,
    phone_usage_count: 0, // Would come from ASIS analysis
    seatbelt_violations: 0, // Would come from ASIS analysis
    metadata: { incidents: incidents?.map((i: any) => i.id) },
  };

  const { data, error } = await supabase
    .from('driver_scores')
    .upsert(scoreData, { onConflict: 'driver_id,period_start' })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getDriverScores(driverId: string, limit = 12) {
  const { data, error } = await supabase
    .from('driver_scores')
    .select('*')
    .eq('driver_id', driverId)
    .order('period_start', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

export async function getLatestDriverScore(driverId: string) {
  const { data, error } = await supabase
    .from('driver_scores')
    .select('*')
    .eq('driver_id', driverId)
    .order('period_start', { ascending: false })
    .limit(1)
    .single();
  if (error) return null;
  return data;
}

export async function getFleetScores(periodStart: string, periodEnd: string) {
  const { data, error } = await supabase
    .from('driver_scores')
    .select(`
      *,
      driver:driver_id(id, full_name, avatar_url)
    `)
    .gte('period_start', periodStart)
    .lte('period_end', periodEnd)
    .order('overall_score', { ascending: false });
  if (error) throw error;
  return data || [];
}

export function getScoreColor(score: number): string {
  if (score >= 90) return '#22c55e';
  if (score >= 75) return '#84cc16';
  if (score >= 60) return '#f59e0b';
  if (score >= 40) return '#f97316';
  return '#ef4444';
}

export function getScoreLabel(score: number): string {
  if (score >= 90) return 'Excellent';
  if (score >= 75) return 'Good';
  if (score >= 60) return 'Average';
  if (score >= 40) return 'Poor';
  return 'Critical';
}
