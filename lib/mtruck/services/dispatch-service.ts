import { supabase } from "@/lib/supabase";
import type { Load, MtruckJob, MtruckDelivery, MtruckShipment } from "@/lib/mtruck/types";

const TABLE_LOADS = 'mtruck_loads';
const TABLE_JOBS = 'mtruck_jobs';
const TABLE_DELIVERIES = 'mtruck_deliveries';
const TABLE_SHIPMENTS = 'mtruck_shipments';

// ── LOADS ──

export async function getAvailableLoads(): Promise<Load[]> {
  const { data, error } = await supabase
    .from(TABLE_LOADS)
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getAssignedLoads(driverId?: string): Promise<Load[]> {
  let query = supabase
    .from(TABLE_LOADS)
    .select("*")
    .in("status", ["assigned", "in_transit"]);
  if (driverId) query = query.eq('assigned_driver_id', driverId);
  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function assignLoad(loadId: string, truckId: string, driverId?: string): Promise<void> {
  const updates: Record<string, string | null> = { status: "assigned", assigned_truck_id: truckId };
  if (driverId) updates.assigned_driver_id = driverId;
  const { error } = await supabase.from(TABLE_LOADS).update(updates).eq("id", loadId);
  if (error) throw error;
}

export async function unassignLoad(loadId: string): Promise<void> {
  const { error } = await supabase
    .from(TABLE_LOADS)
    .update({ status: "pending", assigned_truck_id: null, assigned_driver_id: null })
    .eq("id", loadId);
  if (error) throw error;
}

export async function updateLoadStatus(loadId: string, status: Load['status']): Promise<void> {
  const { error } = await supabase.from(TABLE_LOADS).update({ status }).eq("id", loadId);
  if (error) throw error;
}

// ── JOBS ──

export async function getMyJobs(userId: string, role: 'shipper' | 'driver' | 'carrier'): Promise<MtruckJob[]> {
  let query = supabase.from(TABLE_JOBS).select('*');
  if (role === 'shipper') query = query.eq('shipper_id', userId);
  else if (role === 'driver') query = query.eq('assigned_driver_id', userId);
  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getJobById(jobId: string): Promise<MtruckJob | null> {
  const { data, error } = await supabase.from(TABLE_JOBS).select('*').eq('id', jobId).maybeSingle();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function updateJobStatus(jobId: string, status: MtruckJob['status'], updates?: Partial<MtruckJob>): Promise<void> {
  const { error } = await supabase.from(TABLE_JOBS).update({ status, ...updates }).eq('id', jobId);
  if (error) throw new Error(`Update job status failed: ${error.message}`);
}

// ── DELIVERIES ──

export async function createDelivery(payload: {
  job_id?: string;
  shipment_id?: string;
  driver_id?: string;
  truck_id?: string;
  pickup_location?: { lat: number; lng: number; address?: string };
  dropoff_location?: { lat: number; lng: number; address?: string };
  recipient_name?: string;
  notes?: string;
}): Promise<MtruckDelivery> {
  const { data, error } = await supabase
    .from(TABLE_DELIVERIES)
    .insert({ ...payload, status: 'pending' })
    .select()
    .maybeSingle();
  if (error) throw new Error(`Create delivery failed: ${error.message}`);
  return data;
}

export async function getDeliveriesForJob(jobId: string): Promise<MtruckDelivery[]> {
  const { data, error } = await supabase
    .from(TABLE_DELIVERIES)
    .select('*')
    .eq('job_id', jobId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function markDelivered(deliveryId: string, proof?: {
  photo_url?: string;
  signature_url?: string;
  notes?: string;
  gps_location?: { lat: number; lng: number };
}): Promise<void> {
  const { error } = await supabase
    .from(TABLE_DELIVERIES)
    .update({
      status: 'delivered',
      delivery_time: new Date().toISOString(),
      proof_of_delivery: proof ?? {}
    })
    .eq('id', deliveryId);
  if (error) throw new Error(`Mark delivered failed: ${error.message}`);
}

// ── SHIPMENTS ──

export async function createShipment(payload: {
  shipper_id?: string;
  load_id?: string;
  carrier_id?: string;
  origin: string;
  destination: string;
  weight_kg?: number;
  volume_cbm?: number;
  cargo_type?: string;
  declared_value?: number;
  currency?: string;
  tracking_number?: string;
  scheduled_pickup?: string;
  scheduled_delivery?: string;
  created_by: string;
}): Promise<MtruckShipment> {
  const { data, error } = await supabase
    .from(TABLE_SHIPMENTS)
    .insert({
      ...payload,
      declared_value: payload.declared_value ?? 0,
      currency: payload.currency ?? 'KES',
      status: 'pending'
    })
    .select()
    .maybeSingle();
  if (error) throw new Error(`Create shipment failed: ${error.message}`);
  return data;
}

export async function getShipmentByTracking(trackingNumber: string): Promise<MtruckShipment | null> {
  const { data, error } = await supabase
    .from(TABLE_SHIPMENTS)
    .select('*')
    .eq('tracking_number', trackingNumber)
    .maybeSingle();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function updateShipmentStatus(shipmentId: string, status: MtruckShipment['status']): Promise<void> {
  const { error } = await supabase
    .from(TABLE_SHIPMENTS)
    .update({ status, actual_delivery: status === 'delivered' ? new Date().toISOString() : undefined })
    .eq('id', shipmentId);
  if (error) throw new Error(`Update shipment status failed: ${error.message}`);
}
