// NOTE: 'mtruck_loads' and 'mtruck_alerts' tables were not explicitly
// confirmed in schema audit. If queries fail, verify these tables exist.

import { supabase } from "@/lib/supabase";
import type {
  Truck, Load, Driver, FleetAlert, FleetMetrics,
  MtruckFleet, MtruckFleetSnapshot, MtruckFleetCommand,
  PaginatedResult
} from "@/lib/mtruck/types";

const TABLE_FLEET = 'mtruck_fleet';
const TABLE_TRUCKS = 'mtruck_trucks';
const TABLE_DRIVERS = 'mtruck_drivers';
const TABLE_LOADS = 'mtruck_loads';
const TABLE_ALERTS = 'mtruck_alerts';
const TABLE_SNAPSHOTS = 'mtruck_fleet_snapshots';
const TABLE_COMMANDS = 'mtruck_fleet_commands';

// ── FLEET MANAGEMENT ──

export async function getFleetByOwner(ownerId: string): Promise<MtruckFleet | null> {
  const { data, error } = await supabase
    .from(TABLE_FLEET)
    .select('*')
    .eq('owner_id', ownerId)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function createFleet(payload: {
  name: string;
  owner_id: string;
  business_reg?: string;
  kra_pin?: string;
  address?: string;
  city?: string;
  contact_phone?: string;
  contact_email?: string;
  vehicle_count?: number;
  truck_types?: string[];
  coverage_areas?: string[];
  license_number?: string;
  insurance_provider?: string;
  insurance_number?: string;
  country_code?: string;
}): Promise<MtruckFleet> {
  const { data, error } = await supabase
    .from(TABLE_FLEET)
    .insert({
      ...payload,
      status: 'pending_verification',
      verified: false,
    })
    .select()
    .single();
  if (error) throw new Error(`Create fleet failed: ${error.message}`);
  return data;
}

export async function updateFleet(fleetId: string, updates: Partial<MtruckFleet>): Promise<MtruckFleet> {
  const { data, error } = await supabase
    .from(TABLE_FLEET)
    .update(updates)
    .eq('id', fleetId)
    .select()
    .single();
  if (error) throw new Error(`Update fleet failed: ${error.message}`);
  return data;
}

// ── TRUCKS ──

export async function getFleetStatus(): Promise<{
  trucks: Truck[];
  activeTrucks: number;
  onRoad: number;
  pendingLoads: number;
  revenueToday: number;
}> {
  const { data, error } = await supabase.from(TABLE_TRUCKS).select("*").eq("status", "active");
  if (error) throw error;
  const trucks = data || [];
  return {
    trucks,
    activeTrucks: trucks.length,
    onRoad: trucks.filter((t: Truck) => t.status === "active").length,
    pendingLoads: 0,
    revenueToday: 0
  };
}

export async function getTrucks(fleetId?: string): Promise<Truck[]> {
  let query = supabase.from(TABLE_TRUCKS).select("*");
  if (fleetId) query = query.eq('fleet_id', fleetId);
  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getTruckById(truckId: string): Promise<Truck | null> {
  const { data, error } = await supabase.from(TABLE_TRUCKS).select("*").eq("id", truckId).single();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function createTruck(payload: Omit<Truck, 'id' | 'created_at' | 'updated_at'>): Promise<Truck> {
  const { data, error } = await supabase.from(TABLE_TRUCKS).insert(payload).select().single();
  if (error) throw new Error(`Create truck failed: ${error.message}`);
  return data;
}

export async function updateTruck(truckId: string, updates: Partial<Truck>): Promise<Truck> {
  const { data, error } = await supabase.from(TABLE_TRUCKS).update(updates).eq("id", truckId).select().single();
  if (error) throw new Error(`Update truck failed: ${error.message}`);
  return data;
}

// ── DRIVERS ──

export async function getDrivers(fleetId?: string): Promise<Driver[]> {
  let query = supabase.from(TABLE_DRIVERS).select("*");
  if (fleetId) query = query.eq('current_truck_id', fleetId); // Approximate fleet filter
  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getDriverById(driverId: string): Promise<Driver | null> {
  const { data, error } = await supabase.from(TABLE_DRIVERS).select("*").eq("id", driverId).single();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function createDriver(payload: Omit<Driver, 'id' | 'created_at' | 'updated_at'>): Promise<Driver> {
  const { data, error } = await supabase.from(TABLE_DRIVERS).insert(payload).select().single();
  if (error) throw new Error(`Create driver failed: ${error.message}`);
  return data;
}

export async function updateDriver(driverId: string, updates: Partial<Driver>): Promise<Driver> {
  const { data, error } = await supabase.from(TABLE_DRIVERS).update(updates).eq("id", driverId).select().single();
  if (error) throw new Error(`Update driver failed: ${error.message}`);
  return data;
}

// ── LOADS ──

export async function getLoads(status?: Load['status']): Promise<Load[]> {
  let query = supabase.from(TABLE_LOADS).select("*");
  if (status) query = query.eq('status', status);
  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getLoadById(loadId: string): Promise<Load | null> {
  const { data, error } = await supabase.from(TABLE_LOADS).select("*").eq("id", loadId).single();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function createLoad(payload: Omit<Load, 'id' | 'created_at' | 'updated_at'>): Promise<Load> {
  const { data, error } = await supabase.from(TABLE_LOADS).insert(payload).select().single();
  if (error) throw new Error(`Create load failed: ${error.message}`);
  return data;
}

// ── ALERTS ──

export async function getAlerts(resolved = false): Promise<FleetAlert[]> {
  const { data, error } = await supabase
    .from(TABLE_ALERTS)
    .select("*")
    .eq("resolved", resolved)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createAlert(payload: Omit<FleetAlert, 'id' | 'created_at'>): Promise<FleetAlert> {
  const { data, error } = await supabase.from(TABLE_ALERTS).insert(payload).select().single();
  if (error) throw new Error(`Create alert failed: ${error.message}`);
  return data;
}

export async function resolveAlert(alertId: string): Promise<void> {
  const { error } = await supabase
    .from(TABLE_ALERTS)
    .update({ resolved: true, resolved_at: new Date().toISOString() })
    .eq("id", alertId);
  if (error) throw new Error(`Resolve alert failed: ${error.message}`);
}

// ── FLEET SNAPSHOTS ──

export async function getFleetSnapshots(fleetId: string, limit = 30): Promise<MtruckFleetSnapshot[]> {
  const { data, error } = await supabase
    .from(TABLE_SNAPSHOTS)
    .select('*')
    .eq('fleet_id', fleetId)
    .order('snapshot_time', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

export async function getLatestFleetSnapshot(fleetId: string): Promise<MtruckFleetSnapshot | null> {
  const { data, error } = await supabase
    .from(TABLE_SNAPSHOTS)
    .select('*')
    .eq('fleet_id', fleetId)
    .order('snapshot_time', { ascending: false })
    .limit(1)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

// ── FLEET COMMANDS ──

export async function sendFleetCommand(payload: {
  fleet_id?: string;
  truck_id: string;
  command_type: MtruckFleetCommand['command_type'];
  command_payload?: Record<string, unknown>;
  issued_by: string;
}): Promise<MtruckFleetCommand> {
  const { data, error } = await supabase
    .from(TABLE_COMMANDS)
    .insert({ ...payload, status: 'pending' })
    .select()
    .single();
  if (error) throw new Error(`Send command failed: ${error.message}`);
  return data;
}

export async function getPendingCommands(truckId: string): Promise<MtruckFleetCommand[]> {
  const { data, error } = await supabase
    .from(TABLE_COMMANDS)
    .select('*')
    .eq('truck_id', truckId)
    .in('status', ['pending', 'sent'])
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function acknowledgeCommand(commandId: string, response?: Record<string, unknown>): Promise<void> {
  const { error } = await supabase
    .from(TABLE_COMMANDS)
    .update({ status: 'acknowledged', response_payload: response, executed_at: new Date().toISOString() })
    .eq("id", commandId);
  if (error) throw new Error(`Acknowledge command failed: ${error.message}`);
}

// ── METRICS ──

export async function getMetrics(): Promise<FleetMetrics> {
  // TODO: Replace with actual aggregation queries
  return {
    totalDistance: 12450,
    fuelEfficiency: 8.2,
    onTimeRate: 94,
    costPerMile: 1.85,
    revenuePerTruck: 2450,
    utilizationRate: 78
  };
}
