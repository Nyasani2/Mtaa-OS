import { create } from "zustand";
import { useEffect } from 'react';
import { supabase } from "@/lib/supabase";
import {
  scheduleInspection, getTruckInspections, getPendingInspections, submitInspectionResults,
  createMaintenanceAlert, getMaintenanceAlerts, resolveMaintenanceAlert
} from "@/lib/mtruck/services/inspectionService";
import type { MtruckInspection, MtruckMaintenanceAlert } from "@/lib/mtruck/types";

interface MaintenanceState {
  inspections: MtruckInspection[];
  maintenanceAlerts: MtruckMaintenanceAlert[];
  loading: boolean;
  error: string | null;
  refreshInspections: (truckId: string) => Promise<void>;
  refreshAlerts: (truckId?: string, resolved?: boolean) => Promise<void>;
  schedule: (payload: Parameters<typeof scheduleInspection>[0]) => Promise<MtruckInspection>;
  submitResults: (inspectionId: string, results: Parameters<typeof submitInspectionResults>[1]) => Promise<{ passed: boolean }>;
  createAlert: (payload: Parameters<typeof createMaintenanceAlert>[0]) => Promise<MtruckMaintenanceAlert>;
  resolveAlert: (alertId: string, resolvedBy: string) => Promise<void>;
}

export const useMaintenanceStore = create<MaintenanceState>((set, get) => ({
  inspections: [],
  maintenanceAlerts: [],
  loading: false,
  error: null,

  refreshInspections: async (truckId) => {
    set({ loading: true, error: null });
    try {
      const inspections = await getTruckInspections(truckId);
      set({ inspections, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  refreshAlerts: async (truckId, resolved = false) => {
    try {
      const alerts = await getMaintenanceAlerts(truckId, resolved);
      set({ maintenanceAlerts: alerts });
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  schedule: async (payload) => {
    const inspection = await scheduleInspection(payload);
    set((s) => ({ inspections: [inspection, ...s.inspections] }));
    return inspection;
  },

  submitResults: async (inspectionId, results) => {
    const { passed } = await submitInspectionResults(inspectionId, results);
    await get().refreshInspections('all');
    return { passed };
  },

  createAlert: async (payload) => {
    const alert = await createMaintenanceAlert(payload);
    set((s) => ({ maintenanceAlerts: [alert, ...s.maintenanceAlerts] }));
    return alert;
  },

  resolveAlert: async (alertId, resolvedBy) => {
    await resolveMaintenanceAlert(alertId, resolvedBy);
    await get().refreshAlerts();
  },
}));

// ── REALTIME HOOK ──
export function useMaintenanceRealtime(fleetId?: string) {
  const { refreshInspections, refreshAlerts } = useMaintenanceStore();

  useEffect(() => {
    const channels: any[] = [];

    const inspectionCh = supabase
      .channel(`mtruck:inspections:${fleetId ?? 'all'}`, { config: { private: true } })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mtruck_inspections' }, () => refreshInspections('all'))
      .subscribe();
    channels.push(inspectionCh);

    const alertCh = supabase
      .channel(`mtruck:maintenance:${fleetId ?? 'all'}`, { config: { private: true } })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mtruck_maintenance_alerts' }, () => refreshAlerts())
      .subscribe();
    channels.push(alertCh);

    return () => { channels.forEach(ch => supabase.removeChannel(ch)); };
  }, [fleetId, refreshInspections, refreshAlerts]);
}
