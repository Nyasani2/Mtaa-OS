import { supabase } from "@/core/lib/supabaseClient";
import type { Ride, GeoLocation, RideStatus, FareEstimate, VehicleType } from "../types";

const EDGE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL + "/functions/v1";

export async function requestRide(pickup: GeoLocation, dropoff: GeoLocation, ride_type: string = "instant", vehicle_type: VehicleType = "sedan"): Promise<Ride> {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch(`${EDGE_URL}/mtaxi-request`, {
    method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session?.access_token}` },
    body: JSON.stringify({ pickup, dropoff, ride_type, vehicle_type })
  });
  if (!res.ok) { const err = await res.json(); throw new Error(err.error || "Failed to request ride"); }
  const { ride } = await res.json(); return ride;
}

export async function acceptRide(ride_id: string): Promise<Ride> {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch(`${EDGE_URL}/mtaxi-accept`, {
    method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session?.access_token}` },
    body: JSON.stringify({ ride_id })
  });
  if (!res.ok) { const err = await res.json(); throw new Error(err.error || "Failed to accept ride"); }
  const { ride } = await res.json(); return ride;
}

export async function completeRide(ride_id: string, final_fare?: number): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch(`${EDGE_URL}/mtaxi-complete`, {
    method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session?.access_token}` },
    body: JSON.stringify({ ride_id, final_fare })
  });
  if (!res.ok) { const err = await res.json(); throw new Error(err.error || "Failed to complete ride"); }
}

export async function cancelRide(ride_id: string, reason?: string): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch(`${EDGE_URL}/mtaxi-cancel`, {
    method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session?.access_token}` },
    body: JSON.stringify({ ride_id, reason })
  });
  if (!res.ok) { const err = await res.json(); throw new Error(err.error || "Failed to cancel ride"); }
}

export async function getMyRides(status?: RideStatus): Promise<Ride[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  let query = supabase.from("rides").select("*, driver:driver_id(*), vehicle:vehicle_id(*)").or(`rider_id.eq.${user.id},driver_id.eq.${user.id}`).order("created_at", { ascending: false });
  if (status) query = query.eq("status", status);
  const { data, error } = await query.limit(50);
  if (error) throw new Error(error.message); return data || [];
}

export async function getRideById(ride_id: string): Promise<Ride | null> {
  const { data, error } = await supabase.from("rides").select("*, driver:driver_id(*), vehicle:vehicle_id(*)").eq("id", ride_id).single();
  if (error) throw new Error(error.message); return data;
}

export async function rateRide(ride_id: string, rating: number, review?: string, as: "rider" | "driver" = "rider"): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const field = as === "rider" ? "rating_driver" : "rating_rider";
  const reviewField = as === "rider" ? "review_driver" : "review_rider";
  const update: any = { [field]: rating }; if (review) update[reviewField] = review;
  const { error } = await supabase.from("rides").update(update).eq("id", ride_id);
  if (error) throw new Error(error.message);
}

export async function estimateFare(pickup: GeoLocation, dropoff: GeoLocation, vehicle_type: VehicleType = "sedan"): Promise<FareEstimate> {
  const { data: distanceData } = await supabase.rpc("calculate_distance_km", { lat1: pickup.lat, lng1: pickup.lng, lat2: dropoff.lat, lng2: dropoff.lng });
  const distance_km = distanceData || 0;
  const { data: fareData } = await supabase.rpc("calculate_fare", { distance_km });
  const base_fare = fareData || 0;
  const multipliers: Record<VehicleType, number> = { boda: 0.6, tuk_tuk: 0.8, sedan: 1.0, van: 1.3, truck: 1.8 };
  const adjustedBase = Math.round(base_fare * (multipliers[vehicle_type] || 1));
  const { data: surgeData } = await supabase.rpc("mtaxi_compute_surge", { demand: 0, supply: 0 });
  const surge = surgeData || 1;
  return { distance_km: Math.round(distance_km * 100) / 100, base_fare: adjustedBase, surge_multiplier: surge, total_fare: Math.round(adjustedBase * surge), vehicle_type, currency: "KES" };
}
