import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/core/lib/supabaseClient";
import { getNearbyDrivers, updateLocation, getMyDriverProfile, toggleOnlineStatus, getFavoriteDrivers, addFavoriteDriver, removeFavoriteDriver } from "../services/driverService";
import type { NearbyDriver, FavoriteDriver, DriverProfile } from "../types";

export function useNearbyDrivers(lat: number, lng: number, radius_km: number = 5) {
  const [drivers, setDrivers] = useState<NearbyDriver[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true); setError(null);
    try { const data = await getNearbyDrivers(lat, lng, radius_km); setDrivers(data); }
    catch (err: any) { setError(err.message); } finally { setLoading(false); }
  }, [lat, lng, radius_km]);

  useEffect(() => { if (lat && lng) fetch(); }, [fetch]);
  return { drivers, loading, error, refresh: fetch };
}

export function useDriverLocation() {
  const update = useCallback(async (lat: number, lng: number, heading?: number) => { await updateLocation(lat, lng, heading); }, []);
  return { updateLocation: update };
}

export function useDriverProfile() {
  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { getMyDriverProfile().then(setProfile).finally(() => setLoading(false)); }, []);

  const goOnline = useCallback(async () => { await toggleOnlineStatus(true); setProfile(p => p ? { ...p, status: "online" } : p); }, []);
  const goOffline = useCallback(async () => { await toggleOnlineStatus(false); setProfile(p => p ? { ...p, status: "offline" } : p); }, []);

  return { profile, loading, goOnline, goOffline };
}

export function useFavoriteDrivers() {
  const [favorites, setFavorites] = useState<FavoriteDriver[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => { const data = await getFavoriteDrivers(); setFavorites(data); setLoading(false); }, []);
  useEffect(() => { fetch(); }, [fetch]);

  const add = useCallback(async (driver_id: string) => { await addFavoriteDriver(driver_id); await fetch(); }, [fetch]);
  const remove = useCallback(async (driver_id: string) => { await removeFavoriteDriver(driver_id); await fetch(); }, [fetch]);

  return { favorites, loading, addFavorite: add, removeFavorite: remove, refresh: fetch };
}

export function useDriverTracking(driver_id: string | null) {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  useEffect(() => {
    if (!driver_id) return;
    const channel = supabase.channel(`driver-loc-${driver_id}`).on("postgres_changes", { event: "*", schema: "public", table: "driver_locations", filter: `user_id=eq.${driver_id}` }, (payload) => { setLocation({ lat: payload.new.lat, lng: payload.new.lng }); }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [driver_id]);
  return location;
}
