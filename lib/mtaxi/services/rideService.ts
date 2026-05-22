// lib/mtaxi/services/rideService.ts
import { supabase } from "@/lib/supabase";

export interface FareEstimate {
  distance_km: number;
  base_fare: number;
  distance_fare: number;
  time_fare: number;
  surge_multiplier: number;
  total_fare: number;
  vehicle_type: string;
  currency: string;
}

export async function estimateFare(
  pickup: { lat: number; lng: number },
  dropoff: { lat: number; lng: number },
  vehicleType: string = "economy"
): Promise<FareEstimate> {
  const R = 6371;
  const dLat = (dropoff.lat - pickup.lat) * Math.PI / 180;
  const dLng = (dropoff.lng - pickup.lng) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(pickup.lat * Math.PI / 180) * Math.cos(dropoff.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  const distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const baseRates: Record<string, number> = { economy: 2.5, premium: 5.0, xl: 8.0, truck: 12.0 };
  const perKmRates: Record<string, number> = { economy: 1.2, premium: 2.5, xl: 3.5, truck: 5.0 };

  const baseFare = baseRates[vehicleType] || 2.5;
  const distanceFare = distance * (perKmRates[vehicleType] || 1.2);
  const timeFare = (distance / 30) * 0.5;
  const surgeMultiplier = 1.0;
  const totalFare = Math.round((baseFare + distanceFare + timeFare) * surgeMultiplier * 100) / 100;

  return {
    distance_km: Math.round(distance * 100) / 100,
    base_fare: baseFare,
    distance_fare: Math.round(distanceFare * 100) / 100,
    time_fare: Math.round(timeFare * 100) / 100,
    surge_multiplier: surgeMultiplier,
    total_fare: totalFare,
    vehicle_type: vehicleType,
    currency: "USD",
  };
}

export async function requestRide(data: {
  passenger_id: string;
  pickup_lat: number;
  pickup_lng: number;
  dropoff_lat: number;
  dropoff_lng: number;
  ride_type?: string;
  payment_method?: string;
}): Promise<any> {
  const { data: result, error } = await supabase
    .from("mtaxi_rides")
    .insert({
      passenger_id: data.passenger_id,
      pickup_lat: data.pickup_lat,
      pickup_lng: data.pickup_lng,
      dropoff_lat: data.dropoff_lat,
      dropoff_lng: data.dropoff_lng,
      ride_type: data.ride_type || "economy",
      payment_method: data.payment_method || "wallet",
      status: "searching",
    })
    .select()
    .single();
  if (error) throw error;
  return result;
}

export async function getRideById(rideId: string): Promise<any> {
  const { data, error } = await supabase.from("mtaxi_rides").select("*").eq("id", rideId).single();
  if (error) throw error;
  return data;
}

export async function cancelRide(rideId: string, reason?: string): Promise<void> {
  const { error } = await supabase
    .from("mtaxi_rides")
    .update({ status: "cancelled", cancellation_reason: reason, cancelled_at: new Date().toISOString() })
    .eq("id", rideId);
  if (error) throw error;
}
