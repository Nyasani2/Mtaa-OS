import { supabase } from "../../supabase";

export interface GPSPoint {
  truck_id: string;
  lat: number;
  lng: number;
  speed_kph: number;
  heading: number;
  timestamp: string;
}

export async function pushGPSUpdate(point: GPSPoint) {

  const { error } = await supabase
    .from("mtruck_gps_stream")
    .insert({
      truck_id: point.truck_id,
      lat: point.lat,
      lng: point.lng,
      speed_kph: point.speed_kph,
      heading: point.heading,
      timestamp: point.timestamp,
    });

  if (error) throw error;

  await supabase
    .from("mtruck_fleet")
    .update({
      last_lat: point.lat,
      last_lng: point.lng,
      speed_kph: point.speed_kph,
    })
    .eq("id", point.truck_id);

  return true;
}

export async function getLiveFleetPositions() {

  const { data, error } = await supabase
    .from("mtruck_gps_stream")
    .select("*")
    .order("timestamp", { ascending: false });

  if (error) throw error;

  return data || [];
}
