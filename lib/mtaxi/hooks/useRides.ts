import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/core/lib/supabaseClient";
import { getMyRides, getRideById } from "../services/rideService";
import type { Ride, RideStatus } from "../types";

export function useRides(status?: RideStatus) {
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRides = useCallback(async () => {
    setLoading(true); setError(null);
    try { const data = await getMyRides(status); setRides(data); }
    catch (err: any) { setError(err.message); } finally { setLoading(false); }
  }, [status]);

  useEffect(() => { fetchRides(); }, [fetchRides]);
  return { rides, loading, error, refresh: fetchRides };
}

export function useRide(ride_id: string) {
  const [ride, setRide] = useState<Ride | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    getRideById(ride_id).then(data => { if (mounted) setRide(data); }).catch(err => { if (mounted) setError(err.message); }).finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [ride_id]);

  return { ride, loading, error };
}

export function useRealtimeRide(ride_id: string | null) {
  const [ride, setRide] = useState<Ride | null>(null);
  useEffect(() => {
    if (!ride_id) return;
    getRideById(ride_id).then(setRide);
    const channel = supabase.channel(`ride-${ride_id}`).on("postgres_changes", { event: "*", schema: "public", table: "rides", filter: `id=eq.${ride_id}` }, (payload) => { setRide(payload.new as Ride); }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [ride_id]);
  return ride;
}
