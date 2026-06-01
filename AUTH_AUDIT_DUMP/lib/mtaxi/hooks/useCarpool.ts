// lib/mtaxi/hooks/useCarpool.ts
import { useState, useEffect, useCallback } from "react";
import { getCarpoolTrips, createCarpoolTrip, bookCarpool, getMyCarpoolBookings } from "../services/carpoolService";
import type { CarpoolTrip, CarpoolBooking } from "../types";

export function useCarpoolTrips(filters?: { from?: string; to?: string; date?: string }) {
  const [trips, setTrips] = useState<CarpoolTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTrips = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCarpoolTrips(filters);
      setTrips(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to load trips");
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  return { trips, loading, error, refresh: fetchTrips };
}

export function useCarpoolBookings(passengerId: string) {
  const [bookings, setBookings] = useState<(CarpoolBooking & { trip: CarpoolTrip })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMyCarpoolBookings(passengerId);
      setBookings(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  }, [passengerId]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  return { bookings, loading, error, refresh: fetchBookings };
}

export function useBookCarpool() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const book = useCallback(async (tripId: string, passengerId: string, seats = 1) => {
    setLoading(true);
    try {
      const result = await bookCarpool(tripId, passengerId, seats);
      setError(null);
      return result;
    } catch (err: any) {
      setError(err.message || "Booking failed");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { book, loading, error };
}

export function useCreateCarpoolTrip() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = useCallback(async (data: Partial<CarpoolTrip>) => {
    setLoading(true);
    try {
      const result = await createCarpoolTrip(data);
      setError(null);
      return result;
    } catch (err: any) {
      setError(err.message || "Failed to create trip");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { create, loading, error };
}
