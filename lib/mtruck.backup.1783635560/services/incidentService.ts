import { supabase } from "@/lib/supabase";
import type { MtruckIncident, MtruckSecurityAlert } from "@/lib/mtruck/types";

const TABLE_INCIDENTS = 'mtruck_incidents';
const TABLE_SECURITY_ALERTS = 'mtruck_security_alerts';

export async function reportIncident(payload: {
  truck_id?: string;
  driver_id?: string;
  job_id?: string;
  reporter_id: string;
  incident_type: MtruckIncident['incident_type'];
  severity: MtruckIncident['severity'];
  description?: string;
  location?: { lat: number; lng: number; address?: string };
  photos?: string[];
  police_report_number?: string;
  insurance_claim_id?: string;
}): Promise<MtruckIncident> {
  const { data, error } = await supabase
    .from(TABLE_INCIDENTS)
    .insert({
      ...payload,
      photos: payload.photos ?? [],
      status: 'reported'
    })
    .select()
    .single();
  if (error) throw new Error(`Report incident failed: ${error.message}`);
  return data;
}

export async function getIncidentsForUser(userId: string): Promise<MtruckIncident[]> {
  const { data, error } = await supabase
    .from(TABLE_INCIDENTS)
    .select("*, truck:mtruck_trucks(id, plate_number)")
    .or(`reporter_id.eq.${userId},driver_id.eq.${userId}`)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getIncidentsForFleet(fleetId: string): Promise<MtruckIncident[]> {
  const { data, error } = await supabase
    .from(TABLE_INCIDENTS)
    .select("*, truck:mtruck_trucks(id, plate_number, fleet_id)")
    .eq('truck.fleet_id', fleetId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function updateIncidentStatus(incidentId: string, status: MtruckIncident['status'], notes?: string): Promise<void> {
  const updates: Record<string, unknown> = { status };
  if (status === 'resolved') updates.resolved_at = new Date().toISOString();
  if (notes) updates.description = notes;
  const { error } = await supabase.from(TABLE_INCIDENTS).update(updates).eq('id', incidentId);
  if (error) throw new Error(`Update incident failed: ${error.message}`);
}

// ── SECURITY ALERTS ──

export async function createSecurityAlert(payload: {
  fleet_id?: string;
  truck_id: string;
  driver_id?: string;
  alert_type: MtruckSecurityAlert['alert_type'];
  severity: MtruckSecurityAlert['severity'];
  location?: { lat: number; lng: number; address?: string };
  triggered_value?: string;
  threshold_value?: string;
  video_evidence?: string;
}): Promise<MtruckSecurityAlert> {
  const { data, error } = await supabase
    .from(TABLE_SECURITY_ALERTS)
    .insert(payload)
    .select()
    .single();
  if (error) throw new Error(`Create security alert failed: ${error.message}`);
  return data;
}

export async function getSecurityAlerts(fleetId?: string, truckId?: string): Promise<MtruckSecurityAlert[]> {
  let query = supabase.from(TABLE_SECURITY_ALERTS).select('*');
  if (fleetId) query = query.eq('fleet_id', fleetId);
  if (truckId) query = query.eq('truck_id', truckId);
  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function markFalseAlarm(alertId: string): Promise<void> {
  const { error } = await supabase
    .from(TABLE_SECURITY_ALERTS)
    .update({ is_false_alarm: true })
    .eq('id', alertId);
  if (error) throw new Error(`Mark false alarm failed: ${error.message}`);
}
