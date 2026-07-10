import { create } from "zustand";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { getLatestTelemetry } from "@/lib/mtruck/services/tracking-service";
import type { MtruckFuelAlert, MtruckTelemetry } from "@/lib/mtruck/types";

interface FuelState {
  fuelAlerts: MtruckFuelAlert[];
  latestTelemetry: MtruckTelemetry | null;
  loading: boolean;
  error: string | null;
  refreshTelemetry: (truckId: string) => Promise<void>;
}

export const useFuelStore = create<FuelState>((set) => ({
  fuelAlerts: [],
  latestTelemetry: null,
  loading: false,
  error: null,

  refreshTelemetry: async (truckId) => {
    try {
      const telemetry = await getLatestTelemetry(truckId);
      set({ latestTelemetry: telemetry });
    } catch (err: any) {
      set({ error: err.message });
    }
  },
}));

// ── REALTIME HOOK ──
export function useFuelRealtime(fleetId?: string) {
  const { refreshTelemetry } = useFuelStore();

  useEffect(() => {
    if (!fleetId) return;

    const ch = supabase
      .channel(`mtruck:fuel-alerts:${fleetId}`, { config: { private: true } })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mtruck_fuel_alerts', filter: `fleet_id=eq.${fleetId}` }, () => {})
      .subscribe();

    return () => { supabase.removeChannel(ch); };
  }, [fleetId]);
}
