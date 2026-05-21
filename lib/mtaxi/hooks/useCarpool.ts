import { useEffect, useState, useCallback } from "react";
import { getCarpoolTrips, createCarpoolTrip, bookCarpool, getMyCarpoolBookings } from "../services/carpoolService";
import type { CarpoolTrip, CarpoolBooking, GeoLocation } from "../types";

export function useCarpoolTrips() {
  const [trips, setTrips] = useState<CarpoolTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true); setError(null);
    try { const data = await getCarpoolTrips(); setTrips(data); }
    catch (err: any) { setError(err.message); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);
  return { trips, loading, error, refresh: fetch };
}

export function useCarpoolBookings() {
  const [bookings, setBookings] = useState<CarpoolBooking[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => { const data = await getMyCarpoolBookings(); setBookings(data); setLoading(false); }, []);
  useEffect(() => { fetch(); }, [fetch]);
  return { bookings, loading, refresh: fetch };
}

export function useCreateCarpool() {
  const create = useCallback(async (origin: GeoLocation, destination: GeoLocation, departure_time: string, available_seats: number, price_per_seat: number) => {
    return await createCarpoolTrip(origin, destination, departure_time, available_seats, price_per_seat);
  }, []);
  return { create };
}

export function useBookCarpool() {
  const book = useCallback(async (trip_id: string, seats: number = 1) => { return await bookCarpool(trip_id, seats); }, []);
  return { book };
}
