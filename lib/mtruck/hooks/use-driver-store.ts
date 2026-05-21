import { create } from "zustand";
import { getDrivers } from "@/lib/mtruck/services/fleet-service";
import type { Driver } from "@/lib/mtruck/types";

interface DriverState {
  drivers: Driver[];
  refresh: () => Promise<void>;
}

export const useDriverStore = create<DriverState>((set) => ({
  drivers: [],
  refresh: async () => { const drivers = await getDrivers(); set({ drivers }); },
}));

(async () => { const drivers = await getDrivers(); useDriverStore.setState({ drivers }); })();
