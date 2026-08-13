import { supabase } from "@/lib/supabase";
import type { MtruckInspection, MtruckMaintenanceAlert } from "@/lib/mtruck/types";

const TABLE_INSPECTIONS = 'mtruck_inspections';
const TABLE_MAINTENANCE_ALERTS = 'mtruck_maintenance_alerts';

export async function scheduleInspection(payload: {
  truck_id: string;
  driver_id?: string;
  inspector_id?: string;
  inspection_type: MtruckInspection['inspection_type'];
  checklist?: Record<string, boolean>;
  next_due_date?: string;
  notes?: string;
}): Promise<MtruckInspection> {
  const { data, error } = await supabase
    .from(TABLE_INSPECTIONS)
    .insert({
      ...payload,
      checklist: payload.checklist ?? {},
      defects_found: [],
      photos: [],
      status: 'pending'
    })
    .select()
    .maybeSingle();
  if (error) throw new Error(`Schedule inspection failed: ${error.message}`);
  return data;
}

export async function getTruckInspections(truckId: string): Promise<MtruckInspection[]> {
  const { data, error } = await supabase
    .from(TABLE_INSPECTIONS)
    .select('*')
    .eq('truck_id', truckId)
    .order('conducted_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getPendingInspections(fleetId?: string): Promise<MtruckInspection[]> {
  let query = supabase
    .from(TABLE_INSPECTIONS)
    .select('*, truck:mtruck_trucks(id, plate_number, fleet_id)')
    .eq('status', 'pending');
  if (fleetId) query = query.eq('truck.fleet_id', fleetId);
  const { data, error } = await query.order('next_due_date', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function submitInspectionResults(
  inspectionId: string,
  results: {
    brakes_ok?: boolean;
    tyres_ok?: boolean;
    lights_ok?: boolean;
    load_security_ok?: boolean;
    fire_extinguisher_ok?: boolean;
    first_aid_kit_ok?: boolean;
    reflectors_ok?: boolean;
    weight_capacity_verified?: boolean;
    emissions_passed?: boolean;
    defects_found?: string[];
    photos?: string[];
    notes?: string;
  }
): Promise<{ passed: boolean; data: MtruckInspection }> {
  const checklist = {
    brakes_ok: results.brakes_ok ?? false,
    tyres_ok: results.tyres_ok ?? false,
    lights_ok: results.lights_ok ?? false,
    load_security_ok: results.load_security_ok ?? false,
    fire_extinguisher_ok: results.fire_extinguisher_ok ?? false,
    first_aid_kit_ok: results.first_aid_kit_ok ?? false,
    reflectors_ok: results.reflectors_ok ?? false,
    weight_capacity_verified: results.weight_capacity_verified ?? false,
    emissions_passed: results.emissions_passed ?? false,
  };
  const allPass = Object.values(checklist).every((v: any) => v === true);
  const { data, error } = await supabase
    .from(TABLE_INSPECTIONS)
    .update({
      checklist,
      defects_found: results.defects_found ?? [],
      photos: results.photos ?? [],
      status: allPass ? 'passed' : 'failed',
      notes: results.notes,
      conducted_at: new Date().toISOString(),
    })
    .eq('id', inspectionId)
    .select()
    .maybeSingle();
  if (error) throw new Error(`Submit inspection failed: ${error.message}`);
  return { passed: allPass, data };
}

// ── MAINTENANCE ALERTS ──

export async function createMaintenanceAlert(payload: {
  truck_id: string;
  alert_type: MtruckMaintenanceAlert['alert_type'];
  severity?: MtruckMaintenanceAlert['severity'];
  title: string;
  description?: string;
  recommended_action?: string;
  estimated_cost?: number;
  due_date?: string;
  due_km?: number;
  current_km_at_alert?: number;
}): Promise<MtruckMaintenanceAlert> {
  const { data, error } = await supabase
    .from(TABLE_MAINTENANCE_ALERTS)
    .insert({
      ...payload,
      severity: payload.severity ?? 'info',
      is_resolved: false
    })
    .select()
    .maybeSingle();
  if (error) throw new Error(`Create maintenance alert failed: ${error.message}`);
  return data;
}

export async function getMaintenanceAlerts(truckId?: string, resolved = false): Promise<MtruckMaintenanceAlert[]> {
  let query = supabase.from(TABLE_MAINTENANCE_ALERTS).select('*').eq('is_resolved', resolved);
  if (truckId) query = query.eq('truck_id', truckId);
  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function resolveMaintenanceAlert(alertId: string, resolvedBy: string): Promise<void> {
  const { error } = await supabase
    .from(TABLE_MAINTENANCE_ALERTS)
    .update({ is_resolved: true, resolved_at: new Date().toISOString(), resolved_by: resolvedBy })
    .eq('id', alertId);
  if (error) throw new Error(`Resolve alert failed: ${error.message}`);
}
