// lib/mtaxi/services/rideService.ts
import { supabase } from "@/lib/supabase";
import type { MtaxiRide, VehicleType, PaymentMethod } from "../types";

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
  vehicleType: VehicleType | undefined = undefined
): Promise<FareEstimate> {
  const resolvedType: VehicleType = vehicleType || "economy";
  const R = 6371;
  const dLat = (dropoff.lat - pickup.lat) * Math.PI / 180;
  const dLng = (dropoff.lng - pickup.lng) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(pickup.lat * Math.PI / 180) * Math.cos(dropoff.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  const distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const baseRates: Record<string, number> = { economy: 2.5, premium: 5.0, xl: 8.0, truck: 12.0 };
  const perKmRates: Record<string, number> = { economy: 1.2, premium: 2.5, xl: 3.5, truck: 5.0 };

  const baseFare = baseRates[resolvedType] || 2.5;
  const distanceFare = distance * (perKmRates[resolvedType] || 1.2);
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
    vehicle_type: resolvedType,
    currency: "USD",
  };
}

export async function requestRide(data: {
  passenger_id: string;
  pickup_lat: number;
  pickup_lng: number;
  dropoff_lat: number;
  dropoff_lng: number;
  pickup_address?: string;
  dropoff_address?: string;
  ride_type?: VehicleType;
  payment_method?: PaymentMethod;
}): Promise<MtaxiRide> {
  const { data: result, error } = await supabase.functions.invoke("mtaxi-request", {
    body: {
      passenger_id: data.passenger_id,
      pickup_lat: data.pickup_lat,
      pickup_lng: data.pickup_lng,
      dropoff_lat: data.dropoff_lat,
      dropoff_lng: data.dropoff_lng,
      pickup_address: data.pickup_address,
      dropoff_address: data.dropoff_address,
      ride_type: data.ride_type || "economy",
      payment_method: data.payment_method || "wallet",
    },
  });
  if (error) throw error;
  return result;
}

export async function getRideById(rideId: string): Promise<MtaxiRide> {
  const { data, error } = await supabase.from("mtaxi_rides").select("*, driver:mtaxi_drivers(id, full_name, phone, vehicle_plate, vehicle_type, rating, photo_url)").eq("id", rideId).single();
  if (error) throw error;
  return data as MtaxiRide;
}

export async function cancelRide(rideId: string, reason?: string): Promise<void> {
  const { error } = await supabase.functions.invoke("mtaxi-cancel", {
    body: { ride_id: rideId, reason },
  });
  if (error) throw error;
}

export async function getMyRides(passengerId: string, status?: string): Promise<MtaxiRide[]> {
  let query = supabase.from("mtaxi_rides").select("*").eq("passenger_id", passengerId).order("created_at", { ascending: false });
  if (status) query = query.eq("status", status);
  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as MtaxiRide[];
}
