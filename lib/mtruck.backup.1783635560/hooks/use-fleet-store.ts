import { create } from "zustand";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  getFleetStatus, getTrucks, getLoads, getAlerts, getMetrics,
  getFleetByOwner, createFleet, updateFleet,
  getFleetSnapshots, getPendingCommands, sendFleetCommand
} from "@/lib/mtruck/services/fleet-service";
import type { Truck, Load, FleetAlert, FleetMetrics, MtruckFleet, MtruckFleetSnapshot, MtruckFleetCommand } from "@/lib/mtruck/types";

interface FleetState {
  fleet: MtruckFleet | null;
  fleetStats: { activeTrucks: number; onRoad: number; pendingLoads: number; revenueToday: number; truckChange: number; roadChange: number; loadChange: number; revenueChange: number };
  trucks: Truck[];
  loads: Load[];
  alerts: FleetAlert[];
  metrics: FleetMetrics;
  snapshots: MtruckFleetSnapshot[];
  pendingCommands: MtruckFleetCommand[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  refreshFleet: (ownerId: string) => Promise<void>;
  refreshSnapshots: (fleetId: string) => Promise<void>;
  refreshCommands: (truckId: string) => Promise<void>;
  sendCommand: (payload: Parameters<typeof sendFleetCommand>[0]) => Promise<void>;
  createNewFleet: (payload: Parameters<typeof createFleet>[0]) => Promise<MtruckFleet>;
}

export const useFleetStore = create<FleetState>((set, get) => ({
  fleet: null,
  fleetStats: { activeTrucks: 0, onRoad: 0, pendingLoads: 0, revenueToday: 0, truckChange: 0, roadChange: 0, loadChange: 0, revenueChange: 0 },
  trucks: [],
  loads: [],
  alerts: [],
  metrics: { totalDistance: 0, fuelEfficiency: 0, onTimeRate: 0, costPerMile: 0, revenuePerTruck: 0, utilizationRate: 0 },
  snapshots: [],
  pendingCommands: [],
  loading: false,
  error: null,

  refresh: async () => {
    set({ loading: true, error: null });
    try {
      const [fleetStats, trucks, loads, alerts, metrics] = await Promise.all([
        getFleetStatus(), getTrucks(), getLoads(), getAlerts(), getMetrics()
      ]);
      set({
        fleetStats: { ...fleetStats, truckChange: 5, roadChange: 3, loadChange: -2, revenueChange: 12 },
        trucks, loads, alerts, metrics, loading: false
      });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  refreshFleet: async (ownerId) => {
    try {
      const fleet = await getFleetByOwner(ownerId);
      set({ fleet });
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  refreshSnapshots: async (fleetId) => {
    try {
      const snapshots = await getFleetSnapshots(fleetId);
      set({ snapshots });
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  refreshCommands: async (truckId) => {
    try {
      const commands = await getPendingCommands(truckId);
      set({ pendingCommands: commands });
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  sendCommand: async (payload) => {
    try {
      await sendFleetCommand(payload);
      await get().refreshCommands(payload.truck_id);
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  createNewFleet: async (payload) => {
    const fleet = await createFleet(payload);
    set({ fleet });
    return fleet;
  },
}));

// ── REALTIME HOOK ──
export function useFleetRealtime(fleetId?: string) {
  const { refresh, refreshSnapshots, refreshCommands } = useFleetStore();

  useEffect(() => {
    if (!fleetId) return;

    const channels: any[] = [];

    // Fleet changes
    const fleetCh = supabase
      .channel(`mtruck:fleet:${fleetId}`, { config: { private: true } })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mtruck_fleet', filter: `id=eq.${fleetId}` }, refresh)
      .subscribe();
    channels.push(fleetCh);

    // Truck changes
    const truckCh = supabase
      .channel(`mtruck:trucks:${fleetId}`, { config: { private: true } })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mtruck_trucks' }, refresh)
      .subscribe();
    channels.push(truckCh);

    // Alert changes
    const alertCh = supabase
      .channel(`mtruck:alerts:${fleetId}`, { config: { private: true } })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mtruck_alerts' }, refresh)
      .subscribe();
    channels.push(alertCh);

    // Snapshot changes
    const snapCh = supabase
      .channel(`mtruck:snapshots:${fleetId}`, { config: { private: true } })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mtruck_fleet_snapshots', filter: `fleet_id=eq.${fleetId}` }, () => refreshSnapshots(fleetId))
      .subscribe();
    channels.push(snapCh);

    // Command changes
    const cmdCh = supabase
      .channel(`mtruck:commands:${fleetId}`, { config: { private: true } })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mtruck_fleet_commands' }, () => refreshCommands('all'))
      .subscribe();
    channels.push(cmdCh);

    return () => {
      channels.forEach(ch => supabase.removeChannel(ch));
    };
  }, [fleetId, refresh, refreshSnapshots, refreshCommands]);
}
