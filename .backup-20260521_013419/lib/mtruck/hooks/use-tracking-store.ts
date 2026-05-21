import { create } from "zustand";
import { getTruckLocations } from "@/lib/mtruck/services/tracking-service";
import type { Truck } from "@/lib/mtruck/types";

interface TrackingState {
  trucks: Truck[];
  loading: boolean;
  refresh: () => Promise<void>;
}

export const useTrackingStore = create<TrackingState>((set) => ({
  trucks: [],
  loading: false,
  refresh: async () => {
    set({ loading: true });
    try { const trucks = await getTruckLocations(); set({ trucks, loading: false }); }
    catch { set({ loading: false }); }
  },
}));
