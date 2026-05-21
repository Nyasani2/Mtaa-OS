import { supabase } from "@/lib/supabase";
import type { Truck } from "@/lib/mtruck/types";

export async function getTruckLocations(): Promise<Truck[]> {
  const { data, error } = await supabase.from("mtruck_trucks").select("*").eq("status", "active");
  if (error) throw error;
  return data || [];
}

export async function updateTruckLocation(truckId: string, lat: number, lng: number): Promise<void> {
  const { error } = await supabase.from("mtruck_trucks").update({ current_location: { lat, lng }, last_updated: new Date().toISOString() }).eq("id", truckId);
  if (error) throw error;
}
