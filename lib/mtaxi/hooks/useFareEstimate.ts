import { useState, useCallback } from "react";
import { estimateFare } from "../services/rideService";
import type { GeoLocation, FareEstimate, VehicleType } from "../types";

export function useFareEstimate() {
  const [estimate, setEstimate] = useState<FareEstimate | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculate = useCallback(async (pickup: GeoLocation, dropoff: GeoLocation, vehicle_type: VehicleType = "sedan") => {
    setLoading(true); setError(null);
    try { const data = await estimateFare(pickup, dropoff, vehicle_type); setEstimate(data); return data; }
    catch (err: any) { setError(err.message); return null; } finally { setLoading(false); }
  }, []);

  return { estimate, loading, error, calculate };
}
