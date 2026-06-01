// lib/mtruck/services/locationService.ts
// Realtime location for tracking + nearby_trucks RPC

import { supabase } from "@/lib/supabase";

export async function updateLocation(truckId: string, driverId: string, location: {
  lat: number;
  lng: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
}) {
  const { error } = await supabase.from("mtruck_locations").insert({
    truck_id: truckId,
    driver_id: driverId,
    ...location,
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

export async function getTruckLatestLocation(truckId: string) {
  const { data, error } = await supabase
    .from("mtruck_locations")
    .select("*")
    .eq("truck_id", truckId)
    .order("recorded_at", { ascending: false })
    .limit(1)
    .single();
  if (error) throw error;
  return data;
}
