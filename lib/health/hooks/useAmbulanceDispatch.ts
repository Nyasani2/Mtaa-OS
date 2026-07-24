import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export interface AmbulanceUnit {
  id: string;
  unit_number: string;
  unit_type: string;
  status: string;
  current_location?: string;
  driver_name?: string;
  paramedic_name?: string;
}

export interface DispatchPayload {
  patient_name: string;
  patient_phone: string;
  pickup_address: string;
  pickup_latitude?: number;
  pickup_longitude?: number;
  destination_address: string;
  destination_latitude?: number;
  destination_longitude?: number;
  notes?: string;
  priority?: string;
  unit_id?: string;
}

export function useAmbulanceDispatch() {
  const { user } = useAuthStore();
  const [units, setUnits] = useState<AmbulanceUnit[]>([]);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUnits = useCallback(async () => {
    setLoadingUnits(true);
    setError(null);
    try {
      // Try health_ambulance_units first, fallback to health_facilities with type filter
      const { data, error: err } = await supabase
        .from('health_ambulance_units')
        .select('*')
        .eq('status', 'available')
        .order('unit_number');

      if (err) {
        // Fallback: query health_facilities for ambulance type
        const { data: fallbackData, error: fallbackErr } = await supabase
          .from('health_facilities')
          .select('id, name, type, address, phone')
          .eq('type', 'ambulance')
          .order('name');

        if (fallbackErr) throw fallbackErr;
        setUnits((fallbackData || []).map((f: any) => ({
          id: f.id,
          unit_number: f.name,
          unit_type: 'standard',
          status: 'available',
          current_location: f.address,
          driver_name: undefined,
          paramedic_name: undefined,
        })));
      } else {
        setUnits(data || []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load ambulance units');
      setUnits([]);
    } finally {
      setLoadingUnits(false);
    }
  }, []);

  const createDispatch = useCallback(async (payload: DispatchPayload) => {
    if (!user?.id) return { success: false, error: 'Not authenticated' };

    try {
      // Build insert payload — only include fields that exist in health_ambulance_dispatches
      const insertPayload: any = {
        patient_name: payload.patient_name,
        patient_phone: payload.patient_phone,
        pickup_address: payload.pickup_address,
        destination_address: payload.destination_address,
        notes: payload.notes || '',
        status: 'pending',
        requested_by: user.id,
        created_at: new Date().toISOString(),
      };

      // Only add optional fields if provided
      if (payload.pickup_latitude !== undefined) insertPayload.pickup_latitude = payload.pickup_latitude;
      if (payload.pickup_longitude !== undefined) insertPayload.pickup_longitude = payload.pickup_longitude;
      if (payload.destination_latitude !== undefined) insertPayload.destination_latitude = payload.destination_latitude;
      if (payload.destination_longitude !== undefined) insertPayload.destination_longitude = payload.destination_longitude;
      if (payload.unit_id) insertPayload.unit_id = payload.unit_id;
      // priority may not exist in schema — try without first, add if needed

      const { data, error: insertError } = await supabase
        .from('health_ambulance_dispatches')
        .insert(insertPayload)
        .select()
        .single();

      if (insertError) {
        // If priority column missing, retry without it
        if (insertError.message?.includes('priority') || insertError.code === '42703') {
          delete insertPayload.priority;
          const { data: retryData, error: retryError } = await supabase
            .from('health_ambulance_dispatches')
            .insert(insertPayload)
            .select()
            .single();
          if (retryError) throw retryError;
          return { success: true, data: retryData };
        }
        throw insertError;
      }

      return { success: true, data };
    } catch (err: any) {
      console.error('Ambulance dispatch error:', err);
      return { success: false, error: err.message || 'Dispatch failed' };
    }
  }, [user?.id]);

  return { units, loadingUnits, error, fetchUnits, createDispatch };
}
