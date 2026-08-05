// lib/mtaxi/services/driverService.ts
import { supabase } from "@/lib/supabase";
import type { MtaxiDriver, MtaxiRide } from "../types";

export async function getDriverProfile(userId: string): Promise<MtaxiDriver | null> {
  const { data, error } = await supabase.from("mtaxi_drivers").select("*").eq("user_id", userId).maybeSingle();
  if (error && error.code !== "PGRST116") throw error;
  return data as MtaxiDriver | null;
}

export async function toggleOnlineStatus(driverId: string, isOnline: boolean, lat?: number, lng?: number): Promise<void> {
  const update: Record<string, any> = { is_online: isOnline, updated_at: new Date().toISOString() };
  if (lat !== undefined) update.current_lat = lat;
  if (lng !== undefined) update.current_lng = lng;
  const { error } = await supabase.from("mtaxi_drivers").update(update).eq("id", driverId);
  if (error) throw error;
}

export async function getPendingRequests(driverId: string): Promise<MtaxiRide[]> {
  const { data, error } = await supabase
    .from("mtaxi_rides")
    .select("*")
    .eq("status", "searching")
    .order("created_at", { ascending: false })
    .limit(10);
  if (error) throw error;
  return (data || []) as MtaxiRide[];
}

export async function acceptRide(driverId: string, rideId: string): Promise<MtaxiRide> {
  const { data, error } = await supabase.functions.invoke("mtaxi-accept", {
    body: { driver_id: driverId, ride_id: rideId },
  });
  if (error) throw error;
  return data as MtaxiRide;
}

export async function completeRide(driverId: string, rideId: string): Promise<MtaxiRide> {
  const { data, error } = await supabase.functions.invoke("mtaxi-complete", {
    body: { driver_id: driverId, ride_id: rideId },
  });
  if (error) throw error;
  return data as MtaxiRide;
}

export async function updateDriverLocation(driverId: string, lat: number, lng: number): Promise<void> {
  const { error } = await supabase.from("mtaxi_drivers").update({ current_lat: lat, current_lng: lng, updated_at: new Date().toISOString() }).eq("id", driverId);
  if (error) throw error;
}

export async function getDriverEarnings(driverId: string, period: "today" | "week" | "month" = "today"): Promise<{ total: number; trips: number }> {
  const startDate = new Date();
  if (period === "week") startDate.setDate(startDate.getDate() - 7);
  if (period === "month") startDate.setDate(startDate.getDate() - 30);

  const { data, error } = await supabase
    .from("mtaxi_rides")
    .select("final_fare")
    .eq("driver_id", driverId)
    .eq("status", "completed")
    .gte("completed_at", startDate.toISOString());
  if (error) throw error;

  const rides = data || [];
  const total = rides.reduce((sum, r) => sum + (r.final_fare || 0), 0);
  return { total: Math.round(total * 100) / 100, trips: rides.length };
}
