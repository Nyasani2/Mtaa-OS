import { supabase } from "@/core/lib/supabaseClient";
import type { CarpoolTrip, CarpoolBooking, GeoLocation } from "../types";

export async function getCarpoolTrips(): Promise<CarpoolTrip[]> {
  const { data, error } = await supabase.from("carpool_trips").select("*, driver:driver_id(*)").eq("status", "open").gte("departure_time", new Date().toISOString()).order("departure_time", { ascending: true });
  if (error) throw new Error(error.message); return data || [];
}

export async function createCarpoolTrip(origin: GeoLocation, destination: GeoLocation, departure_time: string, available_seats: number, price_per_seat: number): Promise<CarpoolTrip> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { data, error } = await supabase.from("carpool_trips").insert({ driver_id: user.id, origin, destination, departure_time, available_seats, price_per_seat, status: "open" }).select().single();
  if (error) throw new Error(error.message); return data;
}

export async function bookCarpool(trip_id: string, seats_booked: number = 1): Promise<CarpoolBooking> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { data: trip } = await supabase.from("carpool_trips").select("price_per_seat, available_seats").eq("id", trip_id).single();
  if (!trip) throw new Error("Trip not found");
  if (trip.available_seats < seats_booked) throw new Error("Not enough seats");
  const total_amount = trip.price_per_seat * seats_booked;
  const { data, error } = await supabase.from("carpool_bookings").insert({ trip_id, rider_id: user.id, seats_booked, total_amount, status: "confirmed" }).select().single();
  if (error) throw new Error(error.message);
  await supabase.from("carpool_trips").update({ available_seats: trip.available_seats - seats_booked }).eq("id", trip_id);
  return data;
}

export async function getMyCarpoolBookings(): Promise<CarpoolBooking[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { data, error } = await supabase.from("carpool_bookings").select("*, trip:trip_id(*, driver:driver_id(*))").eq("rider_id", user.id).order("created_at", { ascending: false });
  if (error) throw new Error(error.message); return data || [];
}
