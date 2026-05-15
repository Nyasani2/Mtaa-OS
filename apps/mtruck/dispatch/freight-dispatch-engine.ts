import { supabase } from "../../../supabase";

/**
 * MTRUCK FREIGHT DISPATCH ENGINE
 * Matches cargo loads to trucks in real time
 */

export interface CargoRequest {
  id: string;
  sender_id: string;

  pickup_lat: number;
  pickup_lng: number;

  dropoff_lat: number;
  dropoff_lng: number;

  weight_kg: number;
  cargo_type: "SMALL" | "MEDIUM" | "HEAVY";

  urgency: "LOW" | "NORMAL" | "HIGH";

  created_at: string;
}

export interface Truck {
  id: string;
  driver_id: string;

  location_lat: number;
  location_lng: number;

  capacity_kg: number;
  available: boolean;

  truck_type: "VAN" | "TRUCK" | "LORRY";
}

/**
 * Distance engine (Haversine)
 */
function getDistanceKm(a: any, b: any) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;

  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;

  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);

  return R * (2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x)));
}

/**
 * Fetch available trucks
 */
export async function getAvailableTrucks(): Promise<Truck[]> {
  const { data } = await supabase
    .from("trucks")
    .select("*")
    .eq("available", true);

  return data || [];
}

/**
 * Scoring system (distance + capacity fit + urgency)
 */
function scoreTruck(truck: Truck, cargo: CargoRequest) {
  const distance = getDistanceKm(
    { lat: truck.location_lat, lng: truck.location_lng },
    { lat: cargo.pickup_lat, lng: cargo.pickup_lng }
  );

  const capacityFit = truck.capacity_kg >= cargo.weight_kg ? 1 : 0.2;

  const urgencyBoost =
    cargo.urgency === "HIGH" ? 1.5 : cargo.urgency === "NORMAL" ? 1 : 0.8;

  return (1 / (distance + 0.1)) * capacityFit * urgencyBoost;
}

/**
 * Find best truck
 */
export async function findBestTruck(cargo: CargoRequest) {
  const trucks = await getAvailableTrucks();

  if (trucks.length === 0) return null;

  const ranked = trucks
    .map((t) => ({
      truck: t,
      score: scoreTruck(t, cargo),
    }))
    .sort((a, b) => b.score - a.score);

  return ranked[0]?.truck || null;
}

/**
 * Dispatch cargo
 */
export async function dispatchCargo(cargo: CargoRequest) {
  const truck = await findBestTruck(cargo);

  if (!truck) {
    await supabase.from("cargo_queue").insert({
      ...cargo,
      status: "QUEUED",
    });

    return null;
  }

  const { data: job } = await supabase
    .from("freight_jobs")
    .insert({
      sender_id: cargo.sender_id,
      truck_id: truck.id,

      pickup_lat: cargo.pickup_lat,
      pickup_lng: cargo.pickup_lng,
      dropoff_lat: cargo.dropoff_lat,
      dropoff_lng: cargo.dropoff_lng,

      weight_kg: cargo.weight_kg,
      cargo_type: cargo.cargo_type,

      status: "ASSIGNED",
    })
    .select()
    .single();

  await supabase
    .from("trucks")
    .update({ available: false })
    .eq("id", truck.id);

  return {
    job_id: job.id,
    truck_id: truck.id,
  };
}
