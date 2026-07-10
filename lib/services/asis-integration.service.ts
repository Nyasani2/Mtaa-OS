import { supabase } from '@/lib/supabase';

export interface ASISAnalysisRequest {
  recording_id: string;
  analysis_type: 'driver_distraction' | 'phone_usage' | 'seatbelt' | 'fatigue' | 'aggressive_driving' | 'tailgating' | 'near_collision' | 'unsafe_overtake' | 'lane_departure' | 'collision_risk' | 'vehicle_misuse' | 'cargo_safety' | 'passenger_safety' | 'fleet_trends';
  video_segment?: { start_seconds: number; end_seconds: number };
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface ASISAnalysisResult {
  id: string;
  recording_id: string;
  analysis_type: string;
  findings: ASISFinding[];
  risk_score: number;
  recommendations: string[];
  processed_at: string;
  processing_duration_ms: number;
}

export interface ASISFinding {
  timestamp_seconds: number;
  confidence: number;
  label: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  bounding_box?: { x: number; y: number; width: number; height: number };
  metadata?: any;
}

export async function requestASISAnalysis(request: ASISAnalysisRequest) {
  const { data, error } = await supabase.functions.invoke('asis-analyze', {
    body: request,
  });
  if (error) throw error;
  return data as ASISAnalysisResult;
}

export async function getASISAnalysisForRecording(recordingId: string) {
  const { data, error } = await supabase
    .from('asis_analysis_results')
    .select('*')
    .eq('recording_id', recordingId)
    .order('processed_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getASISFindings(analysisId: string) {
  const { data, error } = await supabase
    .from('asis_findings')
    .select('*')
    .eq('analysis_id', analysisId)
    .order('timestamp_seconds', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function getDriverRiskProfile(driverId: string, periodDays: number = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - periodDays);

  const { data: analyses } = await supabase
    .from('asis_analysis_results')
    .select('*, recording:recording_id(driver_id)')
    .gte('processed_at', startDate.toISOString());

  const driverAnalyses = (analyses || []).filter((a: any) => a.recording?.driver_id === driverId);

  if (driverAnalyses.length === 0) {
    return {
      driver_id: driverId,
      period_days: periodDays,
      overall_risk_score: 50,
      risk_trend: 'stable' as const,
      top_concerns: [],
      improvement_areas: [],
      analysis_count: 0,
    };
  }

  const avgRisk = driverAnalyses.reduce((sum: number, a: any) => sum + (a.risk_score || 0), 0) / driverAnalyses.length;

  // Count findings by severity
  const { data: findings } = await supabase
    .from('asis_findings')
    .select('severity')
    .in('analysis_id', driverAnalyses.map((a: any) => a.id));

  const severityCounts: Record<string, number> = {};
  (findings || []).forEach((f: any) => {
    severityCounts[f.severity] = (severityCounts[f.severity] || 0) + 1;
  });

  const topConcerns = Object.entries(severityCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([severity, count]) => ({ severity, count }));

  return {
    driver_id: driverId,
    period_days: periodDays,
    overall_risk_score: Math.round(avgRisk),
    risk_trend: avgRisk > 70 ? 'worsening' : avgRisk < 40 ? 'improving' : 'stable',
    top_concerns: topConcerns,
    improvement_areas: generateImprovementAreas(severityCounts),
    analysis_count: driverAnalyses.length,
  };
}

function generateImprovementAreas(severityCounts: Record<string, number>): string[] {
  const areas: string[] = [];
  if (severityCounts.critical > 0) areas.push('Immediate intervention required for critical events');
  if (severityCounts.high > 2) areas.push('High-severity events trending — review driving patterns');
  if (severityCounts.medium > 5) areas.push('Multiple medium-risk behaviors detected — training recommended');
  if (areas.length === 0) areas.push('Continue current safe driving practices');
  return areas;
}

export async function getFleetRiskSummary(periodDays: number = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - periodDays);

  const { data: analyses } = await supabase
    .from('asis_analysis_results')
    .select('risk_score, recording:recording_id(driver_id)')
    .gte('processed_at', startDate.toISOString());

  const byDriver: Record<string, number[]> = {};
  (analyses || []).forEach((a: any) => {
    const driverId = a.recording?.driver_id;
    if (driverId) {
      if (!byDriver[driverId]) byDriver[driverId] = [];
      byDriver[driverId].push(a.risk_score || 0);
    }
  });

  const driverSummaries = Object.entries(byDriver).map(([driverId, scores]) => ({
    driver_id: driverId,
    avg_risk_score: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
    analysis_count: scores.length,
  }));

  const highRiskDrivers = driverSummaries.filter(d => d.avg_risk_score > 70);
  const lowRiskDrivers = driverSummaries.filter(d => d.avg_risk_score < 40);

  return {
    total_drivers_analyzed: driverSummaries.length,
    fleet_avg_risk_score: driverSummaries.length > 0
      ? Math.round(driverSummaries.reduce((sum, d) => sum + d.avg_risk_score, 0) / driverSummaries.length)
      : 50,
    high_risk_drivers: highRiskDrivers,
    low_risk_drivers: lowRiskDrivers,
    period_days: periodDays,
  };
}

export async function triggerAutomaticAnalysis(recordingId: string, eventType: string) {
  const analysisTypes: Record<string, string[]> = {
    crash: ['collision_risk', 'aggressive_driving'],
    emergency_brake: ['tailgating', 'collision_risk'],
    harsh_acceleration: ['aggressive_driving', 'vehicle_misuse'],
    harsh_braking: ['tailgating', 'aggressive_driving'],
    harsh_cornering: ['aggressive_driving', 'vehicle_misuse'],
    overspeed: ['aggressive_driving', 'collision_risk'],
    driver_fatigue: ['fatigue', 'driver_distraction'],
    phone_usage: ['phone_usage', 'driver_distraction'],
    seatbelt: ['seatbelt', 'passenger_safety'],
  };

  const types = analysisTypes[eventType] || ['fleet_trends'];

  const results = [];
  for (const analysisType of types) {
    try {
      const result = await requestASISAnalysis({
        recording_id: recordingId,
        analysis_type: analysisType as any,
        priority: eventType === 'crash' || eventType === 'emergency_brake' ? 'critical' : 'high',
      });
      results.push(result);
    } catch (e) {
      console.error(`ASIS analysis failed for ${analysisType}:`, e);
    }
  }

  return results;
}

// ASIS analysis types for UI
export const ASIS_ANALYSIS_TYPES = [
  { id: 'driver_distraction', name: 'Driver Distraction', icon: '📱', description: 'Detects phone usage, eating, or other distractions' },
  { id: 'phone_usage', name: 'Phone Usage', icon: '📞', description: 'Identifies mobile phone use while driving' },
  { id: 'seatbelt', name: 'Seatbelt Compliance', icon: '🔒', description: 'Checks if driver and passengers are belted' },
  { id: 'fatigue', name: 'Driver Fatigue', icon: '😴', description: 'Detects signs of drowsiness or fatigue' },
  { id: 'aggressive_driving', name: 'Aggressive Driving', icon: '😠', description: 'Identifies harsh maneuvers and road rage' },
  { id: 'tailgating', name: 'Tailgating', icon: '🚗', description: 'Detects following too closely' },
  { id: 'near_collision', name: 'Near Collision', icon: '⚠️', description: 'Identifies close calls and near misses' },
  { id: 'unsafe_overtake', name: 'Unsafe Overtake', icon: '🏎️', description: 'Detects dangerous passing maneuvers' },
  { id: 'lane_departure', name: 'Lane Departure', icon: '↔️', description: 'Identifies unintended lane changes' },
  { id: 'collision_risk', name: 'Collision Risk', icon: '💥', description: 'Assesses forward collision probability' },
  { id: 'vehicle_misuse', name: 'Vehicle Misuse', icon: '🚫', description: 'Detects unauthorized vehicle use' },
  { id: 'cargo_safety', name: 'Cargo Safety', icon: '📦', description: 'Checks load security and cargo condition' },
  { id: 'passenger_safety', name: 'Passenger Safety', icon: '👥', description: 'Monitors passenger behavior and safety' },
  { id: 'fleet_trends', name: 'Fleet Trends', icon: '📊', description: 'Analyzes patterns across the entire fleet' },
];
