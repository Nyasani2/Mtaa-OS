import { supabase } from "@/lib/supabase";
import type { MtruckLocation, MtruckGpsStream } from "@/lib/mtruck/types";

const TABLE_LOCATIONS = 'mtruck_locations';
const TABLE_GPS_STREAM = 'mtruck_gps_stream';

export async function updateLocation(truckId: string, driverId: string, location: {
  lat: number;
  lng: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
}) {
  const { error } = await supabase.from(TABLE_LOCATIONS).insert({
    truck_id: truckId,
    driver_id: driverId,
    latitude: location.lat,
    longitude: location.lng,
    accuracy_meters: location.accuracy,
    speed_kmh: location.speed,
    heading: location.heading,
  });
  if (error) throw error;
}

export async function getNearbyTrucks(lat: number, lng: number, radiusKm: number = 50) {
  const { data, error } = await supabase.rpc("nearby_trucks", {
    p_lat: lat,
    p_lng: lng,
    p_radius_km: radiusKm,
  });
  if (error) throw error;
  return data;
}

export async function getTruckLatestLocation(truckId: string): Promise<MtruckLocation | null> {
  const { data, error } = await supabase
    .from(TABLE_LOCATIONS)
    .select("*")
    .eq("truck_id", truckId)
    .order("recorded_at", { ascending: false })
    .limit(1)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
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
    .single();
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
