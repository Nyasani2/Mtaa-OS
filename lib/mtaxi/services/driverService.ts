import { supabase } from "@/core/lib/supabaseClient";
import type { NearbyDriver, FavoriteDriver, DriverProfile } from "../types";

const EDGE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL + "/functions/v1";

export async function updateLocation(lat: number, lng: number, heading?: number): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch(`${EDGE_URL}/mtaxi-location`, {
    method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session?.access_token}` },
    body: JSON.stringify({ lat, lng, heading })
  });
  if (!res.ok) { const err = await res.json(); throw new Error(err.error || "Failed to update location"); }
}

export async function getNearbyDrivers(lat: number, lng: number, radius_km: number = 5): Promise<NearbyDriver[]> {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch(`${EDGE_URL}/mtaxi-nearby`, {
    method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session?.access_token}` },
    body: JSON.stringify({ lat, lng, radius_km })
  });
  if (!res.ok) { const err = await res.json(); throw new Error(err.error || "Failed to get nearby drivers"); }
  const { drivers } = await res.json(); return drivers;
}

export async function getDriverProfile(driver_id: string): Promise<DriverProfile | null> {
  const { data, error } = await supabase.from("mtaxi_drivers").select("*").eq("id", driver_id).single();
  if (error) return null; return data;
}

export async function getMyDriverProfile(): Promise<DriverProfile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase.from("mtaxi_drivers").select("*").eq("id", user.id).single();
  if (error) return null; return data;
}

export async function toggleOnlineStatus(online: boolean): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { error } = await supabase.from("mtaxi_driver_status").upsert({ user_id: user.id, online, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
  if (error) throw new Error(error.message);
}

export async function getFavoriteDrivers(): Promise<FavoriteDriver[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { data, error } = await supabase.from("mtaxi_favorite_drivers").select("driver_id, added_at, driver:driver_id(full_name, avatar_url, vehicle:mtaxi_vehicles(type, plate_number, color))").eq("rider_id", user.id).order("added_at", { ascending: false });
  if (error) throw new Error(error.message); return data || [];
}

export async function addFavoriteDriver(driver_id: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { error } = await supabase.from("mtaxi_favorite_drivers").insert({ rider_id: user.id, driver_id }).select();
  if (error) throw new Error(error.message);
}

export async function removeFavoriteDriver(driver_id: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { error } = await supabase.from("mtaxi_favorite_drivers").delete().eq("rider_id", user.id).eq("driver_id", driver_id);
  if (error) throw new Error(error.message);
}
