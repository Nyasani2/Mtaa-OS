import { create } from "zustand";
import { getMetrics } from "@/lib/mtruck/services/fleet-service";
import type { FleetMetrics } from "@/lib/mtruck/types";

interface AnalyticsState {
  metrics: FleetMetrics;
  refresh: () => Promise<void>;
}

export const useAnalyticsStore = create<AnalyticsState>((set) => ({
  metrics: { totalDistance: 12450, fuelEfficiency: 8.2, onTimeRate: 94, costPerMile: 1.85, revenuePerTruck: 2450, utilizationRate: 78 },
  refresh: async () => { const metrics = await getMetrics(); set({ metrics }); },
}));
