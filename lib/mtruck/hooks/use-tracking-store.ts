import { create } from "zustand";
import { useEffect } from 'react';
import { supabase } from "@/lib/supabase";
import {
  getTruckLocations, updateTruckLocation,
  recordLocation, getTruckLocationHistory, getTruckLatestLocation,
  pushGpsStream, getGpsStream,
  recordTelemetry, getTruckTelemetry, getLatestTelemetry
} from "@/lib/mtruck/services/tracking-service";
import type { Truck, MtruckLocation, MtruckGpsStream, MtruckTelemetry } from "@/lib/mtruck/types";

interface TrackingState {
  trucks: Truck[];
  locationHistory: MtruckLocation[];
  latestLocation: MtruckLocation | null;
  gpsStream: MtruckGpsStream[];
  telemetry: MtruckTelemetry[];
  latestTelemetry: MtruckTelemetry | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  refreshHistory: (truckId: string, fromDate?: string, toDate?: string) => Promise<void>;
  refreshGpsStream: (truckId: string) => Promise<void>;
  refreshTelemetry: (truckId: string) => Promise<void>;
  pushLocation: (truckId: string, driverId: string, location: { lat: number; lng: number }) => Promise<void>;
  pushTelemetry: (payload: Parameters<typeof recordTelemetry>[0]) => Promise<void>;
}

export const useTrackingStore = create<TrackingState>((set, get) => ({
  trucks: [],
  locationHistory: [],
  latestLocation: null,
  gpsStream: [],
  telemetry: [],
  latestTelemetry: null,
  loading: false,
  error: null,

  refresh: async () => {
    set({ loading: true, error: null });
    try {
      const trucks = await getTruckLocations();
      set({ trucks, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  refreshHistory: async (truckId, fromDate, toDate) => {
    try {
      const history = await getTruckLocationHistory(truckId, fromDate, toDate);
      set({ locationHistory: history });
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  refreshGpsStream: async (truckId) => {
    try {
      const stream = await getGpsStream(truckId);
      set({ gpsStream: stream });
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  refreshTelemetry: async (truckId) => {
    try {
      const [all, latest] = await Promise.all([
        getTruckTelemetry(truckId),
        getLatestTelemetry(truckId)
      ]);
      set({ telemetry: all, latestTelemetry: latest });
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  pushLocation: async (truckId, driverId, location) => {
    try {
      await recordLocation({ truck_id: truckId, driver_id: driverId, latitude: location.lat, longitude: location.lng });
      await updateTruckLocation(truckId, location.lat, location.lng);
      await get().refreshHistory(truckId);
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  pushTelemetry: async (payload) => {
    try {
      await recordTelemetry(payload);
      await get().refreshTelemetry(payload.truck_id);
    } catch (err: any) {
      set({ error: err.message });
    }
  },
}));

// ── REALTIME HOOK ──
export function useTrackingRealtime(truckId?: string) {
  const { refresh, refreshGpsStream, refreshTelemetry } = useTrackingStore();

  useEffect(() => {
    if (!truckId) return;

    const channels: any[] = [];

    // GPS Stream (high frequency - use broadcast for cursor, postgres for persistence)
    const gpsCh = supabase
      .channel(`mtruck:gps:${truckId}`, { config: { private: true } })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mtruck_gps_stream', filter: `truck_id=eq.${truckId}` }, () => refreshGpsStream(truckId))
      .subscribe();
    channels.push(gpsCh);

    // Locations
    const locCh = supabase
      .channel(`mtruck:locations:${truckId}`, { config: { private: true } })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mtruck_locations', filter: `truck_id=eq.${truckId}` }, () => refresh())
      .subscribe();
    channels.push(locCh);

    // Telemetry
    const telCh = supabase
      .channel(`mtruck:telemetry:${truckId}`, { config: { private: true } })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mtruck_telemetry', filter: `truck_id=eq.${truckId}` }, () => refreshTelemetry(truckId))
      .subscribe();
    channels.push(telCh);

    return () => {
      channels.forEach(ch => supabase.removeChannel(ch));
    };
  }, [truckId, refresh, refreshGpsStream, refreshTelemetry]);
}
