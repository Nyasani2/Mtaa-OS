// hooks/useMTaxi.ts
import { create } from 'zustand';
import { useIdentity } from '@/hooks/useAuthStore';
import { supabase } from '@/lib/supabase/client';

export interface RideRequest {
  id: string;
  rider_id: string;
  pickup_location: { lat: number; lng: number; address: string };
  dropoff_location: { lat: number; lng: number; address: string };
  status: 'pending' | 'accepted' | 'driver_arrived' | 'in_progress' | 'completed' | 'cancelled';
  driver_id?: string;
  fare_estimate: number;
  final_fare?: number;
  distance_km?: number;
  duration_min?: number;
  vehicle_type: 'economy' | 'comfort' | 'premium' | 'xl';
  payment_method: 'wallet' | 'cash' | 'card';
  created_at: string;
  updated_at: string;
}

export interface DriverProfile {
  id: string;
  user_id: string;
  vehicle_make: string;
  vehicle_model: string;
  vehicle_year: number;
  license_plate: string;
  vehicle_type: 'economy' | 'comfort' | 'premium' | 'xl';
  rating: number;
  total_trips: number;
  is_online: boolean;
  current_location?: { lat: number; lng: number };
}

export interface MTaxiState {
  activeRide: RideRequest | null;
  nearbyDrivers: DriverProfile[];
  isLoading: boolean;
  error: string | null;
  isRequesting: boolean;

  requestRide: (pickup: any, dropoff: any, vehicleType: string, paymentMethod: string) => Promise<boolean>;
  cancelRide: () => Promise<boolean>;
  loadActiveRide: () => Promise<void>;
  loadNearbyDrivers: (lat: number, lng: number, radius?: number) => Promise<void>;
  clearError: () => void;
}

export const useMTaxi = create<MTaxiState>((set, get) => ({
  activeRide: null,
  nearbyDrivers: [],
  isLoading: false,
  error: null,
  isRequesting: false,

  requestRide: async (pickup, dropoff, vehicleType, paymentMethod) => {
    const { user, isAuthenticated } = useIdentity.getState();
    if (!isAuthenticated || !user) {
      set({ error: 'Please sign in to request a ride' });
      return false;
    }

    set({ isRequesting: true, error: null });
    try {
      const { data, error } = await supabase
        .from('ride_requests')
        .insert({
          rider_id: user.id,
          pickup_location: pickup,
          dropoff_location: dropoff,
          status: 'pending',
          vehicle_type: vehicleType,
          payment_method: paymentMethod,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      set({ activeRide: data as RideRequest, isRequesting: false });
      return true;
    } catch (err: any) {
      set({ error: err.message, isRequesting: false });
      return false;
    }
  },

  cancelRide: async () => {
    const { user, isAuthenticated } = useIdentity.getState();
    const { activeRide } = get();
    if (!isAuthenticated || !user || !activeRide) return false;

    try {
      const { error } = await supabase
        .from('ride_requests')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', activeRide.id)
        .eq('rider_id', user.id);

      if (error) throw error;

      set({ activeRide: null });
      return true;
    } catch (err: any) {
      set({ error: err.message });
      return false;
    }
  },

  loadActiveRide: async () => {
    const { user, isAuthenticated } = useIdentity.getState();
    if (!isAuthenticated || !user) {
      set({ activeRide: null });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('ride_requests')
        .select('*')
        .eq('rider_id', user.id)
        .in('status', ['pending', 'accepted', 'driver_arrived', 'in_progress'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      set({ activeRide: data as RideRequest || null });
    } catch (err: any) {
      set({ error: err.message });
    } finally {
      set({ isLoading: false });
    }
  },

  loadNearbyDrivers: async (lat: number, lng: number, radius = 5) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase.rpc('get_nearby_drivers', {
        lat,
        lng,
        radius_km: radius,
      });

      if (error) throw error;
      set({ nearbyDrivers: (data || []) as DriverProfile[] });
    } catch (err: any) {
      set({ error: err.message });
    } finally {
      set({ isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));

export default useMTaxi;
