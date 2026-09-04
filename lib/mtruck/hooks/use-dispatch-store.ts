import { create } from "zustand";
import { useEffect } from 'react';
import { supabase } from "@/lib/supabase";
import {
  getAvailableLoads, getAssignedLoads, assignLoad, unassignLoad, updateLoadStatus,
  getMyJobs, getJobById, updateJobStatus,
  createDelivery, getDeliveriesForJob, markDelivered,
  createShipment, getShipmentByTracking, updateShipmentStatus
} from "@/lib/mtruck/services/dispatch-service";
import type { Load, MtruckJob, MtruckDelivery, MtruckShipment } from "@/lib/mtruck/types";

interface DispatchState {
  availableLoads: Load[];
  assignedLoads: Load[];
  allLoads: Load[];
  jobs: MtruckJob[];
  deliveries: MtruckDelivery[];
  shipments: MtruckShipment[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  refreshJobs: (userId: string, role: 'shipper' | 'driver' | 'carrier') => Promise<void>;
  refreshDeliveries: (jobId: string) => Promise<void>;
  refreshShipments: (userId: string) => Promise<void>;
  assign: (loadId: string, truckId: string, driverId?: string) => Promise<void>;
  unassign: (loadId: string) => Promise<void>;
  updateLoad: (loadId: string, status: Load['status']) => Promise<void>;
  updateJob: (jobId: string, status: MtruckJob['status'], updates?: Partial<MtruckJob>) => Promise<void>;
  createNewDelivery: (payload: Parameters<typeof createDelivery>[0]) => Promise<MtruckDelivery>;
  markDeliveryComplete: (deliveryId: string, proof?: Parameters<typeof markDelivered>[1]) => Promise<void>;
  createNewShipment: (payload: Parameters<typeof createShipment>[0]) => Promise<MtruckShipment>;
  updateShipment: (shipmentId: string, status: MtruckShipment['status']) => Promise<void>;
}

export const useDispatchStore = create<DispatchState>((set, get) => ({
  availableLoads: [],
  assignedLoads: [],
  allLoads: [],
  jobs: [],
  deliveries: [],
  shipments: [],
  loading: false,
  error: null,

  refresh: async () => {
    set({ loading: true, error: null });
    try {
      const [available, assigned] = await Promise.all([getAvailableLoads(), getAssignedLoads()]);
      set({ availableLoads: available, assignedLoads: assigned, allLoads: [...available, ...assigned], loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  refreshJobs: async (userId, role) => {
    try {
      const jobs = await getMyJobs(userId, role);
      set({ jobs });
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  refreshDeliveries: async (jobId) => {
    try {
      const deliveries = await getDeliveriesForJob(jobId);
      set({ deliveries });
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  refreshShipments: async (userId) => {
    // TODO: Add getShipmentsForUser service method
    set({ shipments: [] });
  },

  assign: async (loadId, truckId, driverId) => {
    await assignLoad(loadId, truckId, driverId);
    await get().refresh();
  },

  unassign: async (loadId) => {
    await unassignLoad(loadId);
    await get().refresh();
  },

  updateLoad: async (loadId, status) => {
    await updateLoadStatus(loadId, status);
    await get().refresh();
  },

  updateJob: async (jobId, status, updates) => {
    await updateJobStatus(jobId, status, updates);
    await get().refreshJobs('current', 'shipper'); // Refresh with current context
  },

  createNewDelivery: async (payload) => {
    const delivery = await createDelivery(payload);
    set((s) => ({ deliveries: [delivery, ...s.deliveries] }));
    return delivery;
  },

  markDeliveryComplete: async (deliveryId, proof) => {
    await markDelivered(deliveryId, proof);
    await get().refreshDeliveries('all');
  },

  createNewShipment: async (payload) => {
    const shipment = await createShipment(payload);
    set((s) => ({ shipments: [shipment, ...s.shipments] }));
    return shipment;
  },

  updateShipment: async (shipmentId, status) => {
    await updateShipmentStatus(shipmentId, status);
    await get().refreshShipments('current');
  },
}));

// ── REALTIME HOOK ──
export function useDispatchRealtime(userId?: string, role?: 'shipper' | 'driver' | 'carrier') {
  const { refresh, refreshJobs, refreshDeliveries } = useDispatchStore();

  useEffect(() => {
    if (!userId || !role) return;

    const channels: any[] = [];

    const loadCh = supabase
      .channel(`mtruck:loads:${userId}`, { config: { private: true } })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mtruck_loads' }, refresh)
      .subscribe();
    channels.push(loadCh);

    const jobCh = supabase
      .channel(`mtruck:jobs:${userId}`, { config: { private: true } })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mtruck_jobs', filter: `or(shipper_id.eq.${userId},assigned_driver_id.eq.${userId})` }, () => refreshJobs(userId, role))
      .subscribe();
    channels.push(jobCh);

    const deliveryCh = supabase
      .channel(`mtruck:deliveries:${userId}`, { config: { private: true } })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mtruck_deliveries' }, () => refreshDeliveries('all'))
      .subscribe();
    channels.push(deliveryCh);

    return () => { channels.forEach(ch => supabase.removeChannel(ch)); };
  }, [userId, role, refresh, refreshJobs, refreshDeliveries]);
}
