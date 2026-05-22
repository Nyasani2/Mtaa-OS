// lib/mtaxi/services/carpoolService.ts
import { supabase } from "@/lib/supabase";

export interface CarpoolTrip {
  id: string;
  driver_id: string;
  route_from: string;
  route_to: string;
  departure_time: string;
  available_seats: number;
  price_per_seat: number;
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
  vehicle_type?: string;
  created_at: string;
  updated_at: string;
}

export interface CarpoolBooking {
  id: string;
  trip_id: string;
  rider_id: string;
  seats_booked: number;
  total_amount: number;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  created_at: string;
}

export async function getCarpoolTrips(filters?: { from?: string; to?: string; date?: string }): Promise<CarpoolTrip[]> {
  let query = supabase.from("carpool_trips").select("*").eq("status", "scheduled");
  if (filters?.from) query = query.ilike("route_from", `%${filters.from}%`);
  if (filters?.to) query = query.ilike("route_to", `%${filters.to}%`);
  if (filters?.date) query = query.gte("departure_time", `${filters.date}T00:00:00`).lt("departure_time", `${filters.date}T23:59:59`);
  const { data, error } = await query.order("departure_time", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function createCarpoolTrip(data: Partial<CarpoolTrip>): Promise<CarpoolTrip> {
  const { data: result, error } = await supabase
    .from("carpool_trips")
    .insert({
      driver_id: data.driver_id,
      route_from: data.route_from,
      route_to: data.route_to,
      departure_time: data.departure_time,
      available_seats: data.available_seats || 3,
      price_per_seat: data.price_per_seat || 0,
      status: data.status || "scheduled",
      vehicle_type: data.vehicle_type,
    })
    .select()
    .single();
  if (error) throw error;
  return result;
}

export async function bookCarpool(tripId: string, passengerId: string, seats = 1): Promise<CarpoolBooking> {
  const { data: trip } = await supabase.from("carpool_trips").select("price_per_seat, available_seats").eq("id", tripId).single();
  if (!trip || trip.available_seats < seats) throw new Error("Not enough seats available");

  const { data: result, error } = await supabase
    .from("carpool_bookings")
    .insert({
      trip_id: tripId,
      rider_id: passengerId,
      seats_booked: seats,
      total_amount: trip.price_per_seat * seats,
      status: "confirmed",
    })
    .select()
    .single();
  if (error) throw error;

  await supabase.from("carpool_trips").update({ available_seats: trip.available_seats - seats }).eq("id", tripId);
  return result;
}

export async function getMyCarpoolBookings(passengerId: string): Promise<(CarpoolBooking & { trip: CarpoolTrip })[]> {
  const { data, error } = await supabase
    .from("carpool_bookings")
    .select("*, trip:carpool_trips(*)")
    .eq("rider_id", passengerId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}
