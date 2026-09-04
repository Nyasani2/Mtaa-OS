// lib/mtaxi/hooks/useRides.ts
import { useState, useEffect, useCallback } from 'react';
import { supabase } from "@/lib/supabase";
import { requestRide, getRideById, cancelRide, getMyRides, estimateFare } from "../services/rideService";
import type { MtaxiRide, VehicleType, PaymentMethod, FareEstimate } from "../types";

export function useRides(userId: string) {
  const [rides, setRides] = useState<MtaxiRide[]>([]);
  const [currentRide, setCurrentRide] = useState<MtaxiRide | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMyRides = useCallback(async (status?: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMyRides(userId, status);
      setRides(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const fetchCurrentRide = useCallback(async (rideId: string) => {
    setLoading(true);
    try {
      const data = await getRideById(rideId);
      setCurrentRide(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const createRide = useCallback(async (params: {
    pickup: { lat: number; lng: number; address?: string };
    dropoff: { lat: number; lng: number; address?: string };
    ride_type: VehicleType;
    payment_method: PaymentMethod;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const ride = await requestRide({
        passenger_id: userId,
        pickup_lat: params.pickup.lat,
        pickup_lng: params.pickup.lng,
        dropoff_lat: params.dropoff.lat,
        dropoff_lng: params.dropoff.lng,
        pickup_address: params.pickup.address,
        dropoff_address: params.dropoff.address,
        ride_type: params.ride_type,
        payment_method: params.payment_method,
      });
      setCurrentRide(ride);
      return ride;
    } catch (e: any) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const cancelCurrentRide = useCallback(async (rideId: string, reason?: string) => {
    setLoading(true);
    try {
      await cancelRide(rideId, reason);
      setCurrentRide(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const getFare = useCallback(async (pickup: { lat: number; lng: number }, dropoff: { lat: number; lng: number }, vehicleType: VehicleType) => {
    return await estimateFare(pickup, dropoff, vehicleType);
  }, []);

  useEffect(() => {
    if (!currentRide?.id) return;
    const channel = supabase
      .channel(`ride_${currentRide.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "mtaxi_rides", filter: `id=eq.${currentRide.id}` }, (payload) => {
        setCurrentRide(payload.new as MtaxiRide);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [currentRide?.id]);

  return { rides, currentRide, loading, error, fetchMyRides, fetchCurrentRide, createRide, cancelCurrentRide, getFare };
}
