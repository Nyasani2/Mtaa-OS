import { create } from "zustand";
import type { Route } from "@/lib/mtruck/types";

interface RouteState {
  routes: Route[];
  optimizeRoute: (origin: string, destination: string) => Promise<void>;
}

export const useRouteStore = create<RouteState>((set, get) => ({
  routes: [{ id: "route-1", origin: "Johannesburg", destination: "Cape Town", distance: 1400, duration: 840, fuelEstimate: 112, tolls: 45, optimized: true }],
  optimizeRoute: async (origin: string, destination: string) => {
    const newRoute: Route = { id: `route-${Date.now()}`, origin, destination, distance: Math.floor(Math.random() * 2000) + 500, duration: Math.floor(Math.random() * 1200) + 300, fuelEstimate: Math.floor(Math.random() * 200) + 50, tolls: Math.floor(Math.random() * 100), optimized: true };
    set({ routes: [...get().routes, newRoute] });
  },
}));
