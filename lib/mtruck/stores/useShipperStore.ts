// @ts-nocheck
import { create } from 'zustand';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { ShipperRequest, HaulQuote, MtruckJob, TonnageCategory } from '@/lib/mtruck/types';
import { shipperService } from '@/lib/mtruck/services/shipper-service';

interface ShipperState {
  requests: ShipperRequest[];
  jobs: MtruckJob[];
  activeJob: MtruckJob | null;
  selectedRequest: ShipperRequest | null;
  isLoading: boolean;
  error: string | null;

  loadRequests: (shipperId: string) => Promise<void>;
  loadJobs: (shipperId: string) => Promise<void>;
  createRequest: (data: {
    shipperId: string;
    cargoType: string;
    tonnageCategory: TonnageCategory;
    weightKg: number;
    originAddress: string;
    originLat: number;
    originLng: number;
    destAddress: string;
    destLat: number;
    destLng: number;
    pickupDate: string;
    deliveryDeadline: string;
    urgency: 'normal' | 'express' | 'critical';
    specialRequirements?: string[];
  }) => Promise<ShipperRequest>;
  acceptQuote: (quoteId: string, requestId: string) => Promise<MtruckJob>;
  trackJob: (jobId: string) => Promise<void>;
  cancelRequest: (requestId: string) => Promise<void>;
  selectRequest: (req: ShipperRequest | null) => void;
  clearError: () => void;
}

export const useShipperStore = create<ShipperState>((set, get) => ({
  requests: [],
  jobs: [],
  activeJob: null,
  selectedRequest: null,
  isLoading: false,
  error: null,

  loadRequests: async (shipperId) => {
    set({ isLoading: true, error: null });
    try {
      const requests = await shipperService.getMyRequests(shipperId);
      set({ requests, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  loadJobs: async (shipperId) => {
    set({ isLoading: true, error: null });
    try {
      const jobs = await (shipperService as any).getMyJobs(shipperId);
      set({ jobs, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  createRequest: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const request = await shipperService.createRequest(data);
      set((state) => ({
        requests: [request, ...state.requests],
        isLoading: false,
      }));
      return request;
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  acceptQuote: async (quoteId, requestId) => {
    set({ isLoading: true, error: null });
    try {
      const job = await shipperService.acceptQuote(quoteId, requestId);
      set((state) => ({
        jobs: [job, ...state.jobs],
        requests: state.requests.map((r) =>
          r.id === requestId ? { ...r, status: 'accepted' as const } : r
        ),
        isLoading: false,
      }));
      return job;
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  trackJob: async (jobId) => {
    set({ isLoading: true, error: null });
    try {
      const job = await (shipperService as any).trackJob(jobId);
      set({ activeJob: job, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  cancelRequest: async (requestId) => {
    set({ isLoading: true, error: null });
    try {
      await shipperService.cancelRequest(requestId);
      set((state) => ({
        requests: state.requests.map((r) =>
          r.id === requestId ? { ...r, status: 'rejected' as const } : r
        ),
        isLoading: false,
      }));
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  selectRequest: (req) => set({ selectedRequest: req }),
  clearError: () => set({ error: null }),
}));

// ── REALTIME HOOK ──
export function useShipperRealtime(shipperId: string) {
  const { loadRequests, loadJobs } = useShipperStore();

  useEffect(() => {
    const channels: any[] = [];

    const reqCh = supabase
      .channel(`mtruck:shipper-requests:${shipperId}`, { config: { private: true } })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mtruck_shipper_requests', filter: `shipper_id=eq.${shipperId}` }, () => loadRequests(shipperId))
      .subscribe();
    channels.push(reqCh);

    const jobCh = supabase
      .channel(`mtruck:shipper-jobs:${shipperId}`, { config: { private: true } })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mtruck_jobs', filter: `shipper_id=eq.${shipperId}` }, () => loadJobs(shipperId))
      .subscribe();
    channels.push(jobCh);

    return () => { channels.forEach(ch => supabase.removeChannel(ch)); };
  }, [shipperId, loadRequests, loadJobs]);
}
