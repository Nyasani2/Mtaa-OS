import { create } from "zustand";
import { getFleetStatus, getTrucks, getLoads, getAlerts, getMetrics } from "@/lib/mtruck/services/fleet-service";
import type { Truck, Load, FleetAlert, FleetMetrics } from "@/lib/mtruck/types";

interface FleetState {
  fleet: { activeTrucks: number; onRoad: number; pendingLoads: number; revenueToday: number; truckChange: number; roadChange: number; loadChange: number; revenueChange: number };
  trucks: Truck[];
  loads: Load[];
  alerts: FleetAlert[];
  metrics: FleetMetrics;
  loading: boolean;
  refresh: () => Promise<void>;
}

export const useFleetStore = create<FleetState>((set) => ({
  fleet: { activeTrucks: 0, onRoad: 0, pendingLoads: 0, revenueToday: 0, truckChange: 0, roadChange: 0, loadChange: 0, revenueChange: 0 },
  trucks: [],
  loads: [],
  alerts: [],
  metrics: { totalDistance: 0, fuelEfficiency: 0, onTimeRate: 0, costPerMile: 0, revenuePerTruck: 0, utilizationRate: 0 },
  loading: false,
  refresh: async () => {
    set({ loading: true });
    try {
      const [fleet, trucks, loads, alerts, metrics] = await Promise.all([getFleetStatus(), getTrucks(), getLoads(), getAlerts(), getMetrics()]);
      set({ fleet: { activeTrucks: fleet.activeTrucks, onRoad: fleet.onRoad, pendingLoads: fleet.pendingLoads, revenueToday: fleet.revenueToday, truckChange: 5, roadChange: 3, loadChange: -2, revenueChange: 12 }, trucks, loads, alerts, metrics, loading: false });
    } catch { set({ loading: false }); }
  },
}));
