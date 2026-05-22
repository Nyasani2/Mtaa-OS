"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";

export interface Ride {
  id: string;
  pickup_location: string;
  dropoff_location: string;
  status: string;
  fare: number;
  created_at: string;
}

export function useRides(rideId?: string) {
  const [rides, setRides] = useState<Ride[]>([]);
  const [ride, setRide] = useState<Ride | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchRides = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from("rides").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      setRides(data || []);
    } catch (err) { console.error(err); }
    finally { setIsLoading(false); }
  }, []);

  const fetchRide = useCallback(async (id: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from("rides").select("*").eq("id", id).single();
      if (error) throw error;
      setRide(data);
    } catch (err) { console.error(err); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => {
    if (rideId) fetchRide(rideId);
    else fetchRides();
  }, [rideId, fetchRide, fetchRides]);

  return { rides, ride, isLoading, refresh: fetchRides };
}
