import { create } from "zustand";
import { useEffect } from 'react';
import { supabase } from "@/lib/supabase";
import { getTradeCorridors, getCorridorByRoute } from "@/lib/mtruck/services/addressService";
import type { MtruckTradeCorridor, Route } from "@/lib/mtruck/types";

interface RouteState {
  corridors: MtruckTradeCorridor[];
  routes: Route[];
  selectedCorridor: MtruckTradeCorridor | null;
  loading: boolean;
  error: string | null;
  refreshCorridors: () => Promise<void>;
  findCorridor: (origin: string, destination: string) => Promise<void>;
  addRoute: (route: Route) => void;
}

export const useRouteStore = create<RouteState>((set, get) => ({
  corridors: [],
  routes: [],
  selectedCorridor: null,
  loading: false,
  error: null,

  refreshCorridors: async () => {
    set({ loading: true, error: null });
    try {
      const corridors = await getTradeCorridors();
      set({ corridors, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  findCorridor: async (origin, destination) => {
    try {
      const corridor = await getCorridorByRoute(origin, destination);
      set({ selectedCorridor: corridor });
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  addRoute: (route) => set((s) => ({ routes: [route, ...s.routes] })),
}));

// ── REALTIME HOOK ──
export function useRouteRealtime() {
  const { refreshCorridors } = useRouteStore();

  useEffect(() => {
    const ch = supabase
      .channel('mtruck:corridors', { config: { private: true } })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mtruck_trade_corridors' }, refreshCorridors)
      .subscribe();

    return () => { supabase.removeChannel(ch); };
  }, [refreshCorridors]);
}
