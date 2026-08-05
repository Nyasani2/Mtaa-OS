import { supabase } from "@/lib/supabase";
import type {
  Truck, MtruckLocation, MtruckGpsStream, MtruckTelemetry,
  MtruckEtaPrediction, GeoPoint
} from "@/lib/mtruck/types";

const TABLE_TRUCKS = 'mtruck_trucks';
const TABLE_LOCATIONS = 'mtruck_locations';
const TABLE_GPS_STREAM = 'mtruck_gps_stream';
const TABLE_TELEMETRY = 'mtruck_telemetry';
const TABLE_ETA = 'mtruck_eta_predictions';

// ── TRUCK LOCATIONS (HISTORICAL) ──

export async function recordLocation(payload: {
  truck_id: string;
  driver_id?: string;
  latitude: number;
  longitude: number;
  accuracy_meters?: number;
  speed_kmh?: number;
  heading?: number;
  altitude?: number;
  geofence_zone?: string;
}): Promise<MtruckLocation> {
  const { data, error } = await supabase
    .from(TABLE_LOCATIONS)
    .insert(payload)
    .select()
    .maybeSingle();
  if (error) throw new Error(`Record location failed: ${error.message}`);
  return data;
}

export async function getTruckLocationHistory(
  truckId: string,
  fromDate?: string,
  toDate?: string,
  limit = 100
): Promise<MtruckLocation[]> {
  let query = supabase
    .from(TABLE_LOCATIONS)
    .select('*')
    .eq('truck_id', truckId)
    .order('recorded_at', { ascending: false })
    .limit(limit);
  if (fromDate) query = query.gte('recorded_at', fromDate);
  if (toDate) query = query.lte('recorded_at', toDate);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getTruckLatestLocation(truckId: string): Promise<MtruckLocation | null> {
  const { data, error } = await supabase
    .from(TABLE_LOCATIONS)
    .select('*')
    .eq('truck_id', truckId)
    .order('recorded_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

// ── GPS STREAM (REALTIME TELEMETRY) ──

export async function pushGpsStream(payload: {
  truck_id: string;
  driver_id?: string;
  latitude: number;
  longitude: number;
  speed_kmh?: number;
  heading?: number;
  ignition_status?: boolean;
  engine_hours?: number;
  odometer_km?: number;
  fuel_level_percent?: number;
  battery_voltage?: number;
  signal_strength?: number;
  device_id?: string;
}): Promise<MtruckGpsStream> {
  const { data, error } = await supabase
    .from(TABLE_GPS_STREAM)
    .insert({ ...payload, ignition_status: payload.ignition_status ?? false })
    .select()
    .maybeSingle();
  if (error) throw new Error(`Push GPS stream failed: ${error.message}`);
  return data;
}

export async function getGpsStream(truckId: string, limit = 50): Promise<MtruckGpsStream[]> {
  const { data, error } = await supabase
    .from(TABLE_GPS_STREAM)
    .select('*')
    .eq('truck_id', truckId)
    .order('received_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

// ── VEHICLE TELEMETRY ──

export async function recordTelemetry(payload: {
  truck_id: string;
  engine_rpm?: number;
  coolant_temp_c?: number;
  oil_pressure?: number;
  brake_pressure?: number;
  tire_pressure?: Record<string, number>;
  adblue_level_percent?: number;
  engine_load_percent?: number;
  throttle_position?: number;
  diagnostic_codes?: string[];
}): Promise<MtruckTelemetry> {
  const { data, error } = await supabase
    .from(TABLE_TELEMETRY)
    .insert({ ...payload, diagnostic_codes: payload.diagnostic_codes ?? [] })
    .select()
    .maybeSingle();
  if (error) throw new Error(`Record telemetry failed: ${error.message}`);
  return data;
}

export async function getTruckTelemetry(truckId: string, limit = 100): Promise<MtruckTelemetry[]> {
  const { data, error } = await supabase
    .from(TABLE_TELEMETRY)
    .select('*')
    .eq('truck_id', truckId)
    .order('recorded_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

export async function getLatestTelemetry(truckId: string): Promise<MtruckTelemetry | null> {
  const { data, error } = await supabase
    .from(TABLE_TELEMETRY)
    .select('*')
    .eq('truck_id', truckId)
    .order('recorded_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

// ── ETA PREDICTIONS ──

export async function createEtaPrediction(payload: {
  shipment_id: string;
  truck_id?: string;
  predicted_eta: string;
  confidence_interval_minutes?: number;
  prediction_model?: string;
  factors?: Record<string, unknown>;
}): Promise<MtruckEtaPrediction> {
  const { data, error } = await supabase
    .from(TABLE_ETA)
    .insert({
      ...payload,
      confidence_interval_minutes: payload.confidence_interval_minutes ?? 30,
      prediction_model: payload.prediction_model ?? 'ml_v1',
      factors: payload.factors ?? {}
    })
    .select()
    .maybeSingle();
  if (error) throw new Error(`Create ETA prediction failed: ${error.message}`);
  return data;
}

export async function getEtaPredictions(shipmentId: string): Promise<MtruckEtaPrediction[]> {
  const { data, error } = await supabase
    .from(TABLE_ETA)
    .select('*')
    .eq('shipment_id', shipmentId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function updateActualArrival(etaId: string, actualArrival: string, accuracyMinutes: number): Promise<void> {
  const { error } = await supabase
    .from(TABLE_ETA)
    .update({ actual_arrival: actualArrival, accuracy_minutes: accuracyMinutes })
    .eq('id', etaId);
  if (error) throw new Error(`Update actual arrival failed: ${error.message}`);
}

// ── LEGACY COMPAT ──

export async function getTruckLocations(): Promise<Truck[]> {
  const { data, error } = await supabase.from(TABLE_TRUCKS).select("*").eq("status", "active");
  if (error) throw error;
  return data || [];
}

export async function updateTruckLocation(truckId: string, lat: number, lng: number): Promise<void> {
  const { error } = await supabase
    .from(TABLE_TRUCKS)
    .update({ current_location: { lat, lng }, last_updated: new Date().toISOString() })
    .eq("id", truckId);
  if (error) throw error;
}
