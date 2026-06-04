// hooks/useMTruck.ts
import { create } from 'zustand';
import { useIdentity } from '@/hooks/useAuthStore';
import { supabase } from '@/lib/supabase/client';

export interface FreightRequest {
  id: string;
  shipper_id: string;
  pickup_location: { lat: number; lng: number; address: string };
  delivery_location: { lat: number; lng: number; address: string };
  cargo_type: string;
  cargo_weight_kg: number;
  cargo_dimensions?: { length: number; width: number; height: number };
  vehicle_required: 'pickup' | 'van' | 'truck_small' | 'truck_medium' | 'truck_large' | 'flatbed';
  status: 'pending' | 'quoted' | 'accepted' | 'picked_up' | 'in_transit' | 'delivered' | 'cancelled';
  carrier_id?: string;
  quoted_price?: number;
  final_price?: number;
  pickup_date: string;
  delivery_deadline?: string;
  special_instructions?: string;
  created_at: string;
  updated_at: string;
}

export interface CarrierProfile {
  id: string;
  user_id: string;
  company_name: string;
  vehicle_types: string[];
  max_capacity_kg: number;
  service_areas: string[];
  rating: number;
  total_deliveries: number;
  is_available: boolean;
  current_location?: { lat: number; lng: number };
  insurance_verified: boolean;
}

export interface MTruckState {
  activeShipment: FreightRequest | null;
  availableCarriers: CarrierProfile[];
  myShipments: FreightRequest[];
  isLoading: boolean;
  error: string | null;
  isSubmitting: boolean;

  createShipment: (shipment: Partial<FreightRequest>) => Promise<boolean>;
  cancelShipment: (shipmentId: string) => Promise<boolean>;
  loadActiveShipment: () => Promise<void>;
  loadMyShipments: () => Promise<void>;
  loadAvailableCarriers: (lat: number, lng: number, radius?: number) => Promise<void>;
  clearError: () => void;
}

export const useMTruck = create<MTruckState>((set, get) => ({
  activeShipment: null,
  availableCarriers: [],
  myShipments: [],
  isLoading: false,
  error: null,
  isSubmitting: false,

  createShipment: async (shipment: Partial<FreightRequest>) => {
    const { user, isAuthenticated } = useIdentity.getState();
    if (!isAuthenticated || !user) {
      set({ error: 'Please sign in to create a shipment' });
      return false;
    }

    set({ isSubmitting: true, error: null });
    try {
      const { data, error } = await supabase
        .from('freight_requests')
        .insert({
          ...shipment,
          shipper_id: user.id,
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        activeShipment: data as FreightRequest,
        myShipments: [data as FreightRequest, ...state.myShipments],
        isSubmitting: false,
      }));
      return true;
    } catch (err: any) {
      set({ error: err.message, isSubmitting: false });
      return false;
    }
  },

  cancelShipment: async (shipmentId: string) => {
    const { user, isAuthenticated } = useIdentity.getState();
    if (!isAuthenticated || !user) return false;

    try {
      const { error } = await supabase
        .from('freight_requests')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', shipmentId)
        .eq('shipper_id', user.id);

      if (error) throw error;

      set((state) => ({
        activeShipment: state.activeShipment?.id === shipmentId ? null : state.activeShipment,
        myShipments: state.myShipments.map(s =>
          s.id === shipmentId ? { ...s, status: 'cancelled' as const } : s
        ),
      }));
      return true;
    } catch (err: any) {
      set({ error: err.message });
      return false;
    }
  },

  loadActiveShipment: async () => {
    const { user, isAuthenticated } = useIdentity.getState();
    if (!isAuthenticated || !user) {
      set({ activeShipment: null });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('freight_requests')
        .select('*')
        .eq('shipper_id', user.id)
        .in('status', ['pending', 'quoted', 'accepted', 'picked_up', 'in_transit'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      set({ activeShipment: data as FreightRequest || null });
    } catch (err: any) {
      set({ error: err.message });
    } finally {
      set({ isLoading: false });
    }
  },

  loadMyShipments: async () => {
    const { user, isAuthenticated } = useIdentity.getState();
    if (!isAuthenticated || !user) {
      set({ myShipments: [] });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('freight_requests')
        .select('*')
        .eq('shipper_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ myShipments: (data || []) as FreightRequest[] });
    } catch (err: any) {
      set({ error: err.message });
    } finally {
      set({ isLoading: false });
    }
  },

  loadAvailableCarriers: async (lat: number, lng: number, radius = 20) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase.rpc('get_nearby_carriers', {
        lat,
        lng,
        radius_km: radius,
      });

      if (error) throw error;
      set({ availableCarriers: (data || []) as CarrierProfile[] });
    } catch (err: any) {
      set({ error: err.message });
    } finally {
      set({ isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));

export default useMTruck;
