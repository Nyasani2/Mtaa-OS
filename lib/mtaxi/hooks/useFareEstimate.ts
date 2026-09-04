// lib/mtaxi/hooks/useFareEstimate.ts
import { useState, useCallback } from 'react';
import { estimateFare, FareEstimate } from "../services/rideService";
import type { VehicleType } from "../types";

export function useFareEstimate() {
  const [estimate, setEstimate] = useState<FareEstimate | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculate = useCallback(async (
    pickup: { lat: number; lng: number },
    dropoff: { lat: number; lng: number },
    vehicleType: VehicleType
  ) => {
    setLoading(true);
    try {
      const result = await estimateFare(pickup, dropoff, vehicleType);
      setEstimate(result);
      setError(null);
      return result;
    } catch (err: any) {
      setError(err.message || "Failed to estimate fare");
      setEstimate(null);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { estimate, loading, error, calculate };
}
