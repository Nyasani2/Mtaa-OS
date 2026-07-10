import { create } from "zustand";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { getMetrics } from "@/lib/mtruck/services/fleet-service";
import { getFleetSnapshots, getLatestFleetSnapshot } from "@/lib/mtruck/services/fleet-service";
import type { FleetMetrics, MtruckFleetSnapshot } from "@/lib/mtruck/types";

interface AnalyticsState {
  metrics: FleetMetrics;
  snapshots: MtruckFleetSnapshot[];
  latestSnapshot: MtruckFleetSnapshot | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  refreshSnapshots: (fleetId: string) => Promise<void>;
}

export const useAnalyticsStore = create<AnalyticsState>((set, get) => ({
  metrics: { totalDistance: 0, fuelEfficiency: 0, onTimeRate: 0, costPerMile: 0, revenuePerTruck: 0, utilizationRate: 0 },
  snapshots: [],
  latestSnapshot: null,
  loading: false,
  error: null,

  refresh: async () => {
    set({ loading: true, error: null });
    try {
      const metrics = await getMetrics();
      set({ metrics, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  refreshSnapshots: async (fleetId) => {
    try {
      const [snapshots, latest] = await Promise.all([
        getFleetSnapshots(fleetId),
        getLatestFleetSnapshot(fleetId)
      ]);
      set({ snapshots, latestSnapshot: latest });
    } catch (err: any) {
      set({ error: err.message });
    }
  },
}));

// ── REALTIME HOOK ──
export function useAnalyticsRealtime(fleetId?: string) {
  const { refreshSnapshots } = useAnalyticsStore();

  useEffect(() => {
    if (!fleetId) return;

    const ch = supabase
      .channel(`mtruck:snapshots:${fleetId}`, { config: { private: true } })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mtruck_fleet_snapshots', filter: `fleet_id=eq.${fleetId}` }, () => refreshSnapshots(fleetId))
      .subscribe();

    return () => { supabase.removeChannel(ch); };
  }, [fleetId, refreshSnapshots]);
}
