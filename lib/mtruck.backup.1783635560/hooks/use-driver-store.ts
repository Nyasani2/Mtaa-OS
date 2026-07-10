import { create } from "zustand";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { getDrivers, getDriverById, createDriver, updateDriver } from "@/lib/mtruck/services/fleet-service";
import type { Driver } from "@/lib/mtruck/types";

interface DriverState {
  drivers: Driver[];
  selectedDriver: Driver | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  selectDriver: (driverId: string) => Promise<void>;
  addDriver: (payload: Parameters<typeof createDriver>[0]) => Promise<Driver>;
  update: (driverId: string, updates: Partial<Driver>) => Promise<void>;
}

export const useDriverStore = create<DriverState>((set, get) => ({
  drivers: [],
  selectedDriver: null,
  loading: false,
  error: null,

  refresh: async () => {
    set({ loading: true, error: null });
    try {
      const drivers = await getDrivers();
      set({ drivers, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  selectDriver: async (driverId) => {
    try {
      const driver = await getDriverById(driverId);
      set({ selectedDriver: driver });
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  addDriver: async (payload) => {
    const driver = await createDriver(payload);
    set((s) => ({ drivers: [driver, ...s.drivers] }));
    return driver;
  },

  update: async (driverId, updates) => {
    await updateDriver(driverId, updates);
    await get().refresh();
  },
}));

// ── REALTIME HOOK ──
export function useDriverRealtime(fleetId?: string) {
  const { refresh } = useDriverStore();

  useEffect(() => {
    const ch = supabase
      .channel(`mtruck:drivers:${fleetId ?? 'all'}`, { config: { private: true } })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mtruck_drivers' }, refresh)
      .subscribe();

    return () => { supabase.removeChannel(ch); };
  }, [fleetId, refresh]);
}
