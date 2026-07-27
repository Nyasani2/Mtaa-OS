import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  getMTruckAnalytics,
  getMTruckRevenue,
  getMTruckTrips,
  getMTruckDriverPerformance,
  type MTruckAnalytics,
  type MTruckRevenue,
  type MTruckTrip,
  type DriverPerformance,
} from '@/lib/mtruck/services';

interface AnalyticsState {
  analytics: MTruckAnalytics | null;
  revenue: MTruckRevenue | null;
  trips: MTruckTrip[];
  driverPerformance: DriverPerformance | null;
  loading: boolean;
  error: string | null;
  dateRange: { from: string; to: string };
  setDateRange: (range: { from: string; to: string }) => void;
  loadAnalytics: (truckId?: string) => Promise<void>;
  loadRevenue: (truckId?: string) => Promise<void>;
  loadTrips: (truckId?: string) => Promise<void>;
  loadDriverPerformance: (driverId: string) => Promise<void>;
  refreshAll: (truckId?: string) => Promise<void>;
}

export const useAnalyticsStore = create<AnalyticsState>()(
  persist(
    (set, get) => ({
      analytics: null,
      revenue: null,
      trips: [],
      driverPerformance: null,
      loading: false,
      error: null,
      dateRange: { from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], to: new Date().toISOString().split('T')[0] },
      setDateRange: (range) => set({ dateRange: range }),
      loadAnalytics: async (truckId) => {
        set({ loading: true, error: null });
        try { const data = await getMTruckAnalytics(truckId, get().dateRange); set({ analytics: data }); }
        catch (err: any) { set({ error: err.message || 'Failed to load analytics' }); }
        finally { set({ loading: false }); }
      },
      loadRevenue: async (truckId) => {
        set({ loading: true, error: null });
        try { const data = await getMTruckRevenue(truckId, get().dateRange); set({ revenue: data }); }
        catch (err: any) { set({ error: err.message || 'Failed to load revenue' }); }
        finally { set({ loading: false }); }
      },
      loadTrips: async (truckId) => {
        set({ loading: true, error: null });
        try { const data = await getMTruckTrips(truckId, get().dateRange); set({ trips: data }); }
        catch (err: any) { set({ error: err.message || 'Failed to load trips' }); }
        finally { set({ loading: false }); }
      },
      loadDriverPerformance: async (driverId) => {
        set({ loading: true, error: null });
        try { const data = await getMTruckDriverPerformance(driverId, get().dateRange); set({ driverPerformance: data }); }
        catch (err: any) { set({ error: err.message || 'Failed to load driver performance' }); }
        finally { set({ loading: false }); }
      },
      refreshAll: async (truckId) => {
        set({ loading: true, error: null });
        try {
          const [analytics, revenue, trips] = await Promise.all([
            getMTruckAnalytics(truckId, get().dateRange),
            getMTruckRevenue(truckId, get().dateRange),
            getMTruckTrips(truckId, get().dateRange),
          ]);
          set({ analytics, revenue, trips });
        } catch (err: any) { set({ error: err.message || 'Failed to refresh analytics' }); }
        finally { set({ loading: false }); }
      },
    }),
    { name: 'mtruck-analytics-store' }
  )
);
