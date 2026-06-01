// lib/mtaxi/hooks/useDriver.ts
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { getDriverProfile, toggleOnlineStatus, getPendingRequests, acceptRide, completeRide, updateDriverLocation, getDriverEarnings } from "../services/driverService";
import type { MtaxiDriver, MtaxiRide } from "../types";

export function useDriver(userId: string) {
  const [driver, setDriver] = useState<MtaxiDriver | null>(null);
  const [pendingRides, setPendingRides] = useState<MtaxiRide[]>([]);
  const [currentRide, setCurrentRide] = useState<MtaxiRide | null>(null);
  const [earnings, setEarnings] = useState({ today: 0, week: 0, month: 0, tripsToday: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDriver = useCallback(async () => {
    const data = await getDriverProfile(userId);
    setDriver(data);
  }, [userId]);

  const goOnline = useCallback(async (lat?: number, lng?: number) => {
    if (!driver) return;
    setLoading(true);
    try {
      await toggleOnlineStatus(driver.id, true, lat, lng);
      await fetchDriver();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [driver, fetchDriver]);

  const goOffline = useCallback(async () => {
    if (!driver) return;
    setLoading(true);
    try {
      await toggleOnlineStatus(driver.id, false);
      await fetchDriver();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [driver, fetchDriver]);

  const fetchPending = useCallback(async () => {
    if (!driver) return;
    try {
      const data = await getPendingRequests(driver.id);
      setPendingRides(data);
    } catch (e: any) {
      setError(e.message);
    }
  }, [driver]);

  const accept = useCallback(async (rideId: string) => {
    if (!driver) return;
    setLoading(true);
    try {
      const ride = await acceptRide(driver.id, rideId);
      setCurrentRide(ride);
      await fetchPending();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [driver, fetchPending]);

  const complete = useCallback(async (rideId: string) => {
    if (!driver) return;
    setLoading(true);
    try {
      await completeRide(driver.id, rideId);
      setCurrentRide(null);
      await fetchEarnings();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [driver]);

  const fetchEarnings = useCallback(async () => {
    if (!driver) return;
    try {
      const today = await getDriverEarnings(driver.id, "today");
      const week = await getDriverEarnings(driver.id, "week");
      const month = await getDriverEarnings(driver.id, "month");
      setEarnings({ today: today.total, week: week.total, month: month.total, tripsToday: today.trips });
    } catch (e: any) {
      setError(e.message);
    }
  }, [driver]);

  const updateLocation = useCallback(async (lat: number, lng: number) => {
    if (!driver) return;
    await updateDriverLocation(driver.id, lat, lng);
  }, [driver]);

  useEffect(() => {
    fetchDriver();
  }, [fetchDriver]);

  useEffect(() => {
    if (!driver?.is_online) return;
    const interval = setInterval(fetchPending, 5000);
    return () => clearInterval(interval);
  }, [driver?.is_online, fetchPending]);

  useEffect(() => {
    if (!currentRide?.id) return;
    const channel = supabase
      .channel(`driver_ride_${currentRide.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "mtaxi_rides", filter: `id=eq.${currentRide.id}` }, (payload) => {
        setCurrentRide(payload.new as MtaxiRide);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [currentRide?.id]);

  return { driver, pendingRides, currentRide, earnings, loading, error, goOnline, goOffline, fetchPending, accept, complete, updateLocation, fetchEarnings };
}
